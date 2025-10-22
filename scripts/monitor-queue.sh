#!/bin/bash

echo "🔍 Monitoring BullMQ Queue Activity..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
  timestamp=$(date '+%H:%M:%S')
  
  # Get queue stats
  waiting=$(redis-cli llen "bull:process-conversation:wait" 2>/dev/null || echo "0")
  active=$(redis-cli llen "bull:process-conversation:active" 2>/dev/null || echo "0")
  completed=$(redis-cli zcard "bull:process-conversation:completed" 2>/dev/null || echo "0")
  failed=$(redis-cli zcard "bull:process-conversation:failed" 2>/dev/null || echo "0")
  
  echo "[$timestamp] Queue Status:"
  echo "  📋 Waiting: $waiting"
  echo "  🔄 Active: $active"
  echo "  ✅ Completed: $completed"
  echo "  ❌ Failed: $failed"
  
  # Show recent completed jobs
  if [ "$completed" -gt 0 ]; then
    recent=$(redis-cli zrange "bull:process-conversation:completed" -3 -1 2>/dev/null | tr '\n' ' ')
    echo "  📊 Recent completed jobs: $recent"
  fi
  
  echo ""
  sleep 2
done
