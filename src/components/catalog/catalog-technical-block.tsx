import {
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { TechnicalComparisonTable } from 'src/types/catalog-spec.types';
import { tryParseRawExtraction } from 'src/components/catalog/parse-raw-extraction-table';

type NormalizedRow = { attribute: string; values: string[] };

/**
 * Coerce API/JSONB rows (sometimes loose shapes) into attribute + string[].
 */
function normalizeRow(raw: unknown, index: number): NormalizedRow | null {
  if (raw == null) return null;
  if (typeof raw !== 'object') return { attribute: `Fila ${index + 1}`, values: [String(raw)] };
  const r = raw as Record<string, unknown>;
  const attr =
    r.attribute ??
    r.Attribute ??
    r.label ??
    r.name ??
    r.campo;
  let values = r.values ?? r.value ?? r.vals;
  if (!Array.isArray(values)) {
    if (values == null) values = [];
    else if (typeof values === 'string') {
      try {
        const parsed = JSON.parse(values) as unknown;
        values = Array.isArray(parsed) ? parsed : [values];
      } catch {
        values = [values];
      }
    } else {
      values = [values as unknown];
    }
  }
  const strValues = (values as unknown[]).map((v) => (v == null ? '—' : String(v).trim() || '—'));
  return {
    attribute: String(attr != null && attr !== '' ? attr : `Fila ${index + 1}`),
    values: strValues,
  };
}

/**
 * Build a displayable matrix: column labels and padded value rows.
 */
function normalizeTable(table: TechnicalComparisonTable): {
  columns: string[];
  rows: NormalizedRow[];
  legal?: string;
} | null {
  const rawRows = table.rows;
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return null;
  }

  const rows = rawRows
    .map((row, i) => normalizeRow(row, i))
    .filter((x): x is NormalizedRow => x != null);

  if (rows.length === 0) return null;

  let colLabels: string[] = Array.isArray(table.columns)
    ? (table.columns as unknown[]).map((c) => (c == null ? '—' : String(c).trim() || '—'))
    : [];

  const maxDataCols = Math.max(
    colLabels.length,
    ...rows.map((r) => (Array.isArray(r.values) ? r.values.length : 0)),
  );

  if (maxDataCols === 0) return null;

  if (colLabels.length < maxDataCols) {
    const start = colLabels.length;
    for (let j = start; j < maxDataCols; j += 1) {
      colLabels.push(`C${j + 1}`);
    }
  } else if (colLabels.length > maxDataCols) {
    colLabels = colLabels.slice(0, maxDataCols);
  }

  const paddedRows = rows.map((r) => {
    const v = [...(r.values || [])];
    while (v.length < maxDataCols) v.push('—');
    if (v.length > maxDataCols) return { ...r, values: v.slice(0, maxDataCols) };
    return { ...r, values: v };
  });

  return {
    columns: colLabels,
    rows: paddedRows,
    legal: table.legalNote,
  };
}

export function CatalogTechnicalTable({ table }: { table: TechnicalComparisonTable }) {
  let matrix = normalizeTable(table);
  let fromParsed: {
    manufacturerNotes?: string;
    appendixCells?: string[];
  } = {};

  if (!matrix && table.rawExtraction && String(table.rawExtraction).trim()) {
    const parsed = tryParseRawExtraction(String(table.rawExtraction));
    if (parsed && parsed.rows.length) {
      fromParsed = {
        manufacturerNotes: parsed.manufacturerNotes,
        appendixCells: parsed.appendixCells,
      };
      matrix = {
        columns: parsed.columns,
        rows: parsed.rows,
        legal: table.legalNote,
      };
    }
  }
  if (matrix) {
    const { columns, rows, legal } = matrix;
    const notesBlocks = [fromParsed.manufacturerNotes, legal].filter(Boolean) as string[];
    const footAll = notesBlocks.length ? notesBlocks.join('\n\n\n') : undefined;
    return (
      <Box>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            my: 2,
            maxWidth: '100%',
            overflow: 'auto',
            maxHeight: { xs: '50vh', sm: '55vh' },
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              minWidth: Math.max(480, 72 + columns.length * 100),
              tableLayout: 'auto',
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: 'grey.200',
                    minWidth: 100,
                    maxWidth: 200,
                    position: 'sticky',
                    left: 0,
                    top: 0,
                    zIndex: 4,
                    borderRight: 1,
                    borderColor: 'divider',
                    whiteSpace: 'normal',
                    verticalAlign: 'bottom',
                    boxShadow: 2,
                  }}
                >
                  Característica
                </TableCell>
                {columns.map((c, ci) => (
                  <TableCell
                    key={`h-${ci}`}
                    align="center"
                    sx={{
                      fontWeight: 700,
                      bgcolor: 'grey.200',
                      minWidth: 80,
                      maxWidth: 140,
                      fontSize: 12,
                      lineHeight: 1.2,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      verticalAlign: 'bottom',
                      top: 0,
                      zIndex: 3,
                    }}
                  >
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, ri) => (
                <TableRow key={`${ri}-${row.attribute}`}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontWeight: 500,
                      minWidth: 100,
                      maxWidth: 200,
                      position: 'sticky',
                      left: 0,
                      bgcolor: (theme) => (theme.palette.mode === 'light' ? 'grey.50' : 'background.paper'),
                      zIndex: 1,
                      borderRight: 1,
                      borderColor: 'divider',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      verticalAlign: 'top',
                    }}
                  >
                    {row.attribute}
                  </TableCell>
                  {row.values.map((v, vi) => (
                    <TableCell
                      key={vi}
                      align="center"
                      sx={{
                        fontSize: 12,
                        lineHeight: 1.3,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        maxWidth: 140,
                        verticalAlign: 'top',
                      }}
                    >
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {fromParsed.appendixCells && fromParsed.appendixCells.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Opcional y complementos
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, lineHeight: 1.5 }}>
              En el documento original esta sección no sigue la misma cuadrícula que la tabla de arriba. Las entradas
              siguientes son el mismo texto del extracto del PDF, en orden, mostrado como lista para no alinear a columna
              de forma incorrecta.
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, maxHeight: 240, overflow: 'auto', bgcolor: 'grey.50' }}>
              <List dense disablePadding>
                {fromParsed.appendixCells.map((line, li) => (
                  <ListItem key={`apx-${li}`} disableGutters sx={{ py: 0.25, display: 'block' }}>
                    <ListItemText
                      primary={line}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary', sx: { lineHeight: 1.45 } }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}
        {footAll && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}>
            {footAll}
          </Typography>
        )}
      </Box>
    );
  }

  if (table.rawExtraction && String(table.rawExtraction).trim()) {
    return (
      <Paper variant="outlined" sx={{ my: 2, p: 2, bgcolor: 'grey.50' }}>
        <Box
          component="pre"
          sx={{
            m: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace',
            fontSize: 11,
            lineHeight: 1.45,
            maxHeight: { xs: '50vh', sm: '60vh' },
            overflow: 'auto',
          }}
        >
          {table.rawExtraction}
        </Box>
      </Paper>
    );
  }

  return null;
}
