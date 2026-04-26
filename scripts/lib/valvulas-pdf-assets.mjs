/**
 * Text + embedded-raster extraction for Catalogo_valvulas.pdf (Poppler: pdftotext, pdfimages)
 */
import { execFileSync, spawnSync } from 'child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, copyFileSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export function havePoppler() {
  try {
    execFileSync('which', ['pdftotext'], { stdio: 'pipe' });
    execFileSync('which', ['pdfimages'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function pdftoTextPage(pdfPath, page) {
  const r = spawnSync('pdftotext', ['-f', String(page), '-l', String(page), pdfPath, '-'], { encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`pdftotext page ${page} failed: ${r.stderr}`);
  }
  return r.stdout || '';
}

const CODE_RE = /VÁLVULA\s+(AQT-[\dA-Z-]+)/i;
export function extractProductCodeFromText(text) {
  const m = text.match(CODE_RE);
  if (m) return m[1].toUpperCase();
  const m2 = text.match(/\b(AQT-[\dA-Z-]+)\b/);
  return m2 ? m2[1].toUpperCase() : null;
}

function parseSection(text) {
  const t = text.replace(/\f/g, '\n');
  const nameLine = t.split('\n').map((l) => l.trim()).find((l) => l.length > 0) || 'Producto';
  let subtitle = '';
  const subMatch = t.match(/SERIE\s+[^\n]+/i);
  if (subMatch) subtitle = subMatch[0].trim();
  const virtIdx = t.indexOf('VIRTUDES Y BENEFICIOS');
  const tablaIdx = t.indexOf('TABLA DE COMPARACIÓN');
  const descStart = t.search(/Las válvulas|El sistema|Ideal para|Cuerpo de/i);
  let description = '';
  if (descStart >= 0 && (virtIdx < 0 || virtIdx > descStart)) {
    const upTo = virtIdx > descStart ? virtIdx : tablaIdx > descStart ? tablaIdx : descStart + 1500;
    description = t.slice(descStart, upTo).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    const block = t.split('\n').slice(3, 16).join(' ');
    description = block.substring(0, 1200);
  }
  const highlights = [];
  if (virtIdx >= 0) {
    const upTo = tablaIdx > virtIdx ? tablaIdx : t.length;
    const virtBlock = t.slice(virtIdx, upTo);
    for (const line of virtBlock.split('\n')) {
      const s = line.trim();
      if (s.startsWith('•')) highlights.push(s.replace(/^•\s*/, ''));
    }
  }
  let technicalExtraction = '';
  if (tablaIdx >= 0) {
    const notaIdx = t.indexOf('Nota: Importante', tablaIdx);
    const end = notaIdx > tablaIdx ? notaIdx + 800 : Math.min(t.length, tablaIdx + 5000);
    technicalExtraction = t.slice(tablaIdx, end).trim();
  }
  return { nameLine, subtitle, description, highlights, technicalExtraction };
}

export function buildProductNarrative(text) {
  return parseSection(text);
}

/** Read PNG dimensions from IHDR (works on Linux CI; no macOS sips). */
function readPngSize(filePath) {
  try {
    const buf = readFileSync(filePath);
    if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
      return { w: 0, h: 0 };
    }
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return { w: 0, h: 0 };
  }
}

function whAndSize(f) {
  const st = statSync(f);
  let w = 0;
  let h = 0;
  if (f.toLowerCase().endsWith('.png')) {
    const p = readPngSize(f);
    w = p.w;
    h = p.h;
  }
  if (w === 0 || h === 0) {
    const sh = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f], { encoding: 'utf8' });
    if (sh.stdout) {
      const m1 = sh.stdout.match(/pixelWidth:\s*(\d+)/);
      const m2 = sh.stdout.match(/pixelHeight:\s*(\d+)/);
      if (m1) w = parseInt(m1[1], 10);
      if (m2) h = parseInt(m2[1], 10);
    }
  }
  return { area: w * h, size: st.size, w, h };
}

/**
 * @returns {{ main: string, thumbs: string[] }} absolute paths in tmpdir
 */
export function extractPageImagesToTemp(pdfPath, page) {
  const tmp = mkdtempSync(join(tmpdir(), 'vlv-'));
  const prefix = join(tmp, 'x-');
  const r = spawnSync('pdfimages', ['-png', '-f', String(page), '-l', String(page), pdfPath, prefix], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`pdfimages: ${r.stderr || r.stdout}`);
  const dir = readdirSync(tmp)
    .filter((n) => n.startsWith('x-') && n.endsWith('.png'))
    .map((n) => join(tmp, n))
    .sort();
  const bins = dir.filter((f) => statSync(f).size > 1000);
  if (bins.length === 0) {
    rmSync(tmp, { recursive: true, force: true });
    return { tmpDir: null, main: null, thumbs: [] };
  }
  let main = bins[0];
  let bestArea = 0;
  for (const f of bins) {
    const a = whAndSize(f).area;
    if (a > bestArea) {
      bestArea = a;
      main = f;
    } else if (a === bestArea) {
      if (statSync(f).size > statSync(main).size) main = f;
    }
  }
  const mArea = whAndSize(main).area;
  const mSize = statSync(main).size;
  const thumbs = [];
  for (const f of bins) {
    if (f === main) continue;
    const a = whAndSize(f).area;
    const sz = statSync(f).size;
    if (a === mArea && sz < mSize * (2 / 3)) continue;
    thumbs.push(f);
    if (thumbs.length >= 6) break;
  }
  return { tmpDir: tmp, main, thumbs };
}

export function copyProductImagesToPublic(productKey, { tmpDir, main, thumbs }, publicProductsDir) {
  mkdirSync(publicProductsDir, { recursive: true });
  if (main) {
    copyFileSync(main, join(publicProductsDir, `${productKey}_main.png`));
  }
  let i = 0;
  for (const t of thumbs) {
    i += 1;
    const num = String(i).padStart(2, '0');
    copyFileSync(t, join(publicProductsDir, `${productKey}_thumb-${num}.png`));
  }
  if (tmpDir) {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
