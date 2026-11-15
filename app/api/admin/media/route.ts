import { NextRequest } from 'next/server';
import { guard, json, touch } from '@/lib/auth';
import { BusyError, exclusive } from '@/lib/gitsync';
import { LIMITS, MEDIA_NAME, checkImage, deleteMedia, listMedia, saveMedia } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const g = guard(req);
  if ('res' in g) return g.res;
  return touch(json({ media: await listMedia() }), req, g.session);
}

export async function POST(req: NextRequest) {
  const g = guard(req, true);
  if ('res' in g) return g.res;
  if (Number(req.headers.get('content-length') ?? 0) > LIMITS.image + 65536) return json({ error: 'Image is too large (max 3 MB).' }, 413);
  let file: FormDataEntryValue | null = null;
  try { file = (await req.formData()).get('file'); } catch { return json({ error: 'Invalid upload.' }, 400); }
  if (!(file instanceof File)) return json({ error: 'No file received.' }, 400);
  const r = checkImage(Buffer.from(await file.arrayBuffer()));
  if (typeof r === 'string') return json({ error: r }, 400);
  let name: string;
  try { name = await exclusive(async () => saveMedia(Buffer.from(await file.arrayBuffer()), r.ext), { wait: true }); }
  catch (e) { if (e instanceof BusyError) return json({ error: 'A save is in progress. Try again in a moment.' }, 409); throw e; }
  return touch(json({ ok: true, name, url: `/api/media/${name}`, media: await listMedia() }), req, g.session);
}

export async function DELETE(req: NextRequest) {
  const g = guard(req, true);
  if ('res' in g) return g.res;
  const name = req.nextUrl.searchParams.get('name') ?? '';
  if (!MEDIA_NAME.test(name)) return json({ error: 'Invalid name.' }, 400);
  const item = (await listMedia()).find((m) => m.name === name);
  if (item?.used && req.nextUrl.searchParams.get('force') !== '1') return json({ error: 'This image is used in your content.', used: true }, 409);
  try { await exclusive(() => deleteMedia(name), { wait: true }); }
  catch (e) { if (e instanceof BusyError) return json({ error: 'A save is in progress. Try again in a moment.' }, 409); throw e; }
  return touch(json({ ok: true, media: await listMedia() }), req, g.session);
}
