export type MenuItemType = 'item' | 'combo';

export type MenuCategory =
  | 'cahuamanta'
  | 'tacos'
  | 'paquetes'
  | 'bebidas'
  | 'clamatos';

export interface MenuItem {
  id: number;
  category: MenuCategory;
  name: string;
  description?: string;
  price: number;
  itemType: MenuItemType;
  comboIncludes?: string[];
  /** Single product image — data URL in mock; CDN URL from API when integrated */
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export type MenuItemFormData = {
  name: string;
  category: MenuCategory;
  price: number;
  itemType: MenuItemType;
  description: string;
  comboIncludes: string;
  imageUrl: string;
  isActive: boolean;
};

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  cahuamanta: 'Cahuamanta',
  tacos: 'Tacos & Flautas',
  paquetes: 'Paquetes',
  bebidas: 'Bebidas',
  clamatos: 'Clamatos',
};

export const MENU_CATEGORIES: MenuCategory[] = [
  'cahuamanta',
  'tacos',
  'paquetes',
  'bebidas',
  'clamatos',
];

export function menuItemToFormData(item?: MenuItem | null): MenuItemFormData {
  return {
    name: item?.name ?? '',
    category: item?.category ?? 'cahuamanta',
    price: item?.price ?? 0,
    itemType: item?.itemType ?? 'item',
    description: item?.description ?? '',
    comboIncludes: item?.comboIncludes?.join(', ') ?? '',
    imageUrl: item?.imageUrl ?? '',
    isActive: item?.isActive ?? true,
  };
}

export function formDataToMenuPayload(data: MenuItemFormData, sortOrder: number): Omit<MenuItem, 'id'> {
  const comboIncludes =
    data.itemType === 'combo' && data.comboIncludes.trim()
      ? data.comboIncludes.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

  return {
    name: data.name.trim(),
    category: data.category,
    price: data.price,
    itemType: data.itemType,
    description: data.description.trim() || undefined,
    comboIncludes,
    imageUrl: data.imageUrl.trim() || undefined,
    sortOrder,
    isActive: data.isActive,
  };
}
