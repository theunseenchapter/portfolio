import { Fx } from '@/components/Fx';
import { readContent } from '@/lib/store';

const delay = (i: number) => ({ transitionDelay: `${i * 80}ms` });

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { profile: { edu, jobs, me, projects, skills: skillGroups, stats } } = await readContent();
  const skills = Object.fromEntries(skillGroups.map((g) => [g.name, g.items]));
  return (
    <>
      <Fx />
      <header className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'var(--line)', background: 'rgba(9,9,11,.6)' }}>
        <nav className="wrap flex items-center justify-between py-4" aria-label="Primary">
          <a href="#top" className="serif text-2xl">Vivek<span style={{ color: 'var(--a)' }}>.</span></a>
          <div className="mono flex items-center gap-5 md:gap-8">
            {['work', 'experience', 'skills'].map((l) => <a key={l} href={`#${l}`} className="mute hidden transition hover:text-white sm:block">{l}</a>)}
            <a href="/resume" className="mute transition hover:text-white">resume</a>
            <a href="#contact" className="btn p !py-2">Contact</a>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="wrap grid min-h-screen items-center gap-12 pb-16 pt-32 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <p className="chip rv mb-8 inline-flex items-center gap-2"><span className="dot" />Software engineer · Mumbai, India</p>
            <h1 className="serif rv text-[clamp(3.6rem,10vw,8.5rem)] leading-[.88]" style={delay(1)}>
              I build systems<br />that <span className="grad">think</span> &<br />stay <span className="grad">reliable.</span>
            </h1>
            <p className="mute rv mt-8 max-w-xl text-lg leading-8" style={delay(2)}>
              Associate Software Engineer at Synoriq. I turn messy data and hard problems into dependable backends, sharp tooling and useful AI products.
            </p>
            <div className="rv mt-10 flex flex-wrap gap-3" style={delay(3)}>
              <a href="#work" className="btn p">View work ↓</a>
              <a href={`mailto:${me.email}`} className="btn">Say hello</a>
            </div>
          </div>
          <div className="rv hidden justify-self-center lg:block" style={delay(2)}><div className="orb"><i /><i /><i /><b>VY</b></div></div>
        </section>

        <section className="wrap">
          <div className="grid grid-cols-2 overflow-hidden rounded-3xl border md:grid-cols-4" style={{ borderColor: 'var(--line)' }}>
            {stats.map(([n, l], i) => (
              <div key={l} className="rv p-6 md:p-8" style={{ ...delay(i), borderLeft: i ? '1px solid var(--line)' : 0 }}>
                <p className="serif text-3xl md:text-5xl">{n}</p>
                <p className="mono mute mt-3 !text-[10px]">{l}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-20 overflow-hidden border-y py-5" style={{ borderColor: 'var(--line)' }} aria-hidden>
          <div className="mq">{[...Object.values(skills).flat(), ...Object.values(skills).flat()].map((t, i) => <span key={i} className="serif mute px-6 text-3xl">{t}<span className="px-6" style={{ color: 'var(--a)' }}>✦</span></span>)}</div>
        </div>

        <section id="work" className="wrap sec">
          <p className="mono mute rv mb-4">Selected work</p>
          <h2 className="h2 rv mb-14">Built with <span className="grad">intent.</span></h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {projects.map((p, i) => (
              <article key={p.t} className={`card rv flex min-h-[300px] flex-col p-7 md:p-8 ${p.wide ? 'lg:col-span-2' : ''}`} style={delay(i % 3)}>
                <div className="mono mute flex justify-between"><span>{String(i + 1).padStart(2, '0')} / {p.k}</span>{p.st && <span style={{ color: 'var(--a)' }}>● {p.st}</span>}</div>
                <h3 className="serif mt-10 text-4xl md:text-5xl">{p.t}</h3>
                <p className="mute mt-4 max-w-md text-[15px] leading-7">{p.d}</p>
                {p.m && <p className="mt-6"><span className="serif grad text-5xl">{p.m}</span> <span className="mono mute ml-2 !text-[10px]">{p.ml}</span></p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-8">{p.s.map((s) => <span key={s} className="chip">{s}</span>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="wrap sec">
          <p className="mono mute rv mb-4">Experience</p>
          <h2 className="h2 rv mb-14">In <span className="grad">practice.</span></h2>
          <div className="border-t" style={{ borderColor: 'var(--line)' }}>
            {jobs.map((j) => (
              <div key={j.org} className="rv grid gap-6 border-b py-10 md:grid-cols-[.35fr_.65fr]" style={{ borderColor: 'var(--line)' }}>
                <p className="mono mute">{j.when}</p>
                <div>
                  <h3 className="serif text-4xl md:text-5xl">{j.org}</h3>
                  <p className="mono mt-3" style={{ color: 'var(--a)' }}>{j.role}</p>
                  <ul className="mute mt-6 space-y-3 text-[15px] leading-7">{j.pts.map((t) => <li key={t} className="flex gap-3"><span style={{ color: 'var(--a)' }}>→</span>{t}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="skills" className="wrap sec pt-0">
          <p className="mono mute rv mb-4">Toolkit</p>
          <h2 className="h2 rv mb-14">Data before <span className="grad">decoration.</span></h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(skills).map(([k, v], i) => (
              <div key={k} className="card rv p-7" style={delay(i % 2)}>
                <p className="serif text-3xl">{k}</p>
                <div className="mt-5 flex flex-wrap gap-2">{v.map((s) => <span key={s} className="chip">{s}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="card rv mt-4 flex flex-col justify-between gap-4 p-7 md:flex-row md:items-center">
            <div><p className="mono mute">Education</p><p className="serif mt-2 text-3xl">{edu.deg}</p><p className="mute mt-1 text-sm">{edu.school}</p></div>
            <div className="md:text-right"><p className="mono" style={{ color: 'var(--a)' }}>{edu.meta}</p><p className="mute mt-1 text-sm">{edu.extra}</p></div>
          </div>
        </section>

        <section id="contact" className="wrap sec text-center">
          <p className="mono mute rv mb-6">Open channel</p>
          <h2 className="serif rv text-[clamp(3.2rem,9vw,8rem)] leading-[.9]">Let&apos;s build<br />something <span className="grad">meaningful.</span></h2>
          <div className="rv mt-12 flex flex-wrap justify-center gap-3">
            <a href={`mailto:${me.email}`} className="btn p">{me.email}</a>
            <a href={me.github} target="_blank" rel="noreferrer" className="btn">GitHub ↗</a>
            <a href={me.linkedin} target="_blank" rel="noreferrer" className="btn">LinkedIn ↗</a>
          </div>
        </section>
      </main>

      <footer className="wrap mono mute flex justify-between border-t py-8 !text-[10px]" style={{ borderColor: 'var(--line)' }}>
        <span>© 2026 {me.name}</span><span>Next.js · Tailwind</span>
      </footer>
    </>
  );
}
