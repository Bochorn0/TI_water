// src/types/quote.types.ts
// TypeScript types for TI Water quotes

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface QuoteItem {
  id?: number;
  productId: number;
  product?: {
    code: string;
    name: string;
    description?: string;
    category?: string;
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
