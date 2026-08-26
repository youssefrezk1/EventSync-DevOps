import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.envelope_region_authorizer import (
    EnvelopeRegionAuthorizer,
)
from app.structural_envelope_family import (
    StructuralEnvelopeFamily,
    StructuralFamilyRegion,
)


authorizer = EnvelopeRegionAuthorizer()


def family_with_region(region):
    return StructuralEnvelopeFamily(
        compatible=True,
        before_regions=(),
        after_regions=(
            region,
        ),
        reason="test_family",
    )


# =========================================================
# UNKNOWN SEMANTIC ROLE WITH STRONG VALUE EVIDENCE
#
# The semantic name is deliberately arbitrary.
# Authorization must come from values, not the field name.
# =========================================================

runtime_region = StructuralFamilyRegion(
    role="semantic",
    semantic_role="metadata:completely_unknown_field",
    values=(
        "db-101",
        "db-205",
        "db-991",
    ),
    stable=False,
)

result = authorizer.authorize(
    family_with_region(
        runtime_region
    )
)

print(
    "===== UNKNOWN FIELD / RUNTIME-LIKE VALUES ====="
)
print(result)

assert result.authorized is True

decision = result.after_regions[0]

assert decision.generalize is True
assert decision.reason == (
    "runtime_like_value_structure"
)


# =========================================================
# SAME ARBITRARY ROLE, BUT SEMANTIC DRIFT
#
# Same metadata role.
# Different evidence.
#
# Therefore the field name itself cannot be what authorizes
# generalization.
# =========================================================

semantic_region = StructuralFamilyRegion(
    role="semantic",
    semantic_role="metadata:completely_unknown_field",
    values=(
        "failed",
        "restored",
        "delayed",
    ),
    stable=False,
)

result = authorizer.authorize(
    family_with_region(
        semantic_region
    )
)

print()
print(
    "===== UNKNOWN FIELD / SEMANTIC VARIATION ====="
)
print(result)

assert result.authorized is False


# =========================================================
# UNEXPLAINED LEXICAL VARIATION
# =========================================================

mixed_region = StructuralFamilyRegion(
    role="semantic",
    semantic_role=None,
    values=(
        "worker-101",
        "node-205",
        "queue-991",
    ),
    stable=False,
)

result = authorizer.authorize(
    family_with_region(
        mixed_region
    )
)

print()
print(
    "===== UNEXPLAINED LEXICAL VARIATION ====="
)
print(result)

assert result.authorized is False


# =========================================================
# EXISTING STRUCTURAL VARIABLE POLICY MUST STILL WORK
# =========================================================

existing_variable = StructuralFamilyRegion(
    role="variable",
    semantic_role="timestamp",
    values=(
        "2026-08-25T13:01:01Z",
        "2026-08-25T13:01:04Z",
        "2026-08-25T13:01:09Z",
    ),
    stable=False,
)

result = authorizer.authorize(
    family_with_region(
        existing_variable
    )
)

print()
print(
    "===== EXISTING STRUCTURAL VARIABLE ====="
)
print(result)

assert result.authorized is True

decision = result.after_regions[0]

assert decision.generalize is True
assert decision.reason == (
    "structurally_identified_variable"
)


print()
print("=" * 80)
print(
    "ENVELOPE VARIATION AUTHORIZATION TEST PASSED"
)
