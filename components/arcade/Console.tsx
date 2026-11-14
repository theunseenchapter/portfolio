'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sections } from '@/data/arcade';
import { blockText, describe, initialState, step, type Action, type Ctx, type Effect, type Settings, type State } from '@/systems/nav';
import { Lcd } from './Lcd';
import { audio } from './sound';
import '@/app/arcade.css';

const DEFAULTS: Settings = { sound: true, scanlines: true, bigText: false };
const STORE = 'vivek-arcade-settings';

const KEYS: Record<string, Action['t']> = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  Enter: 'A', ' ': 'A', z: 'A', Z: 'A',
  Escape: 'B', Backspace: 'B', x: 'B', X: 'B',
  q: 'X', Q: 'X', y: 'Y', Y: 'Y',
  m: 'START', M: 'START', o: 'SELECT', O: 'SELECT', h: 'HOME', H: 'HOME', p: 'POWER', P: 'POWER', r: 'RESUME', R: 'RESUME',
};

function openHref(href: string) {
  if (href.startsWith('mailto:')) { window.location.href = href; return; }
  // New tab + noopener: the console session (and its state) stays untouched.
  window.open(href, '_blank', 'noopener,noreferrer');
}

/* A physical button. Pointer-down fires immediately (good for touch), optional hold-to-repeat,
   and click with detail 0 covers keyboard activation of a focused button. */
function Hw({ action, label, className, repeat, send, children }: {
  action: Action['t']; label: string; className: string; repeat?: boolean; send: (a: Action) => void; children?: React.ReactNode;
}) {
  const t1 = useRef<number>(); const t2 = useRef<number>();
  const stop = () => { window.clearTimeout(t1.current); window.clearInterval(t2.current); };
  useEffect(() => stop, []);
  return (
    <button
      type="button"
      className={`hw ${className}`}
      data-act={action}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        send({ t: action } as Action);
        if (repeat) { stop(); t1.current = window.setTimeout(() => { t2.current = window.setInterval(() => send({ t: action } as Action), 110); }, 380); }
      }}
      onPointerUp={(e) => { stop(); if (e.pointerType === 'mouse') e.currentTarget.blur(); }} onPointerCancel={stop} onPointerLeave={stop}
      onClick={(e) => { if (e.detail === 0) send({ t: action } as Action); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/* Analogue stick. Drag past the dead-zone to fire a direction (UP/DOWN hold-repeat), tap or press
   Enter/Space on it for `tap`. The cap follows the pointer and springs back on release. */
function Stick({ side, label, tap, send }: { side: 'left' | 'right'; label: string; tap: Action['t']; send: (a: Action) => void }) {
  const cap = useRef<HTMLSpanElement>(null);
  const st = useRef<{ id: number; cx: number; cy: number; r: number; dir: Dir | ''; moved: boolean; t1?: number; t2?: number }>({ id: -1, cx: 0, cy: 0, r: 1, dir: '', moved: false });
  const stopRepeat = () => { window.clearTimeout(st.current.t1); window.clearInterval(st.current.t2); };
  useEffect(() => stopRepeat, []);

  const setCap = (x: number, y: number) => {
    cap.current?.style.setProperty('--sx', x.toFixed(3));
    cap.current?.style.setProperty('--sy', y.toFixed(3));
  };
  const fire = (d: Dir) => {
    send({ t: d } as Action);
    if (d === 'UP' || d === 'DOWN') {
      st.current.t1 = window.setTimeout(() => { st.current.t2 = window.setInterval(() => send({ t: d } as Action), 140); }, 380);
    }
  };
  const release = (btn: HTMLButtonElement, fireTap: boolean) => {
    const s = st.current;
    stopRepeat();
    if (fireTap && !s.moved) send({ t: tap } as Action);
    s.id = -1; s.dir = ''; s.moved = false;
    btn.removeAttribute('data-drag');
    setCap(0, 0);
  };

  return (
    <button
      type="button"
      className={`hw stick ${side}-stick`}
      data-act={tap}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const b = e.currentTarget.getBoundingClientRect();
        Object.assign(st.current, { id: e.pointerId, cx: b.left + b.width / 2, cy: b.top + b.height / 2, r: b.width / 2, dir: '', moved: false });
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.setAttribute('data-drag', '');
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (e.pointerId !== s.id) return;
        let dx = (e.clientX - s.cx) / s.r, dy = (e.clientY - s.cy) / s.r;
        const m = Math.hypot(dx, dy);
        if (m > 1) { dx /= m; dy /= m; }
        setCap(dx, dy);
        const mag = Math.min(m, 1);
        const d: Dir | '' = mag < 0.5 ? '' : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP');
        if (mag > 0.2) s.moved = true;
        if (d !== s.dir) { stopRepeat(); s.dir = d; if (d) fire(d); }
      }}
      onPointerUp={(e) => { if (e.pointerId === st.current.id) release(e.currentTarget, true); if (e.pointerType === 'mouse') e.currentTarget.blur(); }}
      onPointerCancel={(e) => { if (e.pointerId === st.current.id) release(e.currentTarget, false); }}
      onClick={(e) => { if (e.detail === 0) send({ t: tap } as Action); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="stick-cap" ref={cap} aria-hidden />
    </button>
  );
}

export default function Console() {
  const [state, setState] = useState<State>(() => initialState(DEFAULTS));
  const ref = useRef(state);
  const ctx = useRef<Ctx>({ maxScroll: 0 });
  const details = useRef<HTMLDetailsElement>(null);
  const root = useRef<HTMLElement>(null);
  const shell = useRef<HTMLElement>(null);
  const [reduced, setReduced] = useState(false);

  const run = useCallback((e: Effect) => {
    switch (e.t) {
      case 'open': openHref(e.href); break;
      case 'copy': navigator.clipboard?.writeText(e.text).catch(() => {}); break;
      case 'sound': audio.play(e.k, ref.current.settings.sound); break;
      case 'textview':
        if (details.current) {
          details.current.open = true;
          details.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          details.current.querySelector('summary')?.focus();
        }
        break;
    }
  }, []);

  const send = useCallback((a: Action) => {
    const r = step(ref.current, a, ctx.current);
    if (r.state !== ref.current) { ref.current = r.state; setState(r.state); }
    r.fx.forEach(run);
  }, [run]);

  const onMaxScroll = useCallback((n: number) => { ctx.current.maxScroll = n; }, []);

  /* settings persistence */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) send({ t: 'SET_SETTINGS', settings: { ...DEFAULTS, ...JSON.parse(raw) } });
    } catch { /* storage unavailable: defaults are fine */ }
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [send]);
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(state.settings)); } catch { /* ignore */ }
  }, [state.settings]);

  /* boot timer */
  useEffect(() => {
    if (!state.power || state.phase !== 'boot') return;
    const id = window.setTimeout(() => send({ t: 'BOOT_DONE' }), reduced ? 900 : 3000);
    return () => window.clearTimeout(id);
  }, [state.power, state.phase, state.bootId, reduced, send]);

  /* toast timer */
  useEffect(() => {
    if (!state.toast) return;
    const id = window.setTimeout(() => send({ t: 'CLEAR_TOAST' }), 1400);
    return () => window.clearTimeout(id);
  }, [state.toast, send]);

  /* keyboard presses visibly depress the matching hardware button */
  const press = useCallback((a: string) => {
    root.current?.querySelectorAll<HTMLElement>(`[data-act="${a}"]`).forEach((el) => {
      el.setAttribute('data-pressed', '');
      window.setTimeout(() => el.removeAttribute('data-pressed'), 140);
    });
  }, []);

  /* parallax: the shell tilts a few degrees toward the mouse (fine pointers only) */
  useEffect(() => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let raf = 0;
    const set = (x: number, y: number) => {
      shell.current?.style.setProperty('--tx', x.toFixed(3));
      shell.current?.style.setProperty('--ty', y.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => set((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2));
    };
    const onLeave = () => { cancelAnimationFrame(raf); set(0, 0); };
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); document.documentElement.removeEventListener('pointerleave', onLeave); };
  }, [reduced]);

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const a = KEYS[e.key];
      if (!a) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input,textarea,select,[contenteditable="true"],.a11y')) return;
      // Focused buttons / links activate natively on Enter and Space, don't double-fire.
      if ((e.key === 'Enter' || e.key === ' ') && el?.closest('button,a,summary')) return;
      if (e.repeat && !a.match(/UP|DOWN|LEFT|RIGHT/)) return;
      e.preventDefault();
      press(a);
      send({ t: a } as Action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send, press]);

  const live = describe(state) + (state.toast ? ` ${state.toast.msg}` : '');

  return (
    <main className="arcade-root" ref={root}>
      <a className="skip" href="#text-version" onClick={() => { if (details.current) details.current.open = true; }}>Skip to accessible text version</a>
      <h1 className="sr-only">Vivek Yadav: Vivek Arcade portfolio. A handheld console interface.</h1>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{live}</div>

      <section className={`console${state.power ? ' is-on' : ''}`} role="group" aria-label="Vivek Arcade handheld console" ref={shell}>
        <div className="gloss" aria-hidden />

        <div className="screen-deck">
          <div className="power-row">
            <span className={`led${state.power ? ' on' : ''}`} aria-hidden />
            <span className={`power-hint${state.power ? ' hide' : ''}`} aria-hidden>PRESS POWER</span>
            <span className="power-lbl" aria-hidden>OFF</span>
            <Hw action="POWER" label={state.power ? 'Power: turn display off' : 'Power: turn display on'} className={`power${state.power ? ' is-on' : ''}`} send={send}>
              <i className="pw-knob" aria-hidden />
            </Hw>
            <span className="power-lbl" aria-hidden>ON</span>
          </div>
          <div className="bezel">
            <div className={`lcd-wrap${state.power ? ' on' : ''}`}>
              <Lcd state={state} onMaxScroll={onMaxScroll} />
            </div>
            <div className="bezel-foot" aria-hidden>
              <div className="brand"><span>VIVEK</span> ARCADE<em>™</em></div>
              <span className="bezel-note">DOT MATRIX WITH STEREO SOUND</span>
              <span className="grille"><i /><i /><i /><i /><i /><i /></span>
            </div>
          </div>
        </div>

        <div className="controller left-controller" role="group" aria-label="Left controller">
          <div className="controller-cap">
            <span className="controller-name" aria-hidden>VIVEK / L</span>
            <span className="indicator" aria-hidden />
          </div>
          <Stick side="left" tap="A" label="Left analogue stick. Push to move through menus; press in to select." send={send} />
          <div className="dpad" role="group" aria-label="D-pad">
            <Hw action="UP" label="D-pad up" className="key up" repeat send={send}><i /></Hw>
            <Hw action="LEFT" label="D-pad left" className="key left" send={send}><i /></Hw>
            <span className="d-hub" aria-hidden />
            <Hw action="RIGHT" label="D-pad right" className="key right" send={send}><i /></Hw>
            <Hw action="DOWN" label="D-pad down" className="key down" repeat send={send}><i /></Hw>
          </div>
          <div className="foot">
            <Hw action="SELECT" label="Select: settings" className="pill" send={send} />
            <span aria-hidden>SELECT</span>
          </div>
        </div>

        <div className="controller right-controller" role="group" aria-label="Right controller">
          <div className="controller-cap">
            <span className="indicator" aria-hidden />
            <span className="controller-name" aria-hidden>R / VIVEK</span>
          </div>
          <div className="abxy" role="group" aria-label="Action buttons">
            <Hw action="Y" label="Y button: quick resume" className="cap y" send={send}><b aria-hidden>Y</b></Hw>
            <Hw action="X" label="X button: previous page" className="cap x" send={send}><b aria-hidden>X</b></Hw>
            <Hw action="B" label="B button: back" className="cap b" send={send}><b aria-hidden>B</b></Hw>
            <Hw action="A" label="A button: select or open" className="cap a primary" send={send}><b aria-hidden>A</b></Hw>
          </div>
          <Stick side="right" tap="START" label="Right analogue stick. Push to scroll and change pages; press in for the main menu." send={send} />
          <div className="foot two">
            <div><Hw action="START" label="Start: main menu" className="pill" send={send} /><span aria-hidden>START</span></div>
            <div><Hw action="HOME" label="Home: return to title screen" className="home" send={send}><i aria-hidden /></Hw><span aria-hidden>HOME</span></div>
          </div>
        </div>
      </section>

      <details className="a11y" id="text-version" ref={details}>
        <summary>Accessible text version of this portfolio</summary>
        <p className="a11y-note">Everything in the console, as plain structured text. Links open in a new tab.</p>
        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`a-${s.id}`}>
            <h2 id={`a-${s.id}`}>{s.label}</h2>
            <p>{s.desc}</p>
            {s.items.map((it) => (
              <article key={it.id}>
                <h3>{it.label}</h3>
                {it.pages.map((pgx) => (
                  <div key={pgx.id}>
                    <h4>{pgx.label}</h4>
                    {pgx.blocks.map((b, i) =>
                      b.t === 'action' && b.href ? (
                        <p key={i}><a href={b.href} target={b.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">{b.label}</a> ({b.hint})</p>
                      ) : b.t === 'list' ? (
                        <ul key={i}>{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
                      ) : (
                        <p key={i}>{blockText(b)}</p>
                      ),
                    )}
                  </div>
                ))}
              </article>
            ))}
          </section>
        ))}
      </details>
    </main>
  );
}
