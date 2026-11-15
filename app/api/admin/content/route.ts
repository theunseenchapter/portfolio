import { NextRequest } from 'next/server';
import { expiresAt, guard, json, touch } from '@/lib/auth';
import { BusyError, saveAndSync } from '@/lib/gitsync';
import { LIMITS, listArchive, readContent, resumeInfo, listMedia } from '@/lib/store';
import { validateContent } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const g = guard(req);
  if ('res' in g) return g.res;
  const [content, resume, archive, media] = await Promise.all([readContent(), resumeInfo(), listArchive(), listMedia()]);
  return touch(json({ content, resume, archive: archive.length, media: media.length, expiresAt: expiresAt(g.session) }), req, g.session);
}

export async function PUT(req: NextRequest) {
  const g = guard(req, true);
  if ('res' in g) return g.res;
  const raw = await req.text();
  if (raw.length > LIMITS.json) return json({ error: 'Content is too large.' }, 413);
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const v = validateContent(data);
  if (!v.ok) return json({ error: 'Validation failed.', details: v.errors }, 422);
  /* validate -> write files -> commit -> push, under one lock. Local files are kept even when GitHub fails. */
  try {
    const out = await saveAndSync(v.content);
    if (out.kind === 'invalid') return json({ error: 'Validation failed.', details: out.errors }, 422);
    return touch(json({ ok: true, content: out.content, sync: out.sync }), req, g.session);
  } catch (e) {
    if (e instanceof BusyError) return json({ error: 'Another save is already in progress. Wait for it to finish, then try again.', busy: true }, 409);
    throw e;
  }
}
