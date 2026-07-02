import { Chip } from '@mui/material';
import type { OrderStatus } from '@tejaban/types/order.types';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@tejaban/types/order.types';

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  return (
    <Chip
      label={ORDER_STATUS_LABELS[status]}
      color={ORDER_STATUS_COLORS[status]}
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}
