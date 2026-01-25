#!/bin/bash
TYPE=$1
TITLE=$2

if [ -z "$TITLE" ]; then 
  echo "Usage: bun task <type> <title>"
  exit 1
fi

# Create a new change off main
jj new main -m "[$TYPE/$TITLE] Initializing"

# Set the branch name for Graphite to track
jj branch set "$TYPE/$TITLE"

# Push to origin to establish the remote backup branch
jj git push --branch "$TYPE/$TITLE"

echo "✅ JJ change initialized. Branch: $TYPE/$TITLE (Remote backup established)"