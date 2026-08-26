import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.groq_generator import GroqTemplateGenerator
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "empty_registry.test.json"
)

# Start with absolutely no known parsers.
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
    generator = GroqTemplateGenerator()

    engine = AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=buffer,
        template_generator=generator,
        minimum_cluster_size=3,
    )

    messages = [
        # ---------------------------------------------------------
        # Request failures
        # ---------------------------------------------------------
        "2026-08-24T12:01:03Z ERROR request req-781 failed user=42 ip=10.0.0.5 latency=81ms",
        "2026-08-24T12:01:07Z ERROR request req-992 failed user=73 ip=10.0.0.8 latency=35ms",
        "2026-08-24T12:01:11Z ERROR request req-113 failed user=19 ip=10.0.0.11 latency=54ms",

        # ---------------------------------------------------------
        # Database timeouts
        # ---------------------------------------------------------
        "2026-08-24T12:02:01Z WARN database postgres connection timeout after 5000ms",
        "2026-08-24T12:02:04Z WARN database mysql connection timeout after 7000ms",
        "2026-08-24T12:02:09Z WARN database mongodb connection timeout after 3000ms",

        # ---------------------------------------------------------
        # Authentication
        # ---------------------------------------------------------
        "2026-08-24T12:03:01Z INFO user alice authenticated from 192.168.1.20",
        "2026-08-24T12:03:05Z INFO user bob authenticated from 192.168.1.31",
        "2026-08-24T12:03:08Z INFO user charlie authenticated from 192.168.1.42",
    ]

    print("===== REALISTIC LEARNING PHASE =====")

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
    print("===== REMAINING UNKNOWN BUFFER =====")
    print("COUNT:", buffer.count())

    for message in buffer.get_messages():
        print(message)

    print()
    print("===== FUTURE LOG TESTS =====")

    future_messages = [
        "2026-08-24T13:01:45Z ERROR request req-999 failed user=88 ip=10.0.0.25 latency=92ms",
        "2026-08-24T13:02:11Z WARN database oracle connection timeout after 9000ms",
        "2026-08-24T13:03:12Z INFO user diana authenticated from 192.168.1.55",
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
