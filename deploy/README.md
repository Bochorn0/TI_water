# TI Water on DigitalOcean

Same DigitalOcean account as CMI. **New droplet.** CMI stays on `174.138.34.118`. Azure workflows stay active until `https://tiwater.mx` is confirmed on this droplet.

This machine did not have `doctl`, an Azure CLI session, or a DigitalOcean token, so the droplet, the dump, DNS, and the Azure shutdown are run by you with the scripts below. Do not turn Azure off before that confirmation.

## 1. Droplet

In the DigitalOcean panel (the account that owns the CMI droplet):

- Ubuntu 24.04, **2 GB RAM minimum** (4 GB is safer with Postgres and catalog images)
- Region near Hermosillo, or a US region if that is cheaper
- Enable weekly droplet backups
- Note the public IP

SSH in as root and install a GitHub **read-only deploy key** for `Bochorn0/TI_water` on the `deploy` user (the server runs `git fetch`). Separately, create an SSH key pair whose **public** key you pass as `DEPLOY_PUBKEY_FILE` and whose **private** key becomes the GitHub Actions secret `DROPLET_SSH_KEY`. Do not reuse the CMI key.

```bash
# on the droplet, after copying this repo or cloning it
sudo DEPLOY_PUBKEY_FILE=/root/tiwater_gha.pub \
  CERTBOT_EMAIL=you@example.com \
  bash deploy/bootstrap-droplet.sh
```

Bootstrap installs Nginx, Postgres (localhost only), Node 20, PM2, Poppler, UFW (22, 80, 443), and a daily `pg_dump` cron. It does not open 5432 or 3009. Certbot runs only if `staging.tiwater.mx` already points at this IP.

GitHub secrets on `Bochorn0/TI_water` (not the Aquatech monorepo):

| Secret | Value |
| --- | --- |
| `DROPLET_HOST` | new droplet IP |
| `DROPLET_USER` | `deploy` |
| `DROPLET_SSH_KEY` | private key that matches `authorized_keys` |

Pushing Aquatech `main` still updates Azure Static Web Apps only. DigitalOcean updates when `Bochorn0/TI_water` `main` is pushed. [`.github/workflows/deploy-digitalocean.yml`](../.github/workflows/deploy-digitalocean.yml) does not remove the Azure workflows.

## 2. Environment

```bash
sudo bash deploy/render-env.sh
```

That fills the local Postgres password from `/root/tiwater-db-password` into `/var/www/tiwater/TI_water_api/.env`.

From **Azure App Service `tiwatermx-api` → Configuration → Application settings**, copy into that `.env`:

- `SECRET_KEY` (keeps existing password hashes and JWTs valid)
- `TIWATER_API_KEY` (same value as `VITE_TIWATER_API_KEY` in `/var/www/tiwater/.env.production`)
- The email block that is actually set (`EMAIL_PROVIDER` plus `MAILGUN_*`, or `SENDGRID_*`, or `RESEND_*`, or `SMTP_*` / `OAUTH_*`)
- Quote keys if present: `TIWATER_QUOTE_*`, `TIWATER_EMAIL_REPLY_TO`

Leave `EMAIL_DISABLED` unset. Do not change provider. Database host stays `localhost`, `POSTGRES_SSL=false`, database `tiwatermx`, user `tiwater`. `FRONTEND_URL`, `TIWATER_PUBLIC_ORIGIN`, and `SITE_ORIGIN` stay `https://tiwater.mx`.

Frontend file `/var/www/tiwater/.env.production` (see `frontend.env.production.example`):

- Parallel period: `VITE_API_BASE_URL=https://staging.tiwater.mx/api/v1.0`
- `VITE_USE_MOCK_API=false`
- `VITE_TIWATER_API_KEY` matches the API key

Azure Static Web Apps secrets stay pointed at the Azure API until cutover. Both builds must set `VITE_API_BASE_URL`, because [src/config-global.ts](../src/config-global.ts) and [el-tejaban/src/config-global.ts](../el-tejaban/src/config-global.ts) still fall back to the Azure hostname when that variable is empty.

## 3. Database

From a machine that can reach Azure Postgres (temporary firewall rule if the server is private):

```bash
export AZURE_PG_PASSWORD='from Azure'
bash deploy/dump-azure-postgres.sh ~/tiwater-prod.dump
```

Copy the dump to the droplet (do not commit it), then:

```bash
sudo bash deploy/restore-dump.sh /root/tiwater-prod.dump
```

`pg_restore` loads live data. `node scripts/migrations/run-all-migrations.js` applies only files missing from `tiwater_migrations`. Do not run `npm run seed:admin` on a restored production database.

Daily backups: `/etc/cron.d/tiwater-pg-dump` writes `/var/backups/tiwater/tiwater-YYYY-MM-DD.dump` and deletes files older than 7 days. Keep one copy off the droplet as well.

Production writes stay on Azure until the DNS flip. Take a **fresh** dump and restore immediately before cutover.

## 4. Parallel check

Add an A record for `staging.tiwater.mx` only. Leave `tiwater.mx` and `cmiservicios.mx` alone.

```bash
bash deploy/verify-staging.sh https://staging.tiwater.mx
```

Confirm the homepage, `/el-tejaban/`, `/api/v1.0/health`, login, catalog, and one quote email. Then push `Bochorn0/TI_water` `main` and confirm Azure (existing workflows) and the droplet (this workflow) both update. `https://tiwater.mx` should still be Azure.

## 5. Cutover (only after the parallel check)

```bash
export AZURE_PG_PASSWORD='...'
bash deploy/dump-azure-postgres.sh /tmp/tiwater-final.dump
sudo bash deploy/restore-dump.sh /tmp/tiwater-final.dump
sudo CERTBOT_EMAIL=you@example.com bash deploy/cutover.sh
```

`cutover.sh` sets `VITE_API_BASE_URL=https://tiwater.mx/api/v1.0`, rebuilds, and asks Certbot for `tiwater.mx` and `www.tiwater.mx`. Then change those two A records to this droplet. Leave `cmiservicios.mx` on `174.138.34.118`.

After `https://tiwater.mx` is this droplet, replace `PRODUCTION_API_BASE` in `src/config-global.ts` and `el-tejaban/src/config-global.ts` with `https://tiwater.mx/api/v1.0` so a missing build secret cannot call Azure.

Only after that traffic check: disable the push triggers on `azure-static-web-apps.yml`, `main_tiwatermx-api.yml`, and the Aquatech monorepo `tiwater-static-web-app.yml`, then stop App Service `tiwatermx-api`, the Static Web App, and Azure Postgres. Keep the final dump.
