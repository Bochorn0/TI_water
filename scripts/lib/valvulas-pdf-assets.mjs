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

const CODE_RE = /VÁLVULA\s+([A-Z]{2,}(?:-[\dA-Z]{2,})+)/i;
export function extractProductCodeFromText(text) {
  const m = text.match(CODE_RE);
  if (m) return m[1].replace(/\s+/g, '').toUpperCase();
  const m2 = text.match(/\b([A-Z]{2,}(?:-[\dA-Z]{2,})+)\b/);
  if (m2) return m2[1].replace(/\s+/g, '').toUpperCase();
  // Common catalog token without dash, e.g. CLACK.
  const m3 = text.match(/\b(CLACK)\b/i);
  if (m3) return m3[1].toUpperCase();
  // Generic fallback AQT legacy.
  const m4 = text.match(/\b(AQT-[\dA-Z-]+)\b/);
  if (m4) return m4[1].replace(/\s+/g, '').toUpperCase();
  return null;
}

function slugifyToken(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toUpperCase();
}

export function extractFallbackCodeFromText(text, page) {
  const first = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .find((l) => /V[ÁA]LVULA|SISTEMA|TANQUE|MANUAL|TWIN|LATERAL/i.test(l));
  if (first) {
    const t = slugifyToken(first).slice(0, 36);
    if (t) return `PG${String(page).padStart(3, '0')}-${t}`;
  }
  return `PG${String(page).padStart(3, '0')}-ITEM`;
}

function findAnyTechnicalStart(t) {
  const tabla = t.indexOf('TABLA DE COMPARACIÓN');
  if (tabla >= 0) return tabla;
  const lines = t.split('\n').map((l) => l.trim());
  const idx = lines.findIndex((l) =>
    [
      'Conexión',
      'Servicio',
      'Servicio Máx.',
      'Retrolavado',
      'Presión de Trabajo',
      'Drenaje',
      'Distribuidor',
      'Base',
      'Material',
      'Línea Salmuera',
      'Tamaño',
      'Flujo Max. Servicio',
      'Medidor',
    ].includes(l),
  );
  if (idx < 0) return -1;
  let chars = 0;
  for (let i = 0; i < idx; i++) chars += lines[i].length + 1;
  return chars;
}

export function hasTechnicalData(text) {
  const t = text.replace(/\f/g, '\n');
  if (t.includes('TABLA DE COMPARACIÓN')) return true;
  let score = 0;
  if (/Conexión/i.test(t)) score++;
  if (/Servicio Máx\.?/i.test(t)) score++;
  if (/Drenaje/i.test(t)) score++;
  if (/Distribuidor|Base|Material/i.test(t)) score++;
  if (/Tamaño|Medidor|Flujo Max\.? Servicio/i.test(t)) score++;
  return score >= 2;
}

export function extractTitleFromText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const best =
    lines.find((l) => /V[ÁA]LVULA|SISTEMA|TANQUE|MANUAL|TWIN|LATERAL/i.test(l)) ||
    lines[0] ||
    'Producto';
  return best;
}

function parseSection(text) {
  const t = text.replace(/\f/g, '\n');
  const nameLine = t.split('\n').map((l) => l.trim()).find((l) => l.length > 0) || 'Producto';
  let subtitle = '';
  const subMatch = t.match(/SERIE\s+[^\n]+/i);
  if (subMatch) subtitle = subMatch[0].trim();
  const virtIdx = t.indexOf('VIRTUDES Y BENEFICIOS');
  const tablaIdx = findAnyTechnicalStart(t);
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
  let technicalComparisonTable = null;
  if (tablaIdx >= 0) {
    const notaIdx = t.indexOf('Nota: Importante', tablaIdx);
    const end = notaIdx > tablaIdx ? notaIdx + 1000 : Math.min(t.length, tablaIdx + 5000);
    technicalExtraction = t.slice(tablaIdx, end).trim();
    technicalComparisonTable = parseTechnicalTable(technicalExtraction);
  }
  return { nameLine, subtitle, description, highlights, technicalExtraction, technicalComparisonTable };
}

const ATTRIBUTE_LABELS = [
  'Conexión',
  'Servicio',
  'Servicio Máx.',
  'Retrolavado',
  'Presión de Trabajo',
  'Drenaje',
  'Distribuidor',
  'Base',
  'Material',
  'Línea Salmuera',
  'Control Mecánico',
  'Control Digital',
  'Reg. Inmediata',
  'Reg. Retardada',
  'Ciclos',
  'Ciclos Ajustables',
  'Medidor',
  'Filtro',
  'Filtros (Tamaño Tanque)',
  'Suavizadores (Tamaño Tanque)',
  'Suavizadores',
];

function normalizeCode(s) {
  return s.replace(/\s+/g, '').toUpperCase();
}

function parseTechnicalTable(raw) {
  if (!raw) return null;
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const tableTitle = lines.find((l) => l.toUpperCase().startsWith('TABLA DE COMPARACIÓN')) || null;
  const legalStart = raw.indexOf('Nota:');
  const legalNote = legalStart >= 0 ? raw.slice(legalStart).trim() : null;

  const codeMatches = raw.match(/AQT-\s*[0-9A-Z]+(?:-[0-9A-Z]+)*/gi) || [];
  const columns = [];
  for (const m of codeMatches) {
    const c = normalizeCode(m);
    if (!columns.includes(c)) columns.push(c);
  }
  if (columns.length === 0) return null;

  const rows = [];
  const idxByLabel = [];
  for (const label of ATTRIBUTE_LABELS) {
    const idx = lines.findIndex((l) => l === label);
    if (idx >= 0) idxByLabel.push({ label, idx });
  }
  idxByLabel.sort((a, b) => a.idx - b.idx);

  for (let i = 0; i < idxByLabel.length; i++) {
    const cur = idxByLabel[i];
    const nextIdx = i + 1 < idxByLabel.length ? idxByLabel[i + 1].idx : lines.length;
    let tokens = lines.slice(cur.idx + 1, nextIdx);
    tokens = tokens.filter((x) => {
      if (x === 'Número de Parte' || x === 'Opcional') return false;
      if (/^AQT-\s*[0-9A-Z]+(?:-[0-9A-Z]+)*$/i.test(x)) return false;
      return true;
    });
    // Merge wrapped fragments until token count is close to column count.
    while (tokens.length > columns.length) {
      let merged = false;
      for (let t = 1; t < tokens.length; t++) {
        const shortTail = tokens[t].length <= 14 || /^(y|de|del|\(.*\))$/i.test(tokens[t]);
        if (shortTail) {
          tokens[t - 1] = `${tokens[t - 1]} ${tokens[t]}`.replace(/\s+/g, ' ').trim();
          tokens.splice(t, 1);
          merged = true;
          break;
        }
      }
      if (!merged) {
        tokens[tokens.length - 2] = `${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`.trim();
        tokens.pop();
      }
    }
    if (tokens.length < columns.length) {
      while (tokens.length < columns.length) tokens.push(null);
    }
    rows.push({ attribute: cur.label, values: tokens.slice(0, columns.length) });
  }

  return {
    title: tableTitle || 'TABLA DE COMPARACIÓN',
    columns,
    rows,
    rawExtraction: raw,
    legalNote,
  };
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
