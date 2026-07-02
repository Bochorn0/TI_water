import { Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import type { MenuCategory } from '@tejaban/types/menu.types';
import { MENU_CATEGORY_LABELS, MENU_CATEGORIES } from '@tejaban/types/menu.types';

type Props = {
  value: MenuCategory;
  onChange: (category: MenuCategory) => void;
};

export function CategoryTabs({ value, onChange }: Props) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Tabs
      value={value}
      onChange={(_, v) => onChange(v)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{
        mb: 2,
        minHeight: 48,
        '& .MuiTab-root': {
          minHeight: 48,
          minWidth: isSmall ? 100 : 120,
          fontWeight: 600,
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
        },
      }}
    >
      {MENU_CATEGORIES.map((cat) => (
        <Tab key={cat} label={MENU_CATEGORY_LABELS[cat]} value={cat} />
      ))}
    </Tabs>
  );
}
