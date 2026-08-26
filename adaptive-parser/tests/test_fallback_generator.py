import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.fake_llm_generator import FakeLLMTemplateGenerator
from app.fallback_generator import FallbackTemplateGenerator


class BrokenGenerator:
    def generate(self, messages):
        raise RuntimeError(
            "Simulated provider failure"
        )


messages = [
    "Database postgres connection failed",
    "Database mysql connection failed",
    "Database mongodb connection failed",
]

generator = FallbackTemplateGenerator(
    [
        ("broken-primary", BrokenGenerator()),
        ("fake-fallback", FakeLLMTemplateGenerator()),
    ]
)

template = generator.generate(messages)

print("===== TEMPLATE =====")
print(template)

print()
print("===== GENERATOR USED =====")
print(generator.last_generator)

print()
print("===== ERRORS =====")
print(generator.last_errors)
