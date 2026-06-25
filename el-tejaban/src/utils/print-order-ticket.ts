import { CONFIG } from '@tejaban/config-global';
import type { Order } from '@tejaban/types/order.types';
import { ORDER_STATUS_LABELS, type OrderType } from '@tejaban/types/order.types';
import type { Payment } from '@tejaban/types/payment.types';
import { PAYMENT_METHOD_LABELS } from '@tejaban/types/payment.types';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  mostrador: 'Mostrador',
  mesa: 'Mesa',
  uber_eats: 'Uber Eats',
  didi: 'DiDi Food',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildOrderTicketHtml(order: Order, payment?: Payment | null): string {
  const lines = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.quantity}× ${escapeHtml(item.menuItem?.name ?? item.manualName ?? 'Producto')}</td>
        <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
      </tr>`,
    )
    .join('');

  const paymentBlock = payment
    ? `
      <div class="divider"></div>
      <p><strong>Pago:</strong> ${PAYMENT_METHOD_LABELS[payment.method]}</p>
      <p><strong>Monto:</strong> ${formatCurrency(payment.amount)}</p>
      ${payment.terminalTicketRef ? `<p><strong>Ref:</strong> ${escapeHtml(payment.terminalTicketRef)}</p>` : ''}
      <p><strong>Fecha pago:</strong> ${formatDateTime(payment.paidAt)}</p>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ticket ${escapeHtml(order.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; padding: 8px; color: #111; }
    h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
    .sub { text-align: center; font-size: 11px; margin-bottom: 8px; }
    .meta { margin-bottom: 8px; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    td { padding: 3px 0; vertical-align: top; }
    .divider { border-top: 1px dashed #333; margin: 8px 0; }
    .total { font-size: 14px; font-weight: bold; text-align: right; margin-top: 4px; }
    .footer { text-align: center; margin-top: 12px; font-size: 10px; }
    @media print { @page { margin: 4mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(CONFIG.appName)}</h1>
  <p class="sub">${escapeHtml(CONFIG.slogan)}</p>
  <div class="meta">
    <p><strong>${escapeHtml(order.orderNumber)}</strong></p>
    <p>${formatDateTime(order.createdAt)}</p>
    <p>${ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}${order.tableLabel ? ` · ${escapeHtml(order.tableLabel)}` : ''}</p>
    <p>Estado: ${ORDER_STATUS_LABELS[order.status]}</p>
    ${order.createdBy ? `<p>Atendió: ${escapeHtml(order.createdBy)}</p>` : ''}
  </div>
  <div class="divider"></div>
  <table>${lines}</table>
  <div class="divider"></div>
  <p class="total">TOTAL ${formatCurrency(order.total)}</p>
  ${order.notes ? `<p style="margin-top:8px"><strong>Notas:</strong> ${escapeHtml(order.notes)}</p>` : ''}
  ${paymentBlock}
  <p class="footer">Gracias por su preferencia</p>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;
}

/** Opens a print dialog with a thermal-style receipt (72mm). */
export function printOrderTicket(order: Order, payment?: Payment | null): void {
  const html = buildOrderTicketHtml(order, payment);
  const printWindow = window.open('', '_blank', 'width=320,height=640');

  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresión. Permite ventanas emergentes.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
