/**
 * In-memory mock store — DELETE this file when backend is integrated.
 * All services import from here while VITE_USE_MOCK_API=true.
 *
 * Replace with: TI_water_api `/api/v1.0/tiwater/restaurant/*`
 */
import { MOCK_MENU_ITEMS } from './data';
import type { MenuItem } from '@tejaban/types/menu.types';
import type { Order, OrderItem, OrderStatus } from '@tejaban/types/order.types';
import type { Payment, PaymentMethod, SalesReport, SalesReportFilters } from '@tejaban/types/payment.types';
import { ALL_PAYMENT_METHODS } from '@tejaban/types/payment.types';
import type { OrderType } from '@tejaban/types/order.types';
import { ALL_ORDER_TYPES } from '@tejaban/types/order.types';

const MOCK_DELAY_MS = 350;

export function mockDelay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let menuItems: MenuItem[] = structuredClone(MOCK_MENU_ITEMS);
let nextMenuId = 17;
let nextOrderId = 3;
let nextOrderItemId = 10;
let nextPaymentId = 2;
let orderSeq = 2;

const now = () => new Date().toISOString();

function calcTotals(items: OrderItem[]) {
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  return { subtotal, tax: 0, total: subtotal };
}

function generateOrderNumber() {
  orderSeq += 1;
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(orderSeq).padStart(3, '0')}`;
}

const seedOrders: Order[] = [
  {
    id: 1,
    orderNumber: 'ORD-2026-001',
    status: 'en_preparacion',
    orderType: 'mostrador',
    items: [
      {
        id: 1,
        menuItemId: 2,
        menuItem: { id: 2, name: 'Vaso de Cahuamanta', category: 'cahuamanta', price: 85 },
        quantity: 2,
        unitPrice: 85,
        subtotal: 170,
      },
      {
        id: 2,
        menuItemId: 6,
        menuItem: { id: 6, name: 'Taco de Camarón', category: 'tacos', price: 48 },
        quantity: 1,
        unitPrice: 48,
        subtotal: 48,
      },
    ],
    subtotal: 218,
    tax: 0,
    total: 218,
    createdBy: 'María',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 2,
    orderNumber: 'ORD-2026-002',
    status: 'abierta',
    orderType: 'mesa',
    tableLabel: 'Mesa 4',
    items: [
      {
        id: 3,
        menuItemId: 9,
        menuItem: { id: 9, name: 'Paquete 1', category: 'paquetes', price: 150 },
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
      },
    ],
    subtotal: 150,
    tax: 0,
    total: 150,
    notes: 'Sin cebolla',
    createdBy: 'María',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

let orders: Order[] = structuredClone(seedOrders);

const seedPayments: Payment[] = [
  {
    id: 1,
    orderId: 0,
    orderNumber: 'ORD-2026-000',
    method: 'tarjeta',
    amount: 320,
    terminalTicketRef: 'TKT-20260620-00451',
    status: 'registrado',
    recordedBy: 'María',
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

let payments: Payment[] = structuredClone(seedPayments);

export const mockStore = {
  // --- Menu ---
  async getMenu(): Promise<MenuItem[]> {
    return mockDelay([...menuItems].filter((m) => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
  },

  async getAllMenuItems(): Promise<MenuItem[]> {
    return mockDelay([...menuItems].sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder));
  },

  async updateMenuItem(id: number, patch: Partial<MenuItem>): Promise<MenuItem> {
    const idx = menuItems.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');
    menuItems[idx] = { ...menuItems[idx], ...patch };
    return mockDelay(menuItems[idx]);
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const created = { ...item, id: nextMenuId++ };
    menuItems.push(created);
    return mockDelay(created);
  },

  async deleteMenuItem(id: number): Promise<void> {
    const idx = menuItems.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');
    menuItems.splice(idx, 1);
    await mockDelay(null);
  },

  // --- Orders ---
  async getOrders(filters?: {
    status?: OrderStatus;
    today?: boolean;
    fromDate?: string;
    toDate?: string;
    createdBy?: string;
  }): Promise<Order[]> {
    let result = [...orders];
    if (filters?.status) result = result.filter((o) => o.status === filters.status);
    if (filters?.fromDate || filters?.toDate) {
      const from = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null;
      const to = filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null;
      result = result.filter((o) => {
        const createdAt = new Date(o.createdAt);
        if (from && createdAt < from) return false;
        if (to && createdAt > to) return false;
        return true;
      });
    } else if (filters?.today) {
      const today = new Date().toDateString();
      result = result.filter((o) => new Date(o.createdAt).toDateString() === today);
    }
    if (filters?.createdBy) {
      result = result.filter((o) => o.createdBy === filters.createdBy);
    }
    return mockDelay(result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async getOrder(id: number): Promise<Order | null> {
    return mockDelay(orders.find((o) => o.id === id) ?? null);
  },

  async createOrder(payload: {
    orderType?: Order['orderType'];
    tableLabel?: string;
    notes?: string;
    items: Array<{ menuItemId: number; quantity: number; notes?: string }>;
    createdBy?: string;
  }): Promise<Order> {
    const items: OrderItem[] = payload.items.map((line) => {
      const menuItem = menuItems.find((m) => m.id === line.menuItemId);
      if (!menuItem) throw new Error(`Producto ${line.menuItemId} no encontrado`);
      const unitPrice = menuItem.price;
      return {
        id: nextOrderItemId++,
        menuItemId: menuItem.id,
        menuItem: {
          id: menuItem.id,
          name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
        },
        quantity: line.quantity,
        unitPrice,
        subtotal: unitPrice * line.quantity,
        notes: line.notes,
      };
    });

    const totals = calcTotals(items);
    const order: Order = {
      id: nextOrderId++,
      orderNumber: generateOrderNumber(),
      status: 'abierta',
      orderType: payload.orderType ?? 'mostrador',
      tableLabel: payload.tableLabel,
      items,
      notes: payload.notes,
      createdBy: payload.createdBy ?? 'Staff',
      createdAt: now(),
      updatedAt: now(),
      ...totals,
    };
    orders.unshift(order);
    return mockDelay(order);
  },

  async updateOrder(id: number, patch: Partial<Order>): Promise<Order> {
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Orden no encontrada');
    orders[idx] = { ...orders[idx], ...patch, updatedAt: now() };
    if (patch.status === 'cerrada') orders[idx].closedAt = now();
    return mockDelay(orders[idx]);
  },

  async addOrderItem(
    orderId: number,
    payload: { menuItemId: number; quantity: number; notes?: string },
  ): Promise<Order> {
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Orden no encontrada');
    if (orders[idx].status !== 'abierta') throw new Error('Solo se pueden modificar órdenes abiertas');

    const menuItem = menuItems.find((m) => m.id === payload.menuItemId);
    if (!menuItem) throw new Error('Producto no encontrado');

    const existing = orders[idx].items.find((i) => i.menuItemId === payload.menuItemId);
    if (existing) {
      existing.quantity += payload.quantity;
      existing.subtotal = existing.unitPrice * existing.quantity;
    } else {
      orders[idx].items.push({
        id: nextOrderItemId++,
        menuItemId: menuItem.id,
        menuItem: {
          id: menuItem.id,
          name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
        },
        quantity: payload.quantity,
        unitPrice: menuItem.price,
        subtotal: menuItem.price * payload.quantity,
        notes: payload.notes,
      });
    }

    const totals = calcTotals(orders[idx].items);
    orders[idx] = { ...orders[idx], ...totals, updatedAt: now() };
    return mockDelay(orders[idx]);
  },

  async updateOrderItem(
    orderId: number,
    itemId: number,
    patch: { quantity?: number; notes?: string },
  ): Promise<Order> {
    const orderIdx = orders.findIndex((o) => o.id === orderId);
    if (orderIdx === -1) throw new Error('Orden no encontrada');
    if (orders[orderIdx].status !== 'abierta') throw new Error('Solo se pueden modificar órdenes abiertas');

    const itemIdx = orders[orderIdx].items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) throw new Error('Línea no encontrada');

    const item = orders[orderIdx].items[itemIdx];
    if (patch.quantity !== undefined) {
      if (patch.quantity <= 0) {
        orders[orderIdx].items.splice(itemIdx, 1);
      } else {
        item.quantity = patch.quantity;
        item.subtotal = item.unitPrice * item.quantity;
        if (patch.notes !== undefined) item.notes = patch.notes;
      }
    } else if (patch.notes !== undefined) {
      item.notes = patch.notes;
    }

    const totals = calcTotals(orders[orderIdx].items);
    orders[orderIdx] = { ...orders[orderIdx], ...totals, updatedAt: now() };
    return mockDelay(orders[orderIdx]);
  },

  async removeOrderItem(orderId: number, itemId: number): Promise<Order> {
    return this.updateOrderItem(orderId, itemId, { quantity: 0 });
  },

  // --- Payments ---
  async getPayments(filters?: {
    today?: boolean;
    fromDate?: string;
    toDate?: string;
    recordedBy?: string;
  }): Promise<Payment[]> {
    let result = [...payments];
    if (filters?.fromDate || filters?.toDate) {
      const from = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null;
      const to = filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null;
      result = result.filter((p) => {
        const paidAt = new Date(p.paidAt);
        if (from && paidAt < from) return false;
        if (to && paidAt > to) return false;
        return true;
      });
    } else if (filters?.today) {
      const today = new Date().toDateString();
      result = result.filter((p) => new Date(p.paidAt).toDateString() === today);
    }
    if (filters?.recordedBy) {
      result = result.filter((p) => p.recordedBy === filters.recordedBy);
    }
    return mockDelay(result.sort((a, b) => b.paidAt.localeCompare(a.paidAt)));
  },

  async createPayment(
    orderId: number,
    payload: { method: PaymentMethod; amount: number; terminalTicketRef?: string; recordedBy?: string },
  ): Promise<{ payment: Payment; order: Order }> {
    const orderIdx = orders.findIndex((o) => o.id === orderId);
    if (orderIdx === -1) throw new Error('Orden no encontrada');

    if (payload.method === 'tarjeta' && !payload.terminalTicketRef?.trim()) {
      throw new Error('Referencia de terminal requerida para pagos con tarjeta');
    }

    const payment: Payment = {
      id: nextPaymentId++,
      orderId,
      orderNumber: orders[orderIdx].orderNumber,
      method: payload.method,
      amount: payload.amount,
      terminalTicketRef: payload.terminalTicketRef,
      status: 'registrado',
      recordedBy: payload.recordedBy ?? 'Staff',
      paidAt: now(),
    };
    payments.unshift(payment);

    orders[orderIdx] = {
      ...orders[orderIdx],
      status: 'cerrada',
      closedAt: now(),
      updatedAt: now(),
    };

    return mockDelay({ payment, order: orders[orderIdx] });
  },

  async getDailySummary(filters?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<import('@tejaban/types/payment.types').DailySummary> {
    const useToday = !filters?.fromDate && !filters?.toDate;
    const from = filters?.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null;
    const to = filters?.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null;

    const inRange = (iso: string) => {
      if (useToday) return new Date(iso).toDateString() === new Date().toDateString();
      const d = new Date(iso);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    const dayOrders = orders.filter((o) => inRange(o.createdAt));
    const dayPayments = payments.filter((p) => inRange(p.paidAt));

    return mockDelay({
      date: useToday
        ? new Date().toDateString()
        : `${filters!.fromDate} — ${filters!.toDate}`,
      fromDate: useToday ? undefined : filters?.fromDate,
      toDate: useToday ? undefined : filters?.toDate,
      orderCount: dayOrders.length,
      closedOrderCount: dayOrders.filter((o) => o.status === 'cerrada').length,
      openOrderCount: dayOrders.filter((o) => o.status !== 'cerrada' && o.status !== 'cancelada').length,
      totalSales: dayPayments.reduce((s, p) => s + p.amount, 0),
      cashTotal: dayPayments.filter((p) => p.method === 'efectivo').reduce((s, p) => s + p.amount, 0),
      cardTotal: dayPayments.filter((p) => p.method === 'tarjeta').reduce((s, p) => s + p.amount, 0),
      transferTotal: dayPayments.filter((p) => p.method === 'transferencia').reduce((s, p) => s + p.amount, 0),
      uberEatsTotal: dayPayments.filter((p) => p.method === 'uber_eats').reduce((s, p) => s + p.amount, 0),
      didiTotal: dayPayments.filter((p) => p.method === 'didi').reduce((s, p) => s + p.amount, 0),
      rapiTotal: dayPayments.filter((p) => p.method === 'rapi').reduce((s, p) => s + p.amount, 0),
    });
  },

  async getSalesReport(filters: SalesReportFilters): Promise<SalesReport> {
    const from = new Date(`${filters.fromDate}T00:00:00`);
    const to = new Date(`${filters.toDate}T23:59:59.999`);

    let result = payments.filter((p) => {
      const paidAt = new Date(p.paidAt);
      return paidAt >= from && paidAt <= to;
    });

    if (filters.methods?.length) {
      result = result.filter((p) => filters.methods!.includes(p.method));
    }

    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const rows = result.map((p) => ({
      ...p,
      orderType: orderMap.get(p.orderId)?.orderType,
    }));

    const filteredRows =
      filters.orderTypes?.length
        ? rows.filter((p) => p.orderType && filters.orderTypes!.includes(p.orderType))
        : rows;

    const byMethod = Object.fromEntries(ALL_PAYMENT_METHODS.map((m) => [m, 0])) as Record<
      PaymentMethod,
      number
    >;
    const byOrderType = Object.fromEntries(ALL_ORDER_TYPES.map((t) => [t, 0])) as Record<
      OrderType,
      number
    >;

    for (const payment of filteredRows) {
      byMethod[payment.method] += payment.amount;
      if (payment.orderType) {
        byOrderType[payment.orderType] += payment.amount;
      }
    }

    return mockDelay({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      paymentCount: filteredRows.length,
      totalSales: filteredRows.reduce((s, p) => s + p.amount, 0),
      byMethod,
      byOrderType,
      payments: filteredRows.sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    });
  },

  /** Reset store to seed data — dev only */
  reset() {
    menuItems = structuredClone(MOCK_MENU_ITEMS);
    orders = structuredClone(seedOrders);
    payments = structuredClone(seedPayments);
    nextMenuId = 22;
    nextOrderId = 3;
    nextOrderItemId = 10;
    nextPaymentId = 2;
    orderSeq = 2;
  },
};
