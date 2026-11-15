import { NextRequest } from 'next/server';
import { BusyError, deploymentFor, gitStatus, syncSaved } from '@/lib/gitsync';
import { guard, json, touch } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sync status for the dashboard. Local only (no network) unless ?deployment=1, which asks GitHub about the last pushed commit. */
export async function GET(req: NextRequest) {
  const g = guard(req);
  if ('res' in g) return g.res;
  const status = await gitStatus();
  const sha = status.lastSuccess?.sha;
  const deployment = req.nextUrl.searchParams.get('deployment') === '1' && sha && /^[0-9a-f]{7,40}$/.test(sha) ? await deploymentFor(sha).catch(() => null) : undefined;
  return touch(json({ status, deployment }), req, g.session);
}

/** Retry for changes that are already saved locally: commits anything pending and pushes.
    action "retry" = normal; "keep-local" = on a conflict, prefer this site's version of the conflicting lines (explicit choice). */
export async function POST(req: NextRequest) {
  const g = guard(req, true);
  if ('res' in g) return g.res;
  const b = await req.json().catch(() => ({}));
  if (b?.action !== 'retry' && b?.action !== 'keep-local') return json({ error: 'Unknown action.' }, 400);
  try {
    const sync = await syncSaved({ keepLocal: b.action === 'keep-local' });
    return touch(json({ ok: true, sync, status: await gitStatus() }), req, g.session);
  } catch (e) {
    if (e instanceof BusyError) return json({ error: 'Another save is already in progress.', busy: true }, 409);
    throw e;
  }
}
