import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.fallback_generator import FallbackTemplateGenerator
from app.mistral_generator import MistralTemplateGenerator
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


class BrokenGroqGenerator:
    def generate(self, messages):
        raise RuntimeError(
            "Simulated Groq provider failure"
        )


TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "fallback_metrics.test.json"
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
            ("groq", BrokenGroqGenerator()),
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
        "2026-08-24T16:00:01Z WARN queue orders depth=101",
        "2026-08-24T16:00:04Z WARN queue payments depth=205",
        "2026-08-24T16:00:09Z WARN queue notifications depth=991",
    ]

    print("===== LEARNING =====")

    for message in messages:
        print(engine.process(message))

    print()
    print("===== METRICS =====")
    print(engine.get_metrics())

    print()
    print("===== PROVIDER ERRORS =====")
    print(generator.last_errors)

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
