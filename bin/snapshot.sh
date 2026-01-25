#!/bin/bash
TYPE=$1; SCOPE=$2; TITLE=$3; DESC=$4; TICKET=$5

if [ -z "$TICKET" ]; then
  echo "Usage: bun snap <type> <scope> <title> <description> <ticketids>"
  exit 1
fi

MSG="$TYPE${SCOPE:+($SCOPE)}: $TITLE

$DESC

For: $TICKET"

# Update the current change description
jj describe -m "$MSG"

# Sync to remote backup
jj git push --allow-new

echo "✅ Snapshot updated and synced to remote backup."