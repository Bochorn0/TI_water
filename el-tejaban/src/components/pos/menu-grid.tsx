import { Box, CircularProgress, Grid } from '@mui/material';
import type { MenuCategory, MenuItem } from '@tejaban/types/menu.types';
import { CategoryTabs } from './category-tabs';
import { MenuItemCard } from './menu-item-card';

type Props = {
  items: MenuItem[];
  category: MenuCategory;
  loading?: boolean;
  onCategoryChange: (category: MenuCategory) => void;
  onSelectItem: (item: MenuItem) => void;
};

export function MenuGrid({ items, category, loading, onCategoryChange, onSelectItem }: Props) {
  const filtered = items.filter((i) => i.category === category && i.isActive);

  return (
    <Box>
      <CategoryTabs value={category} onChange={onCategoryChange} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {filtered.map((item) => (
            <Grid item xs={6} sm={4} md={4} lg={3} key={item.id}>
              <MenuItemCard item={item} onSelect={onSelectItem} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
