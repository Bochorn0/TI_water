import { Box } from '@mui/material';
import { CONFIG } from '@tejaban/config-global';

type Props = {
  height?: number;
  alt?: string;
};

export function TejabanLogo({ height = 48, alt = CONFIG.appName }: Props) {
  return (
    <Box
      component="img"
      src={CONFIG.logoUrl}
      alt={alt}
      sx={{
        height,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}
