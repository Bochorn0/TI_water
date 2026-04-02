// Shared normalization for quote line items (email + PDF).

export function stringifyEmailText(raw, maxLen = 4000) {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw.trim().slice(0, maxLen);
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw).slice(0, maxLen);
  try {
    return JSON.stringify(raw).slice(0, maxLen);
  } catch {
    return '';
  }
}

export function parseImagesField(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [t];
    } catch {
      return [t];
    }
  }
  return [String(raw)];
}

/**
 * Normalize one line item from DB/API (nested product, snake_case, manual lines).
 * @param {Object} it
 */
export function quoteLineFields(it) {
  const prod = it.product && typeof it.product === 'object' && !Array.isArray(it.product) ? it.product : {};
  const codeRaw = prod.code ?? it.code ?? it.manualCode ?? it.manual_code ?? '';
  const nameRaw = prod.name ?? it.name ?? it.manualName ?? it.manual_name ?? '';
  const descRaw = prod.description ?? it.description ?? '';
  const catRaw = prod.category ?? it.category ?? it.manualCategory ?? it.manual_category ?? '';

  const qtyRaw = it.quantity ?? it.qty ?? 0;
  const qty = Number(qtyRaw);
  const qtySafe = Number.isFinite(qty) ? qty : 0;

  let unitPrice = Number(it.unitPrice ?? it.unit_price);
  if (!Number.isFinite(unitPrice)) unitPrice = NaN;

  let subtotal = Number(it.subtotal ?? it.line_subtotal);
  if (!Number.isFinite(subtotal)) subtotal = NaN;

  const discount = Number(it.discount ?? it.discount_amount ?? 0);
  const discountSafe = Number.isFinite(discount) ? discount : 0;

  if (!Number.isFinite(subtotal) && Number.isFinite(unitPrice) && qtySafe >= 0) {
    subtotal = qtySafe * unitPrice - discountSafe;
  }
  if (!Number.isFinite(unitPrice) && Number.isFinite(subtotal) && qtySafe > 0) {
    unitPrice = (subtotal + discountSafe) / qtySafe;
  }

  const notes = it.notes;

  const pid = it.productId ?? it.product_id;
  const code = stringifyEmailText(codeRaw, 120).trim() || '—';
  let name = stringifyEmailText(nameRaw, 500).trim();
  if (!name) name = pid != null && String(pid).length ? `Producto #${pid}` : 'Partida';
  const description = stringifyEmailText(descRaw, 2000);
  const category = stringifyEmailText(catRaw, 200);

  const images = parseImagesField(prod.images ?? it.images);

  return {
    code,
    name,
    description,
    category,
    quantity: qtySafe,
    unitPrice,
    subtotal,
    discount: discountSafe,
    notes,
    images,
  };
}
