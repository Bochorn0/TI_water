/**
 * TI Water catalog product key: TIW + typeCode (3 letters) + seq (3 digits) → e.g. TIWVAL001
 * Images: {key}_main.png, {key}_thumb-01.png …
 */

export const TIW_PREFIX = 'TIW';

/** DB category or folder name → 3-letter code (extend when adding catalogos) */
export const CATALOG_TYPE_SHORT = {
  valvulas: 'VAL',
  valvulas_sistemas: 'VAL',
  plomeria: 'PLO',
  presurizadores: 'PRE',
  sumergibles: 'SUM',
  general: 'GEN',
};

/**
 * @param {string} typeShort - 3 letters uppercase e.g. VAL
 * @param {number} sequence - 1..999
 */
export function formatProductKey(typeShort, sequence) {
  const t = String(typeShort || 'GEN')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .padEnd(3, 'X')
    .slice(0, 3);
  const n = Math.max(1, Math.min(999, parseInt(String(sequence), 10) || 1));
  return `${TIW_PREFIX}${t}${String(n).padStart(3, '0')}`;
}

/**
 * @param {string} productTypeKey - e.g. "valvulas" or category valvulas_sistemas
 * @param {string} [explicitShort] - from JSON typeShortCode
 */
export function typeShortForCatalog(productTypeKey, explicitShort) {
  if (explicitShort && String(explicitShort).length === 3) {
    return String(explicitShort).toUpperCase().replace(/[^A-Z]/g, '').padEnd(3, 'X').slice(0, 3);
  }
  const k = String(productTypeKey || 'general').toLowerCase();
  return CATALOG_TYPE_SHORT[k] || CATALOG_TYPE_SHORT.general;
}

const KEY_RE = /^TIW([A-Z]{3})(\d{3})$/;

export function parseProductKey(key) {
  const s = String(key || '').toUpperCase().trim();
  const m = s.match(KEY_RE);
  if (!m) return null;
  return { prefix: TIW_PREFIX, typeShort: m[1], sequence: parseInt(m[2], 10) };
}
