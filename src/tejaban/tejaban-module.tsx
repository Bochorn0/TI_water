import { Component, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@tejaban/theme/theme-provider';
import { AuthProvider } from '@tejaban/auth/auth-context';
import '@tejaban/global.css';

class TejabanErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3, maxWidth: 480, mx: 'auto', mt: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            No se pudo cargar El Tejaban: {this.state.error.message}
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function TejabanBootScreen() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50dvh' }}>
      <CircularProgress />
    </Box>
  );
}

/** El Tejaban shell — providers + child routes via <Outlet /> at /el-tejaban */
export function TejabanShell() {
  return (
    <TejabanErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </ThemeProvider>
    </TejabanErrorBoundary>
  );
}

export { TejabanBootScreen };
