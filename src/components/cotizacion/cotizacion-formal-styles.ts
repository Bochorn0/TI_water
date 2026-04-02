import type { SxProps, Theme } from '@mui/material/styles';

export const docPaperSx: SxProps<Theme> = {
  bgcolor: '#fff',
  color: '#1a1a1a',
  border: '1px solid #cfd8dc',
  fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
};

export const docTitleSx: SxProps<Theme> = {
  fontWeight: 700,
  letterSpacing: '0.06em',
  fontSize: '1.35rem',
  textAlign: 'center',
  my: 1,
};

export const docTableHeadSx: SxProps<Theme> = {
  backgroundColor: '#eceff1',
  '& th': {
    fontWeight: 700,
    fontSize: '0.7rem',
    letterSpacing: '0.04em',
    border: '1px solid #b0bec5',
    py: 1,
    px: 0.75,
  },
};

export const docTableCellSx: SxProps<Theme> = {
  border: '1px solid #cfd8dc',
  fontSize: '0.8125rem',
  py: 0.75,
  px: 0.75,
  verticalAlign: 'top',
};

export const folioBoxSx: SxProps<Theme> = {
  border: '2px solid #1565c0',
  p: 1.5,
  minWidth: 200,
  backgroundColor: '#fafafa',
};
