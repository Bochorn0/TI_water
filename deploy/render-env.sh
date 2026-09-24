#!/usr/bin/env bash
# Write droplet env files from the examples plus the local Postgres password.
# Secrets that live only in Azure (SECRET_KEY, TIWATER_API_KEY, email) stay blank
# until you paste them from App Service tiwatermx-api. This script does not call Azure.
#
#   sudo bash deploy/render-env.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/tiwater}"
PASS_FILE="${PASS_FILE:-/root/tiwater-db-password}"
if [ ! -f "$PASS_FILE" ]; then
  echo "Missing ${PASS_FILE}. Run bootstrap-droplet.sh first." >&2
  exit 1
fi
PASS="$(cat "$PASS_FILE")"

install -m 600 -o deploy -g deploy /dev/null "${APP_DIR}/TI_water_api/.env"
sed "s/^POSTGRES_PASSWORD=$/POSTGRES_PASSWORD=${PASS}/; s/^POSTGRES_TIWATER_PASSWORD=$/POSTGRES_TIWATER_PASSWORD=${PASS}/" \
  "${APP_DIR}/deploy/api.env.example" > "${APP_DIR}/TI_water_api/.env"
chown deploy:deploy "${APP_DIR}/TI_water_api/.env"
chmod 600 "${APP_DIR}/TI_water_api/.env"

if [ ! -f "${APP_DIR}/.env.production" ]; then
  install -m 600 -o deploy -g deploy "${APP_DIR}/deploy/frontend.env.production.example" "${APP_DIR}/.env.production"
fi

echo "Wrote ${APP_DIR}/TI_water_api/.env with the local database password."
echo "Still required from Azure App Service application settings:"
echo "  SECRET_KEY, TIWATER_API_KEY, and the active EMAIL_PROVIDER block."
echo "Put the same TIWATER_API_KEY into ${APP_DIR}/.env.production as VITE_TIWATER_API_KEY."
