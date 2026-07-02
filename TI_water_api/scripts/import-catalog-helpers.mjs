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

function normalizeDataUri(s) {
  if (typeof s !== 'string') return null;
  const v = s.trim();
  if (!v) return null;
  if (v.startsWith('data:image/')) return v;
  // Allow raw base64 payloads from extraction tools.
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(v)) {
    return `data:image/png;base64,${v.replace(/\s+/g, '')}`;
  }
  return null;
}

/**
 * Production shape: images must contain only one image (prefer base64 data URI).
 * Priority:
 * 1) data.images[0] if it's already a data URI
 * 2) data.image / data.imageBase64 / data.assets.base64Main (data URI or raw base64)
 * 3) legacy assets.files.main URL fallback
 */
export function resolvePrimaryImage(data) {
  const fromImagesArray = Array.isArray(data.images) ? normalizeDataUri(data.images[0]) : null;
  if (fromImagesArray) return [fromImagesArray];

  const explicit =
    normalizeDataUri(data.image) ||
    normalizeDataUri(data.imageBase64) ||
    normalizeDataUri(data.assets?.base64Main) ||
    normalizeDataUri(data.assets?.mainBase64) ||
    normalizeDataUri(data.assets?.mainDataUri);
  if (explicit) return [explicit];

  // Backward compatibility with URL-based catalog docs.
  const prefix = (data.assets?.publicPathPrefix || '').replace(/\/$/, '');
  const main = data.assets?.files?.main;
  if (prefix && main) {
    return [`${SITE_ORIGIN}${prefix}/${String(main).replace(/^\//, '')}`];
  }

  return [];
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
    images: resolvePrimaryImage({ ...data, productKey }),
    catalogSource: data.source?.file || null,
    pageNumber: data.source?.pdfPage ?? data.source?.page ?? null,
    isActive: true,
  };
}
