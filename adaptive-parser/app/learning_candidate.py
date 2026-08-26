from dataclasses import dataclass, field


@dataclass
class LearningCandidate:
    """
    Structurally validated input for parser-template learning.

    raw_messages:
        Original log messages belonging to the candidate cluster.

    normalized_messages:
        Canonical message payloads after deterministic normalization.

    learning_messages:
        Structural representations safe for template inference.

        Only runtime positions supported by structural evidence may
        be masked here.

    runtime_positions:
        Token positions authorized as runtime-variable positions.

    evidence_messages:
        Optional broader population used only for structural evidence.

    The distinction between raw_messages and learning_messages is
    intentional.

    Raw logs remain available for final parser validation, while
    template inference can operate on the safer structural
    representation.
    """

    raw_messages: list[str]

    normalized_messages: list[str]

    learning_messages: list[str]

    runtime_positions: set[int] = field(
        default_factory=set
    )

    evidence_messages: list[str] = field(
        default_factory=list
    )
