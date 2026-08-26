from dataclasses import dataclass, field


@dataclass
class RuntimeEvidenceContext:
    """
    Runtime evidence learned from a broader structural population.

    Evidence may be discovered from a partition or corpus and then
    supplied when evaluating an individual candidate cluster.

    This separates:

        evidence discovery scope

    from:

        parser-learning / masking scope

    The context contains structural evidence only. It does not contain
    application-specific vocabulary or semantic labels.
    """

    cross_structure_positions: set[int] = field(
        default_factory=set
    )
