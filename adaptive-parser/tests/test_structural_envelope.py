import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.structural_envelope import (
    StructuralEnvelope,
    StructuralRegion,
)


print("===== FORMAT-INDEPENDENT STRUCTURAL MODEL =====")


before = (
    StructuralRegion(
        role="variable",
        value="2026-08-25T16:00:01Z",
        semantic_role="timestamp",
    ),
    StructuralRegion(
        role="literal",
        value=" ",
    ),
    StructuralRegion(
        role="semantic",
        value="ERROR",
        semantic_role="level",
    ),
    StructuralRegion(
        role="literal",
        value=" ",
    ),
)


envelope = StructuralEnvelope(
    regions_before_message=before,
    regions_after_message=(),
    message_found=True,
    reconstructable=True,
)


print(envelope)


assert envelope.message_found is True
assert envelope.reconstructable is True

assert (
    envelope.regions_before_message[0].semantic_role
    == "timestamp"
)

assert (
    envelope.regions_before_message[2].semantic_role
    == "level"
)


print()
print("===== NO FORMAT TAXONOMY REQUIRED =====")

for region in envelope.all_regions():
    print(
        region.role,
        region.semantic_role,
        repr(region.value),
    )


for forbidden in (
    "json",
    "key_value",
    "java",
    "python",
    "syslog",
):
    assert forbidden not in {
        region.role
        for region in envelope.all_regions()
    }


print()
print("=" * 80)
print(
    "FORMAT-INDEPENDENT STRUCTURAL ENVELOPE MODEL PASSED"
)
