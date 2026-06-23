import { CONFIG } from '@tejaban/config-global';
import { mockStore } from '@tejaban/mock/mock-store';
import { tejabanAxios } from '@tejaban/api/axiosInstance';
import type { CreatePaymentPayload, DailySummary, Payment } from '@tejaban/types/payment.types';
import type { Order } from '@tejaban/types/order.types';

export const paymentService = {
  async getPayments(filters?: { today?: boolean }): Promise<Payment[]> {
    if (CONFIG.USE_MOCK_API) return mockStore.getPayments(filters);
    const { data } = await tejabanAxios.get<{ payments: Payment[] }>('/payments', {
      params: filters,
    });
    return data.payments;
  },

  async createPayment(
    orderId: number,
    payload: CreatePaymentPayload,
  ): Promise<{ payment: Payment; order: Order }> {
    if (CONFIG.USE_MOCK_API) {
      const { getStoredUser } = await import('./auth.service');
      const user = getStoredUser();
      return mockStore.createPayment(orderId, {
        ...payload,
        recordedBy: user?.nombre ?? 'Staff',
      });
    }
    const { data } = await tejabanAxios.post<{ payment: Payment; order: Order }>(
      `/orders/${orderId}/payments`,
      payload,
    );
    return data;
  },

  async getDailySummary(date?: string): Promise<DailySummary> {
    if (CONFIG.USE_MOCK_API) return mockStore.getDailySummary(date);
    const { data } = await tejabanAxios.get<DailySummary>('/reports/daily');
    return data;
  },
};
