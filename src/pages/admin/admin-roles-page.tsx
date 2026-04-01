import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CONFIG } from 'src/config-global';
import { v1Get } from 'src/api/v1-helpers';
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

/** Friendly labels for TI Water + shared paths (Aquatech-style clarity in detail view) */
const PERMISSION_LABELS: Record<string, string> = {
  '/': 'Acceso general (API base)',
  '/dashboard': 'Dashboard (menú padre)',
  '/dashboard/v1': 'Dashboard v1',
  '/dashboard/v2': 'Dashboard v2',
  '/usuarios': 'Usuarios y roles',
  '/tiwater-catalog': 'Catálogo TI Water',
  '/tiwater-quotes': 'Cotizaciones TI Water',
  '/equipos': 'Equipos',
  '/controladores': 'Controladores',
  '/puntoVenta': 'Puntos de venta (padre)',
  '/puntoVenta/v1': 'Puntos de venta v1',
  '/puntoVenta/v2': 'Puntos de venta v2',
  '/personalizacion': 'Personalización (padre)',
  '/personalizacion/v1': 'Personalización v1',
  '/personalizacion/v2': 'Personalización v2',
};

const DASHBOARD_VERSION_LABELS: Record<string, string> = {
  v1: 'Dashboard v1',
  v2: 'Dashboard v2',
  both: 'Ambos',
};

function labelForPermission(path: string): string {
  return PERMISSION_LABELS[path] || path;
}

export function AdminRolesPage() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RoleRow | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await v1Get<RoleRow[]>('/roles');
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'No se pudieron cargar roles'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allKnownPaths = Object.keys(PERMISSION_LABELS);
  const detailPaths = detail
    ? [...new Set([...allKnownPaths, ...(detail.permissions || [])])].sort((a, b) => a.localeCompare(b))
    : [];

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
      header: 'Permisos',
      cell: (r) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(r.permissions || []).slice(0, 8).map((p) => (
            <Chip key={p} size="small" label={p} variant="outlined" />
          ))}
          {(r.permissions || []).length > 8 && (
            <Chip size="small" label={`+${(r.permissions || []).length - 8}`} />
          )}
        </Box>
      ),
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
            aria-label="ver detalle de permisos"
            onClick={() => setDetail(r)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        )}
        emptyMessage="No hay roles"
        defaultRowsPerPage={10}
      />

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>Rol: {detail?.name}</DialogTitle>
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
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Permisos (menú y API)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Misma idea que en Aquatech: cada permiso controla visibilidad y acceso a rutas. Solo lectura
            aquí; la edición de roles se gestiona desde el API o futuras pantallas de edición.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 360, overflow: 'auto' }}>
            <FormGroup>
              {detailPaths.map((path) => {
                const checked = (detail?.permissions || []).includes(path);
                const isSub = path.includes('/v1') || path.includes('/v2');
                return (
                  <FormControlLabel
                    key={path}
                    control={<Checkbox checked={checked} disabled size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2">{labelForPermission(path)}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {path}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      mb: 0.5,
                      alignItems: 'flex-start',
                      ml: 0,
                      pl: isSub ? 2 : 0,
                      borderLeft: isSub ? '2px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  />
                );
              })}
            </FormGroup>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
