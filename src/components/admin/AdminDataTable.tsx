import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
  StyledTableCell,
  StyledTableCellHeader,
  StyledTableContainer,
  StyledTableRow,
} from './admin-table-styles';

export type AdminColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  cell: (row: T) => React.ReactNode;
};

export type AdminBulkAction<T> = {
  key: string;
  label: string;
  color?: 'primary' | 'error' | 'secondary' | 'success' | 'warning';
  variant?: 'contained' | 'outlined' | 'text';
  /** Rows that qualify for this action (default: all selected) */
  filterRows?: (row: T) => boolean;
  onExecute: (rows: T[]) => void | Promise<void>;
};

const ROWS_OPTS = [10, 25, 50, 100] as const;

type AdminDataTableProps<T> = {
  title?: string;
  rows: T[];
  rowId: (row: T) => string | number;
  columns: AdminColumnDef<T>[];
  loading?: boolean;
  /** Client-side filter on loaded rows */
  getRowSearchText?: (row: T) => string;
  searchPlaceholder?: string;
  extraFilter?: (row: T) => boolean;
  enableSelection?: boolean;
  bulkActions?: AdminBulkAction<T>[];
  renderActions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  /** Extra controls left of search (e.g. category select) */
  toolbarExtras?: React.ReactNode;
};

export function AdminDataTable<T>({
  title,
  rows,
  rowId,
  columns,
  loading = false,
  getRowSearchText,
  searchPlaceholder = 'Buscar en la tabla…',
  extraFilter,
  enableSelection = true,
  bulkActions = [],
  renderActions,
  emptyMessage = 'Sin registros',
  rowsPerPageOptions = [...ROWS_OPTS],
  defaultRowsPerPage = 10,
  toolbarExtras,
}: AdminDataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const idStr = useCallback((row: T) => String(rowId(row)), [rowId]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (extraFilter) list = list.filter(extraFilter);
    const q = search.trim().toLowerCase();
    if (q && getRowSearchText) {
      list = list.filter((r) => getRowSearchText(r).toLowerCase().includes(q));
    }
    return list;
  }, [rows, search, getRowSearchText, extraFilter]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const pageIds = useMemo(() => paginatedRows.map((r) => idStr(r)), [paginatedRows, idStr]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const toggleAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (row: T) => {
    const id = idStr(row);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(idStr(r))),
    [rows, selectedIds, idStr],
  );

  const colCount =
    columns.length + (enableSelection ? 1 : 0) + (renderActions ? 1 : 0);

  const runBulk = async (action: AdminBulkAction<T>) => {
    const filter = action.filterRows ?? (() => true);
    const targets = selectedRows.filter(filter);
    if (targets.length === 0) return;
    setBulkLoading(true);
    try {
      await action.onExecute(targets);
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Box>
      {title && (
        <Typography variant="h5" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}

      <Toolbar
        disableGutters
        sx={{
          flexWrap: 'wrap',
          gap: 2,
          py: 2,
          px: 0,
          alignItems: 'center',
        }}
      >
        {toolbarExtras}
        {getRowSearchText && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 240, flex: { xs: '1 1 100%', sm: '0 1 280px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        )}
        {enableSelection && selectedIds.size > 0 && bulkActions.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedIds.size} seleccionado(s)
            </Typography>
            {bulkActions.map((action) => {
              const filter = action.filterRows ?? (() => true);
              const count = selectedRows.filter(filter).length;
              return (
                <Button
                  key={action.key}
                  variant={action.variant ?? 'contained'}
                  color={action.color ?? 'primary'}
                  size="small"
                  disabled={count === 0 || bulkLoading}
                  onClick={() => void runBulk(action)}
                >
                  {action.label}
                  {count > 0 ? ` (${count})` : ''}
                </Button>
              );
            })}
          </Box>
        )}
      </Toolbar>

      <StyledTableContainer>
        <Paper elevation={3}>
          <Box sx={{ overflowX: 'auto', position: 'relative', minHeight: loading ? 200 : undefined }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)',
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f4f6f8' }}>
                  {enableSelection && (
                    <StyledTableCellHeader padding="checkbox" sx={{ width: 48 }}>
                      <Checkbox
                        indeterminate={somePageSelected}
                        checked={allPageSelected}
                        onChange={toggleAllPage}
                        inputProps={{ 'aria-label': 'Seleccionar página' }}
                      />
                    </StyledTableCellHeader>
                  )}
                  {columns.map((col) => (
                    <StyledTableCellHeader key={col.id} align={col.align}>
                      {col.header}
                    </StyledTableCellHeader>
                  ))}
                  {renderActions && (
                    <StyledTableCellHeader align="right">Acciones</StyledTableCellHeader>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={colCount} align="center">
                      <Typography color="text.secondary">{emptyMessage}</Typography>
                    </StyledTableCell>
                  </StyledTableRow>
                ) : (
                  paginatedRows.map((row) => {
                    const id = idStr(row);
                    return (
                      <StyledTableRow key={id}>
                        {enableSelection && (
                          <StyledTableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.has(id)}
                              onChange={() => toggleOne(row)}
                              inputProps={{ 'aria-label': `Seleccionar fila ${id}` }}
                            />
                          </StyledTableCell>
                        )}
                        {columns.map((col) => (
                          <StyledTableCell key={col.id} align={col.align}>
                            {col.cell(row)}
                          </StyledTableCell>
                        ))}
                        {renderActions && (
                          <StyledTableCell align="right">{renderActions(row)}</StyledTableCell>
                        )}
                      </StyledTableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={rowsPerPageOptions}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count: c }) => `${from}–${to} de ${c !== -1 ? c : `más de ${to}`}`}
            />
          </Box>
        </Paper>
      </StyledTableContainer>
    </Box>
  );
}
