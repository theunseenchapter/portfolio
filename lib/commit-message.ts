import type { Content, Section } from './content-types';

/* Builds meaningful commit messages by comparing the committed portfolio.json (HEAD) with the new one.
   Pure functions, no I/O: the Git layer passes in what changed. */
export type FileChange = { path: string; status: 'added' | 'modified' | 'deleted' };
type Topic = { verb: 'Add' | 'Update' | 'Remove'; noun: string };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const NOUN: Record<string, string> = {
  intro: 'portfolio introduction', projects: 'projects', experience: 'experience', skills: 'skills',
  achievements: 'achievements', contact: 'contact details',
};

function sectionTopics(o: Section | undefined, n: Section | undefined, out: Topic[]) {
  if (!o && n) return void out.push({ verb: 'Add', noun: `${lc(n.label)} section` });
  if (o && !n) return void out.push({ verb: 'Remove', noun: `${lc(o.label)} section` });
  if (!o || !n || same(o, n)) return;
  if (n.id === 'projects') {
    const oi = new Map(o.items.map((i) => [i.id, i])), ni = new Map(n.items.map((i) => [i.id, i]));
    const added = n.items.filter((i) => !oi.has(i.id)), removed = o.items.filter((i) => !ni.has(i.id));
    const changed = n.items.filter((i) => oi.has(i.id) && !same(oi.get(i.id), i));
    if (added.length) out.push({ verb: 'Add', noun: added.length === 1 ? `new project: ${added[0].label}` : `${added.length} new projects` });
    if (removed.length) out.push({ verb: 'Remove', noun: removed.length === 1 ? `project: ${removed[0].label}` : `${removed.length} projects` });
    if (changed.length) out.push({ verb: 'Update', noun: changed.length === 1 ? `project: ${changed[0].label}` : 'projects' });
    if (!added.length && !removed.length && !changed.length) out.push({ verb: 'Update', noun: 'project list order' });
    return;
  }
  const noun = NOUN[n.id] ?? lc(n.label);
  const metaChanged = o.label !== n.label || o.desc !== n.desc || o.icon !== n.icon;
  const itemsChanged = !same(o.items, n.items);
  out.push({ verb: 'Update', noun: itemsChanged || !metaChanged ? noun : `${noun} section` });
}

export function describeContent(o: Content | null, n: Content | null): Topic[] {
  const out: Topic[] = [];
  if (!n) return out;
  if (!o) return [{ verb: 'Add', noun: 'portfolio content' }];

  if (!same(o.site, n.site)) out.push({ verb: 'Update', noun: 'site text and navigation labels' });

  const ids = [...n.sections.map((s) => s.id), ...o.sections.filter((s) => !n.sections.some((x) => x.id === s.id)).map((s) => s.id)];
  for (const id of ids) sectionTopics(o.sections.find((s) => s.id === id), n.sections.find((s) => s.id === id), out);
  if (!same(o.sections.map((s) => s.id), n.sections.map((s) => s.id)) && !out.some((t) => /section$/.test(t.noun))) out.push({ verb: 'Update', noun: 'menu order' });

  // Profile data (powers /resume and /classic). Skip noun duplicates already reported by the sections above.
  const have = (w: string) => out.some((t) => t.noun.includes(w));
  const op = o.profile, np = n.profile;
  if (!same(op.me, np.me) && !have('contact')) out.push({ verb: 'Update', noun: 'contact details' });
  if (!same(op.jobs, np.jobs) && !have('experience')) out.push({ verb: 'Update', noun: 'experience' });
  if (!same(op.skills, np.skills) && !have('skills')) out.push({ verb: 'Update', noun: 'skills' });
  if (!same(op.edu, np.edu)) out.push({ verb: 'Update', noun: 'education' });
  if (!same(op.stats, np.stats)) out.push({ verb: 'Update', noun: 'resume highlights' });
  if (!same(op.projects, np.projects) && !have('project')) {
    const oldT = op.projects.map((p) => p.t), newT = np.projects.map((p) => p.t);
    const add = newT.filter((t) => !oldT.includes(t)), rem = oldT.filter((t) => !newT.includes(t));
    if (add.length === 1 && !rem.length) out.push({ verb: 'Add', noun: `new project: ${add[0]}` });
    else out.push({ verb: 'Update', noun: 'projects' });
  }
  return out;
}

function join(list: string[]) { return list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`; }

/** One short, meaningful subject line (<= 72 chars) plus a body listing every topic and file. */
export function buildCommitMessage(files: FileChange[], oldC: Content | null, newC: Content | null): { subject: string; body: string } {
  const topics: Topic[] = [];
  const portfolioChanged = files.some((f) => f.path === 'content/portfolio.json');
  if (portfolioChanged) topics.push(...describeContent(oldC, newC));

  const inDir = (d: string) => files.filter((f) => f.path.startsWith(d));
  const resumeFiles = files.filter((f) => /^content\/resume\/current\.(pdf|json)$/.test(f.path));
  const pdf = resumeFiles.find((f) => f.path.endsWith('.pdf'));
  if (pdf) topics.push({ verb: pdf.status === 'added' ? 'Add' : pdf.status === 'deleted' ? 'Remove' : 'Update', noun: 'resume' });
  else if (inDir('content/resume/archive/').length) topics.push({ verb: 'Update', noun: 'resume archive' });

  const media = inDir('content/media/');
  const mAdd = media.filter((f) => f.status === 'added').length, mDel = media.filter((f) => f.status === 'deleted').length;
  if (mAdd) topics.push({ verb: 'Add', noun: mAdd === 1 ? 'image' : `${mAdd} images` });
  if (mDel) topics.push({ verb: 'Remove', noun: mDel === 1 ? 'image' : `${mDel} images` });
  if (portfolioChanged && !topics.length) topics.push({ verb: 'Update', noun: 'portfolio content' });
  if (!topics.length) topics.push({ verb: 'Update', noun: 'portfolio files' });

  let subject: string;
  if (topics.length === 1) subject = `${topics[0].verb} ${topics[0].noun}`;
  else if (topics.every((t) => t.verb === topics[0].verb)) subject = `${topics[0].verb} ${join(topics.map((t) => t.noun))}`;
  else subject = topics.map((t, i) => (i ? `${t.verb.toLowerCase()} ${t.noun}` : `${t.verb} ${t.noun}`)).join(', ');
  if (subject.length > 72) subject = `Update portfolio content (${topics.length} changes)`;

  const mark = { added: 'A', modified: 'M', deleted: 'D' } as const;
  const body = [
    ...topics.map((t) => `- ${t.verb} ${t.noun}`), '',
    'Files:', ...files.map((f) => `  ${mark[f.status]} ${f.path}`), '',
    'Committed automatically by the portfolio admin dashboard.',
  ].join('\n');
  return { subject, body };
}
