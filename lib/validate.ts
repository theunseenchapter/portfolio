import { ICONS, RESUME_ROW_IDS, type Block, type Content, type Item, type Page, type Section } from './content-types';

/* Whitelist validator: rebuilds the content from known fields only, so unknown keys never reach disk. */
const ID = /^[a-z0-9][a-z0-9-]{0,40}$/;
const MEDIA = /^\/api\/media\/[A-Za-z0-9._-]{1,80}$/;
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

class Ctx {
  errors: string[] = [];
  err(path: string, msg: string) { if (this.errors.length < 25) this.errors.push(`${path}: ${msg}`); }
  str(v: unknown, path: string, max: number, o: { req?: boolean } = {}): string {
    if (typeof v !== 'string') { this.err(path, 'must be text'); return ''; }
    const s = v.replace(CTRL, '').trim();
    if (o.req && !s) this.err(path, 'is required');
    if (s.length > max) { this.err(path, `max ${max} characters`); return s.slice(0, max); }
    return s;
  }
  url(v: unknown, path: string, kinds: ('http' | 'rel' | 'mail' | 'media')[]): string {
    const s = this.str(v, path, 500);
    if (!s) return s;
    const ok = (kinds.includes('http') && /^https?:\/\/[^\s]+$/i.test(s)) || (kinds.includes('mail') && /^mailto:[^\s]+$/i.test(s))
      || (kinds.includes('rel') && /^\/(?!\/)[^\s]*$/.test(s)) || (kinds.includes('media') && MEDIA.test(s));
    if (!ok) this.err(path, 'invalid link');
    return s;
  }
  arr(v: unknown, path: string, min: number, max: number): unknown[] {
    if (!Array.isArray(v)) { this.err(path, 'must be a list'); return []; }
    if (v.length < min) this.err(path, `needs at least ${min}`);
    if (v.length > max) { this.err(path, `max ${max} entries`); return v.slice(0, max); }
    return v;
  }
  obj(v: unknown, path: string): Record<string, unknown> {
    if (!v || typeof v !== 'object' || Array.isArray(v)) { this.err(path, 'must be an object'); return {}; }
    return v as Record<string, unknown>;
  }
  id(v: unknown, path: string, seen: Set<string>): string {
    const s = this.str(v, path, 41, { req: true });
    if (!ID.test(s)) this.err(path, 'id must be lowercase letters, digits or dashes');
    if (seen.has(s)) this.err(path, `duplicate id "${s}"`);
    seen.add(s);
    return s;
  }
}

const strList = (c: Ctx, v: unknown, path: string, max = 40, len = 300) => c.arr(v, path, 0, max).map((x, i) => c.str(x, `${path}[${i}]`, len));
const pairs = (c: Ctx, v: unknown, path: string, max = 30): [string, string][] =>
  c.arr(v, path, 0, max).map((x, i) => {
    const a = Array.isArray(x) ? x : [];
    return [c.str(a[0], `${path}[${i}].0`, 120), c.str(a[1], `${path}[${i}].1`, 600)];
  });

function block(c: Ctx, v: unknown, path: string): Block {
  const o = c.obj(v, path);
  switch (o.t) {
    case 'p': return { t: 'p', text: c.str(o.text, `${path}.text`, 2000) };
    case 'h': return { t: 'h', text: c.str(o.text, `${path}.text`, 120) };
    case 'list': return { t: 'list', items: strList(c, o.items, `${path}.items`) };
    case 'chips': return { t: 'chips', items: strList(c, o.items, `${path}.items`, 60, 60) };
    case 'steps': return { t: 'steps', items: pairs(c, o.items, `${path}.items`) };
    case 'kv': return { t: 'kv', rows: pairs(c, o.rows, `${path}.rows`) };
    case 'stats': return { t: 'stats', items: c.arr(o.items, `${path}.items`, 0, 12).map((x, i) => { const s = c.obj(x, `${path}.items[${i}]`); return { big: c.str(s.big, `${path}.items[${i}].big`, 40), label: c.str(s.label, `${path}.items[${i}].label`, 120) }; }) };
    case 'img': return { t: 'img', src: c.url(o.src, `${path}.src`, ['media', 'http']), alt: c.str(o.alt, `${path}.alt`, 200) };
    case 'action': {
      const out: Block = { t: 'action', label: c.str(o.label, `${path}.label`, 40, { req: true }), hint: c.str(o.hint, `${path}.hint`, 120) };
      if (o.href) out.href = c.url(o.href, `${path}.href`, ['http', 'mail', 'rel']);
      if (o.copy) out.copy = c.str(o.copy, `${path}.copy`, 300);
      return out;
    }
    default: c.err(path, 'unknown block type'); return { t: 'p', text: '' };
  }
}

function page(c: Ctx, v: unknown, path: string, seen: Set<string>): Page {
  const o = c.obj(v, path);
  return { id: c.id(o.id, `${path}.id`, seen), label: c.str(o.label, `${path}.label`, 24, { req: true }), blocks: c.arr(o.blocks, `${path}.blocks`, 0, 30).map((b, i) => block(c, b, `${path}.blocks[${i}]`)) };
}

function item(c: Ctx, v: unknown, path: string, seen: Set<string>): Item {
  const o = c.obj(v, path);
  const art = c.str(o.art, `${path}.art`, 20);
  if (!(ICONS as readonly string[]).includes(art)) c.err(`${path}.art`, 'unknown icon');
  const pageIds = new Set<string>();
  const out: Item = {
    id: c.id(o.id, `${path}.id`, seen), label: c.str(o.label, `${path}.label`, 60, { req: true }), desc: c.str(o.desc, `${path}.desc`, 200), art,
    pages: c.arr(o.pages, `${path}.pages`, 1, 16).map((p, i) => page(c, p, `${path}.pages[${i}]`, pageIds)),
  };
  const tag = c.str(o.tag ?? '', `${path}.tag`, 40); if (tag) out.tag = tag;
  const image = c.url(o.image ?? '', `${path}.image`, ['media', 'http']); if (image) out.image = image;
  return out;
}

function section(c: Ctx, v: unknown, path: string, seen: Set<string>): Section {
  const o = c.obj(v, path);
  const icon = c.str(o.icon, `${path}.icon`, 20);
  if (!(ICONS as readonly string[]).includes(icon)) c.err(`${path}.icon`, 'unknown icon');
  const ids = new Set<string>();
  return { id: c.id(o.id, `${path}.id`, seen), label: c.str(o.label, `${path}.label`, 30, { req: true }), desc: c.str(o.desc, `${path}.desc`, 200), icon, items: c.arr(o.items, `${path}.items`, 1, 40).map((x, i) => item(c, x, `${path}.items[${i}]`, ids)) };
}

export function validateContent(input: unknown): { ok: true; content: Content } | { ok: false; errors: string[] } {
  const c = new Ctx();
  const r = c.obj(input, 'content');
  const si = c.obj(r.site, 'site');
  const rows = c.arr(si.resumeRows, 'site.resumeRows', RESUME_ROW_IDS.length, RESUME_ROW_IDS.length);
  const site = {
    brand: c.str(si.brand, 'site.brand', 12, { req: true }), brandSub: c.str(si.brandSub, 'site.brandSub', 14), press: c.str(si.press, 'site.press', 30),
    copyright: c.str(si.copyright, 'site.copyright', 60), resumeLabel: c.str(si.resumeLabel, 'site.resumeLabel', 20, { req: true }), resumeDesc: c.str(si.resumeDesc, 'site.resumeDesc', 120),
    resumeRows: RESUME_ROW_IDS.map((id, i) => { const o = c.obj(rows[i], `site.resumeRows[${i}]`); return { id, label: c.str(o.label, `site.resumeRows[${i}].label`, 24, { req: true }), desc: c.str(o.desc, `site.resumeRows[${i}].desc`, 120) }; }),
  };

  const p = c.obj(r.profile, 'profile');
  const me = c.obj(p.me, 'profile.me');
  const email = c.str(me.email, 'profile.me.email', 120, { req: true });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) c.err('profile.me.email', 'invalid email');
  const ed = c.obj(p.edu, 'profile.edu');
  const profile = {
    me: { name: c.str(me.name, 'profile.me.name', 80, { req: true }), email, github: c.url(me.github, 'profile.me.github', ['http']), linkedin: c.url(me.linkedin, 'profile.me.linkedin', ['http']), location: c.str(me.location, 'profile.me.location', 80), title: c.str(me.title, 'profile.me.title', 80) },
    stats: pairs(c, p.stats, 'profile.stats', 12),
    projects: c.arr(p.projects, 'profile.projects', 0, 40).map((x, i) => {
      const o = c.obj(x, `profile.projects[${i}]`); const pp = `profile.projects[${i}]`;
      const out: Content['profile']['projects'][number] = { t: c.str(o.t, `${pp}.t`, 80, { req: true }), k: c.str(o.k, `${pp}.k`, 60), d: c.str(o.d, `${pp}.d`, 600), s: strList(c, o.s, `${pp}.s`, 20, 40) };
      const m = c.str(o.m ?? '', `${pp}.m`, 30), ml = c.str(o.ml ?? '', `${pp}.ml`, 60), st = c.str(o.st ?? '', `${pp}.st`, 40);
      if (m) out.m = m; if (ml) out.ml = ml; if (st) out.st = st; if (o.wide === true) out.wide = true;
      return out;
    }),
    jobs: c.arr(p.jobs, 'profile.jobs', 0, 20).map((x, i) => { const o = c.obj(x, `profile.jobs[${i}]`); return { when: c.str(o.when, `profile.jobs[${i}].when`, 60), org: c.str(o.org, `profile.jobs[${i}].org`, 80, { req: true }), role: c.str(o.role, `profile.jobs[${i}].role`, 80), pts: strList(c, o.pts, `profile.jobs[${i}].pts`, 20, 400) }; }),
    skills: c.arr(p.skills, 'profile.skills', 0, 20).map((x, i) => { const o = c.obj(x, `profile.skills[${i}]`); return { name: c.str(o.name, `profile.skills[${i}].name`, 40, { req: true }), items: strList(c, o.items, `profile.skills[${i}].items`, 40, 60) }; }),
    edu: { deg: c.str(ed.deg, 'profile.edu.deg', 100), school: c.str(ed.school, 'profile.edu.school', 140), meta: c.str(ed.meta, 'profile.edu.meta', 140), extra: c.str(ed.extra, 'profile.edu.extra', 200) },
  };

  const seen = new Set<string>();
  const sections = c.arr(r.sections, 'sections', 1, 12).map((s, i) => section(c, s, `sections[${i}]`, seen));
  if (c.errors.length) return { ok: false, errors: c.errors };
  return { ok: true, content: { version: 1, updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : null, site, profile, sections } };
}
