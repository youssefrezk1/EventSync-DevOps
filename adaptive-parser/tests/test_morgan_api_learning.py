import json
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient

import app.api as api_module
from app.adaptive_engine import AdaptiveParsingEngine
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


class RecordingMorganGenerator:
    def __init__(self):
        self.calls = []
        self.last_generator = None
        self.last_errors = []
        self.last_attempted_generators = []

    def generate(self, messages):
        self.calls.append(list(messages))

        self.last_generator = (
            "recording-morgan-test"
        )

        self.last_errors = []
        self.last_attempted_generators = [
            "recording-morgan-test"
        ]

        return (
            "GET /api/events/<*> <*> <*> ms - <*>"
        )


learning_messages = [
    (
        "\x1b[36mGET\x1b[0m "
        "/api/events/101 "
        "\x1b[32m200\x1b[0m "
        "12.742 ms - 531"
    ),
    (
        "\x1b[36mGET\x1b[0m "
        "/api/events/205 "
        "\x1b[32m200\x1b[0m "
        "18.913 ms - 325"
    ),
    (
        "\x1b[36mGET\x1b[0m "
        "/api/events/991 "
        "\x1b[32m200\x1b[0m "
        "7.104 ms - 777"
    ),
]

future_messages = [
    (
        "\x1b[36mGET\x1b[0m "
        "/api/events/456 "
        "\x1b[32m200\x1b[0m "
        "9.812 ms - 444"
    ),
    (
        "\x1b[36mGET\x1b[0m "
        "/api/events/808 "
        "\x1b[32m200\x1b[0m "
        "5.100 ms - 222"
    ),
]


with tempfile.TemporaryDirectory() as directory:
    registry_path = (
        Path(directory)
        / "parser_registry.json"
    )

    registry_path.write_text(
        json.dumps({"parsers": []}),
        encoding="utf-8",
    )

    generator = RecordingMorganGenerator()

    engine = AdaptiveParsingEngine(
        registry=ParserRegistry(
            registry_path
        ),
        unknown_buffer=UnknownBuffer(),
        template_generator=generator,
        minimum_cluster_size=3,
    )

    previous_engine = api_module._engine

    try:
        api_module._engine = engine

        client = TestClient(
            api_module.app
        )

        print(
            "===== MORGAN API LEARNING PHASE ====="
        )

        learning_results = []

        for message in learning_messages:
            response = client.post(
                "/v1/parse",
                json={"message": message},
            )

            assert response.status_code == 200

            result = response.json()
            learning_results.append(result)

            print()
            print("MESSAGE:")
            print(repr(message))
            print("RESULT:")
            print(result)

        print()
        print("===== GENERATOR CALLS =====")
        print(generator.calls)

        print()
        print("===== REGISTERED PARSERS =====")

        for parser in engine.registry.parsers:
            print(parser)

        assert len(generator.calls) == 1, (
            "Safe Morgan family should cross the "
            "generation boundary exactly once."
        )

        assert (
            learning_results[-1]["status"]
            == "learned_and_parsed"
        )

        assert (
            learning_results[-1][
                "template_generation_used"
            ]
            is True
        )

        assert len(engine.registry.parsers) == 1

        print()
        print("===== FUTURE LOCAL REUSE =====")

        for message in future_messages:
            response = client.post(
                "/v1/parse",
                json={"message": message},
            )

            assert response.status_code == 200

            result = response.json()

            print()
            print("MESSAGE:")
            print(repr(message))
            print("RESULT:")
            print(result)

            assert result["status"] == "known"

            assert (
                result["template_generation_used"]
                is False
            )

        assert len(generator.calls) == 1, (
            "Known Morgan logs must not call "
            "the generator again."
        )

        metrics = engine.get_metrics()

        print()
        print("===== METRICS =====")
        print(metrics)

        assert metrics[
            "template_generation_calls"
        ] == 1

        assert metrics[
            "parsers_learned"
        ] == 1

        print()
        print(
            "MORGAN API LEARNING TEST PASSED"
        )

    finally:
        api_module._engine = previous_engine
