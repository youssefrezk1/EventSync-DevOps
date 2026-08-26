import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.regex_generator import TemplateRegexGenerator
from app.validator import ParserValidator


template = "Payment <*> failed user=<*> latency=<*>ms"

positive_messages = [
    "Payment TX-100 failed user=41 latency=81ms",
    "Payment TX-200 failed user=72 latency=35ms",
    "Payment TX-300 failed user=19 latency=54ms",
]

negative_messages = [
    "Database postgres connection failed",
    "Queue orders contains 841 messages",
    "User admin successfully logged in",
]

regex_generator = TemplateRegexGenerator()
validator = ParserValidator()

regex = regex_generator.generate(template)

result = validator.validate(
    regex=regex,
    positive_messages=positive_messages,
    negative_messages=negative_messages,
)

print("===== TEMPLATE =====")
print(template)

print()
print("===== REGEX =====")
print(regex)

print()
print("===== VALIDATION =====")
print(result)
