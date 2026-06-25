import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Typography,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { paymentService } from '@tejaban/services/payment.service';
import type { Payment, PaymentMethod } from '@tejaban/types/payment.types';
import { PAYMENT_METHOD_LABELS } from '@tejaban/types/payment.types';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';

export default function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const methodFilter = searchParams.get('method') as PaymentMethod | null;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService
      .getPayments()
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!methodFilter) return payments;
    return payments.filter((p) => p.method === methodFilter);
  }, [payments, methodFilter]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Pagos registrados
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {methodFilter
          ? `Filtrado: ${PAYMENT_METHOD_LABELS[methodFilter]}`
          : 'Referencias de terminal para conciliación contable'}
      </Typography>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} height={100} sx={{ mb: 1.5, borderRadius: 2 }} />)
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No hay pagos registrados.
        </Typography>
      ) : (
        filtered.map((payment) => (
          <Card key={payment.id} elevation={0} sx={{ mb: 1.5, border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box>
                  <Typography fontWeight={800} variant="h6">
                    {formatCurrency(payment.amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(payment.paidAt)} · {payment.orderNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Registrado por {payment.recordedBy}
                  </Typography>
                </Box>
                <Chip
                  label={PAYMENT_METHOD_LABELS[payment.method]}
                  color={
                    payment.method === 'tarjeta'
                      ? 'error'
                      : payment.method === 'uber_eats' || payment.method === 'didi'
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
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Ref. terminal
                  </Typography>
                  <Typography fontWeight={700} fontFamily="monospace">
                    {payment.terminalTicketRef}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
