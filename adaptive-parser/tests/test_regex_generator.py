import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.regex_generator import TemplateRegexGenerator


template = "Payment <*> failed user=<*> latency=<*>ms"

generator = TemplateRegexGenerator()
regex = generator.generate(template)

print("===== TEMPLATE =====")
print(template)

print()
print("===== GENERATED REGEX =====")
print(regex)

messages = [
    "Payment TX-77 failed user=83 latency=92ms",
    "Payment TX-999 failed user=12 latency=41ms",
]

print()
print("===== MATCH TEST =====")

for message in messages:
    match = re.fullmatch(regex, message)

    print()
    print("MESSAGE:")
    print(message)

    if match:
        print("MATCHED: True")
        print("PARAMETERS:", list(match.groups()))
    else:
        print("MATCHED: False")
