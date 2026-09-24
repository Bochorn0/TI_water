#!/usr/bin/env bash
# Dump Azure Postgres from a machine that can reach it (laptop, or the droplet
# after a temporary firewall rule). Does not print the password.
#
#   export AZURE_PG_PASSWORD='...'
#   bash deploy/dump-azure-postgres.sh [output.dump]
#
# Host and database match TI_water_api/.env-example.
set -euo pipefail

OUT="${1:-tiwater-prod.dump}"
: "${AZURE_PG_PASSWORD:?Set AZURE_PG_PASSWORD}"

export PGPASSWORD="$AZURE_PG_PASSWORD"
pg_dump --format=custom --no-owner --no-acl \
  "host=tiwatermx-api-server.postgres.database.azure.com port=5432 dbname=tiwatermx-api-database user=${AZURE_PG_USER:-rhuhvluvzl} sslmode=require" \
  -f "$OUT"
unset PGPASSWORD
echo "Wrote ${OUT}. Copy it off this machine before cutover. Do not commit it."
