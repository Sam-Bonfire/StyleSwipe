#!/bin/bash
set -e

# Construct the title
COMMIT_MSG="${USAGE_TYPE}: ${USAGE_TITLE}"

# Add optional description
if [ -n "$USAGE_DESCRIPTION" ]; then
    COMMIT_MSG="${COMMIT_MSG}\n\n${USAGE_DESCRIPTION}"
fi

# Add optional ticket ID
if [ -n "$USAGE_TICKET" ]; then
    COMMIT_MSG="${COMMIT_MSG}\n\nFor: ${USAGE_TICKET}"
fi

# Apply the commit
git add .
echo -e "$COMMIT_MSG" | git commit -F -

echo "📸 Progress captured with structured message:"
echo -e "$COMMIT_MSG"