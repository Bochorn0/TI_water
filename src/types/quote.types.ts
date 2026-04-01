// src/types/quote.types.ts
// TypeScript types for TI Water quotes

export enum QuoteStatus {
  PENDIENTE = 'pendiente',
  ENVIADA = 'enviada',
}

export interface QuoteItem {
  id?: number;
  productId: number;
  product?: {
    code: string;
    name: string;
    description?: string;
    category?: string;
    /** First entry is used as thumbnail in admin quote modal */
    images?: string[];
  };
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
  notes?: string;
}

export interface Quote {
  id?: number;
  quoteNumber?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  items: QuoteItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  validUntil?: string;
  status: QuoteStatus | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteResponse {
  quotes: Quote[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
