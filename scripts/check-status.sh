#!/bin/bash

# SOMI Sentinel Status Check Script

set -e

echo "🔍 SOMI Sentinel System Status"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check service status
check_service() {
    local service_name=$1
    local url=$2
    local pid_file="logs/${service_name}.pid"
    
    echo -n "Checking $service_name... "
    
    # Check if PID file exists and process is running
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            # Check if service responds to HTTP
            if curl -s "$url" > /dev/null 2>&1; then
                print_success "Running (PID: $pid)"
                return 0
            else
                print_warning "Process running but not responding"
                return 1
            fi
        else
            print_error "Process not running"
            return 1
        fi
    else
        print_error "Not started"
        return 1
    fi
}

# Function to get service info
get_service_info() {
    local service_name=$1
    local url=$2
    
    echo "  URL: $url"
    
    # Try to get service-specific info
    case $service_name in
        "Backend API")
            if curl -s "$url/health" > /dev/null 2>&1; then
                local health=$(curl -s "$url/health" | jq -r '.status' 2>/dev/null || echo "unknown")
                local block=$(curl -s "$url/health" | jq -r '.blockNumber' 2>/dev/null || echo "unknown")
                echo "  Status: $health"
                echo "  Block: $block"
            fi
            ;;
        "Relayer")
            if curl -s "$url/status" > /dev/null 2>&1; then
                local balance=$(curl -s "$url/status" | jq -r '.balance' 2>/dev/null || echo "unknown")
                local gasPrice=$(curl -s "$url/status" | jq -r '.gasPrice' 2>/dev/null || echo "unknown")
                echo "  Balance: $balance ETH"
                echo "  Gas Price: $gasPrice wei"
            fi
            ;;
        "Agent")
            if curl -s "$url/status" > /dev/null 2>&1; then
                local running=$(curl -s "$url/status" | jq -r '.isRunning' 2>/dev/null || echo "unknown")
                local address=$(curl -s "$url/status" | jq -r '.agentAddress' 2>/dev/null || echo "unknown")
                echo "  Running: $running"
                echo "  Address: $address"
            fi
            ;;
    esac
}

# Check all services
echo ""
print_status "Service Status:"
echo "=================="

services=(
    "Backend API:http://localhost:3000/health"
    "Relayer:http://localhost:3001/health"
    "Agent:http://localhost:3002/status"
    "Frontend:http://localhost:5173"
)

all_healthy=true

for service_info in "${services[@]}"; do
    IFS=':' read -r service_name url <<< "$service_info"
    
    if check_service "$service_name" "$url"; then
        get_service_info "$service_name" "$url"
    else
        all_healthy=false
    fi
    echo ""
done

# Overall status
echo "=================="
if $all_healthy; then
    print_success "All services are running and healthy!"
else
    print_error "Some services are not running properly"
    echo ""
    echo "To start all services: bash scripts/start-all.sh"
    echo "To view logs: tail -f logs/[Service Name].log"
fi

# Check contract deployment
echo ""
print_status "Contract Status:"
echo "=================="

if [ -f "deployed.json" ]; then
    local network=$(cat deployed.json | jq -r '.network')
    local chainId=$(cat deployed.json | jq -r '.chainId')
    local deployer=$(cat deployed.json | jq -r '.deployer')
    
    print_success "Contracts deployed to $network (Chain ID: $chainId)"
    echo "  Deployer: $deployer"
    echo "  Contracts:"
    echo "    Vault: $(cat deployed.json | jq -r '.contracts.vault')"
    echo "    Executor: $(cat deployed.json | jq -r '.contracts.executor')"
    echo "    Policy Manager: $(cat deployed.json | jq -r '.contracts.policyManager')"
    echo "    Audit Log: $(cat deployed.json | jq -r '.contracts.auditLog')"
else
    print_error "No deployment found. Run: cd contracts && npm run deploy:somnia"
fi

# Check environment variables
echo ""
print_status "Environment Status:"
echo "======================"

required_vars=("AGENT_PRIVATE_KEY" "RELAYER_PRIVATE_KEY" "GEMINI_API_KEY" "NFT_STORAGE_KEY")
all_vars_set=true

for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        print_success "$var: Set"
    else
        print_error "$var: Not set"
        all_vars_set=false
    fi
done

if $all_vars_set; then
    print_success "All required environment variables are set"
else
    print_error "Some environment variables are missing"
    echo "Check your .env files in each service directory"
fi

echo ""
print_status "System check complete"
