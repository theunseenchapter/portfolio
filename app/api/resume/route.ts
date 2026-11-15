import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { P, resumeInfo } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public, stable resume link. Always serves the latest uploaded PDF. ?download=1 forces a download. */
export async function GET(req: NextRequest) {
  const info = await resumeInfo();
  if (!info) return NextResponse.redirect(new URL('/resume', req.url));
  const buf = await fs.readFile(P.resume);
  const dl = req.nextUrl.searchParams.get('download') === '1';
  return new NextResponse(new Uint8Array(buf), { headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename="${info.name.replace(/[^\w.() -]/g, '_')}"`,
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox",
  } });
}
