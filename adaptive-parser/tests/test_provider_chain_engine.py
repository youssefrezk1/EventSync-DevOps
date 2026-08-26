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
from app.unknown_buffer import UnknownBuffer


TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "provider_chain_engine.test.json"
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

    generator = FallbackTemplateGenerator(
        [
            ("groq", GroqTemplateGenerator()),
            ("mistral", MistralTemplateGenerator()),
        ]
    )

    engine = AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=buffer,
        template_generator=generator,
        minimum_cluster_size=3,
    )

    messages = [
        "2026-08-24T14:01:01Z ERROR cache redis miss key=user:101 latency=31ms",
        "2026-08-24T14:01:04Z ERROR cache redis miss key=user:205 latency=47ms",
        "2026-08-24T14:01:09Z ERROR cache redis miss key=user:991 latency=22ms",
    ]

    print("===== LEARNING PHASE =====")

    for message in messages:
        result = engine.process(message)

        print()
        print("MESSAGE:")
        print(message)

        print("RESULT:")
        print(result)

        print("GENERATOR USED:")
        print(generator.last_generator)

        print("GENERATOR ERRORS:")
        print(generator.last_errors)

    print()
    print("===== REGISTERED PARSERS =====")

    for parser in registry.parsers:
        print(parser)

    print()
    print("===== FUTURE LOG =====")

    future_message = (
        "2026-08-25T09:45:33Z "
        "ERROR cache redis miss "
        "key=user:777 latency=63ms"
    )

    result = engine.process(future_message)

    print("MESSAGE:")
    print(future_message)

    print("RESULT:")
    print(result)

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
