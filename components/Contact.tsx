'use client';

import { useState } from 'react';

const answers: Record<string, string> = {
  database: 'DataScope explores 680+ tables and 13K+ columns, with query validation and SQL safety checks across a complex database.',
  ai: 'MediSource is a multi-agent medicine-ordering platform under development. Home Alchemy uses fine-tuned generative models and reduced inference time by 60%.',
  synoriq: 'At Synoriq, Vivek builds Java, Spring Boot, Python and SQL backend services, including ETL, migration and reconciliation workflows. He improved report execution time from 2 minutes to 20 seconds.',
  technologies: 'Vivek works across Python, Java, Spring Boot, SQL, PostgreSQL, React, Next.js, TypeScript, PyTorch, RAG and APIs.',
};

export default function Contact() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const ask = () => {
    const key = Object.keys(answers).find((item) => question.toLowerCase().includes(item));
    setAnswer(key ? answers[key] : 'Try asking about DataScope, AI, Synoriq or technologies. This guide answers from the verified portfolio only.');
  };

  return <section id="contact" className="section-pad bg-cobalt text-paper"><div className="mx-auto max-w-[1440px]"><div className="grid gap-20 lg:grid-cols-[1fr_0.75fr]"><div><p className="eyebrow text-paper/60">06 / Open channel</p><h2 className="mt-12 max-w-3xl font-editorial text-7xl leading-[0.82] tracking-[-0.05em] md:text-[9rem]">Have something<br /><span className="text-paper/50">interesting</span><br />in mind?</h2><p className="mt-12 text-lg text-paper/70">Let&apos;s build something meaningful.</p><div className="mt-10 flex flex-wrap gap-5 font-mono text-[10px] uppercase tracking-[0.16em]"><a className="border-b border-paper/40 pb-2 hover:border-paper" href="mailto:vivek.yadav03@gmail.com">Email</a><a className="border-b border-paper/40 pb-2 hover:border-paper" href="https://github.com/theunseenchapter" target="_blank" rel="noreferrer">GitHub ↗</a><a className="border-b border-paper/40 pb-2 hover:border-paper" href="https://www.linkedin.com/in/vivekyadav03" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></div><div className="self-end border-t border-paper/30 pt-6"><p className="eyebrow text-paper/60">Curious about something? Ask.</p><div className="mt-8 flex border-b border-paper/40 pb-3"><label htmlFor="guide-question" className="sr-only">Ask the portfolio guide</label><input id="guide-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && ask()} placeholder="e.g. What did he build at Synoriq?" className="min-w-0 flex-1 bg-transparent text-sm text-paper outline-none placeholder:text-paper/40" /><button type="button" onClick={ask} className="font-mono text-[10px] uppercase tracking-[0.15em] text-paper/70 hover:text-paper">Ask ↗</button></div>{answer && <p className="mt-6 text-sm leading-6 text-paper/75">{answer}</p>}<p className="mt-10 font-mono text-[9px] uppercase tracking-[0.15em] text-paper/40">Local knowledge-base prototype / no external model connected</p></div></div></div></section>;
}
