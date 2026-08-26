import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.clusterer import UnknownLogClusterer
from app.log_adapter import LogAdapter


adapter = LogAdapter()

messages = [
    # ---------------------------------------------------------
    # Same general event family expressed through different
    # logging envelopes.
    # ---------------------------------------------------------
    (
        "2026-08-25T14:00:01Z "
        "ERROR connection timeout host=postgres duration=5000ms"
    ),

    (
        "2026-08-25 14:00:04,123 - database - ERROR - "
        "connection timeout host=mysql duration=7000ms"
    ),

    (
        "2026-08-25 14:00:09.331 "
        "ERROR DatabaseService - "
        "connection timeout host=mongodb duration=3000ms"
    ),

    # ---------------------------------------------------------
    # Structured key=value events.
    # ---------------------------------------------------------
    (
        'time=2026-08-25T14:01:01Z '
        'level=error '
        'service=worker '
        'msg="job completed" '
        'job=101 duration=31'
    ),

    (
        'time=2026-08-25T14:01:04Z '
        'level=error '
        'service=worker '
        'msg="job completed" '
        'job=205 duration=47'
    ),

    (
        'time=2026-08-25T14:01:09Z '
        'level=error '
        'service=worker '
        'msg="job completed" '
        'job=991 duration=22'
    ),
]


print("===== CANONICAL EVENTS =====")

for message in messages:
    event = adapter.adapt(message)

    print()
    print("RAW:")
    print(event.raw_message)

    print("MESSAGE:")
    print(event.message)

    print("LEVEL:")
    print(event.level)

    print("SOURCE:")
    print(event.source)


clusterer = UnknownLogClusterer(
    eps=0.50,
    min_samples=2,
)

clusters = clusterer.cluster(
    messages
)


print()
print("=" * 80)
print("===== CLUSTERS =====")

for cluster_id, cluster_messages in (
    clusters.items()
):
    print()
    print(
        f"CLUSTER {cluster_id} "
        f"({len(cluster_messages)} messages)"
    )

    for message in cluster_messages:
        print(message)


print()
print("=" * 80)
print("===== ASSERTIONS =====")


all_output_messages = [
    message
    for cluster_messages in clusters.values()
    for message in cluster_messages
]

assert sorted(all_output_messages) == sorted(
    messages
)

# The three structured worker events should remain together.
worker_cluster = None

for cluster_id, cluster_messages in (
    clusters.items()
):
    if all(
        "service=worker" in message
        for message in cluster_messages
    ):
        worker_cluster = cluster_messages
        break

assert worker_cluster is not None
assert len(worker_cluster) == 3


# Cluster output must retain the original raw representations.
assert any(
    message.startswith(
        "2026-08-25 14:00:04,123"
    )
    for message in all_output_messages
)

assert any(
    message.startswith(
        "time=2026-08-25T14:01:01Z"
    )
    for message in all_output_messages
)


print(
    "RAW REPRESENTATIONS PRESERVED"
)
print(
    "STRUCTURED EVENT FAMILY CLUSTERED"
)
print(
    "CANONICAL CLUSTERING TEST PASSED"
)
