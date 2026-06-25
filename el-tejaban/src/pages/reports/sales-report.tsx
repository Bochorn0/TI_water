import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import { toast } from 'react-toastify';
import { paymentService } from '@tejaban/services/payment.service';
import { ALL_ORDER_TYPES, ORDER_TYPE_LABELS } from '@tejaban/types/order.types';
import type { OrderType } from '@tejaban/types/order.types';
import {
  ALL_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from '@tejaban/types/payment.types';
import type { PaymentMethod, SalesReport } from '@tejaban/types/payment.types';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';
import { downloadSalesReportCsv } from '@tejaban/utils/export-sales-csv';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function SalesReportPage() {
  const [fromDate, setFromDate] = useState(monthStartIso);
  const [toDate, setToDate] = useState(todayIso);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleMethod = (method: PaymentMethod) => {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const toggleOrderType = (type: OrderType) => {
    setOrderTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      toast.error('Selecciona un rango de fechas');
      return;
    }
    if (fromDate > toDate) {
      toast.error('La fecha inicial no puede ser posterior a la final');
      return;
    }

    setLoading(true);
    try {
      const data = await paymentService.getSalesReport({
        fromDate,
        toDate,
        methods: methods.length ? methods : undefined,
        orderTypes: orderTypes.length ? orderTypes : undefined,
      });
      setReport(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const methodSummary = useMemo(() => {
    if (!report) return [];
    return ALL_PAYMENT_METHODS.filter((m) => report.byMethod[m] > 0).map((m) => ({
      key: m,
      label: PAYMENT_METHOD_LABELS[m],
      amount: report.byMethod[m],
    }));
  }, [report]);

  const orderTypeSummary = useMemo(() => {
    if (!report) return [];
    return ALL_ORDER_TYPES.filter((t) => report.byOrderType[t] > 0).map((t) => ({
      key: t,
      label: ORDER_TYPE_LABELS[t],
      amount: report.byOrderType[t],
    }));
  }, [report]);

  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto', width: '100%' }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Reporte de ventas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Filtra por fechas, método de pago y origen de orden. Exporta el resultado a CSV.
      </Typography>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Desde"
              type="date"
              fullWidth
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Hasta"
              type="date"
              fullWidth
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Método de pago
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Sin selección = todos los métodos
            </Typography>
            <FormGroup row>
              {ALL_PAYMENT_METHODS.map((method) => (
                <FormControlLabel
                  key={method}
                  control={
                    <Checkbox
                      size="small"
                      checked={methods.includes(method)}
                      onChange={() => toggleMethod(method)}
                    />
                  }
                  label={PAYMENT_METHOD_LABELS[method]}
                />
              ))}
            </FormGroup>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Origen de orden
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Sin selección = todos los orígenes
            </Typography>
            <FormGroup row>
              {ALL_ORDER_TYPES.map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      size="small"
                      checked={orderTypes.includes(type)}
                      onChange={() => toggleOrderType(type)}
                    />
                  }
                  label={ORDER_TYPE_LABELS[type]}
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar reporte'}
          </Button>
          {report && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => downloadSalesReportCsv(report)}
            >
              Exportar CSV
            </Button>
          )}
        </Box>
      </Paper>

      {loading && (
        <Box>
          <Skeleton height={120} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton height={280} sx={{ borderRadius: 2 }} />
        </Box>
      )}

      {!loading && report && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <SummaryCard label="Ventas totales" value={formatCurrency(report.totalSales)} highlight />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SummaryCard label="Pagos registrados" value={String(report.paymentCount)} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SummaryCard
                label="Periodo"
                value={`${report.fromDate} — ${report.toDate}`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <BreakdownCard title="Por método de pago" rows={methodSummary} />
            </Grid>
            <Grid item xs={12} md={6}>
              <BreakdownCard title="Por origen de orden" rows={orderTypeSummary} />
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography fontWeight={700}>Detalle de pagos ({report.payments.length})</Typography>
            </Box>

            {report.payments.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No hay pagos en el periodo con los filtros seleccionados.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Orden</TableCell>
                      <TableCell>Origen</TableCell>
                      <TableCell>Método</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell>Referencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.payments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                        <TableCell>{payment.orderNumber}</TableCell>
                        <TableCell>
                          {payment.orderType ? (
                            <Chip size="small" label={ORDER_TYPE_LABELS[payment.orderType]} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {payment.terminalTicketRef || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2.5, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
          {label}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={800}
          color={highlight ? 'primary.main' : 'text.primary'}
          sx={{ mt: 0.5 }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; label: string; amount: number }>;
}) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sin datos en este periodo.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rows.map((row) => (
            <Box key={row.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2">{row.label}</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(row.amount)}
                </Typography>
              </Box>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
