#!/bin/bash
TYPE=$1
TITLE=$2
if [ -z "$TITLE" ]; then echo "Usage: bun task <name>"; exit 1; fi

# Safety check: Ensure we aren't branching directly off main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" == "main" ]; then
    echo "⚠️ Warning: You are branching off 'main'. Usually, you should branch off 'dev'."
    read -p "Continue anyway? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then exit 1; fi
fi

gt branch create "$TYPE/$TITLE"
echo "✅ Stacked new branch: $TYPE/$TITLE"