import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.template_generator import SimpleTemplateGenerator
from app.fake_llm_generator import FakeLLMTemplateGenerator


messages = [
    "Payment TX-100 failed user=41 latency=81ms",
    "Payment TX-200 failed user=72 latency=35ms",
    "Payment TX-300 failed user=19 latency=54ms",
]

simple = SimpleTemplateGenerator()
fake_llm = FakeLLMTemplateGenerator()

print("===== SIMPLE TEMPLATE =====")
print(simple.generate(messages))

print()
print("===== INTELLIGENT TEMPLATE =====")
print(fake_llm.generate(messages))
