import { NextRequest } from 'next/server';
import { expiresAt, json, readSession, touch } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public-safe: only says whether the caller holds a valid session. ?touch=1 extends the idle window. */
export async function GET(req: NextRequest) {
  const s = readSession(req);
  if (!s) return json({ authenticated: false });
  const res = json({ authenticated: true, expiresAt: req.nextUrl.searchParams.get('touch') && req.headers.get('x-requested-with') === 'portfolio-admin' ? Date.now() + 1800000 : expiresAt(s) });
  if (req.nextUrl.searchParams.get('touch') && req.headers.get('x-requested-with') === 'portfolio-admin') touch(res, req, s);
  return res;
}
