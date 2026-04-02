// src/services/tiwater-quote-notification.service.js
// Customer emails — formal cotización layout (with / without prices)

import emailHelper from '../utils/email.helper.js';

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

function itemUnidad(it) {
  const c = it.product?.category?.trim();
  return c && c.length > 0 ? escapeHtml(c.toUpperCase()) : UNIDAD_DEFAULT;
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
  const subtotal = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const tax = Number(quote.tax || 0);
  const total = subtotal + tax;
  const ivaPct = subtotal > 0 && tax > 0 ? (tax / subtotal) * 100 : 16;

  const th = 'padding:10px 8px;border:1px solid #b0bec5;background:#eceff1;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;';
  const td = 'padding:10px 8px;border:1px solid #cfd8dc;font-size:13px;vertical-align:top;';

  const priceHead = showPrices
    ? `<th style="${th}text-align:right;">PRECIO</th><th style="${th}text-align:right;">SUBTOTAL</th>`
    : '';

  const rows = items
    .map((it) => {
      const code = escapeHtml(it.product?.code || '—');
      const name = escapeHtml(it.product?.name || `Producto #${it.productId || ''}`);
      const desc = it.product?.description ? `<br/><span style="color:#546e7a;font-size:12px;">${escapeHtml(it.product.description)}</span>` : '';
      const lineNotes = it.notes ? `<br/><span style="color:#37474f;font-size:12px;">${escapeHtml(it.notes)}</span>` : '';
      const qty = formatQty(it.quantity);
      const unit = itemUnidad(it);
      const priceCells = showPrices
        ? `<td style="${td}text-align:right;">${formatMoney(it.unitPrice)}</td><td style="${td}text-align:right;font-weight:600;">${formatMoney(it.subtotal)}</td>`
        : '';
      return `<tr>
        <td style="${td}text-align:center;">${qty}</td>
        <td style="${td}">${code}</td>
        <td style="${td}">${name}${desc}${lineNotes}</td>
        <td style="${td}text-align:center;">${unit}</td>
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
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <thead>
        <tr>
          <th style="${th}text-align:center;">CANT.</th>
          <th style="${th}">CÓDIGO</th>
          <th style="${th}">CONCEPTO</th>
          <th style="${th}text-align:center;">UNIDAD</th>
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
    lines.push(
      `${i + 1}. ${it.product?.code || ''} — ${it.product?.name || ''} — Cant. ${it.quantity}`,
    );
    if (showPrices) {
      lines.push(`   Precio ${formatMoney(it.unitPrice)}  Subtotal ${formatMoney(it.subtotal)}`);
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
  const to = quote.clientEmail?.trim();
  if (!isValidEmail(to)) {
    console.log('[TIWaterQuoteEmail] Skip received email: no valid clientEmail');
    return { skipped: true, reason: 'no_email' };
  }

  const subject = `Cotización recibida ${quote.quoteNumber || ''} — ${BRAND}`;
  const inner = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hola ${escapeHtml(quote.clientName || 'cliente')},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Tu cotización está en proceso. Un vendedor evaluará tu solicitud y recibirás una respuesta en poco tiempo. Te agradecemos tu paciencia.</p>
    <p style="font-size:13px;font-weight:700;text-transform:uppercase;margin:0 0 12px;color:#1565c0;">Resumen de tu solicitud <span style="font-weight:400;color:#666;">(sin precios)</span></p>
    ${formalQuoteBodyHtml(quote, false)}
  `;

  const result = await emailHelper.sendEmail({
    to,
    subject,
    html: wrapEmail(inner),
    ...(isValidEmail(QUOTE_REPLY_TO) ? { replyTo: QUOTE_REPLY_TO } : {}),
    text: [
      `Hola ${quote.clientName || 'cliente'},`,
      '',
      'Tu cotización está en proceso. Un vendedor evaluará tu solicitud y recibirás una respuesta en poco tiempo. Te agradecemos tu paciencia.',
      '',
      'Resumen (sin precios):',
      plainTextLines(quote, false),
    ].join('\n'),
  });

  if (!result.success) {
    console.error('[TIWaterQuoteEmail] Received confirmation failed:', result.error);
  }
  return result;
}

export async function sendQuoteResponseCustomerEmail(quote) {
  const to = quote.clientEmail?.trim();
  if (!isValidEmail(to)) {
    console.log('[TIWaterQuoteEmail] Skip response email: no valid clientEmail');
    return { skipped: true, reason: 'no_email' };
  }

  const subject = `Cotización ${quote.quoteNumber || ''} — Propuesta con precios — ${BRAND}`;
  const inner = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hola ${escapeHtml(quote.clientName || 'cliente')},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Adjuntamos el detalle de su cotización con precios e importes. Estado: <strong>Enviada</strong>.</p>
    ${formalQuoteBodyHtml(quote, true)}
    <p style="margin-top:20px;font-size:14px;color:#2e7d32;"><strong>Estado:</strong> Cotización enviada / respondida por nuestro equipo.</p>
  `;

  const result = await emailHelper.sendEmail({
    to,
    subject,
    html: wrapEmail(inner),
    ...(isValidEmail(QUOTE_REPLY_TO) ? { replyTo: QUOTE_REPLY_TO } : {}),
    text: [
      `Hola ${quote.clientName || 'cliente'},`,
      '',
      'Detalle de su cotización con precios:',
      plainTextLines(quote, true),
    ].join('\n'),
  });

  if (!result.success) {
    console.error('[TIWaterQuoteEmail] Response email failed:', result.error);
  }
  return result;
}
