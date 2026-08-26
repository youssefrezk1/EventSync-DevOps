from dataclasses import dataclass, field


@dataclass(frozen=True)
class StructuralFamilyRegion:
    """
    One aligned region observed across a structural family.

    ``values`` contains the observed raw values at this position.

    ``stable`` means every observation contains the same value.

    Variation is reported, not automatically authorized for
    generalization.
    """

    role: str
    semantic_role: str | None

    values: tuple[str, ...] = field(
        default_factory=tuple
    )

    stable: bool = False


@dataclass(frozen=True)
class StructuralEnvelopeFamily:
    """
    Family-level structural evidence derived from multiple raw inputs.

    This object describes compatibility and observed variation.

    It does not decide that varying values are safe runtime slots.
    """

    compatible: bool

    before_regions: tuple[
        StructuralFamilyRegion,
        ...
    ] = field(
        default_factory=tuple
    )

    after_regions: tuple[
        StructuralFamilyRegion,
        ...
    ] = field(
        default_factory=tuple
    )

    reason: str | None = None

    def all_regions(self):
        return (
            self.before_regions
            + self.after_regions
        )
