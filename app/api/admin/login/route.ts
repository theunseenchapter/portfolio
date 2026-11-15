import { NextRequest } from 'next/server';
import { checkPasscode, clearFails, clientIp, IDLE_MS, json, lockState, recordFail, setCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSCODE) return json({ error: 'Admin mode is not configured on the server.' }, 503);
  const origin = req.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== req.headers.get('host')) return json({ error: 'forbidden' }, 403); } catch { return json({ error: 'forbidden' }, 403); } }
  const ip = clientIp(req);
  const lock = lockState(ip);
  if (lock) return json({ error: `Too many attempts. Try again in ${Math.ceil(lock / 60000)} min.` }, 429);
  let pass = '';
  try { const b = await req.json(); pass = typeof b?.passcode === 'string' ? b.passcode : ''; } catch { /* bad body */ }
  if (!checkPasscode(pass)) {
    recordFail(ip);
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return json({ error: 'Incorrect passcode.' }, 401);
  }
  clearFails(ip);
  const res = json({ ok: true, expiresAt: Date.now() + IDLE_MS });
  if (!setCookie(res, req)) return json({ error: 'Session could not be created.' }, 500);
  return res;
}
