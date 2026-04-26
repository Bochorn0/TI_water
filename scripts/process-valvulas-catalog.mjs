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

function parseArgs() {
  const a = process.argv.slice(2);
  let from = 5;
  let to = 10;
  let startSeq = 1;
  let mergeA56 = true;
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
    } else if (a[i] === '--no-merge-a56') {
      mergeA56 = false;
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

  for (let page = from; page <= to; page++) {
    const text = pdftoTextPage(PDF, page);
    const nameLine = text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0) || '';
    const productKey = keyFor(seq);
    const aqt56Path = join(V, 'AQT-56', 'product.json');

    if (page === 5 && mergeA56 && existsSync(aqt56Path)) {
      const ex = JSON.parse(readFileSync(aqt56Path, 'utf8'));
      ex.productKey = productKey;
      ex.source = { ...ex.source, file: 'Catalogo_valvulas.pdf', pdfPage: page };
      ex.assets = buildAssetsDoc(productKey);
      ex.pattern = ex.pattern || 'CATALOGO_VALVULAS__AQT-56';
      writeFileSync(aqt56Path, JSON.stringify(ex, null, 2), 'utf8');
      const img = extractPageImagesToTemp(PDF, page);
      if (img.main) copyProductImagesToPublic(productKey, img, PUBLIC);
      else console.warn('[warn] no rasters for page 5');
      console.log('[merge] updated', aqt56Path, productKey);
      manifest.items.push({ productKey, code: ex.product?.code, page, json: 'valvulas/AQT-56/product.json' });
      seq += 1;
      continue;
    }

    const realCode = extractProductCodeFromText(text);
    if (!realCode) {
      console.warn(`[skip] page ${page}: no AQT- code, line1=${nameLine.substring(0, 50)}`);
      continue;
    }
    const narr = buildProductNarrative(text);
    const outDir = join(V, realCode);
    mkdirSync(outDir, { recursive: true });

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
        technicalComparisonTable: {
          title: 'Extraído del PDF (revisar y convertir a tabla estructurada si aplica)',
          columns: null,
          rows: [],
          rawExtraction: narr.technicalExtraction || text,
        },
      },
      assets: buildAssetsDoc(productKey),
    };

    const img = extractPageImagesToTemp(PDF, page);
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
