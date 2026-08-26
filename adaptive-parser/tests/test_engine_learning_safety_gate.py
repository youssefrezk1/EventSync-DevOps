import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


class RecordingTemplateGenerator:
    """
    Local test double.

    It records every template-generation call so we can prove that
    unsafe candidate clusters never reach the generation boundary.
    """

    def __init__(self, template=None):
        self.template = template
        self.calls = []

        self.last_generator = "recording-test"
        self.last_errors = []
        self.last_attempted_generators = [
            "recording-test"
        ]

    def generate(self, messages):
        self.calls.append(
            list(messages)
        )

        if self.template is None:
            raise AssertionError(
                "Template generator was called unexpectedly."
            )

        return self.template


def create_registry(path):
    path.write_text(
        json.dumps(
            {
                "parsers": []
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return ParserRegistry(path)


# =========================================================
# TEST 1
#
# DBSCAN considers these messages similar enough to form a
# candidate cluster, but they contain unexplained semantic
# variation.
#
# The safety gate must stop them BEFORE template generation.
# =========================================================

unsafe_registry_path = (
    PROJECT_ROOT
    / "data"
    / "engine_safety_unsafe.test.json"
)

create_registry(
    unsafe_registry_path
)

unsafe_registry = ParserRegistry(
    unsafe_registry_path
)

unsafe_buffer = UnknownBuffer()

unsafe_generator = RecordingTemplateGenerator(
    template=None
)

unsafe_engine = AdaptiveParsingEngine(
    registry=unsafe_registry,
    unknown_buffer=unsafe_buffer,
    template_generator=unsafe_generator,
    minimum_cluster_size=3,
)


unsafe_messages = [
    "database connection failed",
    "database connection restored",
    "database connection delayed",
]


print("===== UNSAFE ENGINE PATH =====")

unsafe_results = []

for message in unsafe_messages:
    result = unsafe_engine.process(
        message
    )

    unsafe_results.append(
        result
    )

    print()
    print("MESSAGE:")
    print(message)

    print("RESULT:")
    print(result)


print()
print("GENERATOR CALLS:")
print(unsafe_generator.calls)

print()
print("REGISTERED PARSERS:")
print(unsafe_registry.parsers)

print()
print("METRICS:")
print(
    unsafe_engine.get_metrics()
)


assert unsafe_generator.calls == []

assert unsafe_registry.parsers == []

assert (
    unsafe_engine.get_metrics()[
        "template_generation_calls"
    ]
    == 0
)

assert (
    unsafe_engine.get_metrics()[
        "parsers_learned"
    ]
    == 0
)

assert unsafe_buffer.count() == 3


print()
print(
    "UNSAFE CLUSTER DID NOT REACH "
    "TEMPLATE GENERATION"
)


# =========================================================
# TEST 2
#
# A structurally safe family must still be able to pass the
# gate, generate a parser, register it, and parse future logs.
# =========================================================

safe_registry_path = (
    PROJECT_ROOT
    / "data"
    / "engine_safety_safe.test.json"
)

create_registry(
    safe_registry_path
)

safe_registry = ParserRegistry(
    safe_registry_path
)

safe_buffer = UnknownBuffer()

safe_generator = RecordingTemplateGenerator(
    template=(
        "request req-<NUM> failed "
        "user=<NUM> ip=<IP> "
        "latency=<NUM>ms"
    )
)

safe_engine = AdaptiveParsingEngine(
    registry=safe_registry,
    unknown_buffer=safe_buffer,
    template_generator=safe_generator,
    minimum_cluster_size=3,
)


safe_messages = [
    (
        "2026-08-25T16:00:01Z ERROR "
        "request req-101 failed "
        "user=41 ip=10.0.0.5 latency=81ms"
    ),
    (
        "2026-08-25T16:00:04Z ERROR "
        "request req-205 failed "
        "user=72 ip=10.0.0.8 latency=35ms"
    ),
    (
        "2026-08-25T16:00:09Z ERROR "
        "request req-991 failed "
        "user=19 ip=10.0.0.11 latency=54ms"
    ),
]


print()
print("=" * 80)
print("===== SAFE ENGINE PATH =====")

safe_results = []

for message in safe_messages:
    result = safe_engine.process(
        message
    )

    safe_results.append(
        result
    )

    print()
    print("MESSAGE:")
    print(message)

    print("RESULT:")
    print(result)


print()
print("GENERATOR CALLS:")
print(safe_generator.calls)

print()
print("REGISTERED PARSERS:")

for parser in safe_registry.parsers:
    print(parser)

print()
print("METRICS:")
print(
    safe_engine.get_metrics()
)


assert len(
    safe_generator.calls
) == 1

assert len(
    safe_registry.parsers
) == 1

assert (
    safe_engine.get_metrics()[
        "template_generation_calls"
    ]
    == 1
)

assert (
    safe_engine.get_metrics()[
        "parsers_learned"
    ]
    == 1
)


# =========================================================
# Future deterministic reuse.
# =========================================================

future_message = (
    "2026-08-26T09:45:33Z ERROR "
    "request req-777 failed "
    "user=88 ip=10.20.5.25 latency=92ms"
)

future_result = safe_engine.process(
    future_message
)


print()
print("===== FUTURE LOG =====")
print("MESSAGE:")
print(future_message)

print("RESULT:")
print(future_result)


assert future_result["status"] == "known"

assert (
    future_result[
        "template_generation_used"
    ]
    is False
)

assert len(
    safe_generator.calls
) == 1


print()
print("=" * 80)

print(
    "UNSAFE CANDIDATE: "
    "0 TEMPLATE CALLS"
)

print(
    "SAFE CANDIDATE: "
    "1 TEMPLATE CALL"
)

print(
    "FUTURE LOG: "
    "DETERMINISTIC LOCAL REUSE"
)

print()
print(
    "ENGINE LEARNING SAFETY GATE "
    "END-TO-END TEST PASSED"
)


unsafe_registry_path.unlink(
    missing_ok=True
)

safe_registry_path.unlink(
    missing_ok=True
)


# =========================================================
# GENERATION INPUT SECURITY BOUNDARY
# =========================================================

print()
print("=" * 80)
print("===== GENERATION INPUT SECURITY BOUNDARY =====")

assert len(
    safe_generator.calls
) == 1

provider_messages = (
    safe_generator.calls[0]
)

print("GENERATOR RECEIVED:")

for message in provider_messages:
    print(message)


expected_learning_message = (
    "request req-<NUM> failed "
    "user=<NUM> ip=<IP> latency=<NUM>ms"
)

assert provider_messages == [
    expected_learning_message,
    expected_learning_message,
    expected_learning_message,
]


provider_payload = "\n".join(
    provider_messages
)

raw_runtime_values = [
    "2026-08-25T16:00:01Z",
    "2026-08-25T16:00:04Z",
    "2026-08-25T16:00:09Z",
    "req-101",
    "req-205",
    "req-991",
    "10.0.0.5",
    "10.0.0.8",
    "10.0.0.11",
]

for value in raw_runtime_values:
    assert value not in provider_payload


print()
print(
    "GENERATOR RECEIVED ONLY STRUCTURAL "
    "LEARNING MESSAGES"
)

print(
    "RAW RUNTIME VALUES DID NOT CROSS "
    "GENERATION BOUNDARY"
)
