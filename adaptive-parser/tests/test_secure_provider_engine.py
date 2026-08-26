import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.fallback_generator import FallbackTemplateGenerator
from app.groq_generator import GroqTemplateGenerator
from app.mistral_generator import MistralTemplateGenerator
from app.parser_registry import ParserRegistry
from app.redacting_generator import RedactingTemplateGenerator
from app.unknown_buffer import UnknownBuffer


TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "secure_provider_engine.test.json"
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
            ("groq", GroqTemplateGenerator()),
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
            "2026-08-25T10:00:01Z ERROR login failed "
            "email=alice@example.com password=alpha-secret"
        ),
        (
            "2026-08-25T10:00:04Z ERROR login failed "
            "email=bob@example.com password=beta-secret"
        ),
        (
            "2026-08-25T10:00:09Z ERROR login failed "
            "email=charlie@example.com password=gamma-secret"
        ),
    ]

    print("===== LEARNING PHASE =====")

    for message in messages:
        result = engine.process(message)

        print()
        print("MESSAGE:")
        print(message)
        print("RESULT:")
        print(result)

    print()
    print("===== REGISTERED PARSERS =====")

    for parser in registry.parsers:
        print(parser)

    print()
    print("===== SECURITY ASSERTIONS =====")

    registry_text = json.dumps(registry.parsers)

    forbidden_values = [
        "alice@example.com",
        "bob@example.com",
        "charlie@example.com",
        "alpha-secret",
        "beta-secret",
        "gamma-secret",
    ]

    for value in forbidden_values:
        assert value not in registry_text, (
            f"Sensitive value leaked into registry: {value}"
        )

    print("NO RAW SENSITIVE VALUES STORED IN LEARNED PARSERS")

    print()
    print("===== PROVIDER INFORMATION =====")
    print("LAST PROVIDER:")
    print(secure_generator.last_generator)

    print("ATTEMPTED PROVIDERS:")
    print(secure_generator.last_attempted_generators)

    print("PROVIDER ERRORS:")
    print(secure_generator.last_errors)

    print()
    print("===== FUTURE LOG =====")

    future_message = (
        "2026-08-26T09:45:33Z ERROR login failed "
        "email=diana@example.net password=delta-secret"
    )

    print("MESSAGE:")
    print(future_message)

    future_result = engine.process(
        future_message
    )

    print("RESULT:")
    print(future_result)

    assert future_result["status"] == "known"

    print()
    print("===== METRICS =====")
    print(engine.get_metrics())

    print()
    print("SECURE END-TO-END ENGINE TEST PASSED")

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
