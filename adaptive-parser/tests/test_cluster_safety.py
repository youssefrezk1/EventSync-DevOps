import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.cluster_safety import ClusterSafetyValidator


validator = ClusterSafetyValidator()


cases = {
    "safe_session": {
        "messages": [
            "Session <VAR> expired for user <VAR>",
            "Session <VAR> expired for user <VAR>",
            "Session <VAR> expired for user <VAR>",
        ],
        "runtime_positions": {1, 5},
        "expected": True,
    },

    "unsafe_state": {
        "messages": [
            "database connection failed",
            "database connection restored",
            "database connection delayed",
        ],
        "runtime_positions": set(),
        "expected": False,
    },

    "unsafe_action": {
        "messages": [
            "worker task started successfully",
            "worker task completed successfully",
            "worker task cancelled successfully",
        ],
        "runtime_positions": set(),
        "expected": False,
    },

    "runtime_plus_semantic": {
        "messages": [
            "job <VAR> started",
            "job <VAR> completed",
            "job <VAR> failed",
        ],
        "runtime_positions": {1},
        "expected": False,
    },

    "safe_request": {
        "messages": [
            (
                "<TIMESTAMP> ERROR request "
                "req-<NUM> failed user=<NUM> "
                "ip=<IP> latency=<NUM>ms"
            ),
            (
                "<TIMESTAMP> ERROR request "
                "req-<NUM> failed user=<NUM> "
                "ip=<IP> latency=<NUM>ms"
            ),
            (
                "<TIMESTAMP> ERROR request "
                "req-<NUM> failed user=<NUM> "
                "ip=<IP> latency=<NUM>ms"
            ),
        ],
        "runtime_positions": set(),
        "expected": True,
    },
}


print("===== CLUSTER SAFETY =====")

for name, case in cases.items():
    result = validator.validate(
        case["messages"],
        runtime_positions=case[
            "runtime_positions"
        ],
    )

    print()
    print("=" * 80)
    print(name.upper())

    print()
    print("MESSAGES:")

    for message in case["messages"]:
        print(message)

    print()
    print("RESULT:")
    print(result)

    assert result["safe"] == case["expected"], (
        f"{name}: expected "
        f"{case['expected']}, got "
        f"{result['safe']}"
    )


print()
print("=" * 80)
print("ALL CLUSTER SAFETY ASSERTIONS PASSED")
