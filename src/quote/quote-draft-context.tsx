import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Product } from 'src/types/product.types';
import type { QuoteItem } from 'src/types/quote.types';

const STORAGE_KEY = 'tiwater_quote_draft_v1';

function catalogLineQuantity(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function readStorage(): QuoteItem[] {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as QuoteItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function productToLine(product: Product): QuoteItem {
  return {
    productId: product.id,
    lineKind: 'product',
    product: {
      code: product.code,
      name: product.name,
      description: product.description,
      category: product.category,
      images: product.images,
    },
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
    notes: '',
  };
}

type QuoteDraftContextValue = {
  items: QuoteItem[];
  setItems: (value: SetStateAction<QuoteItem[]>) => void;
  addProduct: (product: Product) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: 'quantity' | 'notes', value: number | string) => void;
  clear: () => void;
  itemCount: number;
  totalUnits: number;
};

const QuoteDraftContext = createContext<QuoteDraftContextValue | null>(null);

export function QuoteDraftProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>(() => readStorage());

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addProduct = useCallback((product: Product) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, productToLine(product)];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, j) => j !== index));
  }, []);

  const updateItem = useCallback((index: number, field: 'quantity' | 'notes', value: number | string) => {
    setItems((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      if (field === 'quantity') next[index] = { ...next[index], quantity: catalogLineQuantity(value) };
      if (field === 'notes') next[index] = { ...next[index], notes: String(value) };
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<QuoteDraftContextValue>(() => {
    const itemCount = items.length;
    const totalUnits = items.reduce((s, l) => s + (l.quantity || 0), 0);
    return {
      items,
      setItems,
      addProduct,
      removeItem,
      updateItem,
      clear,
      itemCount,
      totalUnits,
    };
  }, [items, setItems, addProduct, removeItem, updateItem, clear]);

  return <QuoteDraftContext.Provider value={value}>{children}</QuoteDraftContext.Provider>;
}

export function useQuoteDraft() {
  const ctx = useContext(QuoteDraftContext);
  if (!ctx) throw new Error('useQuoteDraft must be used within QuoteDraftProvider');
  return ctx;
}

export function useQuoteDraftOptional() {
  return useContext(QuoteDraftContext);
}
