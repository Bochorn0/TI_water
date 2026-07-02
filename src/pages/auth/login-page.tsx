import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { CONFIG } from 'src/config-global';
import { useAuth } from 'src/auth/auth-context';
import { getApiErrorMessage } from 'src/utils/api-error';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string } | undefined;
  const from =
    state?.from && state.from.startsWith('/') && !state.from.startsWith('/login')
      ? state.from
      : '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin — {CONFIG.appName}</title>
      </Helmet>
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Card elevation={4}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Acceso administrador
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Catálogo TI Water (mock: admin@tiwater.mx). Ejecuta{' '}
              <code>node scripts/seed-admin-user.js</code> en el API si aún no existe el usuario.
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Correo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </Button>
            </Box>
            <Button component={Link} to="/" fullWidth sx={{ mt: 2 }}>
              Volver al sitio
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
