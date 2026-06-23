export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export type PaymentStatus = 'registrado' | 'conciliado' | 'anulado';

export interface Payment {
  id: number;
  orderId: number;
  orderNumber: string;
  method: PaymentMethod;
  amount: number;
  terminalTicketRef?: string;
  status: PaymentStatus;
  recordedBy: string;
  paidAt: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

export interface CreatePaymentPayload {
  method: PaymentMethod;
  amount: number;
  terminalTicketRef?: string;
}

export interface DailySummary {
  date: string;
  orderCount: number;
  closedOrderCount: number;
  openOrderCount: number;
  totalSales: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
}
