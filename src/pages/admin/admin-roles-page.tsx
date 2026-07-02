import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CONFIG } from 'src/config-global';
import { v1Get, v1Patch } from 'src/api/v1-helpers';
import { getApiErrorMessage } from 'src/utils/api-error';
import { toast } from 'react-toastify';
import { AdminDataTable, type AdminColumnDef } from 'src/components/admin/AdminDataTable';

type RoleRow = {
  id: number;
  name: string;
  protected?: boolean;
  permissions?: string[];
  dashboardVersion?: string;
};

/**
 * Panel rows aligned with the admin sidebar. API paths:
 * - /tiwater-catalog → Catálogo
 * - /tiwater-quotes → Cotizaciones
 * - /usuarios → Usuarios y Roles (misma ruta en API para /users y /roles)
 */
const TIWATER_PANEL_ROWS: { id: string; path: string; title: string; description: string }[] = [
  {
    id: 'catalog',
    path: '/tiwater-catalog',
    title: 'Catálogo',
    description: 'Productos en el panel: listado, alta, edición y baja.',
  },
  {
    id: 'quotes',
    path: '/tiwater-quotes',
    title: 'Cotizaciones',
    description: 'Cotizaciones en el panel: ver, actualizar estado y detalle.',
  },
  {
    id: 'users',
    path: '/usuarios',
    title: 'Usuarios',
    description: 'Cuentas de usuario en el panel (API /users).',
  },
  {
    id: 'roles',
    path: '/usuarios',
    title: 'Roles',
    description: 'Permisos de roles en el panel (API /roles).',
  },
];

const TIWATER_PATH_SET = new Set(TIWATER_PANEL_ROWS.map((p) => p.path));

const DASHBOARD_VERSION_LABELS: Record<string, string> = {
  v1: 'Dashboard v1',
  v2: 'Dashboard v2',
  both: 'Ambos',
};

export function AdminRolesPage() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RoleRow | null>(null);
  /** Full permissions array while dialog is open (TI Water toggles + legacy paths preserved on save) */
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await v1Get<RoleRow[]>('/roles');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'No se pudieron cargar roles'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  useEffect(() => {
    if (detail) {
      setDraftPermissions([...(detail.permissions || [])]);
    } else {
      setDraftPermissions([]);
    }
  }, [detail]);

  const openDialog = (r: RoleRow) => {
    setDetail(r);
  };

  const closeDialog = () => {
    setDetail(null);
  };

  const isProtected = Boolean(detail?.protected);

  const togglePath = (path: string) => {
    if (isProtected) return;
    setDraftPermissions((prev) => {
      const has = prev.includes(path);
      if (has) return prev.filter((p) => p !== path);
      return [...prev, path];
    });
  };

  const handleSave = async () => {
    if (!detail || isProtected) return;
    setSaving(true);
    try {
      const legacy = (detail.permissions || []).filter((p) => !TIWATER_PATH_SET.has(p));
      const tiSelected = TIWATER_PANEL_ROWS.filter((p) => draftPermissions.includes(p.path)).map(
        (p) => p.path,
      );
      const merged = [...new Set([...legacy, ...tiSelected])];
      const updated = await v1Patch<RoleRow>(`/roles/${detail.id}`, { permissions: merged });
      toast.success('Permisos actualizados');
      setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      setDetail({ ...detail, ...updated, permissions: updated.permissions ?? merged });
      setDraftPermissions([...(updated.permissions ?? merged)]);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'No se pudo guardar el rol'));
    } finally {
      setSaving(false);
    }
  };

  const columns: AdminColumnDef<RoleRow>[] = [
    { id: 'name', header: 'Nombre', cell: (r) => r.name },
    { id: 'protected', header: 'Protegido', cell: (r) => (r.protected ? 'Sí' : 'No') },
    {
      id: 'dashboard',
      header: 'Dashboard',
      cell: (r) =>
        DASHBOARD_VERSION_LABELS[r.dashboardVersion || ''] || r.dashboardVersion || '—',
    },
    {
      id: 'perms',
      header: 'Permisos TI Water',
      cell: (r) => {
        const perms = r.permissions || [];
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {TIWATER_PANEL_ROWS.filter((row) => perms.includes(row.path)).map((row) => (
              <Chip key={row.id} size="small" label={row.title} color="primary" variant="outlined" />
            ))}
            {perms.some((perm) => !TIWATER_PATH_SET.has(perm)) && (
              <Chip size="small" label="+ otros" variant="outlined" />
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <>
      <Helmet>
        <title>Roles — {CONFIG.appName}</title>
      </Helmet>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Roles
      </Typography>
      <AdminDataTable<RoleRow>
        rows={rows}
        rowId={(r) => r.id}
        columns={columns}
        loading={loading}
        getRowSearchText={(r) =>
          [r.name, r.dashboardVersion, ...(r.permissions || [])].filter(Boolean).join(' ')
        }
        searchPlaceholder="Buscar rol o permiso…"
        enableSelection={false}
        renderActions={(r) => (
          <IconButton
            size="small"
            color="primary"
            aria-label={r.protected ? 'ver permisos' : 'editar permisos'}
            onClick={() => openDialog(r)}
          >
            {r.protected ? <VisibilityIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
        )}
        emptyMessage="No hay roles"
        defaultRowsPerPage={10}
      />

      <Dialog open={Boolean(detail)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {isProtected ? 'Ver permisos' : 'Editar permisos'}: {detail?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Versión dashboard:{' '}
            <strong>
              {detail
                ? DASHBOARD_VERSION_LABELS[detail.dashboardVersion || ''] ||
                  detail.dashboardVersion ||
                  '—'
                : ''}
            </strong>
          </Typography>

          {isProtected && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Rol protegido (p. ej. admin / cliente): los permisos de este sitio no se editan aquí para
              evitar bloqueos. Otros roles sí pueden cambiarse.
            </Alert>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Acceso al panel TI Water
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Cuatro módulos del panel; Usuarios y Roles comparten el permiso{' '}
            <strong>/usuarios</strong> en la API. Las rutas heredadas de otros sistemas se conservan al
            guardar aunque no aparezcan aquí.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, maxHeight: 360, overflow: 'auto' }}>
            <FormGroup>
              {TIWATER_PANEL_ROWS.map((item) => {
                const checked = draftPermissions.includes(item.path);
                return (
                  <FormControlLabel
                    key={item.id}
                    control={
                      <Checkbox
                        checked={checked}
                        disabled={isProtected}
                        size="small"
                        onChange={() => togglePath(item.path)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.description}
                        </Typography>
                        <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.25 }}>
                          {item.path}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      mb: 1.5,
                      alignItems: 'flex-start',
                      ml: 0,
                    }}
                  />
                );
              })}
            </FormGroup>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cerrar</Button>
          {!isProtected && (
            <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <CircularProgress size={22} /> : 'Guardar permisos'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
