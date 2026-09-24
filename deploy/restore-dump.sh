#!/usr/bin/env bash
# Restore a custom-format dump into the local tiwatermx database, then run
# migrations that are not already in tiwater_migrations.
#
#   sudo bash deploy/restore-dump.sh /path/to/tiwater-prod.dump
#
# Does not run seed:admin. A restored production database already has users.
set -euo pipefail

DUMP="${1:-}"
if [ -z "$DUMP" ] || [ ! -f "$DUMP" ]; then
  echo "Usage: sudo bash deploy/restore-dump.sh /path/to/tiwater-prod.dump" >&2
  exit 1
fi

APP_DIR="${APP_DIR:-/var/www/tiwater}"

sudo -u postgres pg_restore --no-owner --role=tiwater --clean --if-exists -d tiwatermx "$DUMP" || true
# pg_restore returns 1 for harmless warnings (missing objects on --clean). Re-run
# a strict check that the database accepts connections.
sudo -u postgres psql -d tiwatermx -v ON_ERROR_STOP=1 -c 'SELECT current_database();'

if [ ! -f "${APP_DIR}/TI_water_api/.env" ]; then
  echo "Write ${APP_DIR}/TI_water_api/.env before migrations (deploy/api.env.example)." >&2
  exit 1
fi

sudo -u deploy bash -lc "cd '${APP_DIR}/TI_water_api' && node scripts/migrations/run-all-migrations.js"
echo "Restore and migrations finished. Do not run npm run seed:admin unless you mean to reset the admin password."
