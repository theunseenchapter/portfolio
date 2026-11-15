import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import AdminApp from '@/components/admin/AdminApp';
import AdminLogin from '@/components/admin/AdminLogin';
import { COOKIE, expiresAt, readSessionToken } from '@/lib/auth';
import { listArchive, listMedia, readContent, resumeInfo } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin — Vivek Arcade', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = readSessionToken(cookies().get(COOKIE)?.value);
  if (!session) return <AdminLogin />;
  const [content, resume, archive, media] = await Promise.all([readContent(), resumeInfo(), listArchive(), listMedia()]);
  return <AdminApp initial={{ content, resume, archive, media, expiresAt: expiresAt(session) }} />;
}
