#!/usr/bin/env bash
# Smoke check for the staging host. Does not change DNS or Azure.
#   bash deploy/verify-staging.sh [https://staging.tiwater.mx]
set -euo pipefail

BASE="${1:-https://staging.tiwater.mx}"
BASE="${BASE%/}"

echo "GET ${BASE}/api/v1.0/health"
curl -fsS "${BASE}/api/v1.0/health"
echo
echo "GET ${BASE}/"
curl -fsS -o /dev/null -w "home HTTP %{http_code}\n" "${BASE}/"
echo "GET ${BASE}/el-tejaban/"
curl -fsS -o /dev/null -w "el-tejaban HTTP %{http_code}\n" "${BASE}/el-tejaban/" || \
  curl -fsS -o /dev/null -w "el-tejaban HTTP %{http_code}\n" "${BASE}/el-tejaban"
echo "Staging smoke check finished. Production tiwater.mx should still be Azure until cutover.sh and the DNS change."
