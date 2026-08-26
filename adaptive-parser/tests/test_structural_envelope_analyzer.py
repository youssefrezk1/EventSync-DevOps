import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.structural_envelope_analyzer import (
    StructuralEnvelopeAnalyzer,
)


analyzer = StructuralEnvelopeAnalyzer()


cases = [
    (
        "2026-08-25T13:01:00Z ERROR "
        "database timeout"
    ),
    (
        "2026-08-25 13:01:00,123 - "
        "database - ERROR - "
        "connection timeout"
    ),
    (
        "2026-08-25 13:01:00.331 "
        "ERROR DatabaseService - "
        "connection timeout"
    ),
    (
        "ERROR database connection failed"
    ),
    (
        "plain application message"
    ),
]


print("===== STRUCTURAL ENVELOPE ANALYSIS =====")


for raw in cases:
    envelope = analyzer.analyze(
        raw
    )

    print()
    print("=" * 80)
    print("RAW:")
    print(raw)

    print("MESSAGE FOUND:")
    print(
        envelope.message_found
    )

    print("RECONSTRUCTABLE:")
    print(
        envelope.reconstructable
    )

    print("BEFORE:")
    for region in (
        envelope.regions_before_message
    ):
        print(
            region
        )

    print("AFTER:")
    for region in (
        envelope.regions_after_message
    ):
        print(
            region
        )

    assert envelope.message_found is True
    assert envelope.reconstructable is True


# ---------------------------------------------------------
# Structured serialization.
#
# Important:
#
# We do NOT reject this because it happens to be JSON.
#
# The analyzer is format-independent. If the canonical message
# appears literally inside the raw representation and the surrounding
# content can be preserved structurally, the representation is a
# reconstruction candidate.
# ---------------------------------------------------------

structured_raw = (
    '{"timestamp":"2026-08-25T13:01:00Z",'
    '"level":"error",'
    '"message":"connection timeout"}'
)

structured_envelope = analyzer.analyze(
    structured_raw
)

print()
print("=" * 80)
print("STRUCTURED RAW REPRESENTATION")
print(structured_envelope)

assert (
    structured_envelope.message_found
    is True
)

assert (
    structured_envelope.reconstructable
    is True
)

assert (
    structured_envelope.regions_before_message
)

assert (
    structured_envelope.regions_after_message
)


# Verify that reconstruction capability came from structural
# observation rather than from a named format classification.

all_roles = {
    region.role
    for region in (
        structured_envelope.all_regions()
    )
}

for forbidden in (
    "json",
    "key_value",
    "java",
    "python",
    "syslog",
):
    assert forbidden not in all_roles


print()
print(
    "STRUCTURED REPRESENTATION ACCEPTED BY OBSERVED STRUCTURE"
)

print()
print("=" * 80)
print(
    "STRUCTURAL ENVELOPE ANALYZER TEST PASSED"
)
