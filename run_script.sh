#!/bin/bash
echo "[SUPERVISOR] Starting Goat.js - $(date)"
while true; do
    node Goat.js
    EXIT_CODE=$?
    echo "[SUPERVISOR] Goat.js exited with code $EXIT_CODE - $(date)"
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[SUPERVISOR] Normal exit - stopping"
        break
    fi
    echo "[SUPERVISOR] Restarting in 3 seconds..."
    sleep 3
done
