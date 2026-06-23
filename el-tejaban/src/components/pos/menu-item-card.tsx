import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { MenuItemImage } from '@tejaban/components/menu/menu-item-image';
import type { MenuItem } from '@tejaban/types/menu.types';
import { formatCurrency } from '@tejaban/utils/format';

type Props = {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
};

export function MenuItemCard({ item, onSelect }: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: 1,
        borderColor: 'divider',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:active': { transform: 'scale(0.97)' },
        overflow: 'hidden',
      }}
    >
      <CardActionArea
        onClick={() => onSelect(item)}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 0 }}
      >
        <MenuItemImage src={item.imageUrl} alt={item.name} aspectRatio="16 / 10" rounded={false} />

        <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
          <BoxHeader item={item} />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5, fontSize: { xs: '0.95rem', sm: '1rem' } }}
          >
            {item.name}
          </Typography>
          {item.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 1,
              }}
            >
              {item.description}
            </Typography>
          )}
          <Chip
            label={formatCurrency(item.price)}
            size="medium"
            sx={{
              bgcolor: 'error.main',
              color: '#FFEB3B',
              fontWeight: 800,
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              height: 36,
            }}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function BoxHeader({ item }: { item: MenuItem }) {
  if (item.itemType !== 'combo') return null;
  return (
    <Chip
      icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
      label="Paquete"
      size="small"
      color="secondary"
      sx={{ mb: 1, height: 24 }}
    />
  );
}
