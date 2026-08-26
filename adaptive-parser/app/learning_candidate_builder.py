from app.learning_candidate import LearningCandidate
from app.learning_candidate_evaluator import (
    LearningCandidateEvaluator,
)


class LearningCandidateBuilder:
    """
    Builds a validated structural learning candidate.

    Safety evaluation remains the authority for deciding which token
    positions may be generalized.

    Unsafe clusters never produce a LearningCandidate.
    """

    def __init__(
        self,
        evaluator=None,
    ):
        self.evaluator = (
            evaluator
            or LearningCandidateEvaluator()
        )

    def build(
        self,
        raw_messages,
        evidence_messages=None,
    ):
        raw_messages = list(raw_messages)

        if evidence_messages is None:
            evidence_messages = raw_messages
        else:
            evidence_messages = list(
                evidence_messages
            )

        evaluation = self.evaluator.evaluate(
            raw_messages,
            evidence_messages=evidence_messages,
        )

        if not evaluation["safe"]:
            return None

        return LearningCandidate(
            raw_messages=raw_messages,
            normalized_messages=list(
                evaluation["normalized_messages"]
            ),
            learning_messages=list(
                evaluation["masked_messages"]
            ),
            runtime_positions=set(
                evaluation["runtime_positions"]
            ),
            evidence_messages=evidence_messages,
        )
