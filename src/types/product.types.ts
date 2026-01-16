// src/types/product.types.ts
// TypeScript types for TI Water products

export enum ProductCategory {
  GENERAL = 'general',
  PRESURIZADORES = 'presurizadores',
  VALVULAS_SISTEMAS = 'valvulas_sistemas',
  SUMERGIBLES = 'sumergibles',
  PLOMERIA = 'plomeria',
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: ProductCategory | string;
  price?: number;
  specifications?: Record<string, any>;
  images?: string[];
  catalogSource?: string;
  pageNumber?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  isActive?: boolean;
  catalogSource?: string;
  limit?: number;
  offset?: number;
}

export interface ProductResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
