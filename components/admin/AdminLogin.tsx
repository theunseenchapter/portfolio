'use client';

import { useRouter } from 'next/navigation';
import { PasscodeModal } from './EditButton';

export default function AdminLogin() {
  const router = useRouter();
  return <PasscodeModal onClose={() => router.push('/')} onDone={() => router.refresh()} />;
}
