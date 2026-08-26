#!/usr/bin/env bash

set +e

cd "$(dirname "$0")" || exit 1

PASS=0
FAIL=0
SKIP=0

LOG="offline_test_results.log"

: > "$LOG"

echo "============================================================"
echo " ADAPTIVE PARSER - OFFLINE REGRESSION SUITE"
echo "============================================================"
echo

# These tests intentionally exercise real external providers
# or production provider chains.
#
# They are NOT failures and are simply excluded from the
# deterministic offline regression suite.

EXTERNAL_TESTS="
test_fallback_metrics.py
test_groq_api.py
test_groq_template.py
test_mistral_template.py
test_mixed_adaptive_engine.py
test_provider_chain_engine.py
test_real_adaptive_engine.py
test_real_mistral_fallback.py
test_real_provider_chain.py
test_realistic_empty_registry.py
test_secure_fallback_engine.py
test_secure_provider_engine.py
"

is_external_test() {
    local name="$1"

    for external in $EXTERNAL_TESTS; do
        if [ "$name" = "$external" ]; then
            return 0
        fi
    done

    return 1
}

echo "===== COMPILE CHECK ====="

if python -m compileall -q app tests; then
    echo "COMPILE: PASS"
else
    echo "COMPILE: FAIL"
    exit 1
fi

echo
echo "===== TEST EXECUTION ====="

for test_file in $(find tests -maxdepth 1 -type f -name 'test_*.py' | sort); do

    name=$(basename "$test_file")

    echo
    echo "------------------------------------------------------------"
    echo "$name"
    echo "------------------------------------------------------------"

    if is_external_test "$name"; then
        echo "SKIP: external/provider-dependent test"
        SKIP=$((SKIP + 1))
        continue
    fi

    temp_log=$(mktemp)

    python "$test_file" >"$temp_log" 2>&1
    status=$?

    if [ "$status" -eq 0 ]; then
        echo "PASS"
        PASS=$((PASS + 1))

        {
            echo
            echo "============================================================"
            echo "PASS: $name"
            echo "============================================================"
            cat "$temp_log"
        } >> "$LOG"
    else
        echo "FAIL (exit $status)"
        FAIL=$((FAIL + 1))

        {
            echo
            echo "============================================================"
            echo "FAIL: $name"
            echo "============================================================"
            cat "$temp_log"
        } >> "$LOG"

        echo
        echo "Last 20 lines:"
        tail -n 20 "$temp_log"
    fi

    rm -f "$temp_log"
done

echo
echo "============================================================"
echo " OFFLINE REGRESSION SUMMARY"
echo "============================================================"
echo "PASSED : $PASS"
echo "FAILED : $FAIL"
echo "SKIPPED: $SKIP"
echo

if [ "$FAIL" -eq 0 ]; then
    echo "OFFLINE REGRESSION SUITE PASSED"
    echo
    echo "Full output:"
    echo "$PWD/$LOG"
    exit 0
else
    echo "OFFLINE REGRESSION SUITE HAS FAILURES"
    echo
    echo "Full failure details:"
    echo "$PWD/$LOG"
    exit 1
fi
