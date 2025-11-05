#!/bin/bash

# SOMI Sentinel Simple Start Script
# This script starts the integrated frontend + backend application

echo "🚀 Starting SOMI Sentinel (Integrated Frontend + Backend)"
echo "======================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create logs directory
mkdir -p logs

# Check if environment variables are set
if [ -z "$GEMINI_API_KEY" ] || [ -z "$NFT_STORAGE_KEY" ]; then
    echo "⚠️  Warning: Some environment variables are missing."
    echo "   The backend will use mock data."
    echo "   Create a .env file with required variables (see env.example)"
    echo ""
fi

# Check if deployed.json exists
if [ ! -f "deployed.json" ]; then
    echo "⚠️  Warning: deployed.json not found."
    echo "   The backend will use mock data."
    echo "   To deploy contracts: cd contracts && npm run deploy:somnia"
    echo ""
fi

echo "🌐 Starting application..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start the integrated application
npm run dev
