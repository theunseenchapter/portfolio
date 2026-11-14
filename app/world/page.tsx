'use client';

import dynamic from 'next/dynamic';

const World = dynamic(() => import('@/components/world/World'), { ssr: false });

export default function Home() {
  return <World />;
}
