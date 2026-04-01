// src/services/tiwater-quote-notification.service.js
// Customer emails for TI Water quotes (Mailgun / SendGrid / Resend / SMTP via email.helper)

import emailHelper from '../utils/email.helper.js';

const BRAND = 'TI Water';

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
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function itemsTableHtml(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p><em>Sin productos en la cotización.</em></p>';
  }
  const rows = items
    .map((it) => {
      const name = escapeHtml(it.product?.name || `Producto #${it.productId || ''}`);
      const code = it.product?.code ? escapeHtml(String(it.product.code)) : '—';
      const qty = escapeHtml(String(it.quantity ?? ''));
      const unit = formatMoney(it.unitPrice);
      const disc = formatMoney(it.discount || 0);
      const sub = formatMoney(it.subtotal);
      const lineNotes = it.notes ? escapeHtml(it.notes) : '—';
      return `<tr>
        <td style="padding:8px;border:1px solid #e0e0e0;">${name}<br/><span style="color:#666;font-size:12px;">${code}</span></td>
        <td style="padding:8px;border:1px solid #e0e0e0;text-align:right;">${qty}</td>
        <td style="padding:8px;border:1px solid #e0e0e0;text-align:right;">${unit}</td>
        <td style="padding:8px;border:1px solid #e0e0e0;text-align:right;">${disc}</td>
        <td style="padding:8px;border:1px solid #e0e0e0;text-align:right;">${sub}</td>
        <td style="padding:8px;border:1px solid #e0e0e0;font-size:13px;">${lineNotes}</td>
      </tr>`;
    })
    .join('');
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:left;">Producto</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:right;">Cant.</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:right;">Precio unit.</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:right;">Desc.</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:right;">Subtotal</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:left;">Notas línea</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function quoteSummaryBlock(quote) {
  const num = escapeHtml(quote.quoteNumber || '');
  const name = escapeHtml(quote.clientName || '');
  const phone = escapeHtml(quote.clientPhone || '—');
  const addr = escapeHtml(quote.clientAddress || '—');
  const status = escapeHtml(quote.status || '—');
  const notes = quote.notes ? escapeHtml(quote.notes) : null;
  const validUntil = quote.validUntil ? escapeHtml(String(quote.validUntil)) : null;

  return `
    <table style="width:100%;max-width:560px;margin:12px 0;font-size:14px;line-height:1.5;">
      <tr><td><strong>Folio:</strong></td><td>${num}</td></tr>
      <tr><td><strong>Cliente:</strong></td><td>${name}</td></tr>
      <tr><td><strong>Teléfono:</strong></td><td>${phone}</td></tr>
      <tr><td><strong>Dirección:</strong></td><td>${addr}</td></tr>
      <tr><td><strong>Estado:</strong></td><td>${status}</td></tr>
      ${validUntil ? `<tr><td><strong>Vigencia:</strong></td><td>${validUntil}</td></tr>` : ''}
    </table>
    ${notes ? `<p style="margin-top:12px;"><strong>Notas generales:</strong><br/>${notes}</p>` : ''}
    ${itemsTableHtml(quote.items)}
    <p style="margin-top:12px;font-size:15px;">
      <strong>Subtotal:</strong> ${formatMoney(quote.subtotal)}<br/>
      <strong>Impuestos:</strong> ${formatMoney(quote.tax)}<br/>
      <strong>Total:</strong> ${formatMoney(quote.total)}
    </p>`;
}

function wrapEmail(innerHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:640px;margin:0 auto;padding:20px;">
  <div style="background:#f9f9f9;padding:24px;border-radius:8px;border:1px solid #e0e0e0;">
    <h1 style="color:#1565c0;margin-top:0;">${BRAND}</h1>
    <div style="background:#fff;padding:20px;border-radius:6px;">
      ${innerHtml}
    </div>
    <p style="text-align:center;color:#666;font-size:12px;margin-top:20px;">
      Correo automático, por favor no respondas directamente a este mensaje.
    </p>
  </div>
</body>
</html>`;
}

/**
 * After a public (or authenticated) quote is created — pending review.
 */
export async function sendQuoteReceivedCustomerEmail(quote) {
  const to = quote.clientEmail?.trim();
  if (!isValidEmail(to)) {
    console.log('[TIWaterQuoteEmail] Skip received email: no valid clientEmail');
    return { skipped: true, reason: 'no_email' };
  }

  const subject = `Recibimos tu cotización ${quote.quoteNumber || ''} — ${BRAND}`;
  const inner = `
    <p>Hola ${escapeHtml(quote.clientName || 'cliente')},</p>
    <p>Tu cotización está en proceso. Un vendedor evaluará tu solicitud y recibirás una respuesta en poco tiempo. Te agradecemos tu paciencia.</p>
    <h2 style="margin-top:24px;font-size:16px;">Detalle de tu solicitud</h2>
    ${quoteSummaryBlock(quote)}
  `;

  const result = await emailHelper.sendEmail({
    to,
    subject,
    html: wrapEmail(inner),
    text: [
      `Hola ${quote.clientName || 'cliente'},`,
      '',
      'Tu cotización está en proceso. Un vendedor evaluará tu solicitud y recibirás una respuesta en poco tiempo. Te agradecemos tu paciencia.',
      '',
      `Folio: ${quote.quoteNumber}`,
      `Total indicativo: ${formatMoney(quote.total)}`,
    ].join('\n'),
  });

  if (!result.success) {
    console.error('[TIWaterQuoteEmail] Received confirmation failed:', result.error);
  }
  return result;
}

/**
 * When staff marks the quote as responded (status enviada) — pricing and notes.
 */
export async function sendQuoteResponseCustomerEmail(quote) {
  const to = quote.clientEmail?.trim();
  if (!isValidEmail(to)) {
    console.log('[TIWaterQuoteEmail] Skip response email: no valid clientEmail');
    return { skipped: true, reason: 'no_email' };
  }

  const subject = `Respuesta a tu cotización ${quote.quoteNumber || ''} — ${BRAND}`;
  const inner = `
    <p>Hola ${escapeHtml(quote.clientName || 'cliente')},</p>
    <p>Ya puedes revisar la propuesta económica y los detalles de tu cotización a continuación.</p>
    <h2 style="margin-top:24px;font-size:16px;">Cotización respondida</h2>
    ${quoteSummaryBlock(quote)}
    <p style="margin-top:16px;color:#2e7d32;"><strong>Estado:</strong> Enviada / respondida por nuestro equipo.</p>
  `;

  const result = await emailHelper.sendEmail({
    to,
    subject,
    html: wrapEmail(inner),
    text: [
      `Hola ${quote.clientName || 'cliente'},`,
      '',
      'Ya puedes revisar la propuesta económica y los detalles de tu cotización.',
      '',
      `Folio: ${quote.quoteNumber}`,
      `Subtotal: ${formatMoney(quote.subtotal)}`,
      `Impuestos: ${formatMoney(quote.tax)}`,
      `Total: ${formatMoney(quote.total)}`,
      quote.notes ? `Notas: ${quote.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  });

  if (!result.success) {
    console.error('[TIWaterQuoteEmail] Response email failed:', result.error);
  }
  return result;
}
