import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.runtime_value_evidence import (
    RuntimeValueEvidenceAnalyzer,
)


analyzer = RuntimeValueEvidenceAnalyzer()


print("===== RAW VARIABLE-BEARING VALUES =====")

result = analyzer.analyze(
    (
        "db-101",
        "db-205",
        "db-991",
    )
)

print(result)

assert result.runtime_like is True

assert result.normalized_values == (
    "db-<NUM>",
    "db-<NUM>",
    "db-<NUM>",
)


print()
print("===== NORMALIZED VALUE =====")

assert analyzer.contains_runtime_evidence(
    "req-<NUM>"
)

assert analyzer.contains_runtime_evidence(
    "node-<UUID>"
)


print()
print("===== RAW VALUE =====")

assert analyzer.contains_runtime_evidence(
    "req-101"
)

assert analyzer.contains_runtime_evidence(
    "10.20.5.25"
)


print()
print("===== SEMANTIC VARIATION =====")

semantic = analyzer.analyze(
    (
        "failed",
        "restored",
        "delayed",
    )
)

print(semantic)

assert semantic.runtime_like is False


print()
print("===== DIFFERENT STRUCTURES =====")

different = analyzer.analyze(
    (
        "worker-101",
        "node-205",
        "queue-991",
    )
)

print(different)

assert different.runtime_like is False


print()
print("=" * 80)
print("GENERIC RUNTIME VALUE EVIDENCE TEST PASSED")


print()
print("===== PRE-NORMALIZED PLACEHOLDER FAMILY =====")

normalized_family = analyzer.analyze(
    (
        "abc<NUM>",
        "def<NUM>",
        "ghi<NUM>",
    )
)

print(normalized_family)

assert normalized_family.runtime_like is True

assert normalized_family.reason == (
    "embedded_normalized_placeholder"
)

assert normalized_family.normalized_values == (
    "abc<NUM>",
    "def<NUM>",
    "ghi<NUM>",
)
