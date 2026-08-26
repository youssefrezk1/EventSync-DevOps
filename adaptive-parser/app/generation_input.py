from dataclasses import dataclass, field


@dataclass(frozen=True)
class GenerationInput:
    """
    Explicit input boundary for parser-template generation.

    learning_messages:
        Structurally validated representations intended for
        template inference.

        These are derived from a LearningCandidate and may contain
        deterministic placeholders such as:

            <NUM>
            <IP>
            <UUID>
            <VAR>

        They are deliberately distinct from the original raw logs.

    runtime_positions:
        Token positions that were explicitly authorized as runtime
        values by structural evidence.

    The generation boundary must not require raw log messages.
    Original raw messages remain local and are used later for final
    parser validation.
    """

    learning_messages: tuple[str, ...]

    runtime_positions: frozenset[int] = field(
        default_factory=frozenset
    )

    @classmethod
    def from_candidate(
        cls,
        candidate,
    ):
        if candidate is None:
            raise ValueError(
                "GenerationInput requires a LearningCandidate."
            )

        return cls(
            learning_messages=tuple(
                candidate.learning_messages
            ),
            runtime_positions=frozenset(
                candidate.runtime_positions
            ),
        )
