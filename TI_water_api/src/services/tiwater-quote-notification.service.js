// src/services/tiwater-quote-notification.service.js
// Customer emails — formal cotización layout (with / without prices)

import emailHelper from '../utils/email.helper.js';
import TIWaterQuoteModel from '../models/postgres/tiwater-quote.model.js';

const BRAND = 'TI WATER';
const QUOTE_REPLY_TO = String(process.env.TIWATER_EMAIL_REPLY_TO || '').trim();

const ISSUER = {
  tradeMark: 'TI WATER',
  legalName:
    process.env.TIWATER_QUOTE_LEGAL_NAME ||
    'TI WATER — Soluciones en purificación de agua',
  rfc: process.env.TIWATER_QUOTE_RFC || '',
  footerLegal:
    process.env.TIWATER_QUOTE_FOOTER_LEGAL ||
    'Precios sujetos a cambio sin previo aviso. Vigencia de cotización según acuerdo comercial.',
};

const LUGAR = process.env.TIWATER_QUOTE_LUGAR || 'HERMOSILLO, SONORA';
const MONEDA = 'MXN';
const UNIDAD_DEFAULT = 'SERVICIO';

function escapeHtml(str) {
  if (str == null || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** For HTML attribute values (e.g. img src). Avoid full escapeHtml — it can break query strings. */
function escapeAttrUrl(url) {
  return String(url || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '%3C');
}

function stringifyEmailText(raw, maxLen = 4000) {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw.trim().slice(0, maxLen);
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw).slice(0, maxLen);
  try {
    return JSON.stringify(raw).slice(0, maxLen);
  } catch {
    return '';
  }
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const t = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatQty(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function itemUnidadFromCategory(category) {
  const c = stringifyEmailText(category, 200).trim();
  return c.length > 0 ? escapeHtml(c.toUpperCase()) : escapeHtml(UNIDAD_DEFAULT);
}

/** Many clients store relative paths; email clients need absolute URLs for <img>. */
function absoluteProductImageUrl(url) {
  if (url == null || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) {
    const baseProto = String(process.env.TIWATER_PUBLIC_ORIGIN || process.env.FRONTEND_URL || '')
      .trim()
      .match(/^https?:/i)?.[0];
    return `${baseProto || 'https:'}${t}`;
  }
  const base = String(
    process.env.TIWATER_PUBLIC_ORIGIN ||
      process.env.FRONTEND_URL ||
      process.env.VITE_API_URL ||
      '',
  )
    .trim()
    .replace(/\/$/, '');
  if (!base) return t;
  const path = t.startsWith('/') ? t : `/${t}`;
  return `${base}${path}`;
}

function parseImagesField(raw) {
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

/** Normalize item shape for email (camelCase API, snake_case, or missing nested product). */
function emailItemFields(it) {
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

function firstProductImageUrlFromFields(fields) {
  if (!fields.images.length) return '';
  return absoluteProductImageUrl(fields.images[0]);
}

async function loadQuoteForEmail(quote) {
  const id = quote?.id;
  if (id == null || Number.isNaN(Number(id))) return quote;
  try {
    const fresh = await TIWaterQuoteModel.findById(Number(id));
    return fresh || quote;
  } catch (e) {
    console.warn('[TIWaterQuoteEmail] Could not reload quote for email, using payload:', e?.message || e);
    return quote;
  }
}

function formalQuoteBodyHtml(quote, showPrices) {
  const num = escapeHtml(quote.quoteNumber || '—');
  const client = escapeHtml(quote.clientName || '');
  const email = quote.clientEmail ? escapeHtml(quote.clientEmail) : '';
  const phone = quote.clientPhone ? escapeHtml(quote.clientPhone) : '';
  const addr = quote.clientAddress ? escapeHtml(quote.clientAddress) : '';
  const notes = quote.notes ? escapeHtml(quote.notes) : '';
  const created = quote.createdAt ? new Date(quote.createdAt) : new Date();
  const fechaStr = escapeHtml(
    created.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );

  const items = Array.isArray(quote.items) ? quote.items : [];
  const subtotal = items.reduce((s, it) => {
    const f = emailItemFields(it);
    const st = Number(f.subtotal);
    return s + (Number.isFinite(st) ? st : 0);
  }, 0);
  const tax = Number(quote.tax || 0);
  const total = subtotal + tax;
  const ivaPct = subtotal > 0 && tax > 0 ? (tax / subtotal) * 100 : 16;

  const th = 'padding:10px 8px;border:1px solid #b0bec5;background:#eceff1;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;';
  const td = 'padding:10px 8px;border:1px solid #cfd8dc;font-size:13px;vertical-align:top;';

  const priceHead = showPrices
    ? `<th width="14%" style="${th}text-align:right;">PRECIO</th><th width="14%" style="${th}text-align:right;">SUBTOTAL</th>`
    : '';

  const tdCell =
    'padding:10px 8px;border:1px solid #cfd8dc;font-size:13px;vertical-align:top;color:#1a1a1a;line-height:1.35;';

  const rows = items
    .map((it) => {
      const f = emailItemFields(it);
      const code = escapeHtml(f.code);
      const name = escapeHtml(f.name);
      const desc = f.description
        ? `<br/><span style="color:#546e7a;font-size:12px;">${escapeHtml(f.description)}</span>`
        : '';
      const lineNotes = f.notes
        ? `<br/><span style="color:#37474f;font-size:12px;">${escapeHtml(stringifyEmailText(f.notes, 2000))}</span>`
        : '';
      const qty = formatQty(f.quantity);
      const unit = itemUnidadFromCategory(f.category);
      const imgSrc = firstProductImageUrlFromFields(f);
      const imgBlock = imgSrc
        ? `<br/><img src="${escapeAttrUrl(imgSrc)}" width="48" height="48" alt="" border="0" style="display:block;margin-top:6px;max-width:48px;max-height:48px;border:1px solid #e0e0e0;"/>`
        : '';
      const priceStr = formatMoney(f.unitPrice);
      const subStr = formatMoney(f.subtotal);
      const priceCells = showPrices
        ? `<td align="right" valign="top" width="14%" style="${tdCell}">${priceStr}</td><td align="right" valign="top" width="14%" style="${tdCell}font-weight:bold;">${subStr}</td>`
        : '';
      return `<tr>
        <td align="center" valign="top" width="9%" style="${tdCell}">${qty}</td>
        <td valign="top" width="13%" style="${tdCell}">${code}${imgBlock}</td>
        <td valign="top" width="32%" style="${tdCell}">${name}${desc}${lineNotes}</td>
        <td align="center" valign="top" width="12%" style="${tdCell}">${unit}</td>
        ${priceCells}
      </tr>`;
    })
    .join('');

  const colSpan = showPrices ? 6 : 4;
  const tableRows =
    rows || `<tr><td colspan="${colSpan}" style="${td}"><em>Sin partidas.</em></td></tr>`;

  const totalsBlock = showPrices
    ? `
    <table style="width:100%;max-width:280px;margin-left:auto;margin-top:16px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;border-bottom:1px solid #cfd8dc;">Subtotal $</td><td style="padding:6px 0;text-align:right;font-weight:600;border-bottom:1px solid #cfd8dc;">${formatMoney(subtotal)}</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #cfd8dc;">IVA Tras. (${ivaPct.toFixed(2)})% $</td><td style="padding:6px 0;text-align:right;font-weight:600;border-bottom:1px solid #cfd8dc;">${formatMoney(tax)}</td></tr>
      <tr><td style="padding:10px 0 0;font-weight:800;font-size:16px;">TOTAL $</td><td style="padding:10px 0 0;text-align:right;font-weight:800;font-size:16px;border-top:2px solid #1565c0;">${formatMoney(total)}</td></tr>
    </table>`
    : '';

  const rfcLine = ISSUER.rfc ? `<div style="font-size:12px;margin-top:6px;">RFC: ${escapeHtml(ISSUER.rfc)}</div>` : '';

  const comentarios = [notes, ISSUER.footerLegal].filter(Boolean).join('<br/><br/>');

  return `
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #cfd8dc;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr>
        <td style="vertical-align:top;width:60%;">
          <div style="font-size:28px;line-height:1;color:#1565c0;">💧 <span style="font-weight:800;letter-spacing:0.02em;">${escapeHtml(ISSUER.tradeMark)}</span></div>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;margin-top:8px;">${escapeHtml(ISSUER.legalName)}</div>
          ${rfcLine}
        </td>
        <td style="vertical-align:top;width:40%;text-align:right;">
          <div style="display:inline-block;border:2px solid #1565c0;padding:16px 20px;background:#fafafa;text-align:left;min-width:200px;">
            <div style="font-size:11px;color:#666;">Folio</div>
            <div style="font-size:18px;font-weight:800;margin-bottom:10px;">${num}</div>
            <div style="font-size:11px;color:#666;">Fecha</div>
            <div style="font-size:13px;margin-bottom:8px;">${fechaStr}</div>
            <div style="font-size:11px;color:#666;">Lugar</div>
            <div style="font-size:13px;margin-bottom:8px;">${escapeHtml(LUGAR)}</div>
            <div style="font-size:11px;color:#666;">Moneda</div>
            <div style="font-size:13px;font-weight:600;">${MONEDA}</div>
          </div>
        </td>
      </tr>
    </table>
    <div style="text-align:center;font-size:18px;font-weight:700;letter-spacing:0.08em;margin:16px 0;">COTIZACIÓN</div>
    <div style="border-top:1px solid #cfd8dc;padding-top:16px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:800;text-transform:uppercase;margin-bottom:6px;">Cliente</div>
      <div style="font-size:15px;font-weight:700;">${client}</div>
      ${email ? `<div style="font-size:13px;color:#546e7a;">${email}</div>` : ''}
      ${phone ? `<div style="font-size:13px;">Tel. ${phone}</div>` : ''}
      ${addr ? `<div style="font-size:13px;margin-top:6px;">Domicilio: ${addr}</div>` : ''}
    </div>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-bottom:8px;table-layout:fixed;">
      <thead>
        <tr>
          <th width="9%" style="${th}text-align:center;">CANT.</th>
          <th width="13%" style="${th}">CÓDIGO</th>
          <th width="32%" style="${th}">CONCEPTO</th>
          <th width="12%" style="${th}text-align:center;">UNIDAD</th>
          ${priceHead}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    ${totalsBlock}
    ${
      comentarios
        ? `<div style="border-top:1px solid #cfd8dc;padding-top:16px;margin-top:20px;">
        <div style="font-size:12px;font-weight:800;text-transform:uppercase;margin-bottom:8px;">Comentarios</div>
        <div style="font-size:13px;color:#546e7a;line-height:1.5;">${comentarios}</div>
      </div>`
        : ''
    }
  </div>`;
}

function wrapEmail(innerHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:20px;background:#f0f0f0;">
  ${innerHtml}
  <p style="text-align:center;color:#888;font-size:11px;margin-top:24px;max-width:720px;margin-left:auto;margin-right:auto;">
    Correo automático ${BRAND}. Para responder, utilice el mismo correo con el que realizó su solicitud o el enlace de contacto en nuestro sitio.
  </p>
</body>
</html>`;
}

function plainTextLines(quote, showPrices) {
  const lines = [
    `Folio: ${quote.quoteNumber || '—'}`,
    `Cliente: ${quote.clientName || ''}`,
  ];
  const items = quote.items || [];
  items.forEach((it, i) => {
    const f = emailItemFields(it);
    lines.push(`${i + 1}. ${f.code} — ${f.name} — Cant. ${f.quantity}`);
    if (showPrices) {
      lines.push(`   Precio ${formatMoney(f.unitPrice)}  Subtotal ${formatMoney(f.subtotal)}`);
    }
  });
  if (showPrices) {
    const sub = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
    const tax = Number(quote.tax || 0);
    lines.push(`Subtotal: ${formatMoney(sub)}`, `IVA: ${formatMoney(tax)}`, `TOTAL: ${formatMoney(sub + tax)}`);
  }
  if (quote.notes) lines.push('', `Comentarios: ${quote.notes}`);
  return lines.join('\n');
}

export async function sendQuoteReceivedCustomerEmail(quote) {
  const q = await loadQuoteForEmail(quote);
  const to = q.clientEmail?.trim();
  if (!isValidEmail(to)) {
    console.log('[TIWaterQuoteEmail] Skip received email: no valid clientEmail');
    return { skipped: true, reason: 'no_email' };
  }

  const subject = `Cotización recibida ${q.quoteNumber || ''} — ${BRAND}`;
  const inner = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hola ${escapeHtml(q.clientName || 'cliente')},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Tu cotización está en proceso. Un vendedor evaluará tu solicitud y recibirás una respuesta en poco tiempo. Te agradecemos tu paciencia.</p>
    <p style="font-size:13px;font-weight:700;text-transform:uppercase;margin:0 0 12px;color:#1565c0;">Resumen de tu solicitud <span style="font-weight:400;color:#666;">(sin precios)</span></p>
    ${formalQuoteBodyHtml(q, false)}
  `;

  const result = await emailHelper.sendEmail({
    to,
    subject,
    html: wrapEmail(inner),
    ...(isValidEmail(QUOTE_REPLY_TO) ? { replyTo: QUOTE_REPLY_TO } : {}),
    text: [
      `Hola ${q.clientName || 'cliente'},`,
      '',
      'Tu cotización está en proceso. Un vendedor evaluará tu solicitud y recibirás una respuesta en poco tiempo. Te agradecemos tu paciencia.',
      '',
      'Resumen (sin precios):',
      plainTextLines(q, false),
    ].join('\n'),
  });

  if (!result.success) {
    console.error('[TIWaterQuoteEmail] Received confirmation failed:', result.error);
  }
  return result;
}

export async function sendQuoteResponseCustomerEmail(quote) {
  const q = await loadQuoteForEmail(quote);
  const to = q.clientEmail?.trim();
  if (!isValidEmail(to)) {
    console.log('[TIWaterQuoteEmail] Skip response email: no valid clientEmail');
    return { skipped: true, reason: 'no_email' };
  }

  const subject = `Cotización ${q.quoteNumber || ''} — Propuesta con precios — ${BRAND}`;
  const inner = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hola ${escapeHtml(q.clientName || 'cliente')},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Adjuntamos el detalle de su cotización con precios e importes. Estado: <strong>Enviada</strong>.</p>
    ${formalQuoteBodyHtml(q, true)}
    <p style="margin-top:20px;font-size:14px;color:#2e7d32;"><strong>Estado:</strong> Cotización enviada / respondida por nuestro equipo.</p>
  `;

  const result = await emailHelper.sendEmail({
    to,
    subject,
    html: wrapEmail(inner),
    ...(isValidEmail(QUOTE_REPLY_TO) ? { replyTo: QUOTE_REPLY_TO } : {}),
    text: [
      `Hola ${q.clientName || 'cliente'},`,
      '',
      'Detalle de su cotización con precios:',
      plainTextLines(q, true),
    ].join('\n'),
  });

  if (!result.success) {
    console.error('[TIWaterQuoteEmail] Response email failed:', result.error);
  }
  return result;
}
