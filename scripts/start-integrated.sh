#!/bin/bash

# SOMI Sentinel Unified Start Script
# This script starts the integrated frontend + backend

set -e

echo "🚀 Starting SOMI Sentinel (Frontend + Backend)"
echo "============================================="

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

# Create logs directory
mkdir -p logs

# Check if deployed.json exists
if [ ! -f "deployed.json" ]; then
    print_warning "deployed.json not found. Backend will use mock data."
    print_info "To deploy contracts: cd contracts && npm run deploy:somnia"
fi

# Check if environment variables are set
print_status "Checking environment variables..."
if [ -z "$GEMINI_API_KEY" ] || [ -z "$NFT_STORAGE_KEY" ]; then
    print_warning "Some environment variables are missing. Backend will use mock data."
    print_info "Create a .env file with required variables (see env.example)"
fi

# Check if ports are available
if check_port 3000; then
    print_warning "Port 3000 is already in use. Backend may not start."
fi

if check_port 5173; then
    print_warning "Port 5173 is already in use. Frontend may not start."
fi

# Start the integrated application
print_status "Starting integrated SOMI Sentinel application..."
print_info "This will start both frontend and backend together"

# Start the application
npm run dev

# Note: The above command will run both frontend and backend concurrently
# If you want to run them separately, use:
# npm run dev:frontend  (in one terminal)
# npm run dev:backend   (in another terminal)
