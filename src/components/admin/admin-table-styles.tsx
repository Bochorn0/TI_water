import { styled } from '@mui/material/styles';
import { Tab, Tabs, TableRow, TableCell, TableContainer } from '@mui/material';

/** Aquatech-style pill tabs, using TI Water primary palette */
export const AdminCustomTabs = styled(Tabs)({
  backgroundColor: '#fff',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  padding: '4px',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
});

export const AdminCustomTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '16px',
  borderRadius: '8px',
  padding: '10px 16px',
  transition: 'all 0.3s ease',
  '&.Mui-selected': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    color: '#fff',
    boxShadow: `0px 3px 6px ${theme.palette.primary.main}40`,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const StyledTableContainer = styled(TableContainer)({
  borderRadius: '12px',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
});

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

export const StyledTableCell = styled(TableCell)({
  padding: '12px',
  fontSize: '14px',
});

export const StyledTableCellHeader = styled(TableCell)({
  padding: '12px',
  fontSize: '14px',
  fontWeight: 700,
});
