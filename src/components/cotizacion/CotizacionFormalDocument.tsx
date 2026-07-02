import type { ReactNode } from 'react';
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Quote } from 'src/types/quote.types';
import {
  COTIZACION_EMISOR,
  COTIZACION_LUGAR_DEFAULT,
  COTIZACION_MONEDA,
} from 'src/constants/cotizacion-document';
import { docPaperSx, docTitleSx, docTableHeadSx, folioBoxSx } from './cotizacion-formal-styles';

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatQty(n: number) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export type CotizacionFormalDocumentProps = {
  quote: Quote;
  /** Líneas de tabla (controles de edición o filas de solo lectura) */
  children: ReactNode;
  /** Mostrar columnas de precio y bloque de totales */
  showPrices: boolean;
  /** Pie de página bajo totales (notas, banco) */
  footerNotes?: string;
  /** IVA editable: si se pasa, se muestra campo externo; totales usan quote.tax */
  taxAmount?: number;
};

export function CotizacionFormalDocument({
  quote,
  children,
  showPrices,
  footerNotes,
  taxAmount,
}: CotizacionFormalDocumentProps) {
  const subtotal = quote.items?.reduce((s, it) => s + (it.subtotal || 0), 0) ?? 0;
  const tax = taxAmount ?? Number(quote.tax || 0);
  const total = subtotal + tax;
  const ivaPct = subtotal > 0 && tax > 0 ? (tax / subtotal) * 100 : 16;

  const created = quote.createdAt ? new Date(quote.createdAt) : new Date();
  const fechaStr = created.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Paper elevation={0} sx={{ ...docPaperSx, p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography
              component="span"
              sx={{
                fontSize: '2rem',
                lineHeight: 1,
                color: '#1565c0',
              }}
            >
              💧
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.5rem',
                color: '#1565c0',
                letterSpacing: '0.02em',
              }}
            >
              {COTIZACION_EMISOR.tradeMark}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            {COTIZACION_EMISOR.legalName}
          </Typography>
          {COTIZACION_EMISOR.rfc ? (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              RFC: {COTIZACION_EMISOR.rfc}
            </Typography>
          ) : null}
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ ...folioBoxSx, ml: { md: 'auto' } }}>
            <Typography variant="caption" display="block" color="text.secondary">
              Folio
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              {quote.quoteNumber || '—'}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              {fechaStr}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Lugar
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              {COTIZACION_LUGAR_DEFAULT}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Moneda
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {COTIZACION_MONEDA}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography sx={docTitleSx}>COTIZACIÓN</Typography>

      <Box sx={{ my: 2, borderTop: '1px solid #cfd8dc', pt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 0.5 }}>
          Cliente
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {quote.clientName}
        </Typography>
        {quote.clientEmail ? (
          <Typography variant="body2" color="text.secondary">
            {quote.clientEmail}
          </Typography>
        ) : null}
        {quote.clientPhone ? (
          <Typography variant="body2">Tel. {quote.clientPhone}</Typography>
        ) : null}
        {quote.clientAddress ? (
          <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 640 }}>
            Domicilio: {quote.clientAddress}
          </Typography>
        ) : null}
      </Box>

      <TableContainer sx={{ mb: 2 }}>
        <Table size="small" sx={{ borderCollapse: 'collapse' }}>
          <TableHead sx={docTableHeadSx}>
            <TableRow>
              <TableCell align="center" sx={{ width: 72 }}>
                CANT.
              </TableCell>
              <TableCell sx={{ width: 100 }}>CÓDIGO</TableCell>
              <TableCell>CONCEPTO</TableCell>
              <TableCell align="center" sx={{ width: 96 }}>
                UNIDAD
              </TableCell>
              {showPrices ? (
                <>
                  <TableCell align="right" sx={{ width: 100 }}>
                    PRECIO
                  </TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    SUBTOTAL
                  </TableCell>
                </>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>{children}</TableBody>
        </Table>
      </TableContainer>

      {showPrices ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Box sx={{ minWidth: 260, borderTop: '1px solid #cfd8dc', pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2">Subtotal $</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatMoney(subtotal)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2">IVA Tras. ({ivaPct.toFixed(2)})% $</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatMoney(tax)}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.75,
                mt: 0.5,
                borderTop: '2px solid #1565c0',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                TOTAL $
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {formatMoney(total)}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : null}

      {[footerNotes, quote.notes, COTIZACION_EMISOR.footerLegal].some(Boolean) ? (
        <Box sx={{ borderTop: '1px solid #cfd8dc', pt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, textTransform: 'uppercase' }}>
            Comentarios
          </Typography>
          <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
            {[footerNotes, quote.notes, COTIZACION_EMISOR.footerLegal].filter(Boolean).join('\n\n')}
          </Typography>
        </Box>
      ) : null}
    </Paper>
  );
}

export { formatMoney, formatQty };
