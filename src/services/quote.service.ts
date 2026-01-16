// src/services/quote.service.ts
// Service for TI Water quotes API calls

import { get, post } from 'src/api/axiosHelper';
import type { Quote, QuoteResponse } from 'src/types/quote.types';

export const quoteService = {
  create: async (quote: Quote): Promise<Quote> => {
    const response = await post<Quote>('/quotes', quote);
    return response;
  },

  getAll: async (filters?: {
    status?: string;
    clientName?: string;
    limit?: number;
    offset?: number;
  }): Promise<QuoteResponse> => {
    const response = await get<QuoteResponse>('/quotes', filters);
    return response;
  },

  getById: async (id: number): Promise<Quote> => {
    const response = await get<Quote>(`/quotes/${id}`);
    return response;
  },
};
