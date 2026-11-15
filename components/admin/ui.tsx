'use client';

import React, { createContext, useContext, useState } from 'react';
import { ICONS } from '@/lib/content-types';

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 6)}`;

export function Field({ label, value, onChange, multi, max, hint, placeholder }: { label: string; value: string; onChange: (v: string) => void; multi?: boolean; max?: number; hint?: string; placeholder?: string }) {
  const props = { value, maxLength: max, placeholder, onChange: (e: React.ChangeEvent<any>) => onChange(e.target.value) };
  return (
    <label className="fld"><span>{label.toUpperCase()}</span>{multi ? <textarea {...props} /> : <input type="text" {...props} />}{hint && <small>{hint}</small>}</label>
  );
}

export function IconSelect({ value, onChange, label = 'Icon' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return <label className="fld"><span>{label.toUpperCase()}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{ICONS.map((i) => <option key={i}>{i}</option>)}</select></label>;
}

/** Add / edit / delete / reorder for any list. With `title`, rows are collapsible cards. */
export function ListEditor<T>({ items, onChange, render, make, addLabel = 'ADD', max = 50, min = 0, title }: {
  items: T[]; onChange: (v: T[]) => void; render: (item: T, set: (v: T) => void, i: number) => React.ReactNode; make: () => T;
  addLabel?: string; max?: number; min?: number; title?: (item: T, i: number) => string;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const set = (i: number, v: T) => onChange(items.map((x, k) => (k === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const a = [...items]; [a[i], a[j]] = [a[j], a[i]]; onChange(a);
    setOpen((o) => { const n = new Set(o); const hi = n.has(i), hj = n.has(j); if (hi) n.add(j); else n.delete(j); if (hj) n.add(i); else n.delete(i); return n; });
  };
  const del = (i: number) => {
    if (items.length <= min) return;
    if (title && !window.confirm('Delete this entry? (Applies when you press Save Changes.)')) return;
    onChange(items.filter((_, k) => k !== i)); setOpen(new Set());
  };
  const add = () => { onChange([...items, make()]); if (title) setOpen((o) => new Set(o).add(items.length)); };
  const ctl = (i: number) => (
    <span className="lctl">
      <button type="button" className="ab sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">▲</button>
      <button type="button" className="ab sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">▼</button>
      <button type="button" className="ab sm rose" onClick={() => del(i)} disabled={items.length <= min} aria-label="Delete">✕</button>
    </span>
  );
  return (
    <div>
      {items.map((it, i) => title ? (
        <div className="lrow" key={i}>
          <div className="lhead">
            <button type="button" className="ttl" onClick={() => setOpen((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; })} aria-expanded={open.has(i)}>
              {open.has(i) ? '▾' : '▸'} {String(i + 1).padStart(2, '0')} · {title(it, i) || '(untitled)'}
            </button>
            {ctl(i)}
          </div>
          {open.has(i) && <div className="lbody">{render(it, (v) => set(i, v), i)}</div>}
        </div>
      ) : (
        <div className="lrow lflat" key={i}><div className="lb">{render(it, (v) => set(i, v), i)}</div>{ctl(i)}</div>
      ))}
      <button type="button" className="ab sm" onClick={add} disabled={items.length >= max}>＋ {addLabel}</button>
    </div>
  );
}

export const StrList = ({ label, items, onChange, max = 40 }: { label?: string; items: string[]; onChange: (v: string[]) => void; max?: number }) => (
  <div>
    {label && <h3>{label.toUpperCase()}</h3>}
    <ListEditor items={items} onChange={onChange} make={() => ''} max={max} addLabel="ADD ITEM" render={(v, set) => <Field label="Text" value={v} onChange={set} multi={v.length > 70} />} />
  </div>
);

export const Pairs = ({ label, items, onChange, a, b }: { label?: string; items: [string, string][]; onChange: (v: [string, string][]) => void; a: string; b: string }) => (
  <div>
    {label && <h3>{label.toUpperCase()}</h3>}
    <ListEditor items={items} onChange={onChange} make={() => ['', ''] as [string, string]} addLabel="ADD ROW" render={(v, set) => (<><Field label={a} value={v[0]} onChange={(x) => set([x, v[1]])} /><Field label={b} value={v[1]} onChange={(x) => set([v[0], x])} /></>)} />
  </div>
);

/* ---- media picker context: lets any ImageField open the shared media library modal ---- */
export const PickCtx = createContext<(cb: (url: string) => void) => void>(() => {});
export function ImageField({ label = 'Image', value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  const pick = useContext(PickCtx);
  return (
    <div className="fld">
      <span>{label.toUpperCase()}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/api/media/… or https://…" />
        <button type="button" className="ab sm" onClick={() => pick(onChange)}>PICK</button>
        {value && <button type="button" className="ab sm rose" onClick={() => onChange('')} aria-label="Clear image">✕</button>}
      </div>
      {value && /^(\/api\/media\/|https?:)/.test(value) && <img src={value} alt="" style={{ maxHeight: 90, maxWidth: 160, borderRadius: 6, border: '2px solid var(--g1)' }} />}
    </div>
  );
}
