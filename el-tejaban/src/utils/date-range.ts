export type DateRangePreset = 'today' | 'last3' | 'last7' | 'last15' | 'last30' | 'custom';

export interface DateRange {
  fromDate: string;
  toDate: string;
}

export interface DateRangePresetOption {
  value: DateRangePreset;
  label: string;
}

export const DATE_RANGE_PRESETS: DateRangePresetOption[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'last3', label: 'Últimos 3 días' },
  { value: 'last7', label: 'Últimos 7 días' },
  { value: 'last15', label: 'Últimos 15 días' },
  { value: 'last30', label: 'Últimos 30 días' },
  { value: 'custom', label: 'Personalizado' },
];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function resolveDateRange(preset: DateRangePreset, custom?: DateRange): DateRange {
  const today = todayIso();

  switch (preset) {
    case 'today':
      return { fromDate: today, toDate: today };
    case 'last3':
      return { fromDate: addDaysIso(today, -2), toDate: today };
    case 'last7':
      return { fromDate: addDaysIso(today, -6), toDate: today };
    case 'last15':
      return { fromDate: addDaysIso(today, -14), toDate: today };
    case 'last30':
      return { fromDate: addDaysIso(today, -29), toDate: today };
    case 'custom':
      return {
        fromDate: custom?.fromDate ?? today,
        toDate: custom?.toDate ?? today,
      };
  }
}

export function formatDateRangeLabel(range: DateRange): string {
  if (range.fromDate === range.toDate) return range.fromDate;
  return `${range.fromDate} — ${range.toDate}`;
}
