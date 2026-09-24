#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu droplet in the same DigitalOcean account as CMI.
# Run as root on the NEW droplet. Does not touch the CMI droplet (174.138.34.118).
#
#   curl is not required. From your laptop, after SSH as root:
#   bash deploy/bootstrap-droplet.sh
#
# Optional env:
#   DEPLOY_PUBKEY   path or contents are passed via DEPLOY_PUBKEY_FILE
#   CERTBOT_EMAIL   if set, and staging.tiwater.mx already points here, issue the cert
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root on the droplet." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx postgresql postgresql-contrib poppler-utils git ufw certbot python3-certbot-nginx curl ca-certificates

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v20\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG sudo deploy
echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy

install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
if [ -n "${DEPLOY_PUBKEY_FILE:-}" ] && [ -f "$DEPLOY_PUBKEY_FILE" ]; then
  cat "$DEPLOY_PUBKEY_FILE" >> /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys
fi

install -d -m 755 -o deploy -g deploy /var/www/tiwater
if [ ! -d /var/www/tiwater/.git ]; then
  if [ -n "$(ls -A /var/www/tiwater 2>/dev/null || true)" ]; then
    echo "/var/www/tiwater is not empty and is not a git checkout. Empty it or clone Bochorn0/TI_water there first." >&2
    exit 1
  fi
  sudo -u deploy git clone git@github.com:Bochorn0/TI_water.git /var/www/tiwater
fi
chown -R deploy:deploy /var/www/tiwater

DB_PASS_FILE=/root/tiwater-db-password
if [ ! -f "$DB_PASS_FILE" ]; then
  openssl rand -hex 24 > "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
fi
DB_PASS="$(tr -d '[:space:]' < "$DB_PASS_FILE")"

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'tiwater'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE tiwater WITH LOGIN PASSWORD '${DB_PASS}'"
else
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE tiwater LOGIN PASSWORD '${DB_PASS}'"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'tiwatermx'" | grep -q 1; then
  sudo -u postgres createdb -O tiwater tiwatermx
fi

# Local connections only. Ubuntu's default pg_hba already trusts local sockets
# and rejects non-local TCP unless listen_addresses is opened. Keep the default.
PG_CONF="$(sudo -u postgres psql -tAc 'SHOW config_file')"
sed -i "s/^#\\?listen_addresses.*/listen_addresses = 'localhost'/" "$PG_CONF"
systemctl restart postgresql

install -d -m 750 -o postgres -g postgres /var/backups/tiwater
install -m 755 -o root -g root /var/www/tiwater/deploy/backup-postgres.sh /usr/local/bin/tiwater-backup-postgres
cat > /etc/cron.d/tiwater-pg-dump <<'EOF'
# Daily logical backup. Keep 7 days. Runs as the postgres OS user (peer auth, localhost only).
15 4 * * * postgres /usr/local/bin/tiwater-backup-postgres
EOF
chmod 644 /etc/cron.d/tiwater-pg-dump

cp /var/www/tiwater/deploy/nginx-tiwater.conf /etc/nginx/sites-available/tiwater
ln -sfn /etc/nginx/sites-available/tiwater /etc/nginx/sites-enabled/tiwater
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [ -n "${CERTBOT_EMAIL:-}" ]; then
  certbot --nginx --non-interactive --agree-tos -m "$CERTBOT_EMAIL" -d staging.tiwater.mx || \
    echo "Certbot skipped or failed. Point staging.tiwater.mx at this droplet, then re-run certbot."
fi

echo
echo "Postgres role tiwater, database tiwatermx. Password is in ${DB_PASS_FILE}."
echo "Next: write /var/www/tiwater/TI_water_api/.env and /var/www/tiwater/.env.production"
echo "      (see deploy/api.env.example and deploy/frontend.env.production.example),"
echo "      restore the Azure dump, then push main or run the deploy workflow."
