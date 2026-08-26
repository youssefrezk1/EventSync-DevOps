import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.cluster_safety import ClusterSafetyValidator
from app.clusterer import UnknownLogClusterer
from app.log_adapter import LogAdapter
from app.log_normalizer import LogNormalizer
from app.runtime_slot_authorizer import RuntimeSlotAuthorizer


adapter = LogAdapter()
normalizer = LogNormalizer()
slot_authorizer = RuntimeSlotAuthorizer()
safety = ClusterSafetyValidator()

clusterer = UnknownLogClusterer(
    eps=0.50,
    min_samples=2,
)


def prepare_for_safety(raw_messages):
    """
    Convert raw messages into normalized clustering payloads,
    discover runtime positions, mask those positions, and then
    evaluate whether remaining token variation is safe.
    """

    events = [
        adapter.adapt(message)
        for message in raw_messages
    ]

    normalized = [
        normalizer.normalize(event.message)
        for event in events
    ]

    runtime_positions = (
        slot_authorizer.authorized_positions(
            normalized
        )
    )

    masked = []

    for message in normalized:
        tokens = message.split()

        masked_tokens = [
            (
                "<VAR>"
                if position in runtime_positions
                else token
            )
            for position, token in enumerate(tokens)
        ]

        masked.append(
            " ".join(masked_tokens)
        )

    result = safety.validate(
        masked,
        runtime_positions=runtime_positions,
    )

    return {
        "normalized": normalized,
        "runtime_positions": runtime_positions,
        "masked": masked,
        "safety": result,
    }


print("===== GOOD CANDIDATE CLUSTERS =====")

good_cases = {
    "session": [
        "Session abc123 expired for user alice",
        "Session def456 expired for user bob",
        "Session ghi789 expired for user charlie",
    ],

    "request_failure": [
        (
            "2026-08-25T12:00:01Z "
            "ERROR request req-101 failed "
            "user=41 ip=10.0.0.5 latency=81ms"
        ),
        (
            "2026-08-25T12:00:04Z "
            "ERROR request req-205 failed "
            "user=72 ip=10.0.0.8 latency=35ms"
        ),
        (
            "2026-08-25T12:00:09Z "
            "ERROR request req-991 failed "
            "user=19 ip=10.0.0.11 latency=54ms"
        ),
    ],

    "queue_depth": [
        "2026-08-25T13:05:01Z WARN queue orders depth=101",
        "2026-08-25T13:05:04Z WARN queue payments depth=205",
        "2026-08-25T13:05:09Z WARN queue notifications depth=991",
    ],
}


for name, messages in good_cases.items():
    result = prepare_for_safety(
        messages
    )

    print()
    print("=" * 80)
    print(name.upper())

    print("NORMALIZED:")
    for message in result["normalized"]:
        print(message)

    print("RUNTIME POSITIONS:")
    print(
        sorted(
            result["runtime_positions"]
        )
    )

    print("MASKED:")
    for message in result["masked"]:
        print(message)

    print("SAFETY:")
    print(result["safety"])


print()
print("=" * 80)
print("===== DANGEROUS CANDIDATE CLUSTERS =====")

dangerous_cases = {
    "semantic_state": [
        "database connection failed",
        "database connection restored",
        "database connection delayed",
    ],

    "semantic_action": [
        "worker task started successfully",
        "worker task completed successfully",
        "worker task cancelled successfully",
    ],

    "runtime_plus_semantic": [
        "job alpha1 started",
        "job beta2 completed",
        "job gamma3 failed",
    ],
}


for name, messages in dangerous_cases.items():
    result = prepare_for_safety(
        messages
    )

    print()
    print("=" * 80)
    print(name.upper())

    print("NORMALIZED:")
    for message in result["normalized"]:
        print(message)

    print("RUNTIME POSITIONS:")
    print(
        sorted(
            result["runtime_positions"]
        )
    )

    print("MASKED:")
    for message in result["masked"]:
        print(message)

    print("SAFETY:")
    print(result["safety"])


print()
print("=" * 80)
print("===== CLUSTERER + SAFETY =====")

mixed_messages = [
    "database connection failed",
    "database connection restored",
    "database connection delayed",

    "Session abc123 expired for user alice",
    "Session def456 expired for user bob",
    "Session ghi789 expired for user charlie",
]

clusters = clusterer.cluster(
    mixed_messages
)

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

    if cluster_id == -1:
        print("SAFETY: skipped for noise")
        continue

    prepared = prepare_for_safety(
        group
    )

    print("MASKED:")
    for message in prepared["masked"]:
        print(message)

    print("SAFETY:")
    print(
        prepared["safety"]
    )


print()
print("=" * 80)
print(
    "CLUSTER SAFETY INTEGRATION "
    "DIAGNOSTIC COMPLETED"
)
