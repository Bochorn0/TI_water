import { Box } from '@mui/material';
import logoSrc from '@tejaban/assets/logo.png';

type Props = {
  height?: number;
  maxWidth?: number | string;
  /** Light rounded frame — helps the logo read on colored headers */
  framed?: boolean;
};

export function TejabanLogo({ height = 48, maxWidth = 220, framed = false }: Props) {
  const image = (
    <Box
      component="img"
      src={logoSrc}
      alt="El Tejaban — Mariscos, Taco Fish, Cahuamanta"
      sx={{
        height,
        maxWidth,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );

  if (!framed) return image;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        bgcolor: 'rgba(255,255,255,0.95)',
        borderRadius: 1.5,
        px: 1,
        py: 0.5,
        boxShadow: 1,
      }}
    >
      {image}
    </Box>
  );
}
