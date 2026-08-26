from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimeSlot:
    """
    Describes a candidate runtime-value position.

    Discovery and authorization are intentionally separate.

    position:
        Token position inside the aligned message family.

    evidence:
        Why the position appears dynamic.

    confidence:
        Strength of the structural evidence.

    authorized:
        Whether the position is safe to mask before parser learning.
    """

    position: int
    evidence: str
    confidence: str
    authorized: bool
