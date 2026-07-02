#!/usr/bin/env node
/**
 * Minimal extractor for non-valvulas catalogs:
 * - product title
 * - one base64 image
 * - technical data block/table (structured when possible)
 * - dedupe by code
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
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
} from './lib/valvulas-pdf-assets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOGS_DIR = join(ROOT, 'src/assets/catalogs');

const CATALOGS = [
  { slug: 'plomeria', file: 'Catalogo_plomeria.pdf', type3: 'PLO', dbCategory: 'plomeria' },
  { slug: 'presurizadores', file: 'Catalogo_presurizadores.pdf', type3: 'PRE', dbCategory: 'presurizadores' },
  { slug: 'sumergibles', file: 'Catalogo_sumergibles.pdf', type3: 'SUM', dbCategory: 'sumergibles' },
  { slug: 'general', file: 'Catalogo_general.pdf', type3: 'GEN', dbCategory: 'general' },
];

function keyFor(type3, seq) {
  return `TIW${type3}${String(seq).padStart(3, '0')}`;
}

function asPngDataUri(filePath) {
  if (!filePath || !existsSync(filePath)) return null;
  const b64 = readFileSync(filePath).toString('base64');
  return `data:image/png;base64,${b64}`;
}

function parseArgs() {
  const a = process.argv.slice(2);
  const only = new Set();
  let from = 1;
  let to = 999;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--only' && a[i + 1]) {
      for (const s of a[i + 1].split(',')) only.add(s.trim().toLowerCase());
      i++;
    } else if (a[i] === '--from' && a[i + 1]) {
      from = parseInt(a[i + 1], 10);
      i++;
    } else if (a[i] === '--to' && a[i + 1]) {
      to = parseInt(a[i + 1], 10);
      i++;
    }
  }
  return { only, from, to };
}

function processCatalog({ slug, file, type3, dbCategory }, { from, to }) {
  const pdf = join(CATALOGS_DIR, file);
  if (!existsSync(pdf)) {
    console.warn('[skip catalog] missing', file);
    return { slug, count: 0, skipped: 0, items: [] };
  }

  const outBase = join(CATALOGS_DIR, slug);
  mkdirSync(outBase, { recursive: true });

  const manifest = { generatedAt: new Date().toISOString(), pdf: file, slug, items: [] };
  const seenCodes = new Set();
  let seq = 1;
  let skipped = 0;

  for (let page = from; page <= to; page++) {
    let text;
    try {
      text = pdftoTextPage(pdf, page);
    } catch {
      break;
    }
    if (!text || !text.trim()) continue;
    if (!hasTechnicalData(text)) {
      skipped++;
      continue;
    }

    const code = extractProductCodeFromText(text) || extractFallbackCodeFromText(text, page);
    if (seenCodes.has(code)) {
      skipped++;
      continue;
    }
    seenCodes.add(code);

    const title = extractTitleFromText(text);
    const narr = buildProductNarrative(text);
    const productKey = keyFor(type3, seq);
    seq += 1;

    const img = extractPageImagesToTemp(pdf, page);
    const mainDataUri = asPngDataUri(img.main);

    const doc = {
      schemaVersion: 2,
      pattern: `CATALOGO_${slug.toUpperCase()}__${code.replace(/[^A-Z0-9]/g, '_')}`,
      catalog: { productType: slug, typeShortCode: type3, dbCategory },
      productKey,
      source: { file, pdfPage: page },
      product: {
        code,
        name: title,
        subtitle: narr.subtitle || null,
        description: narr.description || null,
        highlights: narr.highlights || [],
        technicalComparisonTable:
          narr.technicalComparisonTable || {
            title: 'Extraído del PDF (revisar y convertir a tabla estructurada si aplica)',
            columns: null,
            rows: [],
            rawExtraction: narr.technicalExtraction || text,
          },
      },
      assets: { extraction: { tool: 'process-other-catalogs.mjs (poppler)' }, base64Main: mainDataUri },
      images: mainDataUri ? [mainDataUri] : [],
    };

    const outDir = join(outBase, code);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'product.json'), JSON.stringify(doc, null, 2), 'utf8');

    manifest.items.push({
      productKey,
      code,
      page,
      json: `${slug}/${code}/product.json`,
    });
  }

  writeFileSync(join(outBase, 'BATCH-MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
  return { slug, count: manifest.items.length, skipped, items: manifest.items };
}

function main() {
  if (!havePoppler()) {
    console.error('Install poppler first (pdftotext + pdfimages).');
    process.exit(1);
  }
  const args = parseArgs();
  const list = CATALOGS.filter((c) => args.only.size === 0 || args.only.has(c.slug));
  const results = [];
  for (const c of list) {
    const r = processCatalog(c, args);
    results.push(r);
    console.log(`[${c.slug}] extracted=${r.count} skipped=${r.skipped}`);
  }
  const total = results.reduce((n, r) => n + r.count, 0);
  console.log(`TOTAL extracted=${total}`);
}

main();
