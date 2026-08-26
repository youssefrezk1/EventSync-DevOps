import sys
from collections import defaultdict
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer
from app.log_adapter import LogAdapter
from app.log_normalizer import LogNormalizer
from app.log_signature import LogSignature


messages = [
    # =========================================================
    # ERROR|database
    # Family A: connection timeout
    # =========================================================
    "2026-08-25T13:00:01Z ERROR database postgres connection timeout after 5000ms",
    "2026-08-25T13:00:04Z ERROR database mysql connection timeout after 7000ms",
    "2026-08-25T13:00:09Z ERROR database mongodb connection timeout after 3000ms",

    # =========================================================
    # ERROR|database
    # Family B: query failure
    # =========================================================
    "2026-08-25T13:01:01Z ERROR database users query failed duration=81ms",
    "2026-08-25T13:01:04Z ERROR database orders query failed duration=35ms",
    "2026-08-25T13:01:09Z ERROR database invoices query failed duration=54ms",

    # =========================================================
    # ERROR|database
    # Family C: database unavailable
    # =========================================================
    "2026-08-25T13:02:01Z ERROR database primary unavailable retries=3",
    "2026-08-25T13:02:04Z ERROR database replica unavailable retries=5",
    "2026-08-25T13:02:09Z ERROR database analytics unavailable retries=2",

    # =========================================================
    # INFO|worker
    # Family D: completed job
    # =========================================================
    "2026-08-25T13:03:01Z INFO worker job-101 completed duration=31ms",
    "2026-08-25T13:03:04Z INFO worker job-205 completed duration=47ms",
    "2026-08-25T13:03:09Z INFO worker job-991 completed duration=22ms",

    # =========================================================
    # INFO|worker
    # Family E: started job
    # =========================================================
    "2026-08-25T13:04:01Z INFO worker job-301 started queue=orders",
    "2026-08-25T13:04:04Z INFO worker job-405 started queue=payments",
    "2026-08-25T13:04:09Z INFO worker job-799 started queue=notifications",

    # =========================================================
    # WARN|queue
    # Family F: queue depth
    # =========================================================
    "2026-08-25T13:05:01Z WARN queue orders depth=101",
    "2026-08-25T13:05:04Z WARN queue payments depth=205",
    "2026-08-25T13:05:09Z WARN queue notifications depth=991",

    # =========================================================
    # WARN|queue
    # Family G: queue processing delay
    # =========================================================
    "2026-08-25T13:06:01Z WARN queue orders processing delay=81ms",
    "2026-08-25T13:06:04Z WARN queue payments processing delay=35ms",
    "2026-08-25T13:06:09Z WARN queue notifications processing delay=54ms",
]


adapter = LogAdapter()
normalizer = LogNormalizer()
signature_builder = LogSignature()

print("===== SIGNATURE PARTITIONS =====")

signature_groups = defaultdict(list)

for message in messages:
    event = adapter.adapt(message)
    normalized = normalizer.normalize(event.message)
    signature = signature_builder.build(event)

    signature_groups[signature].append(message)

for signature, group in signature_groups.items():
    print()
    print(
        f"{signature}: "
        f"{len(group)} messages"
    )

    for message in group:
        print(" ", message)


print()
print("=" * 80)
print("===== FINAL CLUSTERS =====")

clusterer = UnknownLogClusterer(
    eps=0.60,
    min_samples=2,
)

clusters = clusterer.cluster(messages)

for cluster_id, group in sorted(
    clusters.items(),
    key=lambda item: item[0],
):
    print()
    print("=" * 80)
    print(
        f"CLUSTER {cluster_id} "
        f"({len(group)} messages)"
    )

    for message in group:
        print(message)


print()
print("=" * 80)
print("===== SUMMARY =====")

noise_count = len(
    clusters.get(-1, [])
)

real_clusters = {
    cluster_id: group
    for cluster_id, group in clusters.items()
    if cluster_id != -1
}

print("TOTAL MESSAGES:")
print(len(messages))

print("STRUCTURAL PARTITIONS:")
print(len(signature_groups))

print("FINAL SEMANTIC CLUSTERS:")
print(len(real_clusters))

print("NOISE COUNT:")
print(noise_count)

print()
print(
    "EXPECTED IDEAL RESULT: "
    "3 structural partitions expand into "
    "7 semantic clusters of 3 messages each, "
    "with no cross-family merges."
)
