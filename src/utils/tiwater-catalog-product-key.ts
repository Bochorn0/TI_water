/** Mirrors TI_water_api/src/utils/catalog-product-key.js (for future UI or tooling). */
export const TIW_PREFIX = 'TIW';

export const CATALOG_TYPE_SHORT: Record<string, string> = {
  valvulas: 'VAL',
  valvulas_sistemas: 'VAL',
  plomeria: 'PLO',
  presurizadores: 'PRE',
  sumergibles: 'SUM',
  general: 'GEN',
};

export function formatProductKey(typeShort: string, sequence: number): string {
  const t = String(typeShort || 'GEN')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .padEnd(3, 'X')
    .slice(0, 3);
  const n = Math.max(1, Math.min(999, Number.isFinite(sequence) ? sequence : 1));
  return `${TIW_PREFIX}${t}${String(n).padStart(3, '0')}`;
}

export function typeShortForCatalog(
  productTypeKey: string | undefined,
  explicitShort?: string,
): string {
  if (explicitShort && String(explicitShort).length >= 3) {
    return String(explicitShort)
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .padEnd(3, 'X')
      .slice(0, 3);
  }
  const k = String(productTypeKey || 'general').toLowerCase();
  return CATALOG_TYPE_SHORT[k] || CATALOG_TYPE_SHORT.general;
}
