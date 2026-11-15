'use client';

import type { Block, Content, Item, Page, Section } from '@/lib/content-types';
import { Field, IconSelect, ImageField, ListEditor, Pairs, StrList, uid } from './ui';

/* ------------------------------ blocks ------------------------------ */
const BLOCKS: { t: Block['t']; name: string; make: () => Block }[] = [
  { t: 'p', name: 'Paragraph', make: () => ({ t: 'p', text: '' }) },
  { t: 'h', name: 'Heading', make: () => ({ t: 'h', text: '' }) },
  { t: 'list', name: 'Bullet list', make: () => ({ t: 'list', items: [''] }) },
  { t: 'steps', name: 'Steps', make: () => ({ t: 'steps', items: [['', '']] }) },
  { t: 'stats', name: 'Stats', make: () => ({ t: 'stats', items: [{ big: '', label: '' }] }) },
  { t: 'chips', name: 'Chips / tags', make: () => ({ t: 'chips', items: [''] }) },
  { t: 'kv', name: 'Key / value', make: () => ({ t: 'kv', rows: [['', '']] }) },
  { t: 'img', name: 'Image', make: () => ({ t: 'img', src: '', alt: '' }) },
  { t: 'action', name: 'Link / button', make: () => ({ t: 'action', label: 'OPEN', href: '', hint: '' }) },
];
const bname = (t: string) => BLOCKS.find((b) => b.t === t)?.name ?? t;
const bsum = (b: Block) => {
  const s = b.t === 'p' || b.t === 'h' ? b.text : b.t === 'action' ? b.label : b.t === 'img' ? b.alt || b.src : '';
  return `${bname(b.t)}${s ? ' — ' + s.slice(0, 40) : ''}`;
};

export function BlockEditor({ b, set }: { b: Block; set: (b: Block) => void }) {
  switch (b.t) {
    case 'p': return <Field label="Text" multi value={b.text} max={2000} onChange={(text) => set({ ...b, text })} />;
    case 'h': return <Field label="Heading" value={b.text} max={120} onChange={(text) => set({ ...b, text })} />;
    case 'list':
    case 'chips': return <StrList items={b.items} onChange={(items) => set({ ...b, items })} />;
    case 'steps': return <Pairs items={b.items} onChange={(items) => set({ ...b, items })} a="Title" b="Description" />;
    case 'kv': return <Pairs items={b.rows} onChange={(rows) => set({ ...b, rows })} a="Key" b="Value" />;
    case 'stats':
      return <ListEditor items={b.items} onChange={(items) => set({ ...b, items })} make={() => ({ big: '', label: '' })} addLabel="ADD STAT" max={12}
        render={(v, s) => (<><Field label="Big number" value={v.big} onChange={(big) => s({ ...v, big })} /><Field label="Label" value={v.label} onChange={(label) => s({ ...v, label })} /></>)} />;
    case 'img': return <><ImageField value={b.src} onChange={(src) => set({ ...b, src })} /><Field label="Alt text (describe the image)" value={b.alt} onChange={(alt) => set({ ...b, alt })} /></>;
    case 'action':
      return (
        <div className="grid g2">
          <Field label="Button label" value={b.label} onChange={(label) => set({ ...b, label })} />
          <Field label="Hint text" value={b.hint} onChange={(hint) => set({ ...b, hint })} />
          <Field label="Link (https://, mailto:, or /path)" value={b.href ?? ''} onChange={(href) => set({ ...b, href })} />
          <Field label="…or text to copy" value={b.copy ?? ''} onChange={(copy) => set({ ...b, copy })} />
        </div>
      );
  }
}

export function PageEditor({ pages, onChange }: { pages: Page[]; onChange: (p: Page[]) => void }) {
  return (
    <ListEditor items={pages} onChange={onChange} min={1} max={16} addLabel="ADD PAGE" title={(p) => p.label}
      make={() => ({ id: uid('page'), label: 'NEW PAGE', blocks: [{ t: 'p' as const, text: '' }] })}
      render={(p, set) => (
        <>
          <div className="grid g2"><Field label="Tab label" value={p.label} max={24} onChange={(label) => set({ ...p, label })} /><Field label="Id (internal)" value={p.id} onChange={(id) => set({ ...p, id: id.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></div>
          <h3>CONTENT BLOCKS</h3>
          <div className="sec-l">
            <ListEditor items={p.blocks} onChange={(blocks) => set({ ...p, blocks })} max={30} title={bsum} make={() => BLOCKS[0].make()} addLabel="ADD PARAGRAPH"
              render={(b, sb) => <BlockEditor b={b} set={sb} />} />
            <label className="fld" style={{ marginTop: 8, maxWidth: 260 }}><span>ADD BLOCK OF TYPE…</span>
              <select value="" onChange={(e) => { const m = BLOCKS.find((x) => x.t === e.target.value); if (m) set({ ...p, blocks: [...p.blocks, m.make()] }); }}>
                <option value="">Choose type</option>{BLOCKS.map((x) => <option key={x.t} value={x.t}>{x.name}</option>)}
              </select>
            </label>
          </div>
        </>
      )} />
  );
}

/* ------------------------------ items / sections ------------------------------ */
export function ItemEditor({ item, set, extra }: { item: Item; set: (i: Item) => void; extra?: React.ReactNode }) {
  return (
    <>
      <div className="grid g2">
        <Field label="Name" value={item.label} max={60} onChange={(label) => set({ ...item, label })} />
        <Field label="Short description (menu)" value={item.desc} max={200} onChange={(desc) => set({ ...item, desc })} />
        <Field label="Badge / tag" value={item.tag ?? ''} max={40} onChange={(tag) => set({ ...item, tag })} />
        <IconSelect value={item.art} onChange={(art) => set({ ...item, art })} />
        <Field label="Id (internal, unique)" value={item.id} onChange={(id) => set({ ...item, id: id.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
      </div>
      <ImageField label="Cover image (replaces the pixel icon)" value={item.image ?? ''} onChange={(image) => set({ ...item, image })} />
      {extra}
      <h3>PAGES</h3>
      <PageEditor pages={item.pages} onChange={(pages) => set({ ...item, pages })} />
    </>
  );
}

export const blankItem = (): Item => ({ id: uid('item'), label: 'New item', desc: '', art: 'chip', pages: [{ id: 'overview', label: 'OVERVIEW', blocks: [{ t: 'p', text: '' }] }] });
export const blankProject = (): Item => ({
  id: uid('project'), label: 'New Project', desc: '', art: 'cart', tag: 'PROJECT',
  pages: [
    { id: 'overview', label: 'OVERVIEW', blocks: [{ t: 'p', text: '' }] },
    { id: 'problem', label: 'PROBLEM', blocks: [{ t: 'h', text: 'PROBLEM SOLVED' }, { t: 'p', text: '' }] },
    { id: 'arch', label: 'ARCHITECTURE', blocks: [{ t: 'steps', items: [['', '']] }] },
    { id: 'decisions', label: 'DECISIONS', blocks: [{ t: 'h', text: 'ENGINEERING DECISIONS' }, { t: 'list', items: [''] }] },
    { id: 'tech', label: 'TECHNOLOGIES', blocks: [{ t: 'chips', items: [''] }] },
    { id: 'metrics', label: 'METRICS', blocks: [{ t: 'stats', items: [{ big: '', label: '' }] }] },
    { id: 'github', label: 'GITHUB', blocks: [{ t: 'p', text: 'Source on GitHub.' }, { t: 'action', label: 'OPEN GITHUB', href: '', hint: '' }] },
  ],
});

export function ItemsEditor({ items, onChange, make, repo }: { items: Item[]; onChange: (i: Item[]) => void; make: () => Item; repo?: boolean }) {
  return (
    <ListEditor items={items} onChange={onChange} make={make} min={1} max={40} addLabel="ADD ITEM" title={(i) => `${i.label}${i.tag ? ' · ' + i.tag : ''}`}
      render={(it, set) => (
        <ItemEditor item={it} set={set} extra={repo ? <RepoField item={it} set={set} /> : null} />
      )} />
  );
}

/** Convenience: edits the first link button on the project's GITHUB page. */
function RepoField({ item, set }: { item: Item; set: (i: Item) => void }) {
  const pi = item.pages.findIndex((p) => p.blocks.some((b) => b.t === 'action' && /github/i.test(b.label)));
  const act = pi >= 0 ? (item.pages[pi].blocks.find((b) => b.t === 'action' && /github/i.test(b.label)) as Extract<Block, { t: 'action' }>) : null;
  if (!act) return <div className="warn">No GitHub button found on this project. Add a “Link / button” block to a page to link its repository.</div>;
  const upd = (href: string) => set({ ...item, pages: item.pages.map((p, i) => i !== pi ? p : { ...p, blocks: p.blocks.map((b) => b === act ? { ...act, href, hint: href.replace(/^https?:\/\//, '') } : b) }) });
  return <Field label="Repository URL" value={act.href ?? ''} onChange={upd} placeholder="https://github.com/you/project" />;
}

export function SectionsEditor({ sections, onChange }: { sections: Section[]; onChange: (s: Section[]) => void }) {
  return (
    <ListEditor items={sections} onChange={onChange} min={1} max={12} addLabel="ADD SECTION" title={(s) => s.label}
      make={() => ({ id: uid('sec'), label: 'NEW SECTION', desc: '', icon: 'chip', items: [blankItem()] })}
      render={(s, set) => (
        <div className="grid g2">
          <Field label="Menu label" value={s.label} max={30} onChange={(label) => set({ ...s, label })} />
          <Field label="Menu description" value={s.desc} max={200} onChange={(desc) => set({ ...s, desc })} />
          <IconSelect value={s.icon} onChange={(icon) => set({ ...s, icon })} />
          <Field label="Id (internal, unique)" value={s.id} onChange={(id) => set({ ...s, id: id.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
        </div>
      )} />
  );
}

/* ------------------------------ site + profile ------------------------------ */
export function SiteEditor({ site, set }: { site: Content['site']; set: (s: Content['site']) => void }) {
  const f = (k: keyof Omit<Content['site'], 'resumeRows'>, label: string, max = 60) => <Field label={label} value={site[k]} max={max} onChange={(v) => set({ ...site, [k]: v })} />;
  return (
    <>
      <div className="grid g2">{f('brand', 'Brand (boot logo, ≤12)', 12)}{f('brandSub', 'Brand subtitle', 14)}{f('press', 'Title-screen prompt', 30)}{f('copyright', 'Copyright line')}{f('resumeLabel', 'Resume quick-menu label', 20)}{f('resumeDesc', 'Resume quick-menu description', 120)}</div>
      <h3>RESUME SCREEN LABELS</h3>
      {site.resumeRows.map((r, i) => (
        <div className="grid g2" key={r.id} style={{ marginBottom: 8 }}>
          <Field label={`Row ${i + 1} label`} value={r.label} max={24} onChange={(label) => set({ ...site, resumeRows: site.resumeRows.map((x, k) => (k === i ? { ...x, label } : x)) })} />
          <Field label="Description" value={r.desc} max={120} onChange={(desc) => set({ ...site, resumeRows: site.resumeRows.map((x, k) => (k === i ? { ...x, desc } : x)) })} />
        </div>
      ))}
    </>
  );
}

export function ProfileEditor({ p, set }: { p: Content['profile']; set: (p: Content['profile']) => void }) {
  const me = (k: keyof Content['profile']['me'], label: string) => <Field label={label} value={p.me[k]} onChange={(v) => set({ ...p, me: { ...p.me, [k]: v } })} />;
  const ed = (k: keyof Content['profile']['edu'], label: string) => <Field label={label} value={p.edu[k]} onChange={(v) => set({ ...p, edu: { ...p.edu, [k]: v } })} />;
  return (
    <>
      <div className="warn">This data feeds the printable <b>/resume</b> and <b>/classic</b> pages and your contact links.</div>
      <h3>CONTACT & IDENTITY</h3>
      <div className="grid g2">{me('name', 'Name')}{me('title', 'Title')}{me('location', 'Location')}{me('email', 'Email')}{me('github', 'GitHub URL')}{me('linkedin', 'LinkedIn URL')}</div>
      <Pairs label="Headline stats" items={p.stats} onChange={(stats) => set({ ...p, stats })} a="Number" b="Label" />
      <h3>EXPERIENCE</h3>
      <ListEditor items={p.jobs} onChange={(jobs) => set({ ...p, jobs })} title={(j) => `${j.org} — ${j.role}`} addLabel="ADD JOB" make={() => ({ when: '', org: 'New company', role: '', pts: [''] })}
        render={(j, s) => (<><div className="grid g2"><Field label="Company" value={j.org} onChange={(org) => s({ ...j, org })} /><Field label="Role" value={j.role} onChange={(role) => s({ ...j, role })} /><Field label="When" value={j.when} onChange={(when) => s({ ...j, when })} /></div><StrList label="Highlights" items={j.pts} onChange={(pts) => s({ ...j, pts })} /></>)} />
      <h3>SKILL GROUPS</h3>
      <ListEditor items={p.skills} onChange={(skills) => set({ ...p, skills })} title={(g) => g.name} addLabel="ADD GROUP" make={() => ({ name: 'New group', items: [''] })}
        render={(g, s) => (<><Field label="Group name" value={g.name} onChange={(name) => s({ ...g, name })} /><StrList label="Skills" items={g.items} onChange={(items) => s({ ...g, items })} /></>)} />
      <h3>EDUCATION & CERTIFICATIONS</h3>
      <div className="grid g2">{ed('deg', 'Degree / certification')}{ed('school', 'School / issuer')}{ed('meta', 'Details (CGPA, date)')}{ed('extra', 'Extra (leadership, honours)')}</div>
      <h3>PROJECT SUMMARIES (resume / classic page)</h3>
      <ListEditor items={p.projects} onChange={(projects) => set({ ...p, projects })} title={(x) => x.t} addLabel="ADD PROJECT" make={() => ({ t: 'New project', k: '', d: '', s: [] })}
        render={(x, s) => (<><div className="grid g2"><Field label="Title" value={x.t} onChange={(t) => s({ ...x, t })} /><Field label="Kind" value={x.k} onChange={(k) => s({ ...x, k })} /><Field label="Metric" value={x.m ?? ''} onChange={(m) => s({ ...x, m })} /><Field label="Metric label" value={x.ml ?? ''} onChange={(ml) => s({ ...x, ml })} /><Field label="Status badge" value={x.st ?? ''} onChange={(st) => s({ ...x, st })} /></div><Field label="Description" multi value={x.d} onChange={(d) => s({ ...x, d })} /><StrList label="Stack" items={x.s} onChange={(sx) => s({ ...x, s: sx })} /></>)} />
    </>
  );
}
