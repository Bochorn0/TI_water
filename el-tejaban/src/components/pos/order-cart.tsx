import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { OrderType } from '@tejaban/types/order.types';
import { ORDER_TYPE_LABELS } from '@tejaban/types/order.types';
import { formatCurrency } from '@tejaban/utils/format';

const ORDER_TYPES: OrderType[] = ['mostrador', 'mesa', 'uber_eats', 'didi'];

export type CartLine = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

type Props = {
  lines: CartLine[];
  orderType: OrderType;
  tableLabel: string;
  notes: string;
  onOrderTypeChange: (type: OrderType) => void;
  onTableLabelChange: (label: string) => void;
  onNotesChange: (notes: string) => void;
  onQuantityChange: (menuItemId: number, quantity: number) => void;
  onRemoveLine: (menuItemId: number) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  readOnly?: boolean;
};

export function OrderCart({
  lines,
  orderType,
  tableLabel,
  notes,
  onOrderTypeChange,
  onTableLabelChange,
  onNotesChange,
  onQuantityChange,
  onRemoveLine,
  onSubmit,
  submitting,
  submitLabel = 'Crear orden',
  readOnly,
}: Props) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" fontWeight={800}>
          Orden actual
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {lines.length} {lines.length === 1 ? 'producto' : 'productos'}
        </Typography>
      </Box>

      {!readOnly && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="order-type-label">Tipo de orden</InputLabel>
            <Select
              labelId="order-type-label"
              label="Tipo de orden"
              value={orderType}
              onChange={(e) => onOrderTypeChange(e.target.value as OrderType)}
            >
              {ORDER_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {ORDER_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {orderType === 'mesa' && (
            <TextField
              label="Número de mesa"
              value={tableLabel}
              onChange={(e) => onTableLabelChange(e.target.value)}
              size="small"
              fullWidth
              placeholder="Ej. Mesa 4"
            />
          )}

          {(orderType === 'uber_eats' || orderType === 'didi') && (
            <TextField
              label="Ref. pedido plataforma"
              value={tableLabel}
              onChange={(e) => onTableLabelChange(e.target.value)}
              size="small"
              fullWidth
              placeholder="Ej. #A4F2 Uber Eats"
            />
          )}

          <TextField
            label="Notas"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            placeholder="Sin cebolla, extra limón..."
          />
        </Box>
      )}

      <Divider />

      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {lines.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="Carrito vacío"
              secondary="Toca un producto del menú para agregarlo"
              sx={{ textAlign: 'center', py: 4 }}
            />
          </ListItem>
        ) : (
          lines.map((line) => (
            <ListItem
              key={line.menuItemId}
              sx={{
                py: 1.5,
                alignItems: 'flex-start',
                borderBottom: 1,
                borderColor: 'divider',
              }}
              secondaryAction={
                !readOnly && (
                  <IconButton edge="end" onClick={() => onRemoveLine(line.menuItemId)} aria-label="Eliminar">
                    <DeleteOutlineIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={
                  <Typography fontWeight={600} variant="body1">
                    {line.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {!readOnly ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => onQuantityChange(line.menuItemId, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>
                          {line.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => onQuantityChange(line.menuItemId, line.quantity + 1)}
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          × {formatCurrency(line.unitPrice)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">
                        {line.quantity} × {formatCurrency(line.unitPrice)}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Typography fontWeight={700} sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                {formatCurrency(line.unitPrice * line.quantity)}
              </Typography>
            </ListItem>
          ))
        )}
      </List>

      <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Total</Typography>
          <Typography variant="h5" fontWeight={800} color="primary.main">
            {formatCurrency(subtotal)}
          </Typography>
        </Box>

        {!readOnly && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={lines.length === 0 || submitting}
            onClick={onSubmit}
          >
            {submitting ? 'Guardando...' : submitLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
}
