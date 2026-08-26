import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.groq_generator import GroqTemplateGenerator
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


SOURCE_REGISTRY = (
    PROJECT_ROOT / "data" / "parser_registry.json"
)

TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "real_engine.test.json"
)

shutil.copyfile(
    SOURCE_REGISTRY,
    TEST_REGISTRY,
)

try:
    registry = ParserRegistry(TEST_REGISTRY)
    buffer = UnknownBuffer()
    generator = GroqTemplateGenerator()

    engine = AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=buffer,
        template_generator=generator,
        minimum_cluster_size=3,
    )

    messages = [
        "Database postgres connection failed",
        "Database mysql connection failed",
        "Database mongodb connection failed",
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
    print("===== FUTURE LOG =====")

    future_message = (
        "Database oracle connection failed"
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
