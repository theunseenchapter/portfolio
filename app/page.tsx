import type { Metadata } from 'next';
import Console from '@/components/arcade/Console';
import { readContent, resumeInfo } from '@/lib/store';
import { RESUME_URL } from '@/lib/content-types';

export const dynamic = 'force-dynamic'; // content is edited at runtime from the admin dashboard

export const metadata: Metadata = {
  title: 'Vivek Arcade — Vivek Yadav, Software Engineer',
  description: 'A handheld-console portfolio. Power on, press start, explore projects, experience, skills and contact.',
};

export default async function Home() {
  const [content, resume] = await Promise.all([readContent(), resumeInfo()]);
  const imageUrl = process.env.NEXT_PUBLIC_ABOUT_IMAGE_URL?.trim();
  const sections = imageUrl
    ? content.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          pages: item.pages.map((page) => ({
            ...page,
            blocks: page.blocks.map((block) => (
              block.t === 'img' && block.src === 'https://env.local/about-image'
                ? { ...block, src: imageUrl }
                : block
            )),
          })),
        })),
      }))
    : content.sections;
  return <Console content={{ sections, site: content.site }} resumeHref={resume ? RESUME_URL : '/resume'} />;
}
