#!/bin/bash

# SOMI Sentinel Integration Test Script
# This script tests the complete integration flow

set -e

echo "🧪 SOMI Sentinel Integration Test"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_status "Running: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to check if service is running
check_service_running() {
    local service_name="$1"
    local url="$2"
    
    if curl -s "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local service_name="$1"
    local url="$2"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_service_running "$service_name" "$url"; then
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    return 1
}

echo ""
print_status "Starting integration tests..."
echo ""

# Test 1: Check if all services are running
print_status "=== Service Availability Tests ==="

run_test "Backend API is running" "check_service_running 'Backend API' 'http://localhost:3000/health'"
run_test "Relayer is running" "check_service_running 'Relayer' 'http://localhost:3001/health'"
run_test "Agent is running" "check_service_running 'Agent' 'http://localhost:3002/status'"
run_test "Frontend is running" "check_service_running 'Frontend' 'http://localhost:5173'"

# Test 2: Backend API Tests
print_status "=== Backend API Tests ==="

run_test "Backend health endpoint" "curl -s http://localhost:3000/health | jq -r '.status' | grep -q 'ok'"
run_test "Backend vaults endpoint" "curl -s http://localhost:3000/api/vaults | jq -r 'length' | grep -q '[0-9]'"
run_test "Backend agent status endpoint" "curl -s http://localhost:3000/api/agent/status | jq -r '.isRunning'"
run_test "Backend relayer status endpoint" "curl -s http://localhost:3000/api/relayer/status"

# Test 3: Relayer Tests
print_status "=== Relayer Tests ==="

run_test "Relayer health endpoint" "curl -s http://localhost:3001/health | jq -r '.status' | grep -q 'ok'"
run_test "Relayer status endpoint" "curl -s http://localhost:3001/status | jq -r '.address'"

# Test 4: Agent Tests
print_status "=== Agent Tests ==="

run_test "Agent status endpoint" "curl -s http://localhost:3002/status | jq -r '.isRunning'"
run_test "Agent configuration" "curl -s http://localhost:3002/status | jq -r '.config.rpcUrl' | grep -q 'somnia'"

# Test 5: Contract Integration Tests
print_status "=== Contract Integration Tests ==="

if [ -f "deployed.json" ]; then
    run_test "Contract deployment file exists" "test -f deployed.json"
    run_test "Contract addresses are valid" "cat deployed.json | jq -r '.contracts.vault' | grep -q '^0x'"
    run_test "Contract addresses are set in backend" "curl -s http://localhost:3000/health | jq -r '.contracts.vault' | grep -q '^0x'"
else
    print_warning "Skipping contract tests - no deployment found"
fi

# Test 6: Frontend Integration Tests
print_status "=== Frontend Integration Tests ==="

run_test "Frontend loads successfully" "curl -s http://localhost:5173 | grep -q 'html'"
run_test "Frontend API calls work" "curl -s http://localhost:3000/api/vaults | jq -r 'length' | grep -q '[0-9]'"

# Test 7: End-to-End Flow Test
print_status "=== End-to-End Flow Test ==="

# Test the complete flow: Agent -> Relayer -> Contract
run_test "Agent can connect to blockchain" "curl -s http://localhost:3002/status | jq -r '.config.chainId' | grep -q '[0-9]'"
run_test "Relayer can connect to blockchain" "curl -s http://localhost:3001/status | jq -r '.chainId' | grep -q '[0-9]'"
run_test "Backend can read contract data" "curl -s http://localhost:3000/api/vaults/1 | jq -r '.address' | grep -q '^0x'"

# Test 8: Error Handling Tests
print_status "=== Error Handling Tests ==="

run_test "Backend handles invalid vault ID" "curl -s http://localhost:3000/api/vaults/invalid | jq -r '.error' | grep -q 'Failed'"
run_test "Backend handles invalid proposal ID" "curl -s http://localhost:3000/api/proposals/invalid | jq -r '.error' | grep -q 'Failed'"

# Test 9: Performance Tests
print_status "=== Performance Tests ==="

run_test "Backend responds within 2 seconds" "timeout 2 curl -s http://localhost:3000/health > /dev/null"
run_test "Relayer responds within 2 seconds" "timeout 2 curl -s http://localhost:3001/health > /dev/null"
run_test "Agent responds within 2 seconds" "timeout 2 curl -s http://localhost:3002/status > /dev/null"

# Test 10: Security Tests
print_status "=== Security Tests ==="

run_test "Backend has CORS headers" "curl -s -I http://localhost:3000/health | grep -q 'Access-Control-Allow-Origin'"
run_test "Backend has security headers" "curl -s -I http://localhost:3000/health | grep -q 'X-Content-Type-Options'"
run_test "Relayer has security headers" "curl -s -I http://localhost:3001/health | grep -q 'X-Content-Type-Options'"

# Test Results Summary
echo ""
print_status "=== Test Results Summary ==="
echo "Tests Run: $TESTS_RUN"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All integration tests passed! 🎉"
    echo ""
    echo "✅ System is fully integrated and ready for use"
    echo ""
    echo "🌐 Access the application at: http://localhost:5173"
    echo "📊 Monitor services at:"
    echo "   Backend: http://localhost:3000/health"
    echo "   Relayer: http://localhost:3001/status"
    echo "   Agent:   http://localhost:3002/status"
    exit 0
else
    print_error "Some integration tests failed"
    echo ""
    echo "❌ Please check the failed tests and fix the issues"
    echo ""
    echo "Common issues:"
    echo "1. Services not running - run: bash scripts/start-all.sh"
    echo "2. Missing environment variables - check .env files"
    echo "3. Contract not deployed - run: cd contracts && npm run deploy:somnia"
    echo "4. Network issues - check internet connection and RPC endpoints"
    exit 1
fi
