import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import '@fontsource-variable/dm-sans';

/** El Tejaban brand — ocean blue from physical menu */
const theme = createTheme({
  palette: {
    primary: {
      main: '#0B4F8C',
      light: '#1A7BC4',
      dark: '#073562',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00BCD4',
      light: '#62EFFF',
      dark: '#008BA3',
    },
    error: {
      main: '#E53935',
    },
    warning: {
      main: '#FFB300',
    },
    success: {
      main: '#43A047',
    },
    background: {
      default: '#E8F4FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#5A6B7D',
    },
  },
  typography: {
    fontFamily: '"DM Sans Variable", "Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 600, fontSize: '1rem' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 12,
          padding: '12px 20px',
        },
        sizeLarge: {
          minHeight: 56,
          fontSize: '1.05rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { minWidth: 48, minHeight: 48 },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 72,
          paddingTop: 8,
          '&.Mui-selected': { fontSize: '0.85rem' },
        },
        label: { fontSize: '0.75rem', '&.Mui-selected': { fontSize: '0.8rem' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
