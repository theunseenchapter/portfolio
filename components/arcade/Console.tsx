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
  m: 'START', M: 'START', o: 'SELECT', O: 'SELECT', p: 'POWER', P: 'POWER', r: 'RESUME', R: 'RESUME',
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

export default function Console() {
  const [state, setState] = useState<State>(() => initialState(DEFAULTS));
  const ref = useRef(state);
  const ctx = useRef<Ctx>({ maxScroll: 0 });
  const details = useRef<HTMLDetailsElement>(null);
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
      send({ t: a } as Action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send]);

  const live = describe(state) + (state.toast ? ` ${state.toast.msg}` : '');

  return (
    <main className="arcade-root">
      <a className="skip" href="#text-version" onClick={() => { if (details.current) details.current.open = true; }}>Skip to accessible text version</a>
      <h1 className="sr-only">Vivek Yadav: Vivek Arcade portfolio. A handheld console interface.</h1>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{live}</div>

      <section className="console" role="group" aria-label="Vivek Arcade handheld console">
        <div className="gloss" aria-hidden />

        <div className="power-row">
          <span className={`power-hint${state.power ? ' hide' : ''}`} aria-hidden>PRESS POWER</span>
          <span className="power-lbl" aria-hidden>POWER</span>
          <Hw action="POWER" label={state.power ? 'Power: turn display off' : 'Power: turn display on'} className={`power${state.power ? ' is-on' : ''}`} send={send} />
        </div>

        <div className="bezel">
          <div className="bezel-top" aria-hidden><i /><span>DOT MATRIX WITH STEREO SOUND</span><i /></div>
          <div className="lcd-wrap">
            <span className={`led${state.power ? ' on' : ''}`} aria-hidden />
            <Lcd state={state} onMaxScroll={onMaxScroll} />
          </div>
          <div className="brand" aria-hidden><span>VIVEK</span> ARCADE<em>™</em></div>
        </div>

        <div className="controls">
          <div className="dpad">
            <Hw action="UP" label="D-pad up" className="d up" repeat send={send}><i /></Hw>
            <Hw action="LEFT" label="D-pad left" className="d left" send={send}><i /></Hw>
            <Hw action="RIGHT" label="D-pad right" className="d right" send={send}><i /></Hw>
            <Hw action="DOWN" label="D-pad down" className="d down" repeat send={send}><i /></Hw>
            <span className="d-core" aria-hidden />
          </div>

          <div className="ab">
            <div className="ab-b"><Hw action="B" label="B button: back" className="round" send={send} /><span aria-hidden>B</span></div>
            <div className="ab-a"><Hw action="A" label="A button: select or open" className="round" send={send} /><span aria-hidden>A</span></div>
          </div>

          <div className="ss">
            <div><Hw action="SELECT" label="Select: settings" className="pill" send={send} /><span aria-hidden>SELECT</span></div>
            <div><Hw action="START" label="Start: main menu" className="pill" send={send} /><span aria-hidden>START</span></div>
          </div>

          <div className="speaker" aria-hidden><i /><i /><i /><i /><i /><i /></div>
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
