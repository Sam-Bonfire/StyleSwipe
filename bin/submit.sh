#!/bin/bash
set -e

echo "🛠 Validating with Turbo..."
bun x turbo run lint test typecheck

echo "� Exporting to Git..."
jj git export

echo "�🚀 Submitting stack to Graphite..."
# gt will automatically see the local jj changes exported to the git backend
gt stack submit --no-edit --publish

echo "✅ Stack submitted for review."