import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.template_generator import SimpleTemplateGenerator


generator = SimpleTemplateGenerator()

clusters = {
    "database": [
        "Database postgres connection failed",
        "Database mysql connection failed",
        "Database mongodb connection failed",
    ],
    "payment": [
        "Payment TX-100 failed user=41 latency=81ms",
        "Payment TX-200 failed user=72 latency=35ms",
        "Payment TX-300 failed user=19 latency=54ms",
    ],
}

for name, messages in clusters.items():
    print("=" * 70)
    print(f"CLUSTER: {name}")

    for message in messages:
        print(message)

    template = generator.generate(messages)

    print()
    print("GENERATED TEMPLATE:")
    print(template)
