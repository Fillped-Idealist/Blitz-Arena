#!/bin/bash
# Heartbeat script to keep sandbox alive
# Sends periodic requests to port 5000 to maintain session activity

HEARTBEAT_INTERVAL=1800  # 30 minutes in seconds
LOG_FILE="/tmp/heartbeat.log"
PORT=5000

# Create log file if it doesn't exist
touch "$LOG_FILE"

echo "========================================" | tee -a "$LOG_FILE"
echo "Heartbeat script started at $(date)" | tee -a "$LOG_FILE"
echo "Interval: $HEARTBEAT_INTERVAL seconds" | tee -a "$LOG_FILE"
echo "Port: $PORT" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Infinite loop to send heartbeats
while true; do
    # Send request and check response
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>&1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Heartbeat successful - HTTP $HTTP_CODE" | tee -a "$LOG_FILE"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ Heartbeat failed - HTTP $HTTP_CODE" | tee -a "$LOG_FILE"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Attempting to restart service..." | tee -a "$LOG_FILE"
        
        # Try to restart the service if it fails
        cd /workspace/projects
        coze dev > /tmp/dev-restart.log 2>&1 &
    fi
    
    # Wait for next heartbeat
    sleep "$HEARTBEAT_INTERVAL"
done
