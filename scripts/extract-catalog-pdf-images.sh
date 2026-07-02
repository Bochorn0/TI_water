#!/usr/bin/env bash
# Extract page rasters and save as: ${PRODUCT_KEY}_main.png, ${PRODUCT_KEY}_thumb-01.png …
# Default PRODUCT_KEY=TIWVAL001, page=5, PDF= src/assets/catalogs/Catalogo_valvulas.pdf
# Output: public/catalogs/products/   (gitignored large dirs optional)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PDF="$ROOT/src/assets/catalogs/Catalogo_valvulas.pdf"
OUT="$ROOT/public/catalogs/products"
PRODUCT_KEY="${PRODUCT_KEY:-TIWVAL001}"
PAGE="${PDF_PAGE:-5}"

command -v pdfimages >/dev/null || { echo "Install poppler: brew install poppler" >&2; exit 1; }
[[ -f "$PDF" ]] || { echo "Missing $PDF" >&2; exit 1; }

wh() {
  w=$(sips -g pixelWidth "$1" 2>/dev/null | awk "/pixelWidth/ {print \$2}")
  h=$(sips -g pixelHeight "$1" 2>/dev/null | awk "/pixelHeight/ {print \$2}")
  echo $((w * h))
}
fsize() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null; }

mkdir -p "$OUT"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
pdfimages -png -f "$PAGE" -l "$PAGE" "$PDF" "$TMP/x-"
bins=()
for f in $(ls -1 "$TMP"/x-*.png 2>/dev/null | sort); do
  (( $(fsize "$f") > 1000 )) && bins+=("$f")
done
((${#bins[@]})) || { echo "No images on page $PAGE" >&2; exit 1; }

main="${bins[0]}"
for f in "${bins[@]}"; do
  if [[ $(wh "$f") -gt $(wh "$main") ]]; then
    main=$f
  elif [[ $(wh "$f") -eq $(wh "$main") && $(fsize "$f") -gt $(fsize "$main") ]]; then
    main=$f
  fi
done
msize=$(fsize "$main")
marea=$(wh "$main")
thumbs=()
for f in "${bins[@]}"; do
  [[ "$f" == "$main" ]] && continue
  a=$(wh "$f")
  sz=$(fsize "$f")
  if [[ $a -eq $marea && $sz -lt $(( msize * 2 / 3 )) ]]; then
    continue
  fi
  thumbs+=("$f")
  ((${#thumbs[@]} >= 6)) && break
done

cp -f "$main" "$OUT/${PRODUCT_KEY}_main.png"
n=0
for t in "${thumbs[@]}"; do
  n=$((n + 1))
  num=$(printf "%02d" "$n")
  cp -f "$t" "$OUT/${PRODUCT_KEY}_thumb-$num.png"
done
echo "OK $OUT/${PRODUCT_KEY}_main.png + thumbs (PRODUCT_KEY=$PRODUCT_KEY)"
ls -la "$OUT"/"${PRODUCT_KEY}"* 2>/dev/null | head -20
