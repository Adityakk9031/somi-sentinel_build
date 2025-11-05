#!/bin/bash

# SOMI Sentinel Complete System Startup Script
# This script starts all services in the correct order

set -e

echo "🚀 Starting SOMI Sentinel Complete System"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_dir=$2
    local start_command=$3
    local port=$4
    
    print_status "Starting $service_name..."
    
    if check_port $port; then
        print_warning "Port $port is already in use. Skipping $service_name."
        return 0
    fi
    
    cd "$service_dir"
    
    # Start service in background
    nohup $start_command > "../logs/${service_name}.log" 2>&1 &
    local pid=$!
    
    echo $pid > "../logs/${service_name}.pid"
    print_success "$service_name started with PID $pid"
    
    cd ..
}

# Create logs directory
mkdir -p logs

# Check if deployed.json exists
if [ ! -f "deployed.json" ]; then
    print_error "deployed.json not found. Please run deployment first:"
    echo "cd contracts && npm run deploy:somnia"
    exit 1
fi

# Load contract addresses
print_status "Loading contract addresses from deployed.json..."
EXECUTOR_ADDRESS=$(cat deployed.json | jq -r '.contracts.executor')
POLICY_MANAGER_ADDRESS=$(cat deployed.json | jq -r '.contracts.policyManager')
VAULT_ADDRESS=$(cat deployed.json | jq -r '.contracts.vault')
AUDIT_LOG_ADDRESS=$(cat deployed.json | jq -r '.contracts.auditLog')
AMM_ADAPTER_ADDRESS=$(cat deployed.json | jq -r '.contracts.ammAdapter')

print_success "Contract addresses loaded:"
echo "  Executor: $EXECUTOR_ADDRESS"
echo "  Policy Manager: $POLICY_MANAGER_ADDRESS"
echo "  Vault: $VAULT_ADDRESS"
echo "  Audit Log: $AUDIT_LOG_ADDRESS"
echo "  AMM Adapter: $AMM_ADAPTER_ADDRESS"

# Check environment variables
print_status "Checking environment variables..."
if [ -z "$AGENT_PRIVATE_KEY" ] || [ -z "$RELAYER_PRIVATE_KEY" ] || [ -z "$GEMINI_API_KEY" ] || [ -z "$NFT_STORAGE_KEY" ]; then
    print_error "Missing required environment variables. Please check your .env files."
    echo "Required variables:"
    echo "  AGENT_PRIVATE_KEY"
    echo "  RELAYER_PRIVATE_KEY"
    echo "  GEMINI_API_KEY"
    echo "  NFT_STORAGE_KEY"
    exit 1
fi

print_success "Environment variables validated"

# Start services in order
print_status "Starting services..."

# 1. Start Backend API (Port 3000) - Now integrated in main project
print_status "Starting integrated Backend API..."
if check_port 3000; then
    print_warning "Port 3000 is already in use. Skipping Backend API."
else
    # Backend is now part of the main project, so we start it from root
    cd ..
    nohup npm run dev:backend > logs/backend.log 2>&1 &
    local backend_pid=$!
    echo $backend_pid > logs/backend.pid
    print_success "Backend API started with PID $backend_pid"
    cd scripts
fi

# Wait for backend to be ready
wait_for_service "http://localhost:3000/health" "Backend API"

# 2. Start Relayer (Port 3001) - Now integrated in main project
print_status "Starting integrated Relayer..."
if check_port 3001; then
    print_warning "Port 3001 is already in use. Skipping Relayer."
else
    # Relayer is now part of the main project, so we start it from root
    cd ..
    nohup npm run dev:relayer > logs/relayer.log 2>&1 &
    local relayer_pid=$!
    echo $relayer_pid > logs/relayer.pid
    print_success "Relayer started with PID $relayer_pid"
    cd scripts
fi

# Wait for relayer to be ready
wait_for_service "http://localhost:3001/health" "Relayer"

# 3. Start Agent (Port 3002) - Now integrated in main project
print_status "Starting integrated Agent..."
if check_port 3002; then
    print_warning "Port 3002 is already in use. Skipping Agent."
else
    # Agent is now part of the main project, so we start it from root
    cd ..
    nohup npm run dev:agent > logs/agent.log 2>&1 &
    local agent_pid=$!
    echo $agent_pid > logs/agent.pid
    print_success "Agent started with PID $agent_pid"
    cd scripts
fi

# Wait for agent to be ready
wait_for_service "http://localhost:3002/status" "Agent"

# 4. Start Frontend (Port 5173)
start_service "Frontend" "." "npm run dev" 5173

# Wait for frontend to be ready
wait_for_service "http://localhost:5173" "Frontend"

# Display status
echo ""
print_success "All services started successfully!"
echo ""
echo "🌐 Service URLs:"
echo "================"
echo "Frontend:    http://localhost:5173"
echo "Backend API: http://localhost:3000"
echo "Relayer:     http://localhost:3001"
echo "Agent:       http://localhost:3002"
echo ""
echo "📊 Monitoring:"
echo "=============="
echo "Backend Health: http://localhost:3000/health"
echo "Relayer Status: http://localhost:3001/status"
echo "Agent Status:   http://localhost:3002/status"
echo ""
echo "📝 Logs:"
echo "========"
echo "Backend: tail -f logs/Backend\\ API.log"
echo "Relayer: tail -f logs/Relayer.log"
echo "Agent:   tail -f logs/Agent.log"
echo "Frontend: tail -f logs/Frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "========================"
echo "bash scripts/stop-all.sh"
echo ""
echo "🔍 To check service status:"
echo "==========================="
echo "bash scripts/check-status.sh"
echo ""

# Keep script running to show logs
print_status "Press Ctrl+C to stop all services and exit"
print_status "Or run 'bash scripts/stop-all.sh' in another terminal"

# Function to cleanup on exit
cleanup() {
    print_status "Stopping all services..."
    
    # Stop services by PID
    for service in "Backend API" "Relayer" "Agent" "Frontend"; do
        if [ -f "logs/${service}.pid" ]; then
            local pid=$(cat "logs/${service}.pid")
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                print_success "$service stopped"
            fi
            rm -f "logs/${service}.pid"
        fi
    done
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user interrupt
while true; do
    sleep 1
done
