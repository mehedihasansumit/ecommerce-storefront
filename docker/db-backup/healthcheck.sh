#!/bin/sh
# Healthy when the last successful backup is less than 26 hours old.
MARKER=/var/lib/db-backup/last-success
[ -f "$MARKER" ] || exit 1
AGE=$(( $(date +%s) - $(cat "$MARKER") ))
[ "$AGE" -lt $((26 * 3600)) ]
