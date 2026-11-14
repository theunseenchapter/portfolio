import type { Metadata } from 'next';
import Console from '@/components/arcade/Console';

export const metadata: Metadata = {
  title: 'Vivek Arcade — Vivek Yadav, Software Engineer',
  description: 'A handheld-console portfolio. Power on, press start, explore projects, experience, skills and contact.',
};

export default function Home() {
  return <Console />;
}
