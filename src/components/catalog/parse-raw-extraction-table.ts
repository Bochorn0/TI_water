/**
 * Heuristic parse of Aquatrol `rawExtraction` (double-newline = cell boundaries) into
 * a matrix for the catalog technical table when JSON `rows` / `columns` are empty.
 */

const PART_RE = /^AQT-[0-9A-Z][-0-9A-Z0-9]*$/i;
/** Merged cell: e.g. "AQT-275FT 1\"" (column header + first inch on same line). */
const PART_WITH_TAIL_RE = /^(AQT-[-0-9A-Z]+)(\s+.+)?$/i;

const PAGE_FOOT_8 = /^8\s*\|/i;

function short(c: string, max = 22): string {
  const t = c.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + '…';
}

export type ParsedExtraction = {
  columns: string[];
  rows: { attribute: string; values: string[] }[];
  /** Pie del PDF (* HW, Nota: Importante, etc.) */
  manufacturerNotes?: string;
  /** Celdas de la sección “opcional” (el PDF ya no sigue la cuadrícula 4 columnas). */
  appendixCells?: string[];
};

function splitLegalAndBody(raw: string): { body: string; foot?: string } {
  const hw = raw.indexOf('* HW');
  if (hw > 80) {
    return { body: raw.slice(0, hw).trim(), foot: raw.slice(hw).trim() };
  }
  const p8 = raw.search(PAGE_FOOT_8);
  if (p8 > 80) {
    return { body: raw.slice(0, p8).trim(), foot: raw.slice(p8).trim() };
  }
  const n = raw.indexOf('Nota: Importante.');
  if (n > 80) {
    return { body: raw.slice(0, n).trim(), foot: raw.slice(n).trim() };
  }
  return { body: raw, foot: undefined };
}

/** Double-newline–separated cells; inner newlines become spaces (multi-line one cell). */
function toCells(body: string): string[] {
  const raw = body
    .split(/\n{2,}/)
    .map((s) => s.replace(/\n/g, ' ').trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const c of raw) {
    if (/^Todos\s+Opcional$/i.test(c)) {
      out.push('Todos', 'Opcional');
    } else {
      out.push(c);
    }
  }
  return out;
}

function isFooterCell(s: string): boolean {
  const t = (s || '').trim();
  return t.startsWith('* HW') || /^Nota: Importante/i.test(t) || PAGE_FOOT_8.test(t);
}

/**
 * Linear scan: after "Número de Parte", part codes, optional (Conexión + 4th part), then
 * (attribute, n values) until a footer cell.
 */
export function tryParseRawExtraction(raw: string): ParsedExtraction | null {
  if (!raw || !String(raw).trim()) return null;

  const { body, foot } = splitLegalAndBody(String(raw).trim());
  const cells = toCells(body);
  if (cells.length < 10) return null;

  let i = 0;
  if (/Número de Parte/i.test(cells[0] || '')) {
    i = 1;
  } else {
    const h = cells.findIndex((c) => /^Número de Parte$/i.test(c) || c === 'Número de Parte');
    if (h < 0) return null;
    i = h + 1;
  }

  if (i >= cells.length || !PART_RE.test(cells[i] || '')) return null;

  const colCodes: string[] = [];
  let inchAfterMergedFourth: string | null = null;
  while (i < cells.length && PART_RE.test(cells[i] || '')) {
    colCodes.push(cells[i]!);
    i += 1;
  }

  if (colCodes.length === 3 && i < cells.length && /^conexión$/i.test(cells[i] || '')) {
    if (i + 1 < cells.length) {
      const c = cells[i + 1] || '';
      if (PART_RE.test(c)) {
        colCodes.push(c);
        i += 2;
      } else {
        const m = c.match(PART_WITH_TAIL_RE);
        if (m && m[1]) {
          colCodes.push(m[1]!);
          const tail = (m[2] || '').trim();
          if (tail && /[″"']/.test(tail)) {
            inchAfterMergedFourth = tail;
          }
          i += 2;
        }
      }
    }
  }

  const n = colCodes.length;
  if (n < 2) return null;

  const displayCols = colCodes.map((c) => short(c, 24));
  const rows: { attribute: string; values: string[] }[] = [];
  const maxRows = 80;
  let appendixCells: string[] | undefined;

  /** AQT-275: 4x 1" for "Conexión" — 4th may be merged into "AQT-275FT 1\"". */
  const looksInch = (s: string) => {
    const t = (s || '').trim();
    return (/\d/.test(t) && /[″"']/.test(t)) || /^1["″]\s*$/i.test(t);
  };
  if (n === 4 && i + 2 < cells.length) {
    const a = (cells[i] as string | undefined) || '';
    const b = (cells[i + 1] as string | undefined) || '';
    const c = (cells[i + 2] as string | undefined) || '';
    const v4FromCell = ((cells[i + 3] as string | undefined) || '').trim();
    const v4 = inchAfterMergedFourth && looksInch(inchAfterMergedFourth) ? inchAfterMergedFourth : v4FromCell;
    const haveFourth = (inchAfterMergedFourth && looksInch(inchAfterMergedFourth)) || looksInch(v4FromCell);
    if (looksInch(a) && looksInch(b) && looksInch(c) && haveFourth) {
      rows.push({ attribute: 'Conexión', values: [a, b, c, v4].map((x) => x || '—') });
      i += inchAfterMergedFourth ? 3 : 4;
    } else {
      if (i + 3 < cells.length) {
        const quad = (cells.slice(i, i + 4) as string[]).map((x) => (x || '').trim());
        if (quad.length === 4 && quad.every(looksInch)) {
          rows.push({ attribute: 'Conexión', values: quad.map((v) => v || '—') });
          i += 4;
        }
      }
    }
  }

  while (i < cells.length && rows.length < maxRows) {
    if (isFooterCell(cells[i] || '')) break;

    if (/^Opcional$/i.test(cells[i] || '')) {
      i += 1;
      continue;
    }

    if (i + n - 1 > cells.length) {
      if (rows.length >= 3) break;
      return null;
    }

    const attr = (cells[i] as string).trim();
    if (!attr) {
      i += 1;
      continue;
    }
    if (PART_RE.test(attr) && rows.length) {
      i += 1;
      continue;
    }
    if (/^Número de Parte$/i.test(attr)) {
      i += 1;
      continue;
    }

    i += 1;
    const valueSlice = (cells.slice(i, i + n) as string[]).map((v) => (v == null || v === '' ? '—' : String(v).trim() || '—'));
    if (valueSlice.length < n) {
      if (rows.length >= 5) break;
      return null;
    }
    if (
      /^Medidor$/i.test(attr) &&
      valueSlice.some((v) => /Turbina|999,999,999|^\s*HW\s*$/i.test(v))
    ) {
      const fromIdx = i - 1;
      appendixCells = (cells.slice(fromIdx) as string[]).map((c) => String(c).trim()).filter(Boolean);
      break;
    }
    const a = attr.length > 200 ? attr.slice(0, 198) + '…' : attr;
    rows.push({ attribute: a, values: valueSlice });
    i += n;
  }

  if (rows.length < 1) return null;
  for (const r of rows) {
    if (r.values.length !== n) return null;
  }
  return {
    columns: displayCols,
    rows,
    manufacturerNotes: foot,
    appendixCells,
  };
}

export function getParsedOrNull(raw: string | undefined | null): ParsedExtraction | null {
  if (!raw) return null;
  return tryParseRawExtraction(String(raw));
}
