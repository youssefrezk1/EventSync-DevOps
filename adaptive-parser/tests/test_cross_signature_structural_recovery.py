import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer


messages = [
    "GET /api/health 200 4.231 ms - 11",
    "GET /api/events 200 12.742 ms - 531",
    "POST /api/events 201 18.913 ms - 325",
    "DELETE /api/events/123 204 7.104 ms - 0",
]


clusterer = UnknownLogClusterer(
    eps=0.50,
    min_samples=2,
)

clusters = clusterer.cluster(messages)


print("===== CROSS-SIGNATURE STRUCTURAL RECOVERY =====")

for cluster_id, group in sorted(
    clusters.items(),
    key=lambda item: item[0],
):
    print()
    print(
        f"CLUSTER {cluster_id} "
        f"({len(group)} messages)"
    )

    for message in group:
        print(message)


real_clusters = {
    cluster_id: group
    for cluster_id, group in clusters.items()
    if cluster_id != -1
}

assert len(real_clusters) == 1, (
    "Structurally compatible messages separated only by "
    "their root token should recover into one family."
)

recovered_messages = next(
    iter(real_clusters.values())
)

assert sorted(recovered_messages) == sorted(messages)

assert -1 not in clusters or not clusters[-1]

print()
print(
    "CROSS-SIGNATURE STRUCTURAL RECOVERY TEST PASSED"
)
