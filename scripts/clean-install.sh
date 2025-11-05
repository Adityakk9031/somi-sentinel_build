#!/bin/bash

# SOMI Sentinel Clean Install Script
# This script removes node_modules and reinstalls all dependencies

echo "🧹 SOMI Sentinel Clean Install"
echo "=============================="

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

# Remove existing node_modules
print_status "Removing existing node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_success "Removed main node_modules"
else
    print_warning "No main node_modules found"
fi

# Remove package-lock.json
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    print_success "Removed package-lock.json"
fi

# Remove node_modules from subdirectories
print_status "Cleaning subdirectory node_modules..."

if [ -d "contracts/node_modules" ]; then
    rm -rf contracts/node_modules
    print_success "Removed contracts/node_modules"
fi

if [ -d "agent/node_modules" ]; then
    rm -rf agent/node_modules
    print_success "Removed agent/node_modules"
fi

if [ -d "relayer/node_modules" ]; then
    rm -rf relayer/node_modules
    print_success "Removed relayer/node_modules"
fi

# Install main dependencies
print_status "Installing main project dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Main dependencies installed successfully"
else
    print_error "Failed to install main dependencies"
    exit 1
fi

# Contract dependencies are now included in main package.json
print_status "Contract dependencies are now included in main package.json"

# Agent dependencies are now included in main package.json
print_status "Agent dependencies are now included in main package.json"

# Relayer dependencies are now included in main package.json
print_status "Relayer dependencies are now included in main package.json"

print_success "All dependencies installed successfully!"
echo ""
echo "🚀 You can now start the application:"
echo "   npm run dev"
echo ""
echo "📚 Or run individual services:"
echo "   npm run dev:frontend  # Frontend only"
echo "   npm run dev:backend   # Backend only"
echo "   npm run dev:all       # All services"
echo ""
echo "🔧 Or use the scripts:"
echo "   bash start.sh         # Simple start"
echo "   bash scripts/start-all.sh  # Full system"
