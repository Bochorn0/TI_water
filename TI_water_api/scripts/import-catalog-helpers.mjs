import { formatProductKey, typeShortForCatalog } from '../src/utils/catalog-product-key.js';

const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://tiwater.mx').replace(/\/$/, '');

export function buildDescription(data) {
  const p = data.product;
  const parts = [p.subtitle, '', p.description, ''];
  if (Array.isArray(p.highlights) && p.highlights.length) {
    parts.push('Virtudes y beneficios:', ...p.highlights.map((h) => `• ${h}`));
  }
  return parts.join('\n');
}

export function buildSpecifications(data) {
  const p = data.product;
  const cat = data.catalog || {};
  return {
    catalogPattern: data.pattern,
    productType: cat.productType,
    typeShortCode: cat.typeShortCode,
    productKey: data.productKey,
    source: data.source,
    subtitle: p.subtitle,
    highlights: p.highlights || [],
    technicalComparisonTable: p.technicalComparisonTable,
  };
}

export function resolveImageUrls(data) {
  const prefix = (data.assets?.publicPathPrefix || '').replace(/\/$/, '');
  if (!prefix) return [];
  const base = `${SITE_ORIGIN}${prefix}/`;
  const f = data.assets?.files;
  if (!f) return [];
  const list = [];
  if (f.main) list.push(base + f.main.replace(/^\//, ''));
  for (const t of f.thumbnails || []) {
    if (t) list.push(base + t.replace(/^\//, ''));
  }
  return list;
}

export function resolveProductKey(data) {
  if (data.productKey && /^TIW[A-Z]{3}\d{3}$/i.test(String(data.productKey))) {
    return String(data.productKey).toUpperCase();
  }
  const cat = data.catalog || {};
  const seq = data.sequence != null ? parseInt(String(data.sequence), 10) : 1;
  const short = typeShortForCatalog(cat.productType, cat.typeShortCode);
  return formatProductKey(short, seq);
}

export function categoryFromJson(data) {
  return data.catalog?.dbCategory || data.product?.category || 'general';
}

export function buildPayload(data) {
  const p = data.product;
  const productKey = resolveProductKey(data);
  return {
    productKey,
    code: p.code,
    name: p.name,
    description: buildDescription(data),
    category: categoryFromJson(data),
    price: null,
    specifications: buildSpecifications({ ...data, productKey }),
    images: resolveImageUrls({ ...data, productKey }),
    catalogSource: data.source?.file || null,
    pageNumber: data.source?.pdfPage ?? data.source?.page ?? null,
    isActive: true,
  };
}
