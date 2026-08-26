import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.fallback_generator import FallbackTemplateGenerator
from app.mistral_generator import MistralTemplateGenerator
from app.parser_registry import ParserRegistry
from app.redacting_generator import RedactingTemplateGenerator
from app.unknown_buffer import UnknownBuffer


class BrokenGroqGenerator:
    def generate(self, messages):
        raise RuntimeError(
            "Simulated Groq provider failure"
        )


TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "secure_fallback_engine.test.json"
)

TEST_REGISTRY.write_text(
    json.dumps(
        {"parsers": []},
        indent=2,
    ),
    encoding="utf-8",
)

try:
    registry = ParserRegistry(TEST_REGISTRY)
    buffer = UnknownBuffer()

    provider_chain = FallbackTemplateGenerator(
        [
            ("groq", BrokenGroqGenerator()),
            ("mistral", MistralTemplateGenerator()),
        ]
    )

    secure_generator = RedactingTemplateGenerator(
        generator=provider_chain
    )

    engine = AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=buffer,
        template_generator=secure_generator,
        minimum_cluster_size=3,
    )

    messages = [
        (
            "2026-08-25T11:00:01Z ERROR authentication rejected "
            "email=alice@example.com api_key=secret-alpha"
        ),
        (
            "2026-08-25T11:00:04Z ERROR authentication rejected "
            "email=bob@example.com api_key=secret-beta"
        ),
        (
            "2026-08-25T11:00:09Z ERROR authentication rejected "
            "email=charlie@example.com api_key=secret-gamma"
        ),
    ]

    print("===== SECURE FALLBACK LEARNING =====")

    for message in messages:
        result = engine.process(message)

        print()
        print("MESSAGE:")
        print(message)

        print("RESULT:")
        print(result)

    print()
    print("===== PROVIDER INFORMATION =====")

    print("PROVIDER USED:")
    print(secure_generator.last_generator)

    print("ATTEMPTED PROVIDERS:")
    print(
        secure_generator.last_attempted_generators
    )

    print("PROVIDER ERRORS:")
    print(secure_generator.last_errors)

    assert (
        secure_generator.last_generator
        == "mistral"
    )

    assert (
        secure_generator.last_attempted_generators
        == ["groq", "mistral"]
    )

    print()
    print("===== SECURITY ASSERTIONS =====")

    registry_text = json.dumps(
        registry.parsers
    )

    forbidden_values = [
        "alice@example.com",
        "bob@example.com",
        "charlie@example.com",
        "secret-alpha",
        "secret-beta",
        "secret-gamma",
    ]

    for value in forbidden_values:
        assert value not in registry_text, (
            f"Sensitive value leaked into registry: {value}"
        )

    print(
        "NO RAW SENSITIVE VALUES STORED "
        "IN LEARNED PARSERS"
    )

    print()
    print("===== FUTURE LOG =====")

    future_message = (
        "2026-08-26T08:15:33Z ERROR authentication rejected "
        "email=diana@example.net api_key=secret-delta"
    )

    future_result = engine.process(
        future_message
    )

    print("MESSAGE:")
    print(future_message)

    print("RESULT:")
    print(future_result)

    assert (
        future_result["status"]
        == "known"
    )

    print()
    print("===== METRICS =====")
    metrics = engine.get_metrics()
    print(metrics)

    assert metrics["template_generation_calls"] == 1
    assert metrics["groq_attempts"] == 1
    assert metrics["groq_successes"] == 0
    assert metrics["mistral_attempts"] == 1
    assert metrics["mistral_successes"] == 1
    assert metrics["fallback_uses"] == 1

    print()
    print(
        "SECURE MISTRAL FALLBACK "
        "END-TO-END TEST PASSED"
    )

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
