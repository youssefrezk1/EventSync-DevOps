import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from fastapi.testclient import TestClient

from app import api
from app.adaptive_engine import AdaptiveParsingEngine
from app.fake_llm_generator import FakeLLMTemplateGenerator
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


class RecordingTemplateGenerator:
    def __init__(self, template=None):
        self.template = template
        self.calls = []

        self.last_generator = "recording-api-test"
        self.last_errors = []
        self.last_attempted_generators = [
            "recording-api-test"
        ]

    def generate(self, messages):
        self.calls.append(
            list(messages)
        )

        if self.template is None:
            raise AssertionError(
                "Template generator was called unexpectedly."
            )

        return self.template


def build_test_engine(
    directory,
    generator=None,
):
    registry_path = (
        Path(directory)
        / "parser_registry.json"
    )

    registry_path.write_text(
        json.dumps({"parsers": []}),
        encoding="utf-8",
    )

    if generator is None:
        generator = FakeLLMTemplateGenerator()

    engine = AdaptiveParsingEngine(
        registry=ParserRegistry(registry_path),
        unknown_buffer=UnknownBuffer(),
        template_generator=generator,
        minimum_cluster_size=3,
    )

    return engine


class AdaptiveParserApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = (
            tempfile.TemporaryDirectory()
        )

        self.engine = build_test_engine(
            self.temp_directory.name
        )

        api.set_engine(self.engine)

        self.client = TestClient(api.app)

    def tearDown(self):
        api.set_engine(None)
        self.temp_directory.cleanup()

    def test_health(self):
        response = self.client.get(
            "/health"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "service": "eventsync-adaptive-parser",
            },
        )

    def test_parse_buffers_unknown_message(self):
        response = self.client.post(
            "/v1/parse",
            json={
                "message": (
                    "GET /api/events "
                    "200 42 ms - 531"
                )
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        body = response.json()

        self.assertEqual(
            body["status"],
            "buffered",
        )

        self.assertEqual(
            body["buffer_size"],
            1,
        )

        self.assertFalse(
            body["template_generation_used"]
        )

    def test_parse_sanitizes_ansi_before_engine(self):
        response = self.client.post(
            "/v1/parse",
            json={
                "message": (
                    "\x1b[36mGET\x1b[0m "
                    "/api/events "
                    "\x1b[32m200\x1b[0m "
                    "12.742 ms - 531"
                )
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        body = response.json()

        self.assertEqual(
            body["status"],
            "buffered",
        )

        self.assertEqual(
            body["message"],
            (
                "GET /api/events "
                "200 12.742 ms - 531"
            ),
        )

    def test_metrics_reflect_parse_request(self):
        response = self.client.post(
            "/v1/parse",
            json={
                "message": (
                    "GET /api/events/123 "
                    "200 31 ms - 412"
                )
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        response = self.client.get(
            "/metrics"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        metrics = response.json()

        self.assertEqual(
            metrics["total_logs"],
            1,
        )

        self.assertEqual(
            metrics["buffered_logs"],
            1,
        )

    def test_learning_and_future_local_reuse(self):
        generator = RecordingTemplateGenerator(
            template=(
                "request req-<NUM> failed"
            )
        )

        self.engine = build_test_engine(
            self.temp_directory.name,
            generator=generator,
        )

        api.set_engine(self.engine)

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

        results = []

        for message in learning_messages:
            response = self.client.post(
                "/v1/parse",
                json={
                    "message": message
                },
            )

            self.assertEqual(
                response.status_code,
                200,
            )

            results.append(
                response.json()
            )

        self.assertEqual(
            results[0]["status"],
            "buffered",
        )

        self.assertEqual(
            results[1]["status"],
            "buffered",
        )

        self.assertEqual(
            results[2]["status"],
            "learned_and_parsed",
        )

        # Learning crossed the generation boundary once.
        self.assertEqual(
            len(generator.calls),
            1,
        )

        # Only canonical structural messages reached it.
        self.assertEqual(
            generator.calls[0],
            [
                "request req-<NUM> failed",
                "request req-<NUM> failed",
                "request req-<NUM> failed",
            ],
        )

        future_message = (
            '{"timestamp":"2026-08-26T09:45:33Z",'
            '"level":"error",'
            '"message":"request req-777 failed"}'
        )

        response = self.client.post(
            "/v1/parse",
            json={
                "message": future_message
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        future_result = response.json()

        self.assertEqual(
            future_result["status"],
            "known",
        )

        self.assertFalse(
            future_result[
                "template_generation_used"
            ]
        )

        # Future reuse is entirely local.
        self.assertEqual(
            len(generator.calls),
            1,
        )

        metrics = self.client.get(
            "/metrics"
        ).json()

        self.assertEqual(
            metrics["template_generation_calls"],
            1,
        )

        self.assertEqual(
            metrics["parsers_learned"],
            1,
        )

    def test_unsafe_cluster_never_reaches_generator(self):
        generator = RecordingTemplateGenerator(
            template=None
        )

        self.engine = build_test_engine(
            self.temp_directory.name,
            generator=generator,
        )

        api.set_engine(self.engine)

        messages = [
            "database connection failed",
            "database connection restored",
            "database connection delayed",
        ]

        for message in messages:
            response = self.client.post(
                "/v1/parse",
                json={
                    "message": message
                },
            )

            self.assertEqual(
                response.status_code,
                200,
            )

        self.assertEqual(
            generator.calls,
            [],
        )

        metrics = self.client.get(
            "/metrics"
        ).json()

        self.assertEqual(
            metrics["template_generation_calls"],
            0,
        )

        self.assertEqual(
            metrics["parsers_learned"],
            0,
        )


if __name__ == "__main__":
    unittest.main()
