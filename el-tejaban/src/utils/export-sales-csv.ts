import { ORDER_TYPE_LABELS } from '@tejaban/types/order.types';
import type { SalesReport } from '@tejaban/types/payment.types';
import { PAYMENT_METHOD_LABELS } from '@tejaban/types/payment.types';

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function formatCsvDate(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function buildSalesReportCsv(report: SalesReport): string {
  const lines: string[] = [
    `Reporte de ventas,${report.fromDate},a,${report.toDate}`,
    '',
    'Resumen',
    'Concepto,Monto',
    `Ventas totales,${report.totalSales.toFixed(2)}`,
    `Pagos registrados,${report.paymentCount}`,
    '',
    'Por método de pago',
    'Método,Monto',
    ...Object.entries(report.byMethod)
      .filter(([, amount]) => amount > 0)
      .map(([method, amount]) => `${PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]},${amount.toFixed(2)}`),
    '',
    'Por origen de orden',
    'Origen,Monto',
    ...Object.entries(report.byOrderType)
      .filter(([, amount]) => amount > 0)
      .map(([type, amount]) => `${ORDER_TYPE_LABELS[type as keyof typeof ORDER_TYPE_LABELS]},${amount.toFixed(2)}`),
    '',
    'Detalle de pagos',
    'Fecha,Orden,Origen,Método,Monto,Referencia,Registrado por',
    ...report.payments.map((p) =>
      [
        formatCsvDate(p.paidAt),
        p.orderNumber,
        p.orderType ? ORDER_TYPE_LABELS[p.orderType] : '',
        PAYMENT_METHOD_LABELS[p.method],
        p.amount.toFixed(2),
        p.terminalTicketRef ?? '',
        p.recordedBy,
      ]
        .map(escapeCsv)
        .join(','),
    ),
  ];

  return `\uFEFF${lines.join('\n')}`;
}

export function downloadSalesReportCsv(report: SalesReport): void {
  const csv = buildSalesReportCsv(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ventas-el-tejaban_${report.fromDate}_${report.toDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
