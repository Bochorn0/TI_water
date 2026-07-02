import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import { CONFIG } from 'src/config-global';
import { useAuth } from 'src/auth/auth-context';
import { v1Patch } from 'src/api/v1-helpers';
import type { AuthUser } from 'src/auth/auth-types';
import { getApiErrorMessage } from 'src/utils/api-error';
import { toast } from 'react-toastify';

export function AdminSettingsPage() {
  const { user, setUser } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [puesto, setPuesto] = useState(user?.puesto || '');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre || '');
      setPuesto(user.puesto || '');
    }
  }, [user]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      void (async () => {
        const avatar = reader.result as string;
        try {
          const { user: u } = await v1Patch<{ user: AuthUser }>('/auth/me', { avatar });
          setUser(u);
          toast.success('Foto actualizada');
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Error al subir imagen'));
        }
      })();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (pwd && pwd !== pwd2) {
      toast.warning('Las contraseñas nuevas no coinciden');
      return;
    }
    if (pwd && pwd.length < 5) {
      toast.warning('La contraseña debe tener al menos 5 caracteres');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        nombre: nombre.trim(),
        puesto: puesto.trim(),
      };
      if (pwd) {
        body.password = pwd;
        body.currentPassword = currentPwd;
      }
      const { user: u } = await v1Patch<{ user: AuthUser }>('/auth/me', body);
      setUser(u);
      setPwd('');
      setPwd2('');
      setCurrentPwd('');
      setNombre(u.nombre || '');
      setPuesto(u.puesto || '');
      toast.success('Cuenta actualizada');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Mi cuenta — {CONFIG.appName}</title>
      </Helmet>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Cuenta y perfil
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            src={user.avatar?.startsWith('data:') || user.avatar?.startsWith('http') ? user.avatar : undefined}
            sx={{ width: 72, height: 72 }}
          >
            {(user.nombre || user.email)[0]?.toUpperCase()}
          </Avatar>
          <Button variant="outlined" component="label" size="small">
            Cambiar foto
            <input type="file" accept="image/*" hidden onChange={handleAvatar} />
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user.email}
        </Typography>
        <TextField
          label="Nombre"
          fullWidth
          margin="normal"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <TextField
          label="Puesto"
          fullWidth
          margin="normal"
          value={puesto}
          onChange={(e) => setPuesto(e.target.value)}
        />
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" gutterBottom>
          Cambiar contraseña (opcional)
        </Typography>
        <TextField
          label="Contraseña actual"
          type="password"
          fullWidth
          margin="dense"
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
          autoComplete="current-password"
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          fullWidth
          margin="dense"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete="new-password"
        />
        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          fullWidth
          margin="dense"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          autoComplete="new-password"
        />
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => void handleSave()} disabled={saving}>
          Guardar cambios
        </Button>
      </Paper>
    </>
  );
}
