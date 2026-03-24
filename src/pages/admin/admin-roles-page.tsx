import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip,
  Box,
} from '@mui/material';
import { CONFIG } from 'src/config-global';
import { v1Get } from 'src/api/v1-helpers';
import { getApiErrorMessage } from 'src/utils/api-error';
import { toast } from 'react-toastify';

type RoleRow = {
  id: number;
  name: string;
  protected?: boolean;
  permissions?: string[];
  dashboardVersion?: string;
};

export function AdminRolesPage() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Helmet>
        <title>Roles — {CONFIG.appName}</title>
      </Helmet>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Roles
      </Typography>
      <TableContainer component={Paper}>
        {loading ? (
          <CircularProgress sx={{ m: 4 }} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Protegido</TableCell>
                <TableCell>Dashboard</TableCell>
                <TableCell>Permisos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.protected ? 'Sí' : 'No'}</TableCell>
                  <TableCell>{r.dashboardVersion || '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(r.permissions || []).slice(0, 12).map((p) => (
                        <Chip key={p} size="small" label={p} variant="outlined" />
                      ))}
                      {(r.permissions || []).length > 12 && (
                        <Chip size="small" label={`+${(r.permissions || []).length - 12}`} />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </>
  );
}
