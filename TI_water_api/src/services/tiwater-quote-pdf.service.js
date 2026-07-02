// PDF cotización (adjunto al correo “enviada”) — evita recorte HTML en Gmail.

import PDFDocument from 'pdfkit';
import { quoteLineFields } from '../utils/quote-line-fields.js';

const LUGAR = process.env.TIWATER_QUOTE_LUGAR || 'HERMOSILLO, SONORA';
const MONEDA = 'MXN';
const UNIDAD_DEFAULT = 'SERVICIO';

const ISSUER = {
  tradeMark: process.env.TIWATER_QUOTE_TRADE_MARK || 'TI WATER',
  legalName:
    process.env.TIWATER_QUOTE_LEGAL_NAME ||
    'TI WATER — Soluciones en purificación de agua',
  rfc: process.env.TIWATER_QUOTE_RFC || '',
  footerLegal:
    process.env.TIWATER_QUOTE_FOOTER_LEGAL ||
    'Precios sujetos a cambio sin previo aviso. Vigencia de cotización según acuerdo comercial.',
};

function formatMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(x);
}

function formatQty(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(x);
}

function unidadLabel(category) {
  const c = typeof category === 'string' ? category.trim() : '';
  return c.length > 0 ? c.toUpperCase() : UNIDAD_DEFAULT;
}

/**
 * @param {Object} quote - quote with items from DB
 * @param {{ showPrices: boolean }} opts
 * @returns {Promise<Buffer>}
 */
export function generateQuotePdfBuffer(quote, opts = {}) {
  const showPrices = opts.showPrices !== false;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: `Cotización ${quote.quoteNumber || ''}`,
        Author: ISSUER.tradeMark,
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let y = doc.y;

    const line = (text, options = {}) => {
      doc.font('Helvetica').fontSize(options.size || 10).fillColor('#000000');
      doc.text(text, doc.page.margins.left, y, {
        width: pageW,
        align: options.align || 'left',
      });
      y = doc.y + (options.gap ?? 4);
    };

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1565c0');
    doc.text(`${ISSUER.tradeMark}`, doc.page.margins.left, y, { width: pageW * 0.55 });
    doc.font('Helvetica').fontSize(8).fillColor('#333333');
    const boxX = doc.page.margins.left + pageW * 0.52;
    const boxW = pageW * 0.48;
    let boxY = y;
    doc.rect(boxX, boxY - 2, boxW, 72).stroke('#1565c0');
    doc.font('Helvetica-Bold').fontSize(8).text('Folio', boxX + 8, boxY + 4, { width: boxW - 16 });
    doc.font('Helvetica-Bold').fontSize(11).text(String(quote.quoteNumber || '—'), boxX + 8, boxY + 14, {
      width: boxW - 16,
    });
    doc.font('Helvetica').fontSize(8).text('Fecha', boxX + 8, boxY + 30, { width: boxW - 16 });
    const fecha = quote.createdAt
      ? new Date(quote.createdAt).toLocaleString('es-MX', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('es-MX');
    doc.text(fecha, boxX + 8, boxY + 40, { width: boxW - 16 });
    doc.text(`Lugar: ${LUGAR}`, boxX + 8, boxY + 52, { width: boxW - 16 });
    doc.text(`Moneda: ${MONEDA}`, boxX + 8, boxY + 62, { width: boxW - 16 });

    y = Math.max(doc.y, boxY + 78);
    doc.font('Helvetica').fontSize(9).fillColor('#333333');
    line(ISSUER.legalName, { size: 9, gap: 2 });
    if (ISSUER.rfc) line(`RFC: ${ISSUER.rfc}`, { size: 9, gap: 8 });

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000');
    line('COTIZACIÓN', { size: 14, align: 'center', gap: 12 });

    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageW, y).stroke('#cccccc');
    y += 10;

    doc.font('Helvetica-Bold').fontSize(9).text('CLIENTE', doc.page.margins.left, y);
    y = doc.y + 4;
    doc.font('Helvetica-Bold').fontSize(11).text(String(quote.clientName || '—'), doc.page.margins.left, y, { width: pageW });
    y = doc.y + 2;
    doc.font('Helvetica').fontSize(9).fillColor('#444444');
    if (quote.clientEmail) {
      doc.text(String(quote.clientEmail), doc.page.margins.left, y, { width: pageW });
      y = doc.y + 2;
    }
    if (quote.clientPhone) {
      doc.text(`Tel. ${quote.clientPhone}`, doc.page.margins.left, y, { width: pageW });
      y = doc.y + 2;
    }
    if (quote.clientAddress) {
      doc.text(`Domicilio: ${quote.clientAddress}`, doc.page.margins.left, y, { width: pageW });
      y = doc.y + 2;
    }
    y += 8;
    doc.fillColor('#000000');

    const items = Array.isArray(quote.items) ? quote.items : [];
    const col = showPrices
      ? { cant: 36, code: 52, concept: pageW - 36 - 52 - 58 - 70 - 70, unit: 58, price: 70, sub: 70 }
      : { cant: 40, code: 60, concept: pageW - 40 - 60 - 70, unit: 70, price: 0, sub: 0 };

    const headerY = y;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#37474f');
    let x = doc.page.margins.left;
    doc.text('CANT.', x, headerY, { width: col.cant, align: 'center' });
    x += col.cant;
    doc.text('CÓDIGO', x, headerY, { width: col.code });
    x += col.code;
    doc.text('CONCEPTO', x, headerY, { width: col.concept });
    x += col.concept;
    doc.text('UNIDAD', x, headerY, { width: col.unit, align: 'center' });
    if (showPrices) {
      x += col.unit;
      doc.text('PRECIO', x, headerY, { width: col.price, align: 'right' });
      x += col.price;
      doc.text('SUBTOTAL', x, headerY, { width: col.sub, align: 'right' });
    }
    y = headerY + 14;
    doc.moveTo(doc.page.margins.left, y - 4).lineTo(doc.page.margins.left + pageW, y - 4).stroke('#b0bec5');

    doc.font('Helvetica').fontSize(8).fillColor('#000000');

    for (const it of items) {
      const f = quoteLineFields(it);
      const concept = [f.name, f.description ? `(${f.description})` : '', f.notes ? `Notas: ${f.notes}` : '']
        .filter(Boolean)
        .join(' ');

      doc.font('Helvetica').fontSize(8);
      const rowH = Math.max(
        28,
        doc.heightOfString(concept, { width: col.concept - 4, lineGap: 1 }) + 8,
      );
      if (y + rowH > doc.page.height - doc.page.margins.bottom - 80) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      x = doc.page.margins.left;
      doc.text(formatQty(f.quantity), x, y, { width: col.cant, align: 'center' });
      x += col.cant;
      doc.text(String(f.code), x, y, { width: col.code - 4 });
      x += col.code;
      doc.text(concept, x, y, { width: col.concept - 4, lineGap: 1 });
      x += col.concept;
      doc.text(unidadLabel(f.category), x, y, { width: col.unit - 4, align: 'center' });
      if (showPrices) {
        x += col.unit;
        doc.text(formatMoney(f.unitPrice), x, y, { width: col.price - 4, align: 'right' });
        x += col.price;
        doc.text(formatMoney(f.subtotal), x, y, { width: col.sub - 4, align: 'right' });
      }
      y += rowH;
      doc.moveTo(doc.page.margins.left, y - 2).lineTo(doc.page.margins.left + pageW, y - 2).stroke('#eeeeee');
    }

    if (items.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).text('Sin partidas.', doc.page.margins.left, y, { width: pageW });
      y = doc.y + 12;
    }

    if (showPrices) {
      const subtotal = items.reduce((s, row) => {
        const f = quoteLineFields(row);
        const st = Number(f.subtotal);
        return s + (Number.isFinite(st) ? st : 0);
      }, 0);
      const tax = Number(quote.tax || 0);
      const total = Number.isFinite(Number(quote.total)) ? Number(quote.total) : subtotal + tax;
      const ivaPct = subtotal > 0 && tax > 0 ? (tax / subtotal) * 100 : 16;

      y += 8;
      const tw = 200;
      const tx = doc.page.margins.left + pageW - tw;
      doc.font('Helvetica').fontSize(9);
      doc.text('Subtotal $', tx, y, { width: tw * 0.55 });
      doc.text(formatMoney(subtotal), tx + tw * 0.55, y, { width: tw * 0.45, align: 'right' });
      y += 14;
      doc.text(`IVA Tras. (${ivaPct.toFixed(2)})% $`, tx, y, { width: tw * 0.55 });
      doc.text(formatMoney(tax), tx + tw * 0.55, y, { width: tw * 0.45, align: 'right' });
      y += 16;
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('TOTAL $', tx, y, { width: tw * 0.55 });
      doc.text(formatMoney(total), tx + tw * 0.55, y, { width: tw * 0.45, align: 'right' });
      y += 24;
    }

    doc.font('Helvetica').fontSize(8).fillColor('#555555');
    if (quote.notes) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000').text('Comentarios', doc.page.margins.left, y, { width: pageW });
      y = doc.y + 4;
      doc.font('Helvetica').fontSize(9).fillColor('#444444').text(String(quote.notes), doc.page.margins.left, y, { width: pageW });
      y = doc.y + 10;
    }
    doc.font('Helvetica').fontSize(8).fillColor('#666666').text(ISSUER.footerLegal, doc.page.margins.left, y, {
      width: pageW,
      lineGap: 2,
    });

    doc.end();
  });
}

export function quotePdfFilename(quote) {
  const raw = String(quote.quoteNumber || quote.id || 'cotizacion').replace(/[^\w.-]+/g, '_');
  return `Cotizacion_${raw}.pdf`;
}
