'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { dests, tour, type Dest } from '@/data/world';
import { me } from '@/data/profile';
import { game } from '@/systems/game';
import type { Near } from '../world/Player';

type Props = {
  mode: '3d' | '2d'; setMode: (m: '3d' | '2d') => void; near: Near; focus: string | null; setFocus: (id: string | null) => void;
  selected: string | null; setSelected: (id: string | null) => void; tourIdx: number | null; stop: (i: number | null) => void;
  paused: boolean; setPaused: (v: boolean) => void; dir: boolean; setDir: (v: boolean) => void; fade: boolean; travel: (id: string) => void;
};

const find = (id: string | null) => dests.find((d) => d.id === id) ?? null;
const glass = 'border border-white/10 bg-[rgba(12,13,17,.72)] backdrop-blur-xl shadow-2xl shadow-black/40';
const pill = 'mono rounded-full border border-white/12 bg-[rgba(12,13,17,.7)] px-4 py-2.5 text-white/80 backdrop-blur-xl transition hover:border-white/40 hover:text-white';
const slide = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 16 }, transition: { duration: 0.25 } };
const side = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 40 }, transition: { duration: 0.3, ease: 'easeOut' as const } };

function Loading() {
  const { progress, active } = useProgress();
  const [done, setDone] = useState(false);
  useEffect(() => { if (progress >= 100 && !active) { const t = setTimeout(() => setDone(true), 300); return () => clearTimeout(t); } }, [progress, active]);
  return (
    <AnimatePresence>{!done && (
      <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="fixed inset-0 z-50 grid place-items-center bg-[#09090b]">
        <div className="w-64 text-center">
          <p className="serif text-5xl">Vivek<span className="grad">verse</span></p>
          <div className="mt-8 h-px w-full bg-white/10"><div className="h-px bg-[var(--a)] transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="mono mute mt-4">Generating world · {Math.round(progress)}%</p>
        </div>
      </motion.div>
    )}</AnimatePresence>
  );
}

function Exhibit({ d }: { d: Dest }) {
  const [i, setI] = useState(0);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="mono mute mb-3 !text-[10px]">{d.kind === 'project' ? 'Architecture · tap a layer' : d.kind === 'contact' ? 'Channels' : 'Journey · tap a step'}</p>
      {d.arch.map((n, k) => (
        <button key={n.n} onClick={() => setI(k)} className="group flex w-full gap-3 text-left">
          <span className="flex flex-col items-center">
            <span className="grid h-7 w-7 place-items-center rounded-full border text-[11px] transition" style={{ borderColor: i === k ? d.color : 'rgba(255,255,255,.15)', background: i === k ? d.color : 'transparent', color: i === k ? '#000' : '#aaa' }}>{k + 1}</span>
            {k < d.arch.length - 1 && <span className="h-5 w-px bg-white/15" />}
          </span>
          <span className="pb-3"><b className={`block text-sm ${i === k ? 'text-white' : 'text-white/60'}`}>{n.n}</b>{i === k && <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mute block text-[13px] leading-5">{n.note}</motion.span>}</span>
        </button>
      ))}
    </div>
  );
}

function Panel({ d, close }: { d: Dest; close: () => void }) {
  const links = d.kind === 'contact' ? [['Email', `mailto:${me.email}`], ['GitHub', me.github], ['LinkedIn', me.linkedin]] : d.kind === 'project' ? [['GitHub profile', me.github]] : [];
  return (
    <motion.aside {...side} className={`${glass} absolute inset-x-3 bottom-3 top-20 z-30 overflow-y-auto rounded-3xl md:inset-x-auto md:bottom-4 md:right-4 md:top-20 md:w-[480px]`}>
      <div className="relative h-44 overflow-hidden rounded-t-3xl" style={{ background: `radial-gradient(120% 140% at 80% 0%, ${d.color}66, transparent 60%), #0c0d11` }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-xl hover:bg-white hover:text-black">×</button>
        <div className="absolute bottom-4 left-6 right-6">
          <p className="mono !text-[10px]" style={{ color: d.color }}>{d.region}{d.status && ` · ${d.status}`}</p>
          <h2 className="serif mt-1 text-4xl leading-none">{d.title}</h2>
        </div>
      </div>
      <div className="space-y-6 p-6">
        <p className="mono mute !text-[10px]">{d.eyebrow}</p>
        <p className="text-[15px] leading-7 text-white/85">{d.summary}</p>
        <div><p className="mono mb-2 !text-[10px]" style={{ color: d.color }}>{d.kind === 'project' ? 'Problem solved' : 'The story'}</p><p className="mute text-sm leading-6">{d.problem}</p></div>
        <Exhibit d={d} />
        {d.wins.length > 0 && <div><p className="mono mb-3 !text-[10px]" style={{ color: d.color }}>Verified highlights</p><ul className="space-y-2 text-sm text-white/80">{d.wins.map((w) => <li key={w} className="flex gap-2"><span style={{ color: d.color }}>▸</span>{w}</li>)}</ul></div>}
        <div className="flex flex-wrap gap-2">{d.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map(([l, h]) => <a key={l} href={h} target="_blank" rel="noreferrer" className="btn p">{l} ↗</a>)}
          <button onClick={close} className="btn">Continue exploring</button>
        </div>
      </div>
    </motion.aside>
  );
}

function Joystick() {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<[number, number]>([0, 0]);
  const set = (x: number, y: number) => { game.joy.x = x; game.joy.y = y; setK([x, y]); };
  const move = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const r = ref.current!.getBoundingClientRect();
    let x = (e.clientX - r.left - r.width / 2) / 44, y = (e.clientY - r.top - r.height / 2) / 44;
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    set(x, y);
  };
  return (
    <div ref={ref} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={move} onPointerUp={() => set(0, 0)} onPointerCancel={() => set(0, 0)} className="touch-only fixed bottom-6 left-6 z-20 h-28 w-28 touch-none rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
      <div className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/80" style={{ transform: `translate(calc(-50% + ${k[0] * 44}px), calc(-50% + ${k[1] * 44}px))` }} />
    </div>
  );
}

const Btn = ({ children, ...r }: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...r} className={`${pill} ${r.className ?? ''}`}>{children}</button>;

export function Interface(p: Props) {
  const { mode, near, focus, selected, tourIdx } = p;
  const sel = find(selected), foc = find(focus), nearD = find(near.near);
  const t = tourIdx !== null ? tour[tourIdx] : null, td = t ? find(t.id) : null;
  const regionDests = (id: string) => dests.filter((d) => d.kind === id);
  const groups: [string, Dest[]][] = [['Education', regionDests('education')], ['Career', regionDests('career')], ['Projects', regionDests('project')], ['Contact', regionDests('contact')]];

  return (
    <>
      <Loading />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 md:p-5">
        <div className={`${glass} pointer-events-auto rounded-2xl px-4 py-3`}>
          <p className="serif text-2xl leading-none">Vivek<span className="grad">verse</span></p>
          <p className="mono mute mt-1.5 !text-[9px]">{mode === '3d' ? near.region : 'Top-down world map'}</p>
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
          <div className="flex rounded-full border border-white/12 bg-[rgba(12,13,17,.7)] p-1 backdrop-blur-xl">
            {(['3d', '2d'] as const).map((m) => <button key={m} onClick={() => p.setMode(m)} className={`mono rounded-full px-3.5 py-1.5 transition ${mode === m ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>{m}</button>)}
          </div>
          <Btn onClick={() => p.setDir(!p.dir)}>Directory</Btn>
          <Btn onClick={() => p.stop(0)} className="!border-[var(--a)] !bg-[var(--a)] !text-black">Explore Vivek</Btn>
          <Link href="/resume" className={`${pill} hidden sm:block`}>Resume</Link>
          <Btn onClick={() => p.travel('contact')} className="hidden sm:block">Contact</Btn>
          <Link href="/classic" className={`${pill} hidden lg:block`}>Classic</Link>
        </div>
      </header>

      <AnimatePresence>{p.dir && (
        <motion.aside {...{ initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } }} className={`${glass} absolute bottom-4 left-3 top-24 z-30 w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-3xl p-5 md:left-5`}>
          <div className="mb-4 flex items-center justify-between"><h2 className="serif text-3xl">Destinations</h2><button onClick={() => p.setDir(false)} className="text-2xl text-white/60 hover:text-white" aria-label="Close">×</button></div>
          {groups.map(([g, list]) => (
            <div key={g} className="mb-4"><p className="mono mute mb-1 !text-[10px]">{g}</p>
              {list.map((d) => <button key={d.id} onClick={() => p.setFocus(d.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/8 ${focus === d.id ? 'bg-white/10' : ''}`}><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} /><span className="text-sm">{d.title}</span></button>)}
            </div>
          ))}
        </motion.aside>
      )}</AnimatePresence>

      <AnimatePresence>{foc && !sel && tourIdx === null && (
        <motion.div key={foc.id} {...slide} className={`${glass} absolute bottom-24 left-3 z-30 w-[min(380px,calc(100vw-24px))] rounded-3xl p-5 md:bottom-6 ${p.dir ? 'md:left-[372px]' : 'md:left-5'}`}>
          <div className="flex items-start justify-between gap-3"><div><p className="mono !text-[10px]" style={{ color: foc.color }}>{foc.region}</p><h3 className="serif mt-1 text-3xl leading-none">{foc.title}</h3></div><button onClick={() => p.setFocus(null)} className="text-2xl leading-none text-white/60 hover:text-white" aria-label="Close">×</button></div>
          <p className="mute mt-3 text-sm leading-6">{foc.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2"><button className="btn p !py-2" onClick={() => p.travel(foc.id)}>Travel there</button><button className="btn !py-2" onClick={() => p.setSelected(foc.id)}>Details</button></div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{t && (
        <motion.div key={tourIdx} {...slide} className={`${glass} absolute bottom-24 left-1/2 z-30 w-[min(520px,calc(100vw-24px))] -translate-x-1/2 rounded-3xl p-5 md:bottom-6`}>
          <p className="mono !text-[10px]" style={{ color: 'var(--a)' }}>Guided tour · stop {tourIdx! + 1} of {tour.length} · viewpoint jump</p>
          <h3 className="serif mt-1 text-3xl">{td?.title ?? (t as { title: string }).title}</h3>
          <p className="mute mt-2 text-sm leading-6">{td?.summary ?? (t as { text: string }).text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn !py-2" disabled={tourIdx === 0} onClick={() => p.stop(tourIdx! - 1)}>← Prev</button>
            <button className="btn p !py-2" onClick={() => p.stop(tourIdx! + 1 >= tour.length ? null : tourIdx! + 1)}>{tourIdx! + 1 >= tour.length ? 'Finish' : 'Next →'}</button>
            {td && <button className="btn !py-2" onClick={() => p.setSelected(td.id)}>Details</button>}
            <button className="btn !py-2 ml-auto" onClick={() => p.stop(null)}>Exit tour</button>
          </div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{mode === '3d' && nearD && !sel && tourIdx === null && !p.paused && (
        <motion.button {...slide} onClick={() => p.setSelected(nearD.id)} className={`${glass} mono absolute bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-full px-6 py-3.5 text-white md:bottom-10`}>
          Press <kbd className="mx-1 rounded border border-white/40 px-1.5 py-0.5">E</kbd> to explore <b style={{ color: nearD.color }}>{nearD.title}</b>
        </motion.button>
      )}</AnimatePresence>

      <AnimatePresence>{sel && <Panel key={sel.id} d={sel} close={() => p.setSelected(null)} />}</AnimatePresence>

      {mode === '3d' && (
        <>
          <div className={`${glass} mono pointer-events-none absolute bottom-5 left-5 z-10 hidden gap-4 rounded-full px-5 py-3 !text-[10px] text-white/60 md:flex ${foc || p.dir ? 'md:!hidden' : ''}`}>
            <span>WASD move</span><span>Shift run</span><span>Space jump</span><span>Drag look</span><span>E interact</span><span>M map</span><span>Esc pause</span>
          </div>
          <Joystick />
          <div className="touch-only row fixed bottom-6 right-6 z-20 gap-3">
            <button onPointerDown={() => { game.run = !game.run; }} className="grid h-14 w-14 place-items-center rounded-full border border-white/25 bg-black/50 text-[11px] text-white backdrop-blur-md">RUN</button>
            <button onPointerDown={() => { game.jump = true; }} onPointerUp={() => { game.jump = false; }} className="grid h-14 w-14 place-items-center rounded-full border border-white/25 bg-black/50 text-[11px] text-white backdrop-blur-md">JUMP</button>
            <button onClick={() => nearD && p.setSelected(nearD.id)} className="grid h-14 w-14 place-items-center rounded-full bg-[var(--a)] text-sm font-bold text-black">E</button>
          </div>
        </>
      )}

      <AnimatePresence>{p.paused && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 grid place-items-center bg-black/55 backdrop-blur-sm">
          <div className={`${glass} rounded-3xl p-10 text-center`}><p className="mono mute">Paused</p><h2 className="serif mt-2 text-5xl">Take your time.</h2><button className="btn p mt-6" onClick={() => p.setPaused(false)}>Continue exploring</button></div>
        </motion.div>
      )}</AnimatePresence>

      <div className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity duration-300 ${p.fade ? 'opacity-100' : 'opacity-0'}`} />
    </>
  );
}
