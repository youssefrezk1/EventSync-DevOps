import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.envelope_variation_analyzer import (
    EnvelopeVariationAnalyzer,
)
from app.runtime_slot_analyzer import (
    RuntimeSlotAnalyzer,
)
from app.runtime_value_evidence import (
    RuntimeValueEvidenceAnalyzer,
)


shared = RuntimeValueEvidenceAnalyzer()

slot_analyzer = RuntimeSlotAnalyzer(
    value_evidence_analyzer=shared
)

envelope_analyzer = EnvelopeVariationAnalyzer(
    value_analyzer=shared
)


print("===== SHARED ANALYZER IDENTITY =====")

assert (
    slot_analyzer.value_evidence_analyzer
    is shared
)

assert (
    envelope_analyzer.value_analyzer
    is shared
)

print("Runtime slot and envelope adapters share the primitive.")


print()
print("===== RUNTIME SLOT ANALYSIS =====")

slot_messages = [
    "request req-101 failed",
    "request req-205 failed",
    "request req-991 failed",
]

slots = slot_analyzer.analyze(
    slot_messages
)

for slot in slots:
    print(slot)

authorized = (
    slot_analyzer.authorized_positions(
        slot_messages
    )
)

print("AUTHORIZED:", sorted(authorized))

assert authorized == {1}


print()
print("===== SEMANTIC VARIATION REMAINS CLOSED =====")

semantic_messages = [
    "database connection failed",
    "database connection restored",
    "database connection delayed",
]

semantic_positions = (
    slot_analyzer.authorized_positions(
        semantic_messages
    )
)

print(
    "AUTHORIZED:",
    sorted(semantic_positions),
)

assert semantic_positions == set()


print()
print("===== ENVELOPE VALUE ANALYSIS =====")

envelope_evidence = (
    envelope_analyzer.analyze(
        (
            "db-101",
            "db-205",
            "db-991",
        )
    )
)

print(envelope_evidence)

assert envelope_evidence.runtime_like is True

assert envelope_evidence.normalized_values == (
    "db-<NUM>",
    "db-<NUM>",
    "db-<NUM>",
)


print()
print("=" * 80)
print(
    "SHARED RUNTIME VALUE EVIDENCE TEST PASSED"
)
