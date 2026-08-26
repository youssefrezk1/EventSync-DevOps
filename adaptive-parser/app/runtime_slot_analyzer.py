from app.runtime_slot import RuntimeSlot
from app.runtime_value_evidence import (
    RuntimeValueEvidenceAnalyzer,
)


class RuntimeSlotAnalyzer:
    """
    Evaluates candidate variable positions conservatively.

    This component owns positional analysis across aligned normalized
    messages.

    Recognition of runtime-bearing value structure is delegated to
    RuntimeValueEvidenceAnalyzer.

    Important principle:

        variation != runtime data

    Plain lexical variation is reported but remains unauthorized.
    """

    def __init__(
        self,
        value_evidence_analyzer=None,
    ):
        self.value_evidence_analyzer = (
            value_evidence_analyzer
            or RuntimeValueEvidenceAnalyzer()
        )

    def analyze(
        self,
        normalized_messages,
    ):
        if not normalized_messages:
            return []

        tokenized = [
            message.split()
            for message in normalized_messages
        ]

        if len(tokenized) < 2:
            return []

        lengths = {
            len(tokens)
            for tokens in tokenized
        }

        if len(lengths) != 1:
            return []

        token_count = len(tokenized[0])

        results = []

        for position in range(token_count):
            values = tuple(
                tokens[position]
                for tokens in tokenized
            )

            if len(set(values)) <= 1:
                continue

            evidence = (
                self.value_evidence_analyzer.analyze(
                    values
                )
            )

            if evidence.runtime_like:
                results.append(
                    RuntimeSlot(
                        position=position,
                        evidence=evidence.reason,
                        confidence="high",
                        authorized=True,
                    )
                )
                continue

            results.append(
                RuntimeSlot(
                    position=position,
                    evidence=(
                        "lexical_variation_only"
                    ),
                    confidence="low",
                    authorized=False,
                )
            )

        return results

    def authorized_positions(
        self,
        normalized_messages,
    ):
        return {
            slot.position
            for slot in self.analyze(
                normalized_messages
            )
            if slot.authorized
        }
