export class AuthError extends Error {}
export type ApiError = Error & { details?: string[]; status?: number; used?: boolean };

/** Fetch helper for admin APIs: same-origin cookies + the CSRF header the server requires. */
export async function api<T = any>(url: string, o: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = { 'x-requested-with': 'portfolio-admin' };
  let body: BodyInit | undefined;
  if (o.form) body = o.form;
  else if (o.body !== undefined) { headers['content-type'] = 'application/json'; body = JSON.stringify(o.body); }
  const r = await fetch(url, { method: o.method ?? 'GET', headers, body, cache: 'no-store', credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) throw new AuthError('Session expired');
  if (!r.ok) throw Object.assign(new Error(j.error || 'Request failed'), { details: j.details, status: r.status, used: j.used }) as ApiError;
  return j as T;
}
export const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'never');
