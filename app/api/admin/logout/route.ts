import { NextRequest } from 'next/server';
import { clearCookie, guard, json, readSession, revoke } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const s = readSession(req);
  const g = s ? guard(req, true) : null;
  if (g && 'res' in g) return g.res;
  if (s) revoke(s);
  const res = json({ ok: true });
  clearCookie(res);
  return res;
}
