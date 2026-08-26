import json
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.parser_registry import ParserRegistry
from app.regex_generator import TemplateRegexGenerator
from app.validator import ParserValidator


SOURCE_REGISTRY = (
    PROJECT_ROOT / "data" / "parser_registry.json"
)

TEST_REGISTRY = (
    PROJECT_ROOT / "data" / "parser_registry.test.json"
)

shutil.copyfile(
    SOURCE_REGISTRY,
    TEST_REGISTRY,
)

try:
    registry = ParserRegistry(TEST_REGISTRY)

    template = (
        "Database <*> connection failed"
    )

    positive_messages = [
        "Database postgres connection failed",
        "Database mysql connection failed",
        "Database mongodb connection failed",
    ]

    negative_messages = [
        "Payment TX-77 failed user=83 latency=92ms",
        "Queue orders contains 841 messages",
    ]

    regex_generator = TemplateRegexGenerator()
    validator = ParserValidator()

    regex = regex_generator.generate(template)

    validation = validator.validate(
        regex=regex,
        positive_messages=positive_messages,
        negative_messages=negative_messages,
    )

    print("===== VALIDATION =====")
    print(validation)

    if not validation["passed"]:
        raise SystemExit(
            "Candidate parser failed validation."
        )

    parser = registry.register(
        parser_id="database_connection_failure_v1",
        template=template,
        regex=regex,
        parameter_count=validation["parameter_count"],
        validation=validation,
    )

    print()
    print("===== REGISTERED PARSER =====")
    print(parser)

    print()
    print("===== FUTURE LOG TEST =====")

    future_message = (
        "Database oracle connection failed"
    )

    result = registry.match(
        future_message
    )

    print(result)

finally:
    TEST_REGISTRY.unlink(
        missing_ok=True
    )
