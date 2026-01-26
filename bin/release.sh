#!/bin/bash
set -e

echo "🚀 Starting Production Release..."
git checkout main && git pull origin main
git checkout dev && git pull origin dev

git checkout main
git merge dev --no-ff -m "chore: release integrated changes from dev"

# Versioning
bun version patch --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
git add package.json && git commit -m "release: v$VERSION"

# Deploy
git push origin main
git tag "v$VERSION"
git push origin --tags
git checkout dev

echo "🎊 v$VERSION successfully released to main."