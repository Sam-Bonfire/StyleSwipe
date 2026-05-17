#!/bin/bash
set -e

# Prioritize positional arguments, fallback to environment variables
TYPE="${1:-$usage_type}"
TITLE="${2:-$usage_title}"

# If still empty, check uppercase USAGE_ variants
TYPE="${TYPE:-$USAGE_TYPE}"
TITLE="${TITLE:-$USAGE_TITLE}"

if [ -z "$TITLE" ]; then 
    echo "❌ Error: Missing task type or title."
    echo "Usage: mise run task <type> <title>"
    exit 1
fi

# Slugify the title for the branch name
SLUGIFIED_TITLE=$(echo "$TITLE" | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | tr '[:upper:]' '[:lower:]')

# Safety check: Ensure we aren't branching directly off main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" == "main" ]; then
    echo "⚠️ Warning: You are branching off 'main'. Usually, you should branch off 'dev'."
    read -p "Continue anyway? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then exit 1; fi
fi

gt branch create "$TYPE/$SLUGIFIED_TITLE"
echo "✅ Stacked new branch: $TYPE/$SLUGIFIED_TITLE"