from app.cluster_safety import ClusterSafetyValidator
from app.log_adapter import LogAdapter
from app.log_normalizer import LogNormalizer
from app.runtime_slot_authorizer import RuntimeSlotAuthorizer


class LearningCandidateEvaluator:
    """
    Evaluates whether a candidate log cluster is structurally safe
    enough to proceed to parser-template generation.

    Responsibilities:

      1. adapt raw messages into canonical events;
      2. normalize canonical message payloads;
      3. authorize runtime-variable positions;
      4. mask only authorized positions;
      5. reject unexplained lexical/structural variation.

    This component does not generate templates, call external
    providers, validate regexes, or register parsers.
    """

    def __init__(
        self,
        adapter=None,
        normalizer=None,
        authorizer=None,
        safety_validator=None,
    ):
        self.adapter = adapter or LogAdapter()
        self.normalizer = normalizer or LogNormalizer()

        self.authorizer = (
            authorizer or RuntimeSlotAuthorizer()
        )

        self.safety_validator = (
            safety_validator or ClusterSafetyValidator()
        )

    def evaluate(
        self,
        messages,
        evidence_messages=None,
    ):
        normalized = self._normalize_messages(
            messages
        )

        if evidence_messages is None:
            normalized_evidence = normalized
        else:
            normalized_evidence = (
                self._normalize_messages(
                    evidence_messages
                )
            )

        runtime_positions = (
            self.authorizer.authorized_positions(
                normalized,
                evidence_messages=normalized_evidence,
            )
        )

        masked = self._mask(
            normalized,
            runtime_positions,
        )

        validation = (
            self.safety_validator.validate(
                masked,
                runtime_positions=runtime_positions,
            )
        )

        return {
            "safe": validation["safe"],
            "reason": validation["reason"],
            "normalized_messages": normalized,
            "masked_messages": masked,
            "runtime_positions": sorted(
                runtime_positions
            ),
            "variable_positions": validation[
                "variable_positions"
            ],
            "unsafe_positions": validation[
                "unsafe_positions"
            ],
        }

    def _normalize_messages(self, messages):
        result = []

        for message in messages:
            event = self.adapter.adapt(message)

            result.append(
                self.normalizer.normalize(
                    event.message
                )
            )

        return result

    @staticmethod
    def _mask(
        messages,
        runtime_positions,
    ):
        masked = []

        for message in messages:
            tokens = message.split()

            masked_tokens = [
                (
                    "<VAR>"
                    if position in runtime_positions
                    else token
                )
                for position, token in enumerate(tokens)
            ]

            masked.append(
                " ".join(masked_tokens)
            )

        return masked
