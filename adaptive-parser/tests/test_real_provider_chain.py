import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.fallback_generator import FallbackTemplateGenerator
from app.groq_generator import GroqTemplateGenerator
from app.mistral_generator import MistralTemplateGenerator


messages = [
    "Payment TX-100 failed user=41 latency=81ms",
    "Payment TX-200 failed user=72 latency=35ms",
    "Payment TX-300 failed user=19 latency=54ms",
]

generator = FallbackTemplateGenerator(
    [
        ("groq", GroqTemplateGenerator()),
        ("mistral", MistralTemplateGenerator()),
    ]
)

template = generator.generate(messages)

print("===== TEMPLATE =====")
print(template)

print()
print("===== PROVIDER USED =====")
print(generator.last_generator)

print()
print("===== PROVIDER ERRORS =====")
print(generator.last_errors)
