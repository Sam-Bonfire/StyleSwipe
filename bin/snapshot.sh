#!/bin/bash
MSG=$1
if [ -z "$MSG" ]; then echo "Usage: bun snap 'message'"; exit 1; fi

git add .
git commit -m "$MSG"
echo "📸 Progress captured in local git commit."