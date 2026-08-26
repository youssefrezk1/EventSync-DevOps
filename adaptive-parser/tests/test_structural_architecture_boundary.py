import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.parser_registry import ParserRegistry
from app.structural_template_reconstructor import (
    StructuralTemplateReconstructor,
)
from app.unknown_buffer import UnknownBuffer


class RecordingTemplateGenerator:
    """
    Deterministic provider substitute.

    It records exactly what would cross the generation boundary.
    """

    def __init__(self):
        self.calls = []

        self.last_generator = "architecture-test"
        self.last_errors = []
        self.last_attempted_generators = [
            "architecture-test"
        ]

    def generate(self, messages):
        self.calls.append(
            list(messages)
        )

        return "request req-<NUM> failed"


registry_path = (
    PROJECT_ROOT
    / "data"
    / "structural_architecture_boundary.test.json"
)

registry_path.write_text(
    '{"parsers":[]}',
    encoding="utf-8",
)

registry = ParserRegistry(
    registry_path
)

buffer = UnknownBuffer()
generator = RecordingTemplateGenerator()

engine = AdaptiveParsingEngine(
    registry=registry,
    unknown_buffer=buffer,
    template_generator=generator,
    minimum_cluster_size=3,
)


# =========================================================
# PRODUCTION DEFAULT
#
# The adaptive engine must use the structural reconstruction
# abstraction by default.
# =========================================================

print("===== PRODUCTION RECONSTRUCTION ABSTRACTION =====")

print(
    type(
        engine.template_reconstructor
    ).__name__
)

assert isinstance(
    engine.template_reconstructor,
    StructuralTemplateReconstructor,
)


# =========================================================
# STRUCTURAL LEARNING
#
# This representation is deliberately structured.
#
# The test does not assign it a reconstruction-format name.
# Learning succeeds from locally observed structure.
# =========================================================

messages = [
    (
        '{"timestamp":"2026-08-25T16:00:01Z",'
        '"level":"error",'
        '"message":"request req-101 failed"}'
    ),
    (
        '{"timestamp":"2026-08-25T16:00:04Z",'
        '"level":"error",'
        '"message":"request req-205 failed"}'
    ),
    (
        '{"timestamp":"2026-08-25T16:00:09Z",'
        '"level":"error",'
        '"message":"request req-991 failed"}'
    ),
]


print()
print("===== STRUCTURAL LEARNING =====")

results = []

for message in messages:
    result = engine.process(
        message
    )

    results.append(
        result
    )

    print(result)


assert len(
    generator.calls
) == 1

assert len(
    registry.parsers
) == 1

parser = registry.parsers[0]

print()
print("===== LEARNED PARSER =====")
print(parser)


# The raw structural syntax is reconstructed locally.
assert parser["template"] == (
    '{"timestamp":"<*>",'
    '"level":"error",'
    '"message":"request req-<*> failed"}'
)


# =========================================================
# GENERATION SECURITY BOUNDARY
#
# Provider-bound content contains structural message evidence,
# not the raw surrounding serialization.
# =========================================================

print()
print("===== GENERATION BOUNDARY =====")

for message in generator.calls[0]:
    print(message)

    assert '{"timestamp"' not in message
    assert '"level"' not in message
    assert '"message"' not in message

    assert "req-101" not in message
    assert "req-205" not in message
    assert "req-991" not in message


# =========================================================
# DETERMINISTIC LOCAL REUSE
# =========================================================

future = (
    '{"timestamp":"2026-08-26T09:45:33Z",'
    '"level":"error",'
    '"message":"request req-777 failed"}'
)

future_result = engine.process(
    future
)

print()
print("===== FUTURE LOCAL REUSE =====")
print(future_result)

assert future_result["status"] == "known"

assert len(
    generator.calls
) == 1


registry_path.unlink(
    missing_ok=True
)


print()
print("=" * 80)
print(
    "STRUCTURAL ARCHITECTURE BOUNDARY TEST PASSED"
)
