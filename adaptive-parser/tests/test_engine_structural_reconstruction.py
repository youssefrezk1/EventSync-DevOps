import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


class RecordingTemplateGenerator:
    def __init__(
        self,
        template,
    ):
        self.template = template
        self.calls = []

        self.last_generator = "recording-test"
        self.last_errors = []
        self.last_attempted_generators = [
            "recording-test"
        ]

    def generate(
        self,
        messages,
    ):
        self.calls.append(
            list(messages)
        )

        return self.template


registry_path = (
    PROJECT_ROOT
    / "data"
    / "engine_structural_reconstruction.test.json"
)

registry_path.write_text(
    json.dumps(
        {
            "parsers": []
        },
        indent=2,
    ),
    encoding="utf-8",
)


try:
    registry = ParserRegistry(
        registry_path
    )

    buffer = UnknownBuffer()

    generator = RecordingTemplateGenerator(
        template=(
            "request req-<NUM> failed"
        )
    )

    engine = AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=buffer,
        template_generator=generator,
        minimum_cluster_size=3,
    )


    learning_messages = [
        (
            '{"timestamp":"2026-08-25T13:01:01Z",'
            '"level":"error",'
            '"message":"request req-101 failed"}'
        ),
        (
            '{"timestamp":"2026-08-25T13:01:04Z",'
            '"level":"error",'
            '"message":"request req-205 failed"}'
        ),
        (
            '{"timestamp":"2026-08-25T13:01:09Z",'
            '"level":"error",'
            '"message":"request req-991 failed"}'
        ),
    ]


    print("===== STRUCTURED ENGINE LEARNING =====")

    results = []

    for message in learning_messages:
        result = engine.process(
            message
        )

        results.append(
            result
        )

        print()
        print(result)


    assert (
        results[0]["status"]
        == "buffered"
    )

    assert (
        results[1]["status"]
        == "buffered"
    )

    assert (
        results[2]["status"]
        == "learned_and_parsed"
    )


    # The generator receives canonical structural learning messages,
    # not raw serialized logs.
    print()
    print("===== GENERATOR INPUT =====")
    print(generator.calls)

    assert len(generator.calls) == 1

    provider_messages = (
        generator.calls[0]
    )

    assert provider_messages == [
        "request req-<NUM> failed",
        "request req-<NUM> failed",
        "request req-<NUM> failed",
    ]


    provider_payload = "\n".join(
        provider_messages
    )

    assert '{"timestamp"' not in provider_payload
    assert "2026-08-25T13:01:01Z" not in provider_payload
    assert "101" not in provider_payload
    assert "205" not in provider_payload
    assert "991" not in provider_payload


    print()
    print("===== REGISTERED PARSER =====")

    assert len(registry.parsers) == 1

    parser = registry.parsers[0]

    print(parser)

    assert parser["template"] == (
        '{"timestamp":"<*>",'
        '"level":"error",'
        '"message":"request req-<*> failed"}'
    )

    assert (
        parser["matcher"]["type"]
        == "regex"
    )


    # =====================================================
    # FUTURE LOCAL REUSE
    # =====================================================

    future_message = (
        '{"timestamp":"2026-08-26T09:45:33Z",'
        '"level":"error",'
        '"message":"request req-777 failed"}'
    )

    future_result = engine.process(
        future_message
    )


    print()
    print("===== FUTURE LOG =====")
    print(future_result)

    assert (
        future_result["status"]
        == "known"
    )

    assert (
        future_result[
            "template_generation_used"
        ]
        is False
    )

    assert len(generator.calls) == 1


    print()
    print("=" * 80)
    print(
        "ENGINE STRUCTURAL RECONSTRUCTION TEST PASSED"
    )

finally:
    registry_path.unlink(
        missing_ok=True
    )
