#!/bin/bash

# Cross-platform cleanup script for StyleSwipe

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "Windows detected. Using PowerShell for deep cleanup..."
    powershell.exe -Command "Get-ChildItem -Include node_modules,.turbo,dist,.expo,build -Recurse -Directory | Remove-Item -Recurse -Force"
else
    echo "Unix detected. Using find for cleanup..."
    find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
    find . -name ".turbo" -type d -prune -exec rm -rf '{}' +
    find . -name "dist" -type d -prune -exec rm -rf '{}' +
    find . -name ".expo" -type d -prune -exec rm -rf '{}' +
    find . -name "build" -type d -prune -exec rm -rf '{}' +
fi

echo "Cleanup complete. Run 'bun install' to restore dependencies."
