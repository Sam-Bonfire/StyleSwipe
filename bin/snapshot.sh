#!/bin/bash
set -e

# Prioritize positional arguments, fallback to environment variables
TYPE="${1:-$usage_type}"
TITLE="${2:-$usage_title}"
DESCRIPTION="${3:-$usage_description}"
TICKET="${4:-$usage_ticket}"

# If still empty, check uppercase USAGE_ variants
TYPE="${TYPE:-$USAGE_TYPE}"
TITLE="${TITLE:-$USAGE_TITLE}"
DESCRIPTION="${DESCRIPTION:-$USAGE_DESCRIPTION}"
TICKET="${TICKET:-$USAGE_TICKET}"

if [ -z "$TYPE" ] || [ -z "$TITLE" ]; then
    echo "❌ Error: Missing commit type or title."
    echo "Usage: mise run snap <type> <title> [-d description] [-t ticket]"
    exit 1
fi

# Construct the title
COMMIT_MSG="${TYPE}: ${TITLE}"

# Add optional description
if [ -n "$DESCRIPTION" ]; then
    COMMIT_MSG="${COMMIT_MSG}\n\n${DESCRIPTION}"
fi

# Add optional ticket ID
if [ -n "$TICKET" ]; then
    COMMIT_MSG="${COMMIT_MSG}\n\nFor: ${TICKET}"
fi

# Apply the commit
git add .
printf "$COMMIT_MSG" | git commit -F -

echo "📸 Progress captured with structured message:"
printf "$COMMIT_MSG\n"