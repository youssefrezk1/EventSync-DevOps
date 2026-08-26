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
    PROJECT_ROOT / "data" / "mixed_engine.test.json"
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
        "Payment TX-100 failed user=41 latency=81ms",
        "Queue orders contains 841 messages",
        "User alice logged in from 10.0.0.5",

        "Database mysql connection failed",
        "Payment TX-200 failed user=72 latency=35ms",
        "Queue payments contains 129 messages",
        "User bob logged in from 10.0.0.8",

        "Database mongodb connection failed",
        "Payment TX-300 failed user=19 latency=54ms",
        "Queue notifications contains 401 messages",
        "User charlie logged in from 10.0.0.11",
    ]

    print("===== MIXED LEARNING PHASE =====")

    for index, message in enumerate(messages, start=1):
        result = engine.process(message)

        print()
        print(f"[{index}] MESSAGE:")
        print(message)

        print("RESULT:")
        print(result)

    print()
    print("===== REGISTERED PARSERS =====")

    for parser in registry.parsers:
        print()
        print(parser)

    print()
    print("===== FUTURE LOG TESTS =====")

    future_messages = [
        "Database oracle connection failed",
        "Payment TX-777 failed user=83 latency=92ms",
        "Queue invoices contains 777 messages",
        "User diana logged in from 10.0.0.25",
    ]

    for message in future_messages:
        result = engine.process(message)

        print()
        print("MESSAGE:")
        print(message)

        print("RESULT:")
        print(result)

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
