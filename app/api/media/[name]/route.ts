import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { MEDIA_NAME, mediaPath, mimeFor } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: { name: string } }) {
  const mime = mimeFor(params.name);
  if (!MEDIA_NAME.test(params.name) || !mime) return new NextResponse('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(mediaPath(params.name));
    return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new NextResponse('Not found', { status: 404 }); }
}
