import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  DATE_RANGE_PRESETS,
  type DateRange,
  type DateRangePreset,
} from '@tejaban/utils/date-range';

type Props = {
  preset: DateRangePreset;
  customRange: DateRange;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
  standalone?: boolean;
};

const fieldSx = { minWidth: { xs: '100%', sm: 200 } };

export function DateRangeFilter({
  preset,
  customRange,
  onPresetChange,
  onCustomRangeChange,
  standalone = false,
}: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center',
        ...(standalone ? { mb: 2 } : {}),
      }}
    >
      <FormControl size="small" sx={fieldSx}>
        <InputLabel id="date-range-preset-label">Periodo</InputLabel>
        <Select
          labelId="date-range-preset-label"
          label="Periodo"
          value={preset}
          onChange={(e) => onPresetChange(e.target.value as DateRangePreset)}
          startAdornment={
            <InputAdornment position="start">
              <CalendarMonthIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          }
        >
          {DATE_RANGE_PRESETS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {preset === 'custom' && (
        <>
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={customRange.fromDate}
            onChange={(e) =>
              onCustomRangeChange({ ...customRange, fromDate: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 160 } }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={customRange.toDate}
            onChange={(e) =>
              onCustomRangeChange({ ...customRange, toDate: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 160 } }}
          />
        </>
      )}
    </Box>
  );
}
