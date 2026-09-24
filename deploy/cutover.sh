#!/usr/bin/env bash
# Run on the droplet only after staging.tiwater.mx is verified and you are ready
# to move production DNS. Does not disable Azure. Does not change cmiservicios.mx.
#
# Before this script:
#   1. Freeze writes on the Azure site.
#   2. bash deploy/dump-azure-postgres.sh /tmp/tiwater-final.dump
#   3. sudo bash deploy/restore-dump.sh /tmp/tiwater-final.dump
#
# After this script:
#   Point tiwater.mx and www.tiwater.mx A records at this droplet.
#   Leave cmiservicios.mx on 174.138.34.118.
#   Confirm https://tiwater.mx and /api/v1.0/health.
#   Only then disable the Azure push workflows and stop App Service, Static Web Apps, and Azure Postgres.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/tiwater}"
ENV_FILE="${APP_DIR}/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

sed -i 's|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://tiwater.mx/api/v1.0|' "$ENV_FILE"

# Nginx server_name already includes tiwater.mx and www. Issue the production cert.
if [ -n "${CERTBOT_EMAIL:-}" ]; then
  sudo certbot --nginx --non-interactive --agree-tos --expand \
    -m "$CERTBOT_EMAIL" \
    -d staging.tiwater.mx -d tiwater.mx -d www.tiwater.mx
else
  echo "Set CERTBOT_EMAIL and re-run, or run certbot yourself for tiwater.mx and www.tiwater.mx."
fi

echo "Rebuilding the frontend with the production API URL..."
sudo -u deploy bash -lc "cd '${APP_DIR}' && npm run build && (pm2 describe tiwater-api >/dev/null 2>&1 && pm2 restart tiwater-api || true)"

cat <<'EOF'

Frontend fallback still points at Azure if VITE_API_BASE_URL is missing at build time.
After this cutover deploy is healthy, change PRODUCTION_API_BASE in both files to
https://tiwater.mx/api/v1.0 and push:

  src/config-global.ts
  el-tejaban/src/config-global.ts

Do not delete the Azure workflows until https://tiwater.mx is serving this droplet.
EOF
