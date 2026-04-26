#!/usr/bin/env node
/**
 * Regenerate valvula catalog images from the PDF (no product.json rewrites).
 * Writes to: public/catalogs/products/TIWVAL***_{main,thumb-NN}.png
 * Optionally zips the folder for upload to Azure Blob (Storage account → container)
 * or for copying into a host that serves /catalogs/products/*.
 *
 * Prerequisites (macOS): brew install poppler
 * Run from repo root: cd TI_water && npm run catalog:prepare-images
 *
 * Options:
 *   --no-zip        Skip creating catalog-export/catalog-images.zip
 *   --only TIWVAL002   Extract only that product key (from manifest or product.json)
 */
import { readFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import {
  havePoppler,
  extractPageImagesToTemp,
  copyProductImagesToPublic,
} from './lib/valvulas-pdf-assets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PDF = join(ROOT, 'src/assets/catalogs/Catalogo_valvulas.pdf');
const PUBLIC = join(ROOT, 'public/catalogs/products');
const V = join(ROOT, 'src/assets/catalogs/valvulas');
const MANIFEST = join(V, 'BATCH-MANIFEST.json');
const EXPORT_DIR = join(ROOT, 'catalog-export');

function loadFromManifest() {
  const jobs = [];
  if (!existsSync(MANIFEST)) return jobs;
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  for (const it of m.items || []) {
    if (it.productKey && it.page) {
      jobs.push({ productKey: it.productKey, page: it.page, code: it.code });
    }
  }
  return jobs;
}

function loadFromProductJsons() {
  const jobs = [];
  for (const name of readdirSync(V, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name.startsWith('.')) continue;
    const p = join(V, name.name, 'product.json');
    if (!existsSync(p)) continue;
    const data = JSON.parse(readFileSync(p, 'utf8'));
    const pk = data.productKey;
    const page = data.source?.pdfPage;
    if (pk && page) {
      jobs.push({ productKey: pk, page, code: data.product?.code });
    }
  }
  jobs.sort((a, b) => a.productKey.localeCompare(b.productKey));
  return jobs;
}

function loadJobs(onlyKey) {
  let jobs = loadFromManifest();
  if (jobs.length === 0) {
    jobs = loadFromProductJsons();
  }
  if (onlyKey) {
    jobs = jobs.filter((j) => j.productKey === onlyKey);
  }
  const seen = new Set();
  return jobs.filter((j) => {
    if (seen.has(j.productKey)) return false;
    seen.add(j.productKey);
    return true;
  });
}

function makeZip() {
  mkdirSync(EXPORT_DIR, { recursive: true });
  const rel = 'public/catalogs/products';
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.warn('[zip] skip: missing', rel);
    return;
  }
  const hasPng = readdirSync(abs).some((f) => f.endsWith('.png'));
  if (!hasPng) {
    console.warn('[zip] skip: no png files in', rel);
    return;
  }
  const zipFile = 'catalog-export/catalog-images.zip';
  try {
    execFileSync('zip', ['-r', '-q', zipFile, rel], { cwd: ROOT, stdio: 'inherit' });
    console.log('\n[zip] OK', join(ROOT, zipFile));
  } catch (e) {
    console.error('[zip] failed (is `zip` installed? or use --no-zip):', e.message);
    process.exitCode = 1;
  }
}

function parseArgs() {
  const a = process.argv.slice(2);
  let noZip = false;
  let only;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--no-zip') noZip = true;
    else if (a[i] === '--only' && a[i + 1]) {
      only = a[i + 1];
      i += 1;
    }
  }
  return { noZip, only };
}

function main() {
  const { noZip, only } = parseArgs();
  if (!existsSync(PDF)) {
    console.error('Missing PDF:', PDF);
    process.exit(1);
  }
  if (!havePoppler()) {
    console.error('Install Poppler:  brew install poppler');
    process.exit(1);
  }
  const jobs = loadJobs(only);
  if (jobs.length === 0) {
    console.error(
      'No jobs. Add BATCH-MANIFEST.json or valvulas/<code>/product.json with productKey + source.pdfPage',
      only ? `(no match for --only ${only})` : '',
    );
    process.exit(1);
  }

  mkdirSync(PUBLIC, { recursive: true });
  for (const { productKey, page, code } of jobs) {
    const img = extractPageImagesToTemp(PDF, page);
    if (img.main) {
      copyProductImagesToPublic(productKey, img, PUBLIC);
      console.log('[ok]', productKey, code || '', 'page', page);
    } else {
      console.warn('[warn] no rasters for', productKey, 'page', page);
    }
  }
  console.log('\nOutput:', PUBLIC);

  if (!noZip) {
    makeZip();
  }

  const zipPath = join(EXPORT_DIR, 'catalog-images.zip');
  console.log(`
Next steps (Static Web Apps has no direct “upload product images” — typical options):
  • Azure Blob Storage: container → upload  catalogs/products/…  (or unpack ${zipPath} and
    sync the  public/  tree so paths stay  public/catalogs/products/*.png)
  • Build agent: unzip at TI_water repo root, then  npm run build  (Vite emits  /catalogs/products/…  URLs)
  • Or stop ignoring  public/catalogs/products/  in .git, commit, push (heavier clone)
`);
}

main();
