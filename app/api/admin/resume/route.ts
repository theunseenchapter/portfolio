import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { guard, json, touch } from '@/lib/auth';
import { BusyError, exclusive } from '@/lib/gitsync';
import { LIMITS, P, checkPdf, isArchiveName, deleteArchive, listArchive, restoreArchive, resumeInfo, saveResume } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const g = guard(req);
  if ('res' in g) return g.res;
  const file = req.nextUrl.searchParams.get('file');
  if (file) { // download an archived resume
    if (!isArchiveName(file)) return json({ error: 'Invalid file.' }, 400);
    try { return new NextResponse(new Uint8Array(await fs.readFile(path.join(P.archive, file))), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${file}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
    catch { return json({ error: 'Not found.' }, 404); }
  }
  return touch(json({ current: await resumeInfo(), archive: await listArchive(), maxBytes: LIMITS.pdf }), req, g.session);
}

/** multipart upload (field "file") replaces the current resume; the previous one is archived. */
export async function POST(req: NextRequest) {
  const g = guard(req, true);
  if ('res' in g) return g.res;
  if (Number(req.headers.get('content-length') ?? 0) > LIMITS.pdf + 65536) return json({ error: 'PDF is too large (max 5 MB).' }, 413);
  let file: FormDataEntryValue | null = null;
  try { file = (await req.formData()).get('file'); } catch { return json({ error: 'Invalid upload.' }, 400); }
  if (!(file instanceof File)) return json({ error: 'No file received.' }, 400);
  if (!/\.pdf$/i.test(file.name)) return json({ error: 'File must have a .pdf extension.' }, 400);
  if (file.type && !['application/pdf', 'application/x-pdf', 'application/octet-stream'].includes(file.type)) return json({ error: 'File must be a PDF.' }, 400);
  const buf = Buffer.from(await file.arrayBuffer());
  const bad = checkPdf(buf);
  if (bad) return json({ error: bad }, 400);
  try {
    const current = await exclusive(() => saveResume(buf, file.name), { wait: true }); // never mid-commit
    return touch(json({ ok: true, current, archive: await listArchive() }), req, g.session);
  } catch (e) { if (e instanceof BusyError) return json({ error: 'A save is in progress. Try again in a moment.' }, 409); throw e; }
}

/** { action: 'restore' | 'delete', file } for archived resumes */
export async function PATCH(req: NextRequest) {
  const g = guard(req, true);
  if ('res' in g) return g.res;
  const b = await req.json().catch(() => ({}));
  if (b?.action !== 'restore' && b?.action !== 'delete') return json({ error: 'Unknown action.' }, 400);
  try {
    const bad = await exclusive(async () => {
      if (b.action === 'restore') return (await restoreArchive(String(b.file))) ? null : json({ error: 'Archive not found.' }, 404);
      return (await deleteArchive(String(b.file))) ? null : json({ error: 'Invalid file.' }, 400);
    }, { wait: true });
    if (bad) return bad;
  } catch (e) { if (e instanceof BusyError) return json({ error: 'A save is in progress. Try again in a moment.' }, 409); throw e; }
  return touch(json({ ok: true, current: await resumeInfo(), archive: await listArchive() }), req, g.session);
}
