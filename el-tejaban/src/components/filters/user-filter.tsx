import { FormControl, InputAdornment, InputLabel, MenuItem, Select } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

type Props = {
  label: string;
  value: string;
  users: string[];
  onChange: (user: string) => void;
};

export function UserFilter({ label, value, users, onChange }: Props) {
  return (
    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }} disabled={users.length === 0}>
      <InputLabel id="user-filter-label">{label}</InputLabel>
      <Select
        labelId="user-filter-label"
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        startAdornment={
          <InputAdornment position="start">
            <PersonOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          </InputAdornment>
        }
      >
        <MenuItem value="">Todos</MenuItem>
        {users.map((user) => (
          <MenuItem key={user} value={user}>
            {user}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
