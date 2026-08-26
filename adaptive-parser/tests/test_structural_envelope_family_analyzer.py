import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.structural_envelope_family_analyzer import (
    StructuralEnvelopeFamilyAnalyzer,
)


analyzer = StructuralEnvelopeFamilyAnalyzer()


# =========================================================
# FAMILY 1
# Textual envelope with varying timestamp.
# =========================================================

text_family = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "database timeout"
    ),
    (
        "2026-08-25T13:01:04Z ERROR "
        "database timeout"
    ),
    (
        "2026-08-25T13:01:09Z ERROR "
        "database timeout"
    ),
]


result = analyzer.analyze(
    text_family
)


print("===== TEXT FAMILY =====")
print(result)

assert result.compatible is True

timestamp_regions = [
    region
    for region in result.before_regions
    if region.semantic_role == "timestamp"
]

assert len(timestamp_regions) == 1
assert timestamp_regions[0].stable is False

level_regions = [
    region
    for region in result.before_regions
    if region.semantic_role == "level"
]

assert len(level_regions) == 1
assert level_regions[0].stable is True


# =========================================================
# FAMILY 2
# Structured serialization.
#
# No format name is supplied to the analyzer.
# =========================================================

structured_family = [
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


structured_result = analyzer.analyze(
    structured_family
)


print()
print("===== STRUCTURED FAMILY =====")
print(structured_result)

assert (
    structured_result.compatible
    is True
)

timestamp_regions = [
    region
    for region in (
        structured_result.before_regions
    )
    if region.semantic_role == "timestamp"
]

assert len(timestamp_regions) == 1
assert timestamp_regions[0].stable is False


# =========================================================
# FAMILY 3
# Literal structure drift.
#
# These should not silently become one reusable family.
# =========================================================

incompatible_family = [
    (
        "2026-08-25T13:01:01Z ERROR "
        "database timeout"
    ),
    (
        "2026-08-25T13:01:04Z - ERROR - "
        "database timeout"
    ),
]


incompatible_result = analyzer.analyze(
    incompatible_family
)


print()
print("===== INCOMPATIBLE FAMILY =====")
print(incompatible_result)

assert (
    incompatible_result.compatible
    is False
)


# =========================================================
# FORMAT TAXONOMY SAFETY
# =========================================================

print()
print("===== FORMAT-INDEPENDENT EVIDENCE =====")

for region in (
    structured_result.all_regions()
):
    print(region)

    assert region.role not in {
        "json",
        "key_value",
        "java",
        "python",
        "syslog",
    }


print()
print("=" * 80)
print(
    "STRUCTURAL ENVELOPE FAMILY ANALYZER TEST PASSED"
)
