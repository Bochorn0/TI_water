export function getApiErrorMessage(err: unknown, fallback = 'Algo salió mal'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as {
      response?: { data?: { message?: string; errors?: { msg?: string }[] } };
    };
    const d = ax.response?.data;
    if (typeof d?.message === 'string') return d.message;
    const first = d?.errors?.[0];
    if (first && typeof first.msg === 'string') return first.msg;
  }
  return fallback;
}
