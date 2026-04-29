#!/usr/bin/env node
/**
 * Batch: Catalogo_valvulas.pdf → valvulas/<code>/product.json + public/catalogs/products/TIWVALnnn_*.png
 * Default pages 5–10 (AQT-56 … AQT-390). Page 5 merges into existing AQT-56/product.json (keeps your table text).
 * cd TI_water && node scripts/process-valvulas-catalog.mjs
 * node scripts/process-valvulas-catalog.mjs --from 6 --to 10 --start-seq 2
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  havePoppler,
  pdftoTextPage,
  extractProductCodeFromText,
  extractFallbackCodeFromText,
  extractTitleFromText,
  hasTechnicalData,
  buildProductNarrative,
  extractPageImagesToTemp,
  copyProductImagesToPublic,
} from './lib/valvulas-pdf-assets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PDF = join(ROOT, 'src/assets/catalogs/Catalogo_valvulas.pdf');
const PUBLIC = join(ROOT, 'public/catalogs/products');
const V = join(ROOT, 'src/assets/catalogs/valvulas');
const TIW = 'TIW';
const TYPE3 = 'VAL';

function keyFor(seq) {
  return `${TIW}${TYPE3}${String(seq).padStart(3, '0')}`;
}

function buildAssetsDoc(productKey) {
  return {
    extraction: { tool: 'process-valvulas-catalog.mjs (poppler)' },
    publicPathPrefix: '/catalogs/products',
    files: {
      main: `${productKey}_main.png`,
      thumbnails: [1, 2, 3, 4, 5, 6].map((i) => `${productKey}_thumb-${String(i).padStart(2, '0')}.png`),
    },
  };
}

function asPngDataUri(filePath) {
  if (!filePath) return null;
  const b64 = readFileSync(filePath).toString('base64');
  return `data:image/png;base64,${b64}`;
}

function parseArgs() {
  const a = process.argv.slice(2);
  let from = 4;
  let to = 55;
  let startSeq = 1;
  let mergeA56 = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--from' && a[i + 1]) {
      from = parseInt(a[i + 1], 10);
      i++;
    } else if (a[i] === '--to' && a[i + 1]) {
      to = parseInt(a[i + 1], 10);
      i++;
    } else if (a[i] === '--start-seq' && a[i + 1]) {
      startSeq = parseInt(a[i + 1], 10);
      i++;
    } else if (a[i] === '--merge-a56') {
      mergeA56 = true;
    }
  }
  return { from, to, startSeq, mergeA56 };
}

function main() {
  if (!existsSync(PDF)) {
    console.error('Missing PDF:', PDF);
    process.exit(1);
  }
  if (!havePoppler()) {
    console.error('Install: brew install poppler');
    process.exit(1);
  }

  const { from, to, startSeq, mergeA56 } = parseArgs();
  const manifest = { generatedAt: new Date().toISOString(), pdf: 'Catalogo_valvulas.pdf', items: [] };
  let seq = startSeq;
  const seenCodes = new Set();

  for (let page = from; page <= to; page++) {
    const text = pdftoTextPage(PDF, page);
    const nameLine = extractTitleFromText(text);
    const productKey = keyFor(seq);
    const aqt56Path = join(V, 'AQT-56', 'product.json');

    if (page === 5 && mergeA56 && existsSync(aqt56Path) && !seenCodes.has('AQT-56')) {
      const ex = JSON.parse(readFileSync(aqt56Path, 'utf8'));
      ex.productKey = productKey;
      ex.source = { ...ex.source, file: 'Catalogo_valvulas.pdf', pdfPage: page };
      const img = extractPageImagesToTemp(PDF, page);
      ex.assets = {
        ...buildAssetsDoc(productKey),
        base64Main: asPngDataUri(img.main),
      };
      ex.images = ex.assets.base64Main ? [ex.assets.base64Main] : [];
      ex.pattern = ex.pattern || 'CATALOGO_VALVULAS__AQT-56';
      writeFileSync(aqt56Path, JSON.stringify(ex, null, 2), 'utf8');
      if (img.main) copyProductImagesToPublic(productKey, img, PUBLIC);
      else console.warn('[warn] no rasters for page 5');
      console.log('[merge] updated', aqt56Path, productKey);
      manifest.items.push({ productKey, code: ex.product?.code, page, json: 'valvulas/AQT-56/product.json' });
      seq += 1;
      continue;
    }

    const technical = hasTechnicalData(text);
    if (!technical) {
      console.warn(`[skip] page ${page}: no technical block`);
      continue;
    }
    const parsedCode = extractProductCodeFromText(text);
    const realCode = parsedCode || extractFallbackCodeFromText(text, page);
    if (seenCodes.has(realCode)) {
      console.warn(`[skip] page ${page}: duplicate code ${realCode}`);
      continue;
    }
    seenCodes.add(realCode);
    const narr = buildProductNarrative(text);
    const outDir = join(V, realCode);
    mkdirSync(outDir, { recursive: true });

    const img = extractPageImagesToTemp(PDF, page);
    const mainDataUri = asPngDataUri(img.main);

    const doc = {
      schemaVersion: 2,
      pattern: `CATALOGO_VALVULAS__${realCode.replace(/[^A-Z0-9]/gi, '_')}`,
      catalog: { productType: 'valvulas', typeShortCode: 'VAL', dbCategory: 'valvulas_sistemas' },
      productKey,
      source: {
        file: 'Catalogo_valvulas.pdf',
        pdfPage: page,
      },
      product: {
        code: realCode,
        name: nameLine,
        subtitle: narr.subtitle || undefined,
        description: narr.description,
        highlights: narr.highlights,
        technicalComparisonTable:
          narr.technicalComparisonTable || {
            title: 'Extraído del PDF (revisar y convertir a tabla estructurada si aplica)',
            columns: null,
            rows: [],
            rawExtraction: narr.technicalExtraction || text,
          },
      },
      assets: {
        ...buildAssetsDoc(productKey),
        base64Main: mainDataUri,
      },
      images: mainDataUri ? [mainDataUri] : [],
    };

    if (img.main) {
      copyProductImagesToPublic(productKey, img, PUBLIC);
    } else {
      console.warn(`[warn] no images page ${page} ${realCode}`);
    }

    const outPath = join(outDir, 'product.json');
    writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf8');
    console.log('Wrote', outPath, productKey);
    manifest.items.push({
      productKey,
      code: realCode,
      page,
      json: `valvulas/${realCode}/product.json`,
    });
    seq += 1;
  }

  writeFileSync(join(V, 'BATCH-MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Manifest:', join(V, 'BATCH-MANIFEST.json'));
}

main();
