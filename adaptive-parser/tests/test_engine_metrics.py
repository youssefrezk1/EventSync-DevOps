import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.fallback_generator import FallbackTemplateGenerator
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


class OfflineProvider:
    """
    Deterministic provider stand-in.

    This test exercises the production fallback-chain metadata and
    AdaptiveParsingEngine metric accounting without credentials or
    network access.
    """

    def __init__(
        self,
        template=None,
        error=None,
    ):
        self.template = template
        self.error = error
        self.calls = []

    def generate(self, messages):
        self.calls.append(
            list(messages)
        )

        if self.error is not None:
            raise RuntimeError(
                self.error
            )

        return self.template


TEST_REGISTRY = (
    PROJECT_ROOT
    / "data"
    / "metrics_engine.test.json"
)

TEST_REGISTRY.write_text(
    json.dumps(
        {"parsers": []},
        indent=2,
    ),
    encoding="utf-8",
)


try:
    registry = ParserRegistry(
        TEST_REGISTRY
    )

    buffer = UnknownBuffer()

    groq = OfflineProvider(
        template=(
            "worker job-<NUM> completed "
            "duration=<NUM>ms"
        )
    )

    mistral = OfflineProvider(
        template=(
            "worker job-<NUM> completed "
            "duration=<NUM>ms"
        )
    )

    generator = FallbackTemplateGenerator(
        [
            ("groq", groq),
            ("mistral", mistral),
        ]
    )

    engine = AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=buffer,
        template_generator=generator,
        minimum_cluster_size=3,
    )

    learning_messages = [
        (
            "2026-08-24T15:00:01Z INFO "
            "worker job-101 completed duration=31ms"
        ),
        (
            "2026-08-24T15:00:04Z INFO "
            "worker job-205 completed duration=47ms"
        ),
        (
            "2026-08-24T15:00:09Z INFO "
            "worker job-991 completed duration=22ms"
        ),
    ]

    print("===== LEARNING =====")

    learning_results = []

    for message in learning_messages:
        result = engine.process(
            message
        )

        learning_results.append(
            result
        )

        print(result)

    assert (
        learning_results[0]["status"]
        == "buffered"
    )

    assert (
        learning_results[1]["status"]
        == "buffered"
    )

    assert (
        learning_results[2]["status"]
        == "learned_and_parsed"
    )

    assert (
        learning_results[2][
            "template_generator"
        ]
        == "groq"
    )

    assert (
        learning_results[2][
            "fallback_used"
        ]
        is False
    )

    # The provider boundary must receive only the canonical
    # structural learning representation.
    expected_provider_message = (
        "worker job-<NUM> completed "
        "duration=<NUM>ms"
    )

    assert groq.calls == [
        [
            expected_provider_message,
            expected_provider_message,
            expected_provider_message,
        ]
    ]

    # Groq succeeded, so Mistral must never have been attempted.
    assert mistral.calls == []

    metrics_after_learning = (
        engine.get_metrics()
    )

    print()
    print("===== METRICS AFTER LEARNING =====")
    print(metrics_after_learning)

    assert metrics_after_learning == {
        "total_logs": 3,
        "known_logs": 0,
        "buffered_logs": 2,
        "unknown_logs": 0,
        "learned_and_parsed_logs": 1,
        "parsers_learned": 1,
        "template_generation_calls": 1,
        "groq_attempts": 1,
        "groq_successes": 1,
        "mistral_attempts": 0,
        "mistral_successes": 0,
        "fallback_uses": 0,
    }

    print()
    print("===== REUSE =====")

    reuse_results = []

    for i in range(1, 11):
        message = (
            f"2026-08-25T09:45:{i:02d}Z "
            f"INFO worker job-{700+i} "
            f"completed duration={40+i}ms"
        )

        result = engine.process(
            message
        )

        reuse_results.append(
            result
        )

        print(result)

    assert all(
        result["status"] == "known"
        for result in reuse_results
    )

    assert all(
        result[
            "template_generation_used"
        ]
        is False
        for result in reuse_results
    )

    # Reuse must remain entirely local.
    assert len(groq.calls) == 1
    assert mistral.calls == []

    final_metrics = engine.get_metrics()

    print()
    print("===== FINAL METRICS =====")
    print(final_metrics)

    assert final_metrics == {
        "total_logs": 13,
        "known_logs": 10,
        "buffered_logs": 2,
        "unknown_logs": 0,
        "learned_and_parsed_logs": 1,
        "parsers_learned": 1,
        "template_generation_calls": 1,
        "groq_attempts": 1,
        "groq_successes": 1,
        "mistral_attempts": 0,
        "mistral_successes": 0,
        "fallback_uses": 0,
    }

    print()
    print("=" * 80)
    print(
        "ENGINE METRICS OFFLINE TEST PASSED"
    )
    print(
        "LEARNING: ONE PROVIDER ATTEMPT"
    )
    print(
        "REUSE: TEN LOCAL PARSER MATCHES"
    )

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
