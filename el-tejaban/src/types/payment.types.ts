import type { OrderType } from './order.types';

export type PaymentMethod =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'uber_eats'
  | 'didi'
  | 'rapi';

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
  uber_eats: 'Uber Eats',
  didi: 'DiDi Food',
  rapi: 'Rappi',
};

export const DELIVERY_PAYMENT_METHODS: PaymentMethod[] = ['uber_eats', 'didi', 'rapi'];

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  'efectivo',
  'tarjeta',
  'transferencia',
  ...DELIVERY_PAYMENT_METHODS,
];

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
  uberEatsTotal: number;
  didiTotal: number;
  rapiTotal: number;
}

export interface SalesReportFilters {
  fromDate: string;
  toDate: string;
  methods?: PaymentMethod[];
  orderTypes?: OrderType[];
}

export interface SalesReportPayment extends Payment {
  orderType?: OrderType;
}

export interface SalesReport {
  fromDate: string;
  toDate: string;
  paymentCount: number;
  totalSales: number;
  byMethod: Record<PaymentMethod, number>;
  byOrderType: Record<OrderType, number>;
  payments: SalesReportPayment[];
}
