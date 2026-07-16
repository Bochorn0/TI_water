import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { CONFIG } from 'src/config-global';
import { v1Get, v1Patch, v1Post } from 'src/api/v1-helpers';
import { getApiErrorMessage } from 'src/utils/api-error';
import { toast } from 'react-toastify';
import { AdminDataTable, type AdminColumnDef } from 'src/components/admin/AdminDataTable';

type Row = {
  id: number;
  email: string;
  nombre?: string;
  role_id?: number;
  role_name?: string;
  status?: string;
};

type RoleOption = {
  id: number;
  name: string;
};

type UserForm = {
  id: number | null;
  nombre: string;
  email: string;
  password: string;
  role_id: string;
  status: 'active' | 'pending' | 'inactive';
};

const emptyForm = (): UserForm => ({
  id: null,
  nombre: '',
  email: '',
  password: '',
  role_id: '',
  status: 'active',
});

export function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEdit = form.id != null;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await v1Get<Row[]>('/users');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'No se pudieron cargar usuarios'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await v1Get<RoleOption[]>('/roles');
        setRoles(Array.isArray(data) ? data : []);
      } catch {
        // Roles are only needed in the dialog; surface error on submit if still empty
      }
    })();
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: Row) => {
    const status =
      row.status === 'pending' || row.status === 'inactive' ? row.status : 'active';
    setForm({
      id: row.id,
      nombre: row.nombre || '',
      email: row.email || '',
      password: '',
      role_id: row.role_id != null ? String(row.role_id) : '',
      status,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleChange =
    (field: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async () => {
    const email = form.email.trim();
    const password = form.password.trim();
    const nombre = form.nombre.trim();

    if (!isEdit && !email) {
      toast.error('El correo es obligatorio');
      return;
    }
    if (!isEdit && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (isEdit && password && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!form.role_id) {
      toast.error('Selecciona un rol');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && form.id != null) {
        const payload: Record<string, unknown> = {
          nombre,
          role_id: Number(form.role_id),
          status: form.status,
        };
        if (password) payload.password = password;
        await v1Patch<Row>(`/users/${form.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await v1Post<Row>('/users', {
          email,
          password,
          nombre,
          role_id: Number(form.role_id),
          status: form.status === 'inactive' ? 'pending' : form.status,
        });
        toast.success('Usuario creado');
      }
      setDialogOpen(false);
      setForm(emptyForm());
      await loadUsers();
    } catch (e) {
      toast.error(
        getApiErrorMessage(e, isEdit ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario'),
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: AdminColumnDef<Row>[] = [
    { id: 'email', header: 'Email', cell: (r) => r.email },
    { id: 'nombre', header: 'Nombre', cell: (r) => r.nombre || '—' },
    { id: 'role', header: 'Rol', cell: (r) => r.role_name || '—' },
    {
      id: 'status',
      header: 'Estado',
      cell: (r) => <Chip size="small" label={r.status || '—'} />,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Usuarios — {CONFIG.appName}</title>
      </Helmet>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography variant="h6">Usuarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Añadir usuario
        </Button>
      </Box>
      <AdminDataTable<Row>
        rows={rows}
        rowId={(r) => r.id}
        columns={columns}
        loading={loading}
        getRowSearchText={(r) => [r.email, r.nombre, r.role_name, r.status].filter(Boolean).join(' ')}
        searchPlaceholder="Buscar usuario…"
        renderActions={(r) => (
          <IconButton size="small" color="primary" aria-label="editar usuario" onClick={() => openEdit(r)}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        bulkActions={[
          {
            key: 'copy',
            label: 'Copiar emails',
            variant: 'outlined',
            color: 'primary',
            onExecute: async (selected) => {
              const text = selected.map((u) => u.email).join('\n');
              try {
                await navigator.clipboard.writeText(text);
                toast.success(`${selected.length} correo(s) copiados al portapapeles`);
              } catch {
                toast.error('No se pudo copiar al portapapeles');
              }
            },
          },
        ]}
        emptyMessage="No hay usuarios"
        defaultRowsPerPage={10}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={handleChange('nombre')}
              fullWidth
              autoFocus
            />
            <TextField
              label="Correo"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              fullWidth
              required={!isEdit}
              disabled={isEdit}
              helperText={isEdit ? 'El correo no se puede cambiar' : undefined}
            />
            <TextField
              label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              fullWidth
              required={!isEdit}
              helperText={isEdit ? 'Dejar vacío para no cambiarla (mín. 6 si la cambias)' : 'Mínimo 6 caracteres'}
            />
            <TextField
              select
              label="Rol"
              value={form.role_id}
              onChange={handleChange('role_id')}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            >
              {roles.length === 0 ? (
                <MenuItem value="" disabled>
                  No hay roles disponibles
                </MenuItem>
              ) : (
                roles.map((role) => (
                  <MenuItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </MenuItem>
                ))
              )}
            </TextField>
            <TextField
              select
              label="Estado"
              value={form.status}
              onChange={handleChange('status')}
              fullWidth
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              {isEdit && <MenuItem value="inactive">Inactivo</MenuItem>}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
