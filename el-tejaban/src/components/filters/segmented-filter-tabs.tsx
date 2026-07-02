import { Box, Chip, Typography, alpha, useTheme } from '@mui/material';

export type SegmentedTab<T extends string> = {
  label: string;
  value: T;
  count?: number;
};

type Props<T extends string> = {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedFilterTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        p: 0.75,
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.08),
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Box
            key={tab.value}
            component="button"
            type="button"
            onClick={() => onChange(tab.value)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 1,
              border: '1px solid',
              borderColor: selected ? 'primary.main' : 'transparent',
              borderRadius: 2,
              bgcolor: selected ? 'background.paper' : 'transparent',
              boxShadow: selected ? '0 1px 4px rgba(11, 79, 140, 0.12)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              font: 'inherit',
              '&:hover': {
                bgcolor: selected ? 'background.paper' : alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={selected ? 700 : 600}
              color={selected ? 'primary.main' : 'text.secondary'}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </Typography>
            {tab.count !== undefined && (
              <Chip
                size="small"
                label={tab.count}
                sx={{
                  height: 22,
                  minWidth: 28,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  bgcolor: selected
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.text.secondary, 0.1),
                  color: selected ? 'primary.main' : 'text.secondary',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
