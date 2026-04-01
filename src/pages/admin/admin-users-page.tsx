import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Typography, Chip } from '@mui/material';
import { CONFIG } from 'src/config-global';
import { v1Get } from 'src/api/v1-helpers';
import { getApiErrorMessage } from 'src/utils/api-error';
import { toast } from 'react-toastify';
import { AdminDataTable, type AdminColumnDef } from 'src/components/admin/AdminDataTable';

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
      <Typography variant="h6" sx={{ mb: 2 }}>
        Usuarios
      </Typography>
      <AdminDataTable<Row>
        rows={rows}
        rowId={(r) => r.id}
        columns={columns}
        loading={loading}
        getRowSearchText={(r) => [r.email, r.nombre, r.role_name, r.status].filter(Boolean).join(' ')}
        searchPlaceholder="Buscar usuario…"
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
    </>
  );
}
