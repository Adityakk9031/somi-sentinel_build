#!/bin/bash

# Script to show AI Agent activity in real-time

echo "🤖 SOMI Sentinel AI Agent Activity Monitor"
echo "==========================================="
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed"
    exit 1
fi

# Check if agent is running
if ! curl -s http://localhost:3002/health > /dev/null; then
    echo "❌ AI Agent is not running on port 3002"
    echo "Start it with: npm run dev:agent"
    exit 1
fi

echo "✅ AI Agent is running"
echo ""

# Function to show activity
show_activity() {
    echo "📊 Recent AI Activity (last 10 entries):"
    echo "----------------------------------------"
    
    ACTIVITY=$(curl -s "http://localhost:3002/activity?limit=10")
    
    # Parse and display
    echo "$ACTIVITY" | grep -o '"timestamp":"[^"]*"' | head -10 | while read line; do
        echo "  • ${line}"
    done
    
    echo ""
    echo "🌐 Full activity log: http://localhost:3002/activity"
}

# Show activity once
show_activity

# Watch mode (optional)
if [ "$1" == "--watch" ]; then
    echo "🔍 Watching for AI outputs (press Ctrl+C to stop)..."
    echo ""
    
    while true; do
        sleep 3
        clear
        show_activity
        echo "Last checked: $(date)"
        echo "Press Ctrl+C to stop"
    done
fi

