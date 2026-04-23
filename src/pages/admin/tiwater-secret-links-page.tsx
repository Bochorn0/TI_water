import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  IconButton,
  Link as MuiLink,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { CONFIG } from 'src/config-global';
import { getApiErrorMessage } from 'src/utils/api-error';
import { secretLinkService } from 'src/services/secret-link.service';
import type { SecretLinkListItem } from 'src/types/secret-link.types';
import { AdminDataTable, type AdminColumnDef } from 'src/components/admin/AdminDataTable';

function publicUrlForPath(path: string) {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

export function TiwaterSecretLinksPage() {
  const [items, setItems] = useState<SecretLinkListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [expiresLocal, setExpiresLocal] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await secretLinkService.list();
      setItems(r.items || []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Error al cargar enlaces'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (content.trim().length < 1) {
      toast.error('Escriba el mensaje o datos a proteger');
      return;
    }
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      const expiresAt =
        expiresLocal.trim() === '' ? null : new Date(expiresLocal).toISOString();
      if (expiresLocal.trim() !== '' && Number.isNaN(new Date(expiresAt || '').getTime())) {
        toast.error('Fecha de expiración no válida');
        setLoading(false);
        return;
      }
      const created = await secretLinkService.create({
        title: title.trim() || undefined,
        content: content,
        password,
        expiresAt,
      });
      const url = publicUrlForPath(created.path);
      toast.success('Enlace creado');
      try {
        await navigator.clipboard.writeText(url);
        toast.info('Enlace copiado al portapapeles');
      } catch {
        // ignore
      }
      setContent('');
      setPassword('');
      setTitle('');
      setExpiresLocal('');
      void load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Error al crear enlace'));
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (path: string) => {
    const url = publicUrlForPath(path);
    void navigator.clipboard.writeText(url);
    toast.success('Copiado');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este enlace? Ya no se podrá abrir.')) return;
    try {
      await secretLinkService.remove(id);
      toast.success('Enlace eliminado');
      void load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Error al eliminar'));
    }
  };

  const columns: AdminColumnDef<SecretLinkListItem>[] = [
    {
      id: 'title',
      header: 'Título / referencia',
      cell: (row) => row.title || '—',
    },
    {
      id: 'slug',
      header: 'Ruta',
      cell: (row) => (
        <MuiLink href={publicUrlForPath(`/e/${row.slug}`)} target="_blank" rel="noopener">
          /e/{row.slug}
        </MuiLink>
      ),
    },
    {
      id: 'created',
      header: 'Creado',
      cell: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'expires',
      header: 'Expira',
      cell: (row) => (row.expiresAt ? new Date(row.expiresAt).toLocaleString() : '—'),
    },
    {
      id: 'actions',
      header: 'Acciones',
      align: 'right',
      cell: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Copiar enlace completo">
            <IconButton size="small" onClick={() => copyUrl(`/e/${row.slug}`)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Abrir en nueva pestaña">
            <IconButton size="small" component="a" href={publicUrlForPath(`/e/${row.slug}`)} target="_blank" rel="noopener">
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Enlaces cifrados — {CONFIG.appName}</title>
      </Helmet>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Enlaces cifrados
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
          Cree un enlace <strong>https://tiwater.mx/e/…</strong> que solo se abre con la contraseña que elija. El
          mensaje se guarda cifrado (AES-256-GCM) en el servidor; comparta el enlace y la contraseña por canales
          distintos cuando sea posible.
        </Typography>

        <Box
          component="form"
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'grid',
            gap: 2,
            maxWidth: 720,
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <TextField
            label="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Credenciales staging"
            size="small"
            fullWidth
          />
          <TextField
            required
            label="Contenido protegido"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            minRows={4}
            placeholder="Texto, URLs, notas…"
            fullWidth
          />
          <TextField
            required
            type="password"
            label="Contraseña de desbloqueo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Mínimo 8 caracteres. Compártala solo con quien deba leer el contenido."
            size="small"
            fullWidth
            autoComplete="new-password"
          />
          <TextField
            type="datetime-local"
            label="Expira (opcional)"
            value={expiresLocal}
            onChange={(e) => setExpiresLocal(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Box>
            <Button type="submit" variant="contained" disabled={loading}>
              Crear enlace
            </Button>
          </Box>
        </Box>

        <AdminDataTable<SecretLinkListItem>
          title="Enlaces creados"
          rows={items}
          rowId={(r) => r.id}
          columns={columns}
          loading={loading}
          enableSelection={false}
        />
      </Box>
    </>
  );
}
