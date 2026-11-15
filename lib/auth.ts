import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/* Server-side auth. The passcode only ever lives in process.env.ADMIN_PASSCODE (.env).
   Sessions are HMAC-signed, HttpOnly, SameSite=Strict cookies with an absolute and an idle expiry. */
export const COOKIE = 'admin_session';
export const ABS_MS = 4 * 60 * 60 * 1000;   // hard limit: 4 hours
export const IDLE_MS = 30 * 60 * 1000;      // idle limit: 30 minutes without admin activity
const MAX_FAILS = 5, LOCK_MS = 15 * 60 * 1000;

export type Session = { sid: string; iat: number; la: number };
const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const sha = (s: string) => crypto.createHash('sha256').update(s).digest();

function secret(): Buffer | null {
  const pass = process.env.ADMIN_PASSCODE;
  if (!pass) return null;
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? sha('s:' + s) : sha('derived:' + pass);
}
const sign = (data: string, key: Buffer) => crypto.createHmac('sha256', key).update(data).digest('base64url');

const revoked = new Map<string, number>(); // sid -> expiry (in-memory; sessions also expire on their own)
const fails = new Map<string, { n: number; lock: number; first: number }>();

export function checkPasscode(input: string): boolean {
  const real = process.env.ADMIN_PASSCODE;
  if (!real || typeof input !== 'string' || input.length > 200) return false;
  return crypto.timingSafeEqual(sha(input), sha(real));
}

export const clientIp = (req: NextRequest) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';

export function lockState(ip: string): number { // ms remaining of lockout
  const f = fails.get(ip);
  return f && f.lock > Date.now() ? f.lock - Date.now() : 0;
}
export function recordFail(ip: string) {
  const now = Date.now();
  const f = fails.get(ip);
  const cur = !f || now - f.first > LOCK_MS ? { n: 0, lock: 0, first: now } : f;
  cur.n += 1;
  if (cur.n >= MAX_FAILS) { cur.lock = now + LOCK_MS; cur.n = 0; cur.first = now; }
  fails.set(ip, cur);
}
export const clearFails = (ip: string) => fails.delete(ip);

export function issue(prev?: Session): { token: string; session: Session } | null {
  const key = secret();
  if (!key) return null;
  const now = Date.now();
  const session: Session = { sid: prev?.sid ?? crypto.randomBytes(16).toString('hex'), iat: prev?.iat ?? now, la: now };
  const body = b64(JSON.stringify(session));
  return { token: `${body}.${sign(body, key)}`, session };
}

export function readSession(req: NextRequest): Session | null {
  const key = secret();
  const tok = req.cookies.get(COOKIE)?.value;
  if (!key || !tok) return null;
  const [body, sig] = tok.split('.');
  if (!body || !sig) return null;
  const good = sign(body, key);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    const now = Date.now();
    if (typeof s.sid !== 'string' || now > s.iat + ABS_MS || now > s.la + IDLE_MS || revoked.has(s.sid)) return null;
    return s;
  } catch { return null; }
}

/** Verify a raw cookie value (for server components that use next/headers). */
export function readSessionToken(tok: string | undefined): Session | null {
  return readSession({ cookies: { get: () => (tok ? { value: tok } : undefined) } } as unknown as NextRequest);
}

export const expiresAt = (s: Session) => Math.min(s.iat + ABS_MS, s.la + IDLE_MS);

export function setCookie(res: NextResponse, req: NextRequest, prev?: Session): Session | null {
  const t = issue(prev);
  if (!t) return null;
  const https = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  res.cookies.set(COOKIE, t.token, { httpOnly: true, sameSite: 'strict', secure: https, path: '/', maxAge: Math.floor(ABS_MS / 1000) });
  return t.session;
}
export function clearCookie(res: NextResponse) { res.cookies.set(COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 }); }
export function revoke(s: Session) {
  revoked.set(s.sid, s.iat + ABS_MS);
  for (const [k, v] of revoked) if (v < Date.now()) revoked.delete(k);
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

/** Guard for every admin API. Returns the session, or a response to return immediately. */
export function guard(req: NextRequest, write = false): { session: Session } | { res: NextResponse } {
  const session = readSession(req);
  if (!session) return { res: json({ error: 'unauthorized' }, 401) };
  if (write || req.method !== 'GET') {
    const origin = req.headers.get('origin');
    if (origin) { try { if (new URL(origin).host !== req.headers.get('host')) return { res: json({ error: 'forbidden' }, 403) }; } catch { return { res: json({ error: 'forbidden' }, 403) }; } }
    if (req.headers.get('x-requested-with') !== 'portfolio-admin') return { res: json({ error: 'forbidden' }, 403) };
  }
  return { session };
}
/** Attach a refreshed cookie (sliding idle window) to a successful admin response. */
export function touch(res: NextResponse, req: NextRequest, s: Session) { setCookie(res, req, s); return res; }
