import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  Chip,
  Skeleton,
  Typography,
  alpha,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { DateRangeFilter } from '@tejaban/components/filters/date-range-filter';
import { UserFilter } from '@tejaban/components/filters/user-filter';
import { EmptyState } from '@tejaban/components/layout/empty-state';
import { FilterPanel } from '@tejaban/components/layout/filter-panel';
import { PageHeader } from '@tejaban/components/layout/page-header';
import { paymentService } from '@tejaban/services/payment.service';
import type { Payment, PaymentMethod } from '@tejaban/types/payment.types';
import { DELIVERY_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@tejaban/types/payment.types';
import {
  formatDateRangeLabel,
  resolveDateRange,
  todayIso,
  type DateRange,
  type DateRangePreset,
} from '@tejaban/utils/date-range';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';

const METHOD_COLORS: Partial<Record<PaymentMethod, string>> = {
  efectivo: '#43A047',
  tarjeta: '#E53935',
  transferencia: '#0B4F8C',
  uber_eats: '#2D2D2D',
  didi: '#FF6B00',
  rapi: '#FF441F',
};

export default function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const methodFilter = searchParams.get('method') as PaymentMethod | null;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('today');
  const [customRange, setCustomRange] = useState<DateRange>({
    fromDate: todayIso(),
    toDate: todayIso(),
  });
  const [userFilter, setUserFilter] = useState('');

  const dateRange = useMemo(
    () => resolveDateRange(datePreset, customRange),
    [datePreset, customRange],
  );

  useEffect(() => {
    setLoading(true);
    paymentService
      .getPayments({
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        recordedBy: userFilter || undefined,
      })
      .then(setPayments)
      .finally(() => setLoading(false));
  }, [dateRange.fromDate, dateRange.toDate, userFilter]);

  const users = useMemo(
    () =>
      [...new Set(payments.map((p) => p.recordedBy).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [payments],
  );

  const filtered = useMemo(() => {
    if (!methodFilter) return payments;
    return payments.filter((p) => p.method === methodFilter);
  }, [payments, methodFilter]);

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%' }}>
      <PageHeader
        title="Pagos registrados"
        subtitle={
          methodFilter
            ? `${formatDateRangeLabel(dateRange)} · ${PAYMENT_METHOD_LABELS[methodFilter]}`
            : formatDateRangeLabel(dateRange)
        }
      />

      <FilterPanel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <DateRangeFilter
            preset={datePreset}
            customRange={customRange}
            onPresetChange={setDatePreset}
            onCustomRangeChange={setCustomRange}
          />
          <UserFilter
            label="Registrado por"
            value={userFilter}
            users={users}
            onChange={setUserFilter}
          />
        </Box>
      </FilterPanel>

      {!loading && filtered.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {filtered.length} {filtered.length === 1 ? 'pago' : 'pagos'}
          </Typography>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            Total {formatCurrency(totalAmount)}
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={110} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PaymentsOutlinedIcon />}
          title="No hay pagos registrados"
          description="Ajusta el periodo o el usuario para ver pagos en este rango."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((payment) => (
            <Card
              key={payment.id}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Box
                  sx={{
                    width: 4,
                    flexShrink: 0,
                    bgcolor: METHOD_COLORS[payment.method] ?? 'primary.main',
                  }}
                />
                <Box sx={{ flex: 1, p: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {formatCurrency(payment.amount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {formatDateTime(payment.paidAt)} · {payment.orderNumber}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Registrado por <strong>{payment.recordedBy}</strong>
                      </Typography>
                    </Box>
                    <Chip
                      label={PAYMENT_METHOD_LABELS[payment.method]}
                      color={
                        payment.method === 'tarjeta'
                          ? 'error'
                          : DELIVERY_PAYMENT_METHODS.includes(payment.method)
                            ? 'secondary'
                            : 'default'
                      }
                      icon={payment.method === 'tarjeta' ? <CreditCardIcon /> : undefined}
                    />
                  </Box>

                  {payment.terminalTicketRef && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        border: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Ref. terminal
                      </Typography>
                      <Typography fontWeight={700} fontFamily="monospace" sx={{ mt: 0.25 }}>
                        {payment.terminalTicketRef}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
