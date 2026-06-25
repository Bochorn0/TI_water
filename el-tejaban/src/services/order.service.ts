import { CONFIG } from '@tejaban/config-global';
import { mockStore } from '@tejaban/mock/mock-store';
import { tejabanAxios } from '@tejaban/api/axiosInstance';
import type {
  CreateOrderPayload,
  Order,
  OrderStatus,
  UpdateOrderPayload,
} from '@tejaban/types/order.types';

export const orderService = {
  async getOrders(filters?: { status?: OrderStatus; today?: boolean }): Promise<Order[]> {
    if (CONFIG.USE_MOCK_API) return mockStore.getOrders(filters);
    const { data } = await tejabanAxios.get<{ orders: Order[] }>('/orders', { params: filters });
    return data.orders;
  },

  async getOrder(id: number): Promise<Order | null> {
    if (CONFIG.USE_MOCK_API) return mockStore.getOrder(id);
    try {
      const { data } = await tejabanAxios.get<Order>(`/orders/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    if (CONFIG.USE_MOCK_API) {
      const { getStoredUser } = await import('./auth.service');
      const user = getStoredUser();
      return mockStore.createOrder({ ...payload, createdBy: user?.nombre ?? 'Staff' });
    }
    const { data } = await tejabanAxios.post<Order>('/orders', payload);
    return data;
  },

  async updateOrder(id: number, payload: UpdateOrderPayload): Promise<Order> {
    if (CONFIG.USE_MOCK_API) return mockStore.updateOrder(id, payload);
    const { data } = await tejabanAxios.patch<Order>(`/orders/${id}`, payload);
    return data;
  },

  async addOrderItem(
    orderId: number,
    payload: { menuItemId: number; quantity?: number; notes?: string },
  ): Promise<Order> {
    if (CONFIG.USE_MOCK_API) {
      return mockStore.addOrderItem(orderId, { ...payload, quantity: payload.quantity ?? 1 });
    }
    const { data } = await tejabanAxios.post<Order>(`/orders/${orderId}/items`, payload);
    return data;
  },

  async updateOrderItem(
    orderId: number,
    itemId: number,
    patch: { quantity?: number; notes?: string },
  ): Promise<Order> {
    if (CONFIG.USE_MOCK_API) return mockStore.updateOrderItem(orderId, itemId, patch);
    const { data } = await tejabanAxios.patch<Order>(`/orders/${orderId}/items/${itemId}`, patch);
    return data;
  },

  async removeOrderItem(orderId: number, itemId: number): Promise<Order> {
    if (CONFIG.USE_MOCK_API) return mockStore.removeOrderItem(orderId, itemId);
    const { data } = await tejabanAxios.delete<Order>(`/orders/${orderId}/items/${itemId}`);
    return data;
  },
};
