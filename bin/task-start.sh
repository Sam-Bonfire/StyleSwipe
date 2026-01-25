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
# Set the bookmark name for Graphite to track
jj bookmark set "$TYPE/$TITLE" -r @

# Push to origin to establish the remote backup
jj git push --allow-new

# Export to git to ensure local branch exists for tools like Graphite
echo "🔄 Exporting to Git..."
jj git export

echo "✅ JJ change initialized. Branch: $TYPE/$TITLE (Remote backup established)"