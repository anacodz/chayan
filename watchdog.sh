#!/bin/bash
LOG_FILE="DEV_SERVER_LOG.txt"
PORT=3000

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Gemini Watchdog background process started." >> $LOG_FILE

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
  if [ "$STATUS" -ne 200 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Health check status: $STATUS. Server is down or unhealthy. Restarting..." >> $LOG_FILE
    
    # Try to find and kill the process on the port
    PID=$(lsof -ti :$PORT)
    if [ ! -z "$PID" ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Killing process $PID on port $PORT" >> $LOG_FILE
      kill -9 $PID
      sleep 2
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting dev server: npm run dev" >> $LOG_FILE
    # Use npm as it was present in the project
    nohup npm run dev >> $LOG_FILE 2>&1 &
    
    # Wait for some time to let it start
    sleep 10
  fi
  sleep 30
done
