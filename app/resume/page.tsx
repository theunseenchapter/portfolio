import Link from 'next/link';
import { PrintButton } from "@/components/PrintButton";
import { readContent } from '@/lib/store';

export const metadata = { title: 'Resume — Vivek Yadav' };

const H = ({ children }: { children: string }) => <h2 className="mono mb-3 mt-8 border-b border-neutral-300 pb-1 !text-[11px]">{children}</h2>;

export const dynamic = 'force-dynamic';

export default async function Resume() {
  const { profile: { edu, jobs, me, projects, skills: skillGroups } } = await readContent();
  const skills = Object.fromEntries(skillGroups.map((g) => [g.name, g.items]));
  return (
    <div className="min-h-screen py-10 print:py-0">
      <div className="noprint wrap mb-6 flex max-w-3xl justify-between"><Link href="/" className="btn">← Back</Link><PrintButton /></div>
      <main className="sheet mx-auto max-w-3xl rounded-2xl p-8 text-sm leading-6 md:p-12 print:max-w-none print:rounded-none print:p-0">
        <h1 className="serif text-5xl">{me.name}</h1>
        <p className="mt-2 text-neutral-600">Software Engineer · Mumbai, India · <a href={`mailto:${me.email}`}>{me.email}</a> · <a href={me.github}>GitHub</a> · <a href={me.linkedin}>LinkedIn</a></p>
        <H>Experience</H>
        {jobs.map((j) => (
          <div key={j.org} className="mb-4">
            <div className="flex justify-between font-semibold"><span>{j.org} — {j.role}</span><span className="font-normal text-neutral-500">{j.when}</span></div>
            <ul className="mt-1 list-disc pl-5 text-neutral-700">{j.pts.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        ))}
        <H>Projects</H>
        {projects.map((p) => <p key={p.t} className="mb-1.5"><b>{p.t}</b> <span className="text-neutral-500">({p.s.join(', ')})</span> — {p.d}</p>)}
        <H>Skills</H>
        {Object.entries(skills).map(([k, v]) => <p key={k}><b>{k}:</b> {v.join(', ')}</p>)}
        <H>Education</H>
        <div className="flex justify-between"><span><b>{edu.deg}</b> — {edu.school}</span><span className="text-neutral-500">{edu.meta}</span></div>
        <p className="text-neutral-700">{edu.extra}</p>
      </main>
    </div>
  );
}
