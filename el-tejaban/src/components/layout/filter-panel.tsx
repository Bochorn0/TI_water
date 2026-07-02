import { Paper } from '@mui/material';
import type { ReactNode } from 'react';

export function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(11, 79, 140, 0.06)',
      }}
    >
      {children}
    </Paper>
  );
}
