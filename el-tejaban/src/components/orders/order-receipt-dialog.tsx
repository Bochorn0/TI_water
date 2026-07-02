import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import type { Order } from '@tejaban/types/order.types';
import type { Payment } from '@tejaban/types/payment.types';
import { PAYMENT_METHOD_LABELS } from '@tejaban/types/payment.types';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';
import { printOrderTicket } from '@tejaban/utils/print-order-ticket';

type Props = {
  open: boolean;
  order: Order;
  payment?: Payment | null;
  onClose: () => void;
};

export function OrderReceiptDialog({ open, order, payment, onClose }: Props) {
  const handlePrint = () => {
    try {
      printOrderTicket(order, payment);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo imprimir');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={800}>Pago registrado</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {order.orderNumber} · {formatDateTime(payment?.paidAt ?? order.updatedAt)}
        </Typography>

        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, fontFamily: 'monospace', fontSize: 13 }}>
          {order.items.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
              <span>
                {item.quantity}× {item.menuItem?.name ?? item.manualName}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>TOTAL</span>
            <span>{formatCurrency(order.total)}</span>
          </Box>
          {payment && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {PAYMENT_METHOD_LABELS[payment.method]} · {formatCurrency(payment.amount)}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
          Imprimir ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
}
