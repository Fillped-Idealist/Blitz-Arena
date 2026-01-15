#!/bin/bash
# Monitor heartbeat status

echo "========================================="
echo "Heartbeat Status Monitor"
echo "========================================="
echo ""

# Check if heartbeat process is running
HEARTBEAT_PID=$(ps aux | grep "[h]eartbeat.sh" | awk '{print $2}')
if [ -n "$HEARTBEAT_PID" ]; then
    echo "✓ Heartbeat script is running"
    echo "  PID: $HEARTBEAT_PID"
else
    echo "✗ Heartbeat script is NOT running"
    echo ""
    echo "To start heartbeat, run:"
    echo "  nohup /workspace/projects/heartbeat.sh > /tmp/heartbeat-output.log 2>&1 &"
    exit 1
fi

echo ""
echo "Service Status:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>&1)
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ Port 5000 is responding (HTTP $HTTP_CODE)"
else
    echo "  ✗ Port 5000 is NOT responding (HTTP $HTTP_CODE)"
fi

echo ""
echo "Recent Heartbeat Logs:"
echo "----------------------------------------"
tail -10 /tmp/heartbeat.log

echo ""
echo "========================================="
echo "Total heartbeats sent:"
grep -c "Heartbeat" /tmp/heartbeat.log || echo "0"
echo "========================================="
