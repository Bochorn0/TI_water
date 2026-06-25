import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '@tejaban/auth/auth-context';
import { TejabanLogo } from '@tejaban/components/tejaban-logo';
import { CONFIG } from '@tejaban/config-global';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('..', { relative: 'path' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #0B4F8C 0%, #1A7BC4 50%, #00BCD4 100%)',
        px: 2,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <TejabanLogo height={160} maxWidth={360} />
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
              {CONFIG.slogan}
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Usa tu cuenta de TI Water (mismo usuario que tiwater.mx). Roles: <strong>admin</strong> o{' '}
              <strong>mesero</strong>.
            </Alert>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Correo TI Water"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                autoComplete="username"
              />
              <TextField
                label="Contraseña"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                autoComplete="current-password"
              />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
