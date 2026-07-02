import { Box } from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

type Props = {
  src?: string | null;
  alt: string;
  aspectRatio?: string;
  height?: number | string;
  width?: number | string;
  rounded?: boolean;
};

export function MenuItemImage({
  src,
  alt,
  aspectRatio = '4 / 3',
  height,
  width = '100%',
  rounded = true,
}: Props) {
  return (
    <Box
      sx={{
        width,
        height: height ?? 'auto',
        aspectRatio: height ? undefined : aspectRatio,
        bgcolor: 'action.hover',
        borderRadius: rounded ? 2 : 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <RestaurantMenuIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5 }} />
      )}
    </Box>
  );
}
