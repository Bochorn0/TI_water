#!/usr/bin/env bash
# Daily logical backup. Installed to /usr/local/bin by bootstrap-droplet.sh.
set -euo pipefail

BACKUP_DIR=/var/backups/tiwater
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%F)"
OUT="${BACKUP_DIR}/tiwater-${STAMP}.dump"

pg_dump --format=custom --no-owner --no-acl -d tiwatermx -f "$OUT"
find "$BACKUP_DIR" -name 'tiwater-*.dump' -mtime +7 -delete
echo "Wrote ${OUT}"
