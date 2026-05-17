#!/bin/bash

TASK=$1
shift # Shift remaining args

# Detect environment
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Git Bash
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "bin/$TASK.ps1" "$@"
elif command -v powershell.exe >/dev/null 2>&1; then
    # WSL or other env with powershell.exe in PATH
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "bin/$TASK.ps1" "$@"
else
    # Standard Unix
    bash "bin/$TASK.sh" "$@"
fi
