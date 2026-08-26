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
from app.structural_envelope_family_analyzer import (
    StructuralEnvelopeFamilyAnalyzer,
)


family_analyzer = StructuralEnvelopeFamilyAnalyzer()
authorizer = EnvelopeRegionAuthorizer()


# =========================================================
# OBSERVED STRUCTURAL FAMILY
# =========================================================

messages = [
    (
        '{"timestamp":"2026-08-25T13:01:01Z",'
        '"level":"error",'
        '"message":"connection timeout"}'
    ),
    (
        '{"timestamp":"2026-08-25T13:01:04Z",'
        '"level":"error",'
        '"message":"connection timeout"}'
    ),
    (
        '{"timestamp":"2026-08-25T13:01:09Z",'
        '"level":"error",'
        '"message":"connection timeout"}'
    ),
]

family = family_analyzer.analyze(
    messages
)

assert family.compatible is True

authorization = authorizer.authorize(
    family
)


print("===== AUTHORIZED STRUCTURAL FAMILY =====")
print(authorization)

assert authorization.authorized is True

generalized = [
    region
    for region in authorization.before_regions
    if region.generalize
]

assert len(generalized) == 1

assert (
    generalized[0].semantic_role
    == "timestamp"
)


# =========================================================
# STABLE REGIONS MUST NOT BE GENERALIZED
# =========================================================

stable = [
    region
    for region in (
        authorization.before_regions
        + authorization.after_regions
    )
    if region.stable
]

assert stable

assert all(
    region.generalize is False
    for region in stable
)


print()
print("===== STABLE REGIONS =====")

for region in stable:
    print(region)


# =========================================================
# UNEXPLAINED VARIATION
#
# Variation alone must never authorize a wildcard.
# =========================================================

unsafe_family = StructuralEnvelopeFamily(
    compatible=True,
    before_regions=(
        StructuralFamilyRegion(
            role="variable",
            semantic_role=None,
            values=(
                "alpha",
                "beta",
                "gamma",
            ),
            stable=False,
        ),
    ),
    reason="compatible_structure",
)

unsafe_authorization = authorizer.authorize(
    unsafe_family
)


print()
print("===== UNEXPLAINED VARIATION =====")
print(unsafe_authorization)

assert (
    unsafe_authorization.authorized
    is False
)


# =========================================================
# SEMANTIC VARIATION IS NOT AUTOMATICALLY VARIABLE
#
# Even if a region has a semantic label, the structural analyzer must
# explicitly classify it as variable before generalization.
# =========================================================

semantic_drift_family = StructuralEnvelopeFamily(
    compatible=True,
    before_regions=(
        StructuralFamilyRegion(
            role="semantic",
            semantic_role="source",
            values=(
                "orders",
                "payments",
                "notifications",
            ),
            stable=False,
        ),
    ),
    reason="compatible_structure",
)

semantic_drift = authorizer.authorize(
    semantic_drift_family
)


print()
print("===== SEMANTIC DRIFT =====")
print(semantic_drift)

assert semantic_drift.authorized is False


# =========================================================
# INCOMPATIBLE FAMILY
# =========================================================

incompatible = StructuralEnvelopeFamily(
    compatible=False,
    reason="incompatible_structure",
)

result = authorizer.authorize(
    incompatible
)

assert result.authorized is False


print()
print("=" * 80)
print(
    "ENVELOPE REGION AUTHORIZATION TEST PASSED"
)
