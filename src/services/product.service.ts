// src/services/product.service.ts
// Service for TI Water products API calls

import { get } from 'src/api/axiosHelper';
import type { Product, ProductFilters, ProductResponse } from 'src/types/product.types';

export const productService = {
  getAll: async (filters?: ProductFilters): Promise<ProductResponse> => {
    const response = await get<ProductResponse>('/products', filters);
    return response;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await get<Product>(`/products/${id}`);
    return response;
  },

  getByCode: async (code: string): Promise<Product> => {
    const response = await get<Product>(`/products/code/${code}`);
    return response;
  },

  getStats: async (): Promise<any> => {
    const response = await get('/products/stats');
    return response;
  },
};
