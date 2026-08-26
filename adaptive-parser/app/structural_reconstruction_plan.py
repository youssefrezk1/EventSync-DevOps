from dataclasses import dataclass, field


@dataclass(frozen=True)
class ReconstructionSegment:
    """
    One deterministic reconstruction segment.

    kind:
        literal
        wildcard
        message

    value:
        Literal content for literal segments.

        For wildcard/message segments, value is normally empty.
    """

    kind: str
    value: str = ""


@dataclass(frozen=True)
class StructuralReconstructionPlan:
    """
    Generic reconstruction plan for one authorized envelope family.

    The plan contains no named serialization or application format.
    """

    segments: tuple[
        ReconstructionSegment,
        ...
    ] = field(
        default_factory=tuple
    )

    authorized: bool = False

    reason: str | None = None
