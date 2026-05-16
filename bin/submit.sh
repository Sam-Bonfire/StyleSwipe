#!/bin/bash
set -e

# --no-edit: Use commit messages for PR titles
# --submit: Create PRs if they don't exist
# --publish: Push branches to remote
gt stack submit --no-edit --publish

echo "✅ PRs live on GitHub targeting 'dev'."