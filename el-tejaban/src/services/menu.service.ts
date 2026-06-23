import { CONFIG } from '@tejaban/config-global';
import { mockStore } from '@tejaban/mock/mock-store';
import { tejabanAxios } from '@tejaban/api/axiosInstance';
import type { MenuItem } from '@tejaban/types/menu.types';

function mapProduct(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as number,
    category: row.category as MenuItem['category'],
    name: row.name as string,
    description: row.description as string | undefined,
    price: row.price as number,
    itemType: (row.itemType || row.item_type || 'item') as MenuItem['itemType'],
    comboIncludes: (row.comboIncludes || row.combo_includes) as string[] | undefined,
    imageUrl: (row.imageUrl || row.image_url) as string | undefined,
    sortOrder: (row.sortOrder ?? row.sort_order ?? 0) as number,
    isActive: (row.isActive ?? row.is_active ?? true) as boolean,
  };
}

export const menuService = {
  async getMenu(): Promise<MenuItem[]> {
    if (CONFIG.USE_MOCK_API) return mockStore.getMenu();
    const { data } = await tejabanAxios.get<{ items: Record<string, unknown>[] }>('/products', {
      params: { active: true },
    });
    return data.items.map(mapProduct);
  },

  async getAllMenuItems(): Promise<MenuItem[]> {
    if (CONFIG.USE_MOCK_API) return mockStore.getAllMenuItems();
    const { data } = await tejabanAxios.get<{ items: Record<string, unknown>[] }>('/products');
    return data.items.map(mapProduct);
  },

  async updateMenuItem(id: number, patch: Partial<MenuItem>): Promise<MenuItem> {
    if (CONFIG.USE_MOCK_API) return mockStore.updateMenuItem(id, patch);
    const { data } = await tejabanAxios.patch<Record<string, unknown>>(`/products/${id}`, patch);
    return mapProduct(data);
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    if (CONFIG.USE_MOCK_API) return mockStore.createMenuItem(item);
    const { data } = await tejabanAxios.post<Record<string, unknown>>('/products', item);
    return mapProduct(data);
  },

  async deleteMenuItem(id: number): Promise<void> {
    if (CONFIG.USE_MOCK_API) return mockStore.deleteMenuItem(id);
    await tejabanAxios.delete(`/products/${id}`);
  },
};
