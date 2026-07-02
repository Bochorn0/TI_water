import { Box, Typography, alpha } from '@mui/material';
import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: Props) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center',
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          mx: 'auto',
          mb: 2,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
          '& svg': { fontSize: 28 },
        }}
      >
        {icon}
      </Box>
      <Typography fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: 'auto' }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
