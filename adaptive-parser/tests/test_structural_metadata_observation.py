import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.structural_envelope_analyzer import (
    StructuralEnvelopeAnalyzer,
)
from app.structural_envelope_family_analyzer import (
    StructuralEnvelopeFamilyAnalyzer,
)


analyzer = StructuralEnvelopeAnalyzer()
family_analyzer = (
    StructuralEnvelopeFamilyAnalyzer(
        analyzer=analyzer
    )
)


messages = [
    (
        '{"timestamp":"2026-08-25T16:00:01Z",'
        '"level":"error",'
        '"service":"database",'
        '"message":"connection timeout",'
        '"host":"db-101"}'
    ),
    (
        '{"timestamp":"2026-08-25T16:00:04Z",'
        '"level":"error",'
        '"service":"database",'
        '"message":"connection timeout",'
        '"host":"db-205"}'
    ),
    (
        '{"timestamp":"2026-08-25T16:00:09Z",'
        '"level":"error",'
        '"service":"database",'
        '"message":"connection timeout",'
        '"host":"db-991"}'
    ),
]


print("===== INDIVIDUAL STRUCTURES =====")

for message in messages:
    envelope = analyzer.analyze(
        message
    )

    print()
    print(message)

    print("BEFORE:")
    for region in (
        envelope.regions_before_message
    ):
        print(region)

    print("AFTER:")
    for region in (
        envelope.regions_after_message
    ):
        print(region)


print()
print("===== FAMILY =====")

family = family_analyzer.analyze(
    messages
)

print(family)


assert family.compatible is True

host_regions = [
    region
    for region in family.after_regions
    if (
        region.semantic_role
        == "metadata:host"
    )
]

assert len(host_regions) == 1

host_region = host_regions[0]

assert host_region.values == (
    "db-101",
    "db-205",
    "db-991",
)

assert host_region.stable is False

# Critically, metadata observation alone must NOT pretend that this is
# already authorized runtime data.
assert host_region.role == "semantic"


print()
print("=" * 80)
print(
    "STRUCTURAL METADATA OBSERVATION TEST PASSED"
)
