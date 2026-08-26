import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.envelope_variation_analyzer import (
    EnvelopeVariationAnalyzer,
)


analyzer = EnvelopeVariationAnalyzer()


print("===== VARIABLE-BEARING STRUCTURE =====")

runtime_values = (
    "db-101",
    "db-205",
    "db-991",
)

result = analyzer.analyze(
    runtime_values
)

print(result)

assert result.runtime_like is True

assert result.normalized_values == (
    "db-<NUM>",
    "db-<NUM>",
    "db-<NUM>",
)


print()
print("===== PURE SEMANTIC VARIATION =====")

semantic_values = (
    "failed",
    "restored",
    "delayed",
)

result = analyzer.analyze(
    semantic_values
)

print(result)

assert result.runtime_like is False


print()
print("===== DIFFERENT LEXICAL STRUCTURES =====")

mixed_values = (
    "worker-101",
    "node-205",
    "queue-991",
)

result = analyzer.analyze(
    mixed_values
)

print(result)

assert result.runtime_like is False


print()
print("===== NUMERIC VALUES =====")

numeric_values = (
    "101",
    "205",
    "991",
)

result = analyzer.analyze(
    numeric_values
)

print(result)

assert result.runtime_like is True

assert result.normalized_values == (
    "<NUM>",
    "<NUM>",
    "<NUM>",
)


print()
print("===== IP VALUES =====")

ip_values = (
    "10.0.0.5",
    "10.0.0.8",
    "10.20.5.25",
)

result = analyzer.analyze(
    ip_values
)

print(result)

assert result.runtime_like is True

assert result.normalized_values == (
    "<IP>",
    "<IP>",
    "<IP>",
)


print()
print("===== STABLE VALUE =====")

stable_values = (
    "database",
    "database",
    "database",
)

result = analyzer.analyze(
    stable_values
)

print(result)

assert result.runtime_like is False


print()
print("=" * 80)
print(
    "ENVELOPE VARIATION ANALYZER TEST PASSED"
)
