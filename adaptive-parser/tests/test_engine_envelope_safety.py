import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.adaptive_engine import AdaptiveParsingEngine
from app.parser_registry import ParserRegistry
from app.unknown_buffer import UnknownBuffer


class RecordingTemplateGenerator:
    """
    Records the structural messages crossing the generation boundary.

    Raw serialization must remain local.
    """

    def __init__(self, template):
        self.template = template
        self.calls = []

        self.last_generator = "recording-test"
        self.last_errors = []
        self.last_attempted_generators = [
            "recording-test"
        ]

    def generate(self, messages):
        self.calls.append(
            list(messages)
        )

        return self.template


def make_registry(name):
    path = (
        PROJECT_ROOT
        / "data"
        / name
    )

    path.write_text(
        json.dumps(
            {
                "parsers": []
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return path, ParserRegistry(path)


def run_case(
    name,
    messages,
    generated_template,
):
    registry_path, registry = make_registry(
        f"envelope_{name}.test.json"
    )

    buffer = UnknownBuffer()

    generator = RecordingTemplateGenerator(
        template=generated_template
    )

    engine = AdaptiveParsingEngine(
        registry=registry,
        unknown_buffer=buffer,
        template_generator=generator,
        minimum_cluster_size=3,
    )

    results = []

    for message in messages:
        results.append(
            engine.process(message)
        )

    return {
        "registry_path": registry_path,
        "registry": registry,
        "buffer": buffer,
        "generator": generator,
        "engine": engine,
        "results": results,
    }


def assert_structurally_learned(
    case,
    expected_provider_messages,
):
    assert len(
        case["generator"].calls
    ) == 1

    assert (
        case["generator"].calls[0]
        == expected_provider_messages
    )

    assert len(
        case["registry"].parsers
    ) == 1

    assert (
        case["engine"].get_metrics()[
            "parsers_learned"
        ]
        == 1
    )

    assert (
        case["buffer"].count()
        == 0
    )

    assert (
        case["results"][-1]["status"]
        == "learned_and_parsed"
    )


cases = []

try:
    # =====================================================
    # STRUCTURED REPRESENTATION
    #
    # No format-name policy is involved here.
    #
    # The canonical message appears literally in the raw
    # representation and the surrounding structure is observed
    # consistently across the family.
    # =====================================================

    structured_messages = [
        (
            '{"timestamp":"2026-08-25T16:00:01Z",'
            '"level":"error",'
            '"service":"database",'
            '"message":"connection timeout",'
            '"host":"db-101"}'
        ),
        (
            '{"timestamp":"2026-08-25T16:00:04Z",'
            '"level":"error",'
            '"service":"database",'
            '"message":"connection timeout",'
            '"host":"db-205"}'
        ),
        (
            '{"timestamp":"2026-08-25T16:00:09Z",'
            '"level":"error",'
            '"service":"database",'
            '"message":"connection timeout",'
            '"host":"db-991"}'
        ),
    ]

    structured_case = run_case(
        name="structured",
        messages=structured_messages,
        generated_template=(
            "connection timeout"
        ),
    )

    cases.append(
        structured_case
    )

    print("===== STRUCTURED REPRESENTATION =====")
    print("GENERATOR CALLS:")
    print(
        structured_case[
            "generator"
        ].calls
    )

    print()
    print("REGISTERED PARSERS:")
    print(
        structured_case[
            "registry"
        ].parsers
    )

    assert_structurally_learned(
        structured_case,
        [
            "connection timeout",
            "connection timeout",
            "connection timeout",
        ],
    )


    # =====================================================
    # ALTERNATE STRUCTURED REPRESENTATION
    #
    # Again, acceptance comes from observed structural
    # compatibility and authorization, not from a named format.
    # =====================================================

    alternate_messages = [
        (
            "time=2026-08-25T16:00:01Z "
            "level=error "
            "service=database "
            'msg="connection timeout"'
        ),
        (
            "time=2026-08-25T16:00:04Z "
            "level=error "
            "service=database "
            'msg="connection timeout"'
        ),
        (
            "time=2026-08-25T16:00:09Z "
            "level=error "
            "service=database "
            'msg="connection timeout"'
        ),
    ]

    alternate_case = run_case(
        name="alternate_structured",
        messages=alternate_messages,
        generated_template=(
            "connection timeout"
        ),
    )

    cases.append(
        alternate_case
    )

    print()
    print("=" * 80)
    print("===== ALTERNATE STRUCTURED REPRESENTATION =====")

    print("GENERATOR CALLS:")
    print(
        alternate_case[
            "generator"
        ].calls
    )

    print()
    print("REGISTERED PARSERS:")
    print(
        alternate_case[
            "registry"
        ].parsers
    )

    assert_structurally_learned(
        alternate_case,
        [
            "connection timeout",
            "connection timeout",
            "connection timeout",
        ],
    )


    # =====================================================
    # SAFETY INVARIANT
    #
    # Raw runtime/envelope values must not cross the generation
    # boundary.
    # =====================================================

    provider_payload = "\n".join(
        message
        for case in (
            structured_case,
            alternate_case,
        )
        for call in case[
            "generator"
        ].calls
        for message in call
    )

    forbidden_values = [
        "2026-08-25T16:00:01Z",
        "2026-08-25T16:00:04Z",
        "2026-08-25T16:00:09Z",
        "db-101",
        "db-205",
        "db-991",
        '{"timestamp"',
        "time=",
        "service=database",
    ]

    for value in forbidden_values:
        assert (
            value
            not in provider_payload
        ), (
            "Raw envelope/runtime value crossed "
            f"generation boundary: {value}"
        )


    print()
    print("=" * 80)
    print(
        "STRUCTURAL REPRESENTATIONS LEARNED FROM "
        "OBSERVED EVIDENCE"
    )
    print(
        "RAW ENVELOPE VALUES REMAINED LOCAL"
    )
    print(
        "NO FORMAT-SPECIFIC ALLOWLIST OR DENYLIST REQUIRED"
    )
    print(
        "ENGINE ENVELOPE SAFETY TEST PASSED"
    )

finally:
    for case in cases:
        case["registry_path"].unlink(
            missing_ok=True
        )
