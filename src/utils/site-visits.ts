/**
 * Lightweight client-side visit log for the admin dashboard (demo / proxy for “site traffic”).
 * Replace with server-side analytics when available.
 */
const STORAGE_KEY = 'tiwater_public_session_hits_v1';

export function recordPublicSiteHit(): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/admin') || path.startsWith('/login')) return;
  if (sessionStorage.getItem('tiwater_visit_counted') === '1') return;
  sessionStorage.setItem('tiwater_visit_counted', '1');

  const now = Date.now();
  const raw = localStorage.getItem(STORAGE_KEY);
  const hits: number[] = raw ? (JSON.parse(raw) as number[]) : [];
  hits.push(now);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const cutoff = now - weekMs;
  const pruned = hits.filter((t) => t >= cutoff).slice(-2000);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
}

export function getSiteHitsLast7Days(): number {
  if (typeof window === 'undefined') return 0;
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const raw = localStorage.getItem(STORAGE_KEY);
  const hits: number[] = raw ? (JSON.parse(raw) as number[]) : [];
  return hits.filter((t) => now - t <= weekMs).length;
}
