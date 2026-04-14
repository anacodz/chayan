#!/bin/bash
# Git Master Loop - Runs every 300s
# Grouping changes logically and pushing automatically.

EXCLUDE_PATTERNS="BACKLOG.txt|TASK_NOTES.txt|UI_NOTES.txt|DEV_SERVER_LOG.txt|watchdog.log|watchdog.sh|git_master_loop.sh|.last-run.json|index.html|git_master.log"

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Git Master: Checking for changes..."
  
  # Get list of modified and untracked files, excluding the forbidden ones
  FILES=$(git status --porcelain | grep -vE "$EXCLUDE_PATTERNS" | awk '{print $2}')
  
  if [ ! -z "$FILES" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Git Master: Changes detected. Processing..."
    
    # Simple grouping: commit each modified file with a descriptive message if it's source code
    for FILE in $FILES; do
      if [ -f "$FILE" ]; then
        TYPE="chore"
        case "$FILE" in
          app/*.tsx|app/*.ts) TYPE="ui" ;;
          lib/*.ts|lib/*.js) TYPE="refactor" ;;
          prisma/*) TYPE="chore" ;;
          package.json|bun.lock) TYPE="chore" ;;
          *) TYPE="feat" ;;
        esac
        
        git add "$FILE"
        git commit -m "$TYPE: auto-update $FILE"
      fi
    done
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Git Master: Pushing changes..."
    git push origin main
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Git Master: Working tree clean."
  fi
  
  sleep 300
done
