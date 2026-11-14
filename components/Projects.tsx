'use client';

import { useState } from 'react';

const projects = [
  { no: '01', title: 'DataScope', kind: 'Database intelligence / operations', description: 'A database intelligence and operations platform for understanding complex schemas before making decisions on top of them.', tech: ['Python', 'FastAPI', 'PostgreSQL', 'React'], accent: 'cobalt' },
  { no: '02', title: 'MediSource', kind: 'Agentic AI / medicine ordering', description: 'A multi-agent medicine-ordering platform with prescription analysis and automated recommendations backed by order-management APIs.', tech: ['Agentic AI', 'RAG', 'NLP', 'APIs'], accent: 'vermilion', status: 'Under development' },
  { no: '03', title: 'Home Alchemy', kind: 'Generative interiors', description: 'An AI-powered interior design application using fine-tuned generative models to turn a room brief into a visual direction.', tech: ['Next.js', 'Python', 'PyTorch', 'Stable Diffusion'], accent: 'dark', metric: '60% faster inference' },
  { no: '04', title: 'ClipBridge', kind: 'Cross-device utility', description: 'A small, focused utility for transferring clipboard content between devices.', tech: [] },
  { no: '05', title: 'Tangerine for Windows', kind: 'Desktop utility', description: 'Contextual file-conversion workflows with deep Windows desktop integration.', tech: ['Qt', 'PySide6', 'Win32/OLE'], accent: 'vermilion' },
  { no: '06', title: 'ContextWord', kind: 'Privacy-first dictionary', description: 'A browser dictionary that understands the sentence around a word, with offline lookup and pronunciation.', tech: ['TypeScript', 'Chromium APIs'], accent: 'cobalt' },
  { no: '07', title: 'Excel Validation Dashboard', kind: 'Data quality / operations', description: 'Upload workbooks, validate them against backend templates and surface data-quality issues.', tech: ['React', 'TypeScript', 'Material UI', 'React Query'], accent: 'dark' },
];

export default function Projects() {
  const [activeLayer, setActiveLayer] = useState(0);
  const revealLayers = ['Schema layer', 'SQL validation', 'Safety + intelligence'];

  return (
    <section id="work" className="section-pad bg-paper-deep">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-20 flex items-end justify-between border-b rule pb-5">
          <div><p className="eyebrow mb-4">02 / Selected works</p><h2 className="font-editorial text-6xl leading-none tracking-[-0.05em] md:text-8xl">Built with<br /><span className="text-cobalt">intent.</span></h2></div>
          <p className="hidden max-w-xs text-right text-sm leading-6 text-muted md:block">A working archive of systems, experiments and practical tools.</p>
        </div>

        <article className="mb-24 grid overflow-hidden border-y rule lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-ink p-7 text-paper md:p-12">
            <div className="mb-20 flex items-start justify-between"><span className="eyebrow text-paper/50">Project {projects[0].no}</span><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cobalt">The reveal</span></div>
            <h3 className="font-editorial text-7xl leading-[0.82] tracking-[-0.05em] md:text-9xl">{projects[0].title}</h3>
            <p className="mt-8 max-w-md text-sm leading-6 text-paper/60">{projects[0].description}</p>
            <div className="mt-10 flex flex-wrap gap-2">{projects[0].tech.map((item) => <span key={item} className="border border-paper/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-paper/60">{item}</span>)}</div>
          </div>
          <div className="relative min-h-[440px] overflow-hidden bg-[#c6c6bf] p-7 md:p-12">
            <div className={`absolute inset-0 transition-opacity duration-500 ${activeLayer >= 1 ? 'opacity-100' : 'opacity-0'}`}><div className="absolute left-[18%] top-[22%] h-48 w-48 border border-cobalt/60" /><div className="absolute right-[18%] top-[34%] h-32 w-64 border-y border-cobalt/60" /><div className="absolute bottom-[18%] left-[28%] h-20 w-72 border border-cobalt/60" /></div>
            <div className={`absolute inset-0 transition-opacity duration-500 ${activeLayer >= 2 ? 'opacity-100' : 'opacity-0'}`}><div className="absolute left-[25%] top-[30%] h-40 w-40 rotate-45 border-2 border-vermilion bg-vermilion/10" /><div className="absolute bottom-[25%] right-[23%] h-28 w-28 rounded-full border-2 border-vermilion" /></div>
            <div className="relative z-10 flex h-full flex-col justify-between"><div className="flex justify-between"><span className="eyebrow">Layered system map</span><span className="font-mono text-xs text-cobalt">0{activeLayer + 1} / 03</span></div><div className="mx-auto flex h-48 w-48 items-center justify-center border border-ink/50 bg-paper/40 backdrop-blur-sm"><div className="h-24 w-24 rotate-45 border border-ink/70 bg-paper/50" /></div><div><div className="mb-4 flex flex-wrap gap-2">{revealLayers.map((layer, index) => <button key={layer} type="button" onClick={() => setActiveLayer(index)} aria-pressed={activeLayer === index} className={`border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${activeLayer === index ? 'border-ink bg-ink text-paper' : 'border-ink/30 hover:border-ink'}`}>{layer}</button>)}</div><p className="max-w-sm text-xs leading-5 text-muted">Use the controls to examine the system. Every layer is available without relying on motion or hover.</p></div></div>
          </div>
        </article>

        <div className="grid border-t rule md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(1).map((project) => <a href="#contact" key={project.title} className="group min-h-[300px] border-b border-r rule p-7 transition-colors hover:bg-paper md:p-10"><div className="mb-16 flex justify-between"><span className="eyebrow">{project.no} / {project.kind}</span>{project.status && <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-vermilion">● {project.status}</span>}</div><div className={`mb-7 h-12 w-12 ${project.accent === 'dark' ? 'bg-ink' : project.accent === 'vermilion' ? 'bg-vermilion' : 'bg-cobalt'} transition-transform duration-300 group-hover:rotate-12`} /><h3 className="font-editorial text-4xl leading-none tracking-[-0.03em]">{project.title}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-muted">{project.description}</p>{project.metric && <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">{project.metric}</p>}<div className="mt-7 flex flex-wrap gap-2">{project.tech.map((item) => <span key={item} className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{item}</span>)}</div></a>)}
        </div>
      </div>
    </section>
  );
}
