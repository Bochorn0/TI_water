import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { CONFIG } from 'src/config-global';
import { secretLinkService } from 'src/services/secret-link.service';
import type { PublicSecretLinkMeta } from 'src/types/secret-link.types';
import { getApiErrorMessage } from 'src/utils/api-error';
import { Header } from 'src/components/header/header';

const SITE_HEADER_OFFSET_PX = 100;

export function SecretLinkPage() {
  const { slug } = useParams<{ slug: string }>();
  const [meta, setMeta] = useState<PublicSecretLinkMeta | null>(null);
  const [metaState, setMetaState] = useState<'load' | 'ok' | 'notfound' | 'gone'>('load');
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setMetaState('notfound');
      return;
    }
    let cancel = false;
    setMetaState('load');
    void secretLinkService
      .getPublicMeta(slug)
      .then((m) => {
        if (cancel) return;
        setMeta(m);
        setMetaState('ok');
      })
      .catch((e: { response?: { status?: number } }) => {
        if (cancel) return;
        if (e?.response?.status === 410) setMetaState('gone');
        else setMetaState('notfound');
      });
    return () => {
      cancel = true;
    };
  }, [slug]);

  const onUnlock = async () => {
    if (!slug) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await secretLinkService.unlock(slug, password);
      setUnlocked(r.content);
    } catch (e) {
      setErr(getApiErrorMessage(e, 'No se pudo abrir el contenido'));
    } finally {
      setBusy(false);
    }
  };

  if (!slug) {
    return <StatusWithHeader message="Enlace no válido" />;
  }

  if (metaState === 'load') {
    return (
      <>
        <Helmet>
          <title>Enlace seguro — {CONFIG.appName}</title>
        </Helmet>
        <Header />
        <Box
          sx={{
            minHeight: '50vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pt: `${SITE_HEADER_OFFSET_PX}px`,
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (metaState === 'gone') {
    return <StatusWithHeader message="Este enlace ha expirado" />;
  }

  if (metaState === 'notfound' || !meta) {
    return <StatusWithHeader message="Enlace no encontrado o no disponible" />;
  }

  return (
    <>
      <Helmet>
        <title>Enlace seguro — {CONFIG.appName}</title>
      </Helmet>
      <Header />
      <Box
        component="main"
        sx={{
          maxWidth: 640,
          mx: 'auto',
          px: 2,
          py: 4,
          mt: `${SITE_HEADER_OFFSET_PX}px`,
        }}
      >
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LockOutlinedIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Contenido protegido
              </Typography>
            </Box>
            {meta.title && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                {meta.title}
              </Typography>
            )}
            {meta.expiresAt && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Vence: {new Date(meta.expiresAt).toLocaleString()}
              </Typography>
            )}

            {unlocked != null ? (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {unlocked}
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Introduzca la contraseña que le compartieron para ver el mensaje cifrado.
                </Typography>
                <TextField
                  type="password"
                  fullWidth
                  label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void onUnlock()}
                  autoComplete="off"
                  margin="normal"
                />
                {err && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {err}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  onClick={() => void onUnlock()}
                  disabled={busy || !password}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {busy ? 'Abriendo…' : 'Desbloquear'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 2 }}>
          TI Water · enlace cifrado
        </Typography>
      </Box>
    </>
  );
}

function StatusWithHeader({ message }: { message: string }) {
  return (
    <>
      <Helmet>
        <title>Enlace — {CONFIG.appName}</title>
      </Helmet>
      <Header />
      <Box sx={{ textAlign: 'center', py: 8, px: 2, mt: `${SITE_HEADER_OFFSET_PX}px` }}>
        <Typography color="text.secondary">{message}</Typography>
      </Box>
    </>
  );
}
