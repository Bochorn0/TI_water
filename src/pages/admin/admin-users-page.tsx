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
} from '@mui/material';
import { CONFIG } from 'src/config-global';
import { v1Get } from 'src/api/v1-helpers';
import { getApiErrorMessage } from 'src/utils/api-error';
import { toast } from 'react-toastify';

type Row = {
  id: number;
  email: string;
  nombre?: string;
  role_name?: string;
  status?: string;
};

export function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await v1Get<Row[]>('/users');
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'No se pudieron cargar usuarios'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Helmet>
        <title>Usuarios — {CONFIG.appName}</title>
      </Helmet>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Usuarios
      </Typography>
      <TableContainer component={Paper}>
        {loading ? (
          <CircularProgress sx={{ m: 4 }} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.nombre || '—'}</TableCell>
                  <TableCell>{r.role_name || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status || '—'} />
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
