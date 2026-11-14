'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrthographicCamera, Sky } from '@react-three/drei';
import { dests, tour } from '@/data/world';
import { game, travelTo } from '@/systems/game';
import { height, scatter } from '@/systems/world';
import { Bridges, Terrain, Water } from './Terrain';
import { Nature } from './Nature';
import { Buildings } from './Buildings';
import { Player, type Near } from './Player';
import { Interface } from '../interface/Interface';

function Top() {
  const { size } = useThree();
  return <OrthographicCamera makeDefault position={[0, 220, 0]} up={[0, 0, -1]} zoom={Math.min(size.width, size.height) / 185} near={1} far={600} onUpdate={(c) => c.lookAt(0, 0, 0)} />;
}

export default function World() {
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [near, setNear] = useState<Near>({ near: null, region: 'Open wilderness' });
  const [focus, setFocus] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tourIdx, setTourIdx] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [dir, setDir] = useState(false);
  const [fade, setFade] = useState(false);
  const q = useMemo(() => (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency <= 4 || /[?&]q=low/.test(location.search)) ? 0.5 : 1), []);
  const data = useMemo(() => scatter(q), [q]);

  useEffect(() => { game.locked = !!selected || paused; }, [selected, paused]);

  const jump = useCallback((x: number, z: number, after?: () => void) => {
    setFade(true);
    setTimeout(() => { travelTo(x, z); after?.(); setFade(false); }, 350);
  }, []);
  const travel = useCallback((id: string) => { const d = dests.find((v) => v.id === id)!; setMode('3d'); setFocus(null); setDir(false); jump(d.pos[0], d.pos[1]); }, [jump]);
  const stop = useCallback((i: number | null) => {
    if (i === null || i < 0 || i >= tour.length) { setTourIdx(null); return; }
    const t = tour[i], d = dests.find((v) => v.id === t.id), pos = d ? d.pos : t.pos!;
    setMode('3d'); setSelected(null); setDir(false); setFocus(null);
    jump(pos[0], pos[1], () => setTourIdx(i));
  }, [jump]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'e' && near.near && !selected && !paused) setSelected(near.near);
      else if (k === 'm') setMode((m) => (m === '3d' ? '2d' : '3d'));
      else if (e.key === 'Escape') { if (selected) setSelected(null); else if (focus) setFocus(null); else if (dir) setDir(false); else setPaused((p) => !p); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [near.near, selected, paused, focus, dir]);

  return (
    <div className="fixed inset-0 bg-[#0e1a22]">
      <Canvas shadows={q > 0.5} dpr={q > 0.5 ? [1, 1.75] : 1} camera={{ fov: 55, near: 0.1, far: 700, position: [0, 12, 8] }} gl={{ antialias: q > 0.5, powerPreference: 'high-performance' }} fallback={<div className="grid h-full place-items-center text-white/70">This world needs WebGL enabled.</div>}>
        <Suspense fallback={null}>
          {mode === '3d' ? (<><Sky distance={450000} sunPosition={[40, 60, 25]} turbidity={6} rayleigh={1.2} mieCoefficient={0.005} /><fog attach="fog" args={['#bdd0dc', 80, 340]} /></>) : (<><color attach="background" args={['#0e1a22']} /><Top /></>)}
          <hemisphereLight args={['#d4e6ff', '#6b7a55', 1.0]} />
          <Terrain /><Water /><Bridges />
          <Nature data={data} />
          <Buildings focusId={focus} onPick={setFocus} />
          <Player mode={mode} onNear={setNear} shadows={q > 0.5} />
          {mode === '2d' && dests.map((d) => (
            <Html key={d.id} position={[d.pos[0], height(d.pos[0], d.pos[1]) + 20, d.pos[1]]} center zIndexRange={[10, 0]}>
              <button onClick={() => setFocus(d.id)} className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium backdrop-blur-md transition ${focus === d.id ? 'scale-110 border-white bg-white text-black' : 'border-white/25 bg-black/55 text-white hover:border-white'}`}>
                <i className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.title}
              </button>
            </Html>
          ))}
        </Suspense>
      </Canvas>
      <Interface {...{ mode, setMode, near, focus, setFocus, selected, setSelected, tourIdx, stop, paused, setPaused, dir, setDir, fade, travel }} />
    </div>
  );
}

