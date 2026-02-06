#!/bin/bash

# =============================================================================
# Edge Functions Test Runner
# 
# RISE ARCHITECT PROTOCOL V3 - 10.0/10
# 
# Automatically discovers and executes all *.test.ts files in Edge Functions.
# Supports both function-specific tests and _shared module tests.
# 
# Usage: ./run-tests.sh
# Environment Variables:
#   VERBOSE=1  - Use verbose output (default: compact dot reporter)
# 
# NOTE: Supabase env var SUPABASE_ANON_KEY contains the publishable key
# (sb_publishable_...) after migration to new API key system.
# The env var NAME is kept by Supabase for backwards compatibility.
# 
# @module supabase/functions/run-tests
# =============================================================================

set -e  # Exit on first error for CI compatibility

echo "🧪 RiseCheckout Edge Functions Test Runner"
echo "==========================================="
echo ""

# Validate required environment variables
if [ -z "$SUPABASE_URL" ]; then
  echo "⚠️  SUPABASE_URL not set, using mock value for tests"
  export SUPABASE_URL="https://test.supabase.co"
fi

# SUPABASE_ANON_KEY env var name kept by Supabase (value is now a publishable key)
if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "⚠️  SUPABASE_ANON_KEY (publishable key) not set, using mock value for tests"
  export SUPABASE_ANON_KEY="test-publishable-key"
fi

# Counters
TOTAL_FILES=0
PASSED_FILES=0
FAILED_FILES=0
FAILED_TESTS=()

# Function to run a single test file
run_test_file() {
  local test_file=$1
  local relative_path=${test_file#./}
  
  echo "📋 Testing: $relative_path"
  
  # Use dot reporter for compact output (prevents stdout truncation in Lovable ~50KB limit)
  # Set VERBOSE=1 for detailed output during local debugging
  local reporter_flag="--reporter=dot"
  if [ "$VERBOSE" = "1" ]; then
    reporter_flag=""
  fi
  
  if deno test --allow-net --allow-env --allow-read $reporter_flag "$test_file" 2>&1; then
    echo "✅ PASSED: $relative_path"
    ((PASSED_FILES++))
  else
    echo "❌ FAILED: $relative_path"
    ((FAILED_FILES++))
    FAILED_TESTS+=("$relative_path")
  fi
  
  ((TOTAL_FILES++))
  echo ""
}

# Discover and run all test files
echo "🔍 Discovering test files..."
echo ""

# Find all *.test.ts files in the functions directory
while IFS= read -r -d '' test_file; do
  run_test_file "$test_file"
done < <(find . -name "*.test.ts" -type f -print0 2>/dev/null || true)

# Summary Report
echo "==========================================="
echo "📊 TEST SUMMARY"
echo "==========================================="
echo "Total test files: $TOTAL_FILES"
echo "✅ Passed: $PASSED_FILES"
echo "❌ Failed: $FAILED_FILES"

if [ $FAILED_FILES -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
  echo ""
  echo "==========================================="
  echo "❌ SOME TESTS FAILED"
  echo "==========================================="
  exit 1
else
  echo ""
  echo "==========================================="
  echo "🎉 ALL TESTS PASSED"
  echo "==========================================="
  exit 0
fi
