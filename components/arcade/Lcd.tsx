'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { MENU_COUNT, getItem, getSection, quickResume, sections, type Block, type Item } from '@/data/arcade';
import { KEY_HELP, SETTINGS_ROWS, crumbs, pageOf, top, type Frame, type State } from '@/systems/nav';
import { Pixel } from './Pixel';

type Props = { state: State; onMaxScroll: (n: number) => void };

const VIS = 7;
const windowStart = (cur: number, total: number) => Math.min(Math.max(0, cur - (VIS - 1)), Math.max(0, total - VIS));

/* ------------------------------ chrome ------------------------------ */

function Header({ state }: { state: State }) {
  const c = crumbs(state).slice(-2).join(' > ');
  return (
    <header className="hdr">
      <span className="hdr-t">{c}</span>
      <span className="batt" aria-hidden><i /><i /><i /></span>
    </header>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return <footer className="ftr">{children}</footer>;
}

const Key = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <span className="hint"><b>{k}</b> {children}</span>
);

/* ------------------------------ screens ------------------------------ */

function Boot() {
  return (
    <div className="boot">
      <div className="boot-logo" aria-hidden>
        {'VIVEK'.split('').map((c, i) => <span key={i} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>{c}</span>)}
      </div>
      <div className="boot-sub">ARCADE</div>
      <div className="boot-bar" aria-hidden>{Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ animationDelay: `${0.9 + i * 0.1}s` }} />)}</div>
      <div className="boot-msg">LOADING PORTFOLIO...</div>
    </div>
  );
}

function Title() {
  return (
    <div className="title">
      <div className="title-art"><Pixel name="cart" size="17cqw" className="bob" /></div>
      <h2 className="logo"><span>VIVEK</span><span>ARCADE</span></h2>
      <p className="press">PRESS START.</p>
      <p className="copy">© 2026 VIVEK YADAV</p>
      <Footer><Key k="START">BEGIN</Key><Key k="PWR">OFF</Key></Footer>
    </div>
  );
}

function List({ rows, cur }: { rows: { id: string; label: string; icon: string; badge?: string; divider?: boolean }[]; cur: number }) {
  const start = windowStart(cur, rows.length);
  const slice = rows.slice(start, start + VIS);
  return (
    <ul className="list" role="presentation">
      {start > 0 && <li className="more up" aria-hidden />}
      {slice.map((r, i) => {
        const idx = start + i;
        const sel = idx === cur;
        return (
          <li key={r.id} className={`row${sel ? ' sel' : ''}${r.divider ? ' div' : ''}`}>
            <Pixel name={r.icon} size="6.4cqw" className="ico" />
            <span className="lab">{r.label}</span>
            {r.badge && <span className="badge">{r.badge}</span>}
            {sel && <i className="arrow" aria-hidden />}
          </li>
        );
      })}
      {start + VIS < rows.length && <li className="more dn" aria-hidden />}
    </ul>
  );
}

function Menu({ f, state }: { f: Extract<Frame, { k: 'menu' }>; state: State }) {
  const rows = [
    ...sections.map((s) => ({ id: s.id, label: s.label, icon: s.icon })),
    { id: 'resume', label: `★ ${quickResume.label}`, icon: quickResume.icon, divider: true },
  ];
  const desc = f.cur === MENU_COUNT ? quickResume.desc : sections[f.cur].desc;
  return (
    <>
      <Header state={state} />
      <div className="body">
        <List rows={rows} cur={f.cur} />
        <div className="dlg"><p>{desc}</p></div>
      </div>
      <Footer><Key k="D-PAD">MOVE</Key><Key k="A">OPEN</Key><Key k="B">BACK</Key><Key k="SEL">SETTINGS</Key></Footer>
    </>
  );
}

function SectionScreen({ f, state }: { f: Extract<Frame, { k: 'section' }>; state: State }) {
  const sec = getSection(f.sec);
  const rows = sec.items.map((it) => ({ id: it.id, label: it.label.toUpperCase(), icon: it.art, badge: it.tag === 'IN DEVELOPMENT' ? 'WIP' : undefined }));
  return (
    <>
      <Header state={state} />
      <div className="body">
        <List rows={rows} cur={f.cur} />
        <div className="dlg"><p>{sec.items[f.cur].desc}</p></div>
      </div>
      <Footer><Key k="D-PAD">MOVE</Key><Key k="A">OPEN</Key><Key k="B">BACK</Key><Key k="START">MENU</Key></Footer>
    </>
  );
}

/* ----- blocks used on detail pages ----- */

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p': return <p key={i} className="vt">{b.text}</p>;
          case 'h': return <h4 key={i} className="pxh">{b.text}</h4>;
          case 'list': return <ul key={i} className="bul">{b.items.map((x) => <li key={x} className="vt">{x}</li>)}</ul>;
          case 'steps':
            return (
              <ol key={i} className="steps">
                {b.items.map(([n, t], j) => (
                  <li key={n}><b className="sn">{j + 1}</b><div><span className="sh">{n}</span><span className="vt">{t}</span></div></li>
                ))}
              </ol>
            );
          case 'stats':
            return (
              <div key={i} className="stats">
                {b.items.map((x) => <div key={x.label} className="stat"><strong>{x.big}</strong><span className="vt">{x.label}</span></div>)}
              </div>
            );
          case 'chips': return <div key={i} className="chips">{b.items.map((x) => <span key={x} className="cp">{x}</span>)}</div>;
          case 'kv':
            return (
              <dl key={i} className="kv">
                {b.rows.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd className="vt">{v}</dd></React.Fragment>)}
              </dl>
            );
          case 'action':
            return (
              <div key={i} className="act">
                <span className="act-l"><i className="arrow" aria-hidden />{b.label}</span>
                <span className="vt act-h">{b.hint}</span>
                <span className="act-k">PRESS A</span>
              </div>
            );
        }
      })}
    </>
  );
}

function Hero({ item }: { item: Item }) {
  return (
    <div className="hero">
      <div className="hero-art"><Pixel name={item.art} size="15cqw" className="bob" /></div>
      <div className="hero-t">
        <h3>{item.label.toUpperCase()}</h3>
        {item.tag && <span className="tag">{item.tag}</span>}
      </div>
    </div>
  );
}

function Detail({ f, state, onMaxScroll }: { f: Extract<Frame, { k: 'detail' }>; state: State; onMaxScroll: (n: number) => void }) {
  const item = getItem(f.sec, f.item);
  const page = pageOf(f);
  const vp = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!vp.current || !inner.current) return;
      const lcd = vp.current.closest('.lcd') as HTMLElement | null;
      const step = (lcd?.clientWidth ?? 300) * 0.07;
      const m = Math.max(0, Math.ceil((inner.current.scrollHeight - vp.current.clientHeight - 2) / step));
      setMax(m);
      onMaxScroll(m);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (vp.current) ro.observe(vp.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [f.tab, f.item, state.settings.bigText, onMaxScroll]);

  const hasAction = page.blocks.some((b) => b.t === 'action');
  const last = f.tab === item.pages.length - 1;
  return (
    <>
      <Header state={state} />
      <div className="tabs">
        <i className={`tri l${f.tab === 0 ? ' off' : ''}`} aria-hidden />
        <b className="tab-l">{page.label}</b>
        <i className={`tri r${last ? ' off' : ''}`} aria-hidden />
        <span className="tab-n">{f.tab + 1}/{item.pages.length}</span>
      </div>
      <div className="pips" aria-hidden>{item.pages.map((p, i) => <i key={p.id} className={i === f.tab ? 'on' : ''} />)}</div>
      <div className="body detail">
        <div className="vp" ref={vp}>
          <div className="inner" ref={inner} style={{ transform: `translateY(calc(${f.scroll} * -7cqw))` }}>
            {f.tab === 0 && <Hero item={item} />}
            <Blocks blocks={page.blocks.filter((b) => b.t !== 'action')} />
          </div>
          {f.scroll > 0 && <i className="more up" aria-hidden />}
          {f.scroll < max && <i className="more dn" aria-hidden />}
        </div>
        {hasAction && <Blocks blocks={page.blocks.filter((b) => b.t === 'action')} />}
      </div>
      <Footer>
        <Key k="L/R">PAGE</Key>
        {max > 0 && <Key k="U/D">SCROLL</Key>}
        {(hasAction || !last) && <Key k="A">{hasAction ? 'GO' : 'NEXT'}</Key>}
        <Key k="B">BACK</Key>
      </Footer>
    </>
  );
}

function Settings({ f, state }: { f: Extract<Frame, { k: 'settings' }>; state: State }) {
  const st = state.settings;
  const val = (r: (typeof SETTINGS_ROWS)[number]) =>
    r === 'SOUND' ? (st.sound ? 'ON' : 'OFF') : r === 'CRT LINES' ? (st.scanlines ? 'ON' : 'OFF') : r === 'BIG TEXT' ? (st.bigText ? 'ON' : 'OFF') : r === 'TEXT VERSION' ? 'OPEN' : '';
  const desc: Record<string, string> = {
    SOUND: 'Beeps and the boot jingle.',
    'CRT LINES': 'Scanline texture on the LCD.',
    'BIG TEXT': 'Larger text on every screen.',
    'TEXT VERSION': 'Plain-text copy of everything, for screen readers.',
    KEYBOARD: KEY_HELP,
  };
  const r = SETTINGS_ROWS[f.cur];
  return (
    <>
      <Header state={state} />
      <div className="body">
        <ul className="list" role="presentation">
          {SETTINGS_ROWS.map((row, i) => (
            <li key={row} className={`row${i === f.cur ? ' sel' : ''}`}>
              <span className="lab">{row}</span>
              {val(row) && <span className="badge">{val(row)}</span>}
              {i === f.cur && <i className="arrow" aria-hidden />}
            </li>
          ))}
        </ul>
        <div className="dlg"><p>{desc[r]}</p></div>
      </div>
      <Footer><Key k="D-PAD">MOVE</Key><Key k="A">CHANGE</Key><Key k="B">BACK</Key></Footer>
    </>
  );
}

/* -------------------------------- LCD -------------------------------- */

export function Lcd({ state, onMaxScroll }: Props) {
  const { settings, power, phase } = state;
  const f = top(state);
  const cls = `lcd${settings.scanlines ? ' scan' : ''}${settings.bigText ? ' big' : ''}${power ? ' on' : ' off'}`;

  let screen: React.ReactNode = null;
  let key = 'none';
  if (power) {
    if (phase === 'boot') { screen = <Boot />; key = `boot${state.bootId}`; }
    else if (phase === 'title') { screen = <Title />; key = 'title'; }
    else if (f.k === 'menu') { screen = <Menu f={f} state={state} />; key = 'menu'; }
    else if (f.k === 'section') { screen = <SectionScreen f={f} state={state} />; key = `sec-${f.sec}`; }
    else if (f.k === 'detail') { screen = <Detail f={f} state={state} onMaxScroll={onMaxScroll} />; key = `det-${f.sec}-${f.item}`; }
    else { screen = <Settings f={f} state={state} />; key = 'settings'; }
  }

  return (
    <div className={cls} aria-hidden="true">
      {power && <div className="lcd-boot-flash" key={`flash${state.bootId}-${power}`} />}
      {power ? <div className="scr" key={key}>{screen}</div> : null}
      {power && state.toast && <div className="toast" key={state.toast.id}>{state.toast.msg}</div>}
      <div className="glass" />
    </div>
  );
}
