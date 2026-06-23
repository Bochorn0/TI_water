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
import type { PaymentMethod } from '@tejaban/types/payment.types';
import { PAYMENT_METHOD_LABELS } from '@tejaban/types/payment.types';
import { formatCurrency } from '@tejaban/utils/format';

type Props = {
  open: boolean;
  orderNumber: string;
  total: number;
  onClose: () => void;
  onConfirm: (payload: { method: PaymentMethod; amount: number; terminalTicketRef?: string }) => Promise<void>;
};

export function PaymentDialog({ open, orderNumber, total, onClose, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [amount, setAmount] = useState(String(total));
  const [terminalRef, setTerminalRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        terminalTicketRef: method === 'tarjeta' ? terminalRef.trim() : undefined,
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
            <FormControlLabel
              value="efectivo"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentsIcon fontSize="small" />
                  {PAYMENT_METHOD_LABELS.efectivo}
                </Box>
              }
              sx={{ minHeight: 48 }}
            />
            <FormControlLabel
              value="tarjeta"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCardIcon fontSize="small" />
                  {PAYMENT_METHOD_LABELS.tarjeta}
                </Box>
              }
              sx={{ minHeight: 48 }}
            />
            <FormControlLabel
              value="transferencia"
              control={<Radio />}
              label={PAYMENT_METHOD_LABELS.transferencia}
              sx={{ minHeight: 48 }}
            />
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
            autoFocus
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
