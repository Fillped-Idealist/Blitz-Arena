#!/bin/bash
# Stop heartbeat script

echo "Stopping heartbeat script..."

# Find and kill heartbeat process
HEARTBEAT_PID=$(ps aux | grep "[h]eartbeat.sh" | awk '{print $2}')

if [ -n "$HEARTBEAT_PID" ]; then
    kill "$HEARTBEAT_PID"
    echo "✓ Heartbeat script stopped (PID: $HEARTBEAT_PID)"
else
    echo "✗ No heartbeat script found running"
fi

echo ""
echo "Last heartbeat log:"
tail -5 /tmp/heartbeat.log
