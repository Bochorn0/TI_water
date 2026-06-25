import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import type { PaymentMethod } from '@tejaban/types/payment.types';
import {
  ALL_PAYMENT_METHODS,
  DELIVERY_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from '@tejaban/types/payment.types';
import { formatCurrency } from '@tejaban/utils/format';

type Props = {
  open: boolean;
  orderNumber: string;
  total: number;
  onClose: () => void;
  onConfirm: (payload: { method: PaymentMethod; amount: number; terminalTicketRef?: string }) => Promise<void>;
};

const METHODS: PaymentMethod[] = ALL_PAYMENT_METHODS;

export function PaymentDialog({ open, orderNumber, total, onClose, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [amount, setAmount] = useState(String(total));
  const [terminalRef, setTerminalRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const needsRef = method === 'tarjeta' || DELIVERY_PAYMENT_METHODS.includes(method);

  const handleConfirm = async () => {
    setError('');
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Monto inválido');
      return;
    }
    if (method === 'tarjeta' && !terminalRef.trim()) {
      setError('Ingresa la referencia del ticket de la terminal');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm({
        method,
        amount: parsedAmount,
        terminalTicketRef: needsRef && terminalRef.trim() ? terminalRef.trim() : undefined,
      });
      setTerminalRef('');
      setMethod('efectivo');
      setAmount(String(total));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={800}>
          Cobrar — {orderNumber}
        </Typography>
        <Typography variant="h4" color="primary.main" fontWeight={800} sx={{ mt: 1 }}>
          {formatCurrency(total)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Método de pago
          </Typography>
          <RadioGroup value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {METHODS.map((m) => (
              <FormControlLabel
                key={m}
                value={m}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {m === 'efectivo' && <PaymentsIcon fontSize="small" />}
                    {m === 'tarjeta' && <CreditCardIcon fontSize="small" />}
                    {DELIVERY_PAYMENT_METHODS.includes(m) && <DeliveryDiningIcon fontSize="small" />}
                    {PAYMENT_METHOD_LABELS[m]}
                  </Box>
                }
                sx={{ minHeight: 44 }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <TextField
          label="Monto recibido"
          type="number"
          fullWidth
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ mb: 2 }}
          inputProps={{ min: 0, step: 0.01 }}
        />

        {method === 'tarjeta' && (
          <TextField
            label="Referencia ticket terminal"
            fullWidth
            required
            value={terminalRef}
            onChange={(e) => setTerminalRef(e.target.value)}
            placeholder="Ej. TKT-20260622-00451"
            helperText="Número del comprobante de la terminal externa"
            sx={{ mb: 2 }}
          />
        )}

        {DELIVERY_PAYMENT_METHODS.includes(method) && (
          <TextField
            label="Ref. pedido plataforma (opcional)"
            fullWidth
            value={terminalRef}
            onChange={(e) => setTerminalRef(e.target.value)}
            placeholder={`Ej. pedido ${PAYMENT_METHOD_LABELS[method]}`}
            helperText="ID del pedido en la app de delivery"
          />
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} size="large" disabled={submitting} sx={{ minWidth: 120 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleConfirm}
          disabled={submitting}
          sx={{ minWidth: 160 }}
        >
          {submitting ? 'Registrando...' : 'Registrar pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
