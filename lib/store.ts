import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { defaultContent } from '@/data/arcade';
import type { Content } from './content-types';
import { validateContent } from './validate';

/* File-based storage (no database). Everything lives under ./content so Phase 2 can commit it to GitHub. */
const ROOT = path.join(process.cwd(), 'content');
export const P = {
  content: path.join(ROOT, 'portfolio.json'),
  backups: path.join(ROOT, 'backups'),
  resumeDir: path.join(ROOT, 'resume'),
  resume: path.join(ROOT, 'resume', 'current.pdf'),
  resumeMeta: path.join(ROOT, 'resume', 'current.json'),
  archive: path.join(ROOT, 'resume', 'archive'),
  media: path.join(ROOT, 'media'),
};
export const LIMITS = { pdf: 5 * 1024 * 1024, image: 3 * 1024 * 1024, json: 1024 * 1024 };

async function atomicWrite(file: string, data: string | Buffer) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}
const exists = (f: string) => fs.access(f).then(() => true, () => false);
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

/* ------------------------------ content ------------------------------ */
export async function readContent(): Promise<Content> {
  try {
    const v = validateContent(JSON.parse(await fs.readFile(P.content, 'utf8')));
    if (v.ok) return v.content;
  } catch { /* missing or corrupt: fall back to the built-in seed */ }
  return defaultContent;
}

export async function writeContent(c: Content): Promise<Content> {
  const next: Content = { ...c, updatedAt: new Date().toISOString() };
  if (await exists(P.content)) {
    await fs.mkdir(P.backups, { recursive: true });
    await fs.copyFile(P.content, path.join(P.backups, `portfolio-${stamp()}.json`));
    const old = (await fs.readdir(P.backups)).filter((f) => f.startsWith('portfolio-')).sort();
    await Promise.all(old.slice(0, -15).map((f) => fs.unlink(path.join(P.backups, f))));
  }
  await atomicWrite(P.content, JSON.stringify(next, null, 2) + '\n');
  return next;
}

/* ------------------------------- resume ------------------------------- */
export type ResumeMeta = { name: string; size: number; uploadedAt: string };
export type ArchiveEntry = ResumeMeta & { file: string };
const ARCH = /^resume-\d{8}T\d{6}Z(-[a-f0-9]{4})?\.pdf$/;
export const isArchiveName = (n: string) => ARCH.test(n);

export async function resumeInfo(): Promise<ResumeMeta | null> {
  if (!(await exists(P.resume))) return null;
  try { return JSON.parse(await fs.readFile(P.resumeMeta, 'utf8')); }
  catch { const st = await fs.stat(P.resume); return { name: 'resume.pdf', size: st.size, uploadedAt: st.mtime.toISOString() }; }
}

export function checkPdf(buf: Buffer): string | null {
  if (!buf.length) return 'The file is empty.';
  if (buf.length > LIMITS.pdf) return `PDF is larger than ${LIMITS.pdf / 1048576} MB.`;
  if (!buf.subarray(0, 1024).includes('%PDF-')) return 'This is not a valid PDF file.';
  if (!buf.subarray(Math.max(0, buf.length - 2048)).includes('%%EOF')) return 'The PDF looks truncated or corrupt.';
  return null;
}

async function archiveCurrent() {
  const info = await resumeInfo();
  if (!info) return;
  await fs.mkdir(P.archive, { recursive: true });
  const base = `resume-${stamp()}${(await exists(path.join(P.archive, `resume-${stamp()}.pdf`))) ? '-' + crypto.randomBytes(2).toString('hex') : ''}`;
  await fs.copyFile(P.resume, path.join(P.archive, `${base}.pdf`));
  await atomicWrite(path.join(P.archive, `${base}.json`), JSON.stringify(info));
  const pdfs = (await fs.readdir(P.archive)).filter(isArchiveName).sort();
  for (const f of pdfs.slice(0, -10)) await Promise.all([fs.unlink(path.join(P.archive, f)), fs.unlink(path.join(P.archive, f.replace(/\.pdf$/, '.json'))).catch(() => {})]);
}

export async function saveResume(buf: Buffer, name: string): Promise<ResumeMeta> {
  await archiveCurrent();
  const meta: ResumeMeta = { name: name.replace(/[^\w .()-]/g, '_').slice(0, 100) || 'resume.pdf', size: buf.length, uploadedAt: new Date().toISOString() };
  await atomicWrite(P.resume, buf);
  await atomicWrite(P.resumeMeta, JSON.stringify(meta));
  return meta;
}

export async function listArchive(): Promise<ArchiveEntry[]> {
  if (!(await exists(P.archive))) return [];
  const out: ArchiveEntry[] = [];
  for (const file of (await fs.readdir(P.archive)).filter(isArchiveName).sort().reverse()) {
    const st = await fs.stat(path.join(P.archive, file));
    let meta: ResumeMeta = { name: file, size: st.size, uploadedAt: st.mtime.toISOString() };
    try { meta = JSON.parse(await fs.readFile(path.join(P.archive, file.replace(/\.pdf$/, '.json')), 'utf8')); } catch { /* sidecar optional */ }
    out.push({ ...meta, file });
  }
  return out;
}
export async function restoreArchive(file: string): Promise<ResumeMeta | null> {
  if (!isArchiveName(file)) return null;
  const src = path.join(P.archive, file);
  if (!(await exists(src))) return null;
  const buf = await fs.readFile(src);
  let name = 'resume.pdf';
  try { name = JSON.parse(await fs.readFile(src.replace(/\.pdf$/, '.json'), 'utf8')).name; } catch { /* optional */ }
  return saveResume(buf, name);
}
export async function deleteArchive(file: string) {
  if (!isArchiveName(file)) return false;
  await fs.unlink(path.join(P.archive, file)).catch(() => {});
  await fs.unlink(path.join(P.archive, file.replace(/\.pdf$/, '.json'))).catch(() => {});
  return true;
}

/* -------------------------------- media -------------------------------- */
export const MEDIA_NAME = /^[A-Za-z0-9._-]{1,80}$/;
const SIGS: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: 'png', mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'gif', mime: 'image/gif', test: (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1')) },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
];
export const mimeFor = (name: string) => SIGS.find((s) => name.toLowerCase().endsWith('.' + s.ext))?.mime ?? (name.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : null);

export function checkImage(buf: Buffer): { ext: string } | string {
  if (!buf.length) return 'The file is empty.';
  if (buf.length > LIMITS.image) return `Image is larger than ${LIMITS.image / 1048576} MB.`;
  const sig = SIGS.find((s) => s.test(buf));
  return sig ? { ext: sig.ext } : 'Only PNG, JPG, GIF or WebP images are allowed (content is checked, not just the extension).';
}
export async function saveMedia(buf: Buffer, ext: string) {
  const name = `m-${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}.${ext}`;
  await atomicWrite(path.join(P.media, name), buf);
  return name;
}
export async function listMedia() {
  if (!(await exists(P.media))) return [];
  const used = JSON.stringify(await readContent());
  const out = [];
  for (const name of await fs.readdir(P.media)) {
    if (!MEDIA_NAME.test(name) || !mimeFor(name)) continue;
    const st = await fs.stat(path.join(P.media, name));
    out.push({ name, url: `/api/media/${name}`, size: st.size, uploadedAt: st.mtime.toISOString(), used: used.includes(`/api/media/${name}`) });
  }
  return out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
export async function deleteMedia(name: string) { if (MEDIA_NAME.test(name)) await fs.unlink(path.join(P.media, name)).catch(() => {}); }
export const mediaPath = (name: string) => path.join(P.media, name);
