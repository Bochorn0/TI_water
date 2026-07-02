#!/usr/bin/env bash
# Extract valvulas images from Catalogo_valvulas.pdf, then run API migrations (includes 026 catalog seed SQL).
# Run from your machine (or Cloud Shell with Node 20 + poppler + repo checkout).
#
#   cd TI_water
#   export POSTGRES_HOST=... POSTGRES_DB=... POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_SSL=true
#   optional: POSTGRES_PORT, POSTGRES_TIWATER_* (same as API)
#   ./scripts/catalog-sync-images-and-db.sh
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TI_WATER_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API_ROOT="$(cd "$TI_WATER_ROOT/TI_water_api" && pwd)"

if ! command -v pdfimages >/dev/null 2>&1; then
  echo "Install Poppler (pdfimages). macOS: brew install poppler  Ubuntu: sudo apt install poppler-utils"
  exit 1
fi

cd "$TI_WATER_ROOT"
npm ci
npm run catalog:build-images

cd "$API_ROOT"
if [[ ! -f package-lock.json ]]; then
  echo "Missing $API_ROOT/package-lock.json"
  exit 1
fi
npm ci --omit=dev
node scripts/migrations/run-all-migrations.js

echo "Done. If prod static site is missing new PNGs, redeploy the TI Water frontend or upload public/catalogs/products to your host."
