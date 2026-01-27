#!/bin/bash
set -e

echo "🚀 Initiating Production Release..."

# 1. Sync
git checkout main && git pull origin main
git checkout dev && git pull origin dev

# 2. Merge dev into main
git checkout main
git merge dev --no-ff -m "chore: release integrated changes from dev"

# 3. Manual Version Patch (The "No-Git-Tag" logic)
echo "🔢 Incrementing version..."
# This one-liner handles the patch increment safely
NEW_VERSION=$(node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const parts = pkg.version.split('.');
  parts[2] = parseInt(parts[2]) + 1;
  pkg.version = parts.join('.');
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log(pkg.version);
")

# 4. Commit and Tag
git add package.json
git commit -m "release: v$NEW_VERSION"
git push origin main
git tag "v$NEW_VERSION"
git push origin "v$NEW_VERSION"

# 5. Back to dev
git checkout dev

echo "✅ Successfully released v$NEW_VERSION to main."