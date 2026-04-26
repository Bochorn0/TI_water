// src/types/product.types.ts
// TypeScript types for TI Water products

import type { CatalogProductSpecifications } from './catalog-spec.types';

export enum ProductCategory {
  GENERAL = 'general',
  PRESURIZADORES = 'presurizadores',
  VALVULAS_SISTEMAS = 'valvulas_sistemas',
  SUMERGIBLES = 'sumergibles',
  PLOMERIA = 'plomeria',
}

export interface Product {
  id: number;
  /** TIW + tipo (3 letras) + 001…999, p. ej. TIWVAL001 */
  productKey?: string | null;
  code: string;
  name: string;
  description?: string;
  category?: ProductCategory | string;
  price?: number;
  specifications?: CatalogProductSpecifications | Record<string, unknown>;
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
