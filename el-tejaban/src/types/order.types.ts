import type { MenuItem } from './menu.types';

export type OrderStatus =
  | 'abierta'
  | 'en_preparacion'
  | 'lista'
  | 'cerrada'
  | 'cancelada';

export type OrderType = 'mostrador' | 'mesa' | 'uber_eats' | 'didi';

export interface OrderItem {
  id: number;
  menuItemId?: number;
  menuItem?: Pick<MenuItem, 'id' | 'name' | 'category' | 'price'>;
  manualName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  tableLabel?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  mostrador: 'Mostrador',
  mesa: 'Mesa',
  uber_eats: 'Uber Eats',
  didi: 'DiDi Food',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  abierta: 'Abierta',
  en_preparacion: 'En preparación',
  lista: 'Lista',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
> = {
  abierta: 'primary',
  en_preparacion: 'warning',
  lista: 'info',
  cerrada: 'success',
  cancelada: 'error',
};

export interface CreateOrderPayload {
  orderType?: OrderType;
  tableLabel?: string;
  notes?: string;
  items: Array<{
    menuItemId: number;
    quantity: number;
    notes?: string;
  }>;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  orderType?: OrderType;
  tableLabel?: string;
  notes?: string;
}

export interface AddOrderItemPayload {
  menuItemId: number;
  quantity: number;
  notes?: string;
}

export interface UpdateOrderItemPayload {
  quantity?: number;
  notes?: string;
}
