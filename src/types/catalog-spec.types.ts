/**
 * `specifications` JSON stored on `tiwater_products` (import from product.json).
 */
export type TechnicalComparisonTable = {
  title?: string;
  columns?: string[] | null;
  rows?: Array<{
    attribute: string;
    values: string[];
  }>;
  rawExtraction?: string;
  /** Aviso legal bajo la tabla (p. ej. AQT-56 en product.json) */
  legalNote?: string;
};

export type CatalogProductSpecifications = {
  subtitle?: string;
  highlights?: string[];
  source?: { file?: string; pdfPage?: number; catalogSectionFooter?: string; page?: number };
  technicalComparisonTable?: TechnicalComparisonTable;
  productKey?: string;
  productType?: string;
};
