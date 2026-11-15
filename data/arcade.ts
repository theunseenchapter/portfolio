import { dests } from './world';
import { edu, jobs, me, projects, skills as _skills, stats } from './profile';

/* ------------------------------------------------------------------ */
/* Content model for the Vivek Arcade console.                         */
/* Every fact here is sourced from data/profile.ts and data/world.ts.  */
/* ------------------------------------------------------------------ */

import type { Block, Content, Item, Page, Section, Site } from '@/lib/content-types';
export type { Block, Item, Page, Section };

/** Fallback copy of the printable-resume route; replaced at runtime by setContent(). */
export const FALLBACK_RESUME_HREF = '/resume';
const RESUME_HREF_DEFAULT = FALLBACK_RESUME_HREF;

const p = (text: string): Block => ({ t: 'p', text });
const pg = (id: string, label: string, ...blocks: Block[]): Page => ({ id, label, blocks });

/* ---------------------------- PROJECTS ---------------------------- */

const decisions: Record<string, string[]> = {
  datascope: [
    'Read the schema straight from PostgreSQL catalogs: deterministic, not guessed.',
    'Validate SQL against the real schema before anything runs.',
    'Block risky statements with explicit safety checks.',
    'FastAPI backend + React workspace keep logic and UI separate.',
  ],
  medisource: [
    'Split the job across cooperating agents instead of one monolith.',
    'Ground recommendations with RAG over medicine knowledge.',
    'Place orders through APIs, not manual steps.',
  ],
  'home-alchemy': [
    'Fine-tune Stable Diffusion for interiors rather than use a generic model.',
    'Optimise inference so users can iterate quickly: 60% faster.',
    'Capture a structured room brief in the Next.js front end.',
  ],
  clipbridge: [
    'Dependability first: a transfer must simply work.',
    'A direct cross-device bridge instead of email or chat.',
    'Keep copy and paste as the only gestures.',
  ],
  tangerine: [
    'Qt / PySide6 for the interface.',
    'Win32 / OLE integration for real OS-level reach.',
    'Convert in context, right where the file already is.',
  ],
  contextword: [
    'Offline, on-device dictionary so lookups never leak what you read.',
    'Read the surrounding sentence to pick the right meaning.',
    'TypeScript on Chromium APIs for a light extension.',
  ],
  excel: [
    'Fetch templates from the backend (React Query): rules live in one place.',
    'Strongly typed validation against the template.',
    'Surface data-quality issues before they reach the backend.',
  ],
};

const projectSpecs: [string, string, string][] = [
  ['datascope', 'DataScope', 'db'],
  ['medisource', 'MediSource', 'pill'],
  ['home-alchemy', 'Home Alchemy', 'house'],
  ['clipbridge', 'ClipBridge', 'clip'],
  ['tangerine', 'Tangerine', 'orange'],
  ['contextword', 'ContextWord', 'book'],
  ['excel', 'Excel Validation Dashboard', 'grid'],
];

/** Per-project repo URLs. Falls back to the GitHub profile until real repo URLs are added. */
export const repoUrls: Record<string, string> = {};

function projectItem([id, name, art]: [string, string, string]): Item {
  const d = dests.find((x) => x.id === id)!;
  const pr = projects.find((x) => x.t.toLowerCase() === name.toLowerCase())!;
  const repo = repoUrls[id] ?? me.github;
  const metricBlocks: Block[] = pr.m
    ? [{ t: 'stats', items: [{ big: pr.m, label: pr.ml ?? '' }] }]
    : [p('No quantified metric has been published for this project yet.')];
  return {
    id,
    label: name,
    art,
    tag: d.status ? 'IN DEVELOPMENT' : d.eyebrow.toUpperCase(),
    desc: pr.k + ' · ' + pr.s.slice(0, 3).join(', '),
    pages: [
      pg('overview', 'OVERVIEW', p(pr.d)),
      pg('problem', 'PROBLEM', { t: 'h', text: 'PROBLEM SOLVED' }, p(d.problem)),
      pg('arch', 'ARCHITECTURE', { t: 'steps', items: d.arch.map((a) => [a.n, a.note]) }),
      pg('decisions', 'DECISIONS', { t: 'h', text: 'ENGINEERING DECISIONS' }, { t: 'list', items: decisions[id] }),
      pg('tech', 'TECHNOLOGIES', { t: 'chips', items: d.stack }),
      pg('metrics', 'METRICS', ...metricBlocks, { t: 'h', text: 'VERIFIED OUTCOMES' }, { t: 'list', items: d.wins }),
      pg('github', 'GITHUB', p('Source and profile on GitHub. Opens in a new tab; your console session stays here.'), {
        t: 'action',
        label: 'OPEN GITHUB',
        href: repo,
        hint: repo.replace('https://', ''),
      }),
    ],
  };
}

/* --------------------------- INTRODUCTION --------------------------- */

const intro: Item[] = [
  {
    id: 'about',
    label: 'About Me',
    art: 'person',
    desc: 'Engineer, builder, Mumbai.',
    pages: [
      pg('profile', 'PROFILE', p('Software engineer building reliable backend systems, data tooling and AI products.'),
        { t: 'kv', rows: [['NAME', me.name.toUpperCase()], ['ROLE', 'ASSOCIATE SOFTWARE ENGINEER I'], ['AT', 'SYNORIQ'], ['BASE', 'MUMBAI, INDIA']] }),
      pg('focus', 'FOCUS', { t: 'h', text: 'WHAT I BUILD' }, { t: 'list', items: ['Production lending systems for an NBFC client.', 'Data tooling: schemas, SQL safety, validation.', 'AI products: agents, RAG, generative design.'] }),
      pg('stats', 'STATS', { t: 'stats', items: stats.map(([big, label]) => ({ big, label })) }),
    ],
  },
  {
    id: 'journey',
    label: 'My Journey',
    art: 'cap',
    desc: 'From campus to production.',
    pages: [
      pg('timeline', 'TIMELINE', {
        t: 'steps',
        items: [
          ['MAY–JUN 2024', 'Cloud Computing Intern at iFuture Technologies.'],
          ['MAY 2026', 'Joined Synoriq as Associate Software Engineer I.'],
          ['JUN 2026', `Graduated: ${edu.deg}, CGPA 8.13 / 10.`],
        ],
      }),
      pg('now', 'NOW', p('Shipping a loan management system for an NBFC client while building independent products on the side: DataScope, MediSource, Home Alchemy and more.')),
    ],
  },
  {
    id: 'philosophy',
    label: 'Engineering Philosophy',
    art: 'chip',
    desc: 'Principles behind the work.',
    pages: [
      pg('principles', 'PRINCIPLES', {
        t: 'steps',
        items: [
          ['CORRECT FIRST', 'Production systems must be right before they are fast.'],
          ['LEGIBLE DATA', 'Make the schema understandable before building on it.'],
          ['GUARD EARLY', 'Catch unsafe queries and bad inputs before production.'],
          ['MEASURE IT', 'Prove a win with a number: 2 min to 20 sec.'],
        ],
      }),
      pg('practice', 'IN PRACTICE', { t: 'list', items: ['DataScope validates SQL against the real schema.', 'Excel Validation Dashboard flags bad workbooks up front.', 'Synoriq reports: 2 minutes cut to 20 seconds.'] }),
    ],
  },
  {
    id: 'education',
    label: 'Education',
    art: 'cap',
    desc: 'B.E. Computer Engineering.',
    pages: [
      pg('degree', 'DEGREE', { t: 'kv', rows: [['DEGREE', 'B.E. COMPUTER ENGINEERING'], ['COLLEGE', 'LOKMANYA TILAK COLLEGE OF ENGINEERING, NAVI MUMBAI'], ['CGPA', '8.13 / 10'], ['GRADUATED', 'JUNE 2026']] }),
      pg('lead', 'LEADERSHIP', p(edu.extra + '.')),
    ],
  },
];

/* ----------------------------- EXPERIENCE ---------------------------- */

const syn = dests.find((d) => d.id === 'synoriq')!;
const exp: Item[] = [
  {
    id: 'synoriq',
    label: 'Synoriq',
    art: 'building',
    tag: 'MAY 2026 — PRESENT',
    desc: 'Associate Software Engineer I.',
    pages: [
      pg('role', 'ROLE', { t: 'kv', rows: [['ROLE', jobs[0].role.toUpperCase()], ['WHEN', jobs[0].when.toUpperCase()], ['WORK', 'LOAN MANAGEMENT SYSTEM FOR AN NBFC CLIENT']] }),
      pg('work', 'WORK', { t: 'list', items: jobs[0].pts }),
      pg('impact', 'IMPACT', { t: 'stats', items: [{ big: '2m → 20s', label: 'report execution time' }, { big: '₹3,000+ cr', label: 'client AUM supported' }] }),
      pg('stack', 'STACK', { t: 'chips', items: syn.stack }),
    ],
  },
  {
    id: 'ifuture',
    label: 'IFuture Technologies',
    art: 'cloud',
    tag: 'MAY — JUN 2024',
    desc: 'Cloud Computing Intern.',
    pages: [
      pg('role', 'ROLE', { t: 'kv', rows: [['ROLE', jobs[1].role.toUpperCase()], ['WHEN', jobs[1].when.toUpperCase()]] }),
      pg('work', 'WORK', { t: 'list', items: ['Tested cloud-based applications.', 'Reproduced and documented API issues.', 'Wrote automation scripts.', 'Worked in Agile sprints.'] }),
      pg('stack', 'STACK', { t: 'chips', items: ['Cloud', 'API testing', 'Automation', 'Agile'] }),
    ],
  },
  {
    id: 'pro-achievements',
    label: 'Professional Achievements',
    art: 'trophy',
    desc: 'Numbers from production.',
    pages: [
      pg('impact', 'IMPACT', { t: 'stats', items: stats.slice(0, 2).map(([big, label]) => ({ big, label })) }),
      pg('details', 'DETAILS', { t: 'list', items: ['Report execution cut from 2 minutes to 20 seconds.', 'ETL, migration and reconciliation for clients managing ₹3,000+ crore and ₹500+ crore AUM.', 'Production issue investigation and CI/CD releases.'] }),
    ],
  },
];

/* ------------------------------ SKILLS ------------------------------ */

const skill = (id: string, label: string, art: string, desc: string, chips: string[], used: string[]): Item => ({
  id, label, art, desc,
  pages: [pg('kit', 'INVENTORY', { t: 'chips', items: chips }), pg('used', 'USED FOR', { t: 'list', items: used })],
});

const skillItems: Item[] = [
  skill('lang', 'Programming Languages', 'chip', 'Java · Python · SQL · TS', ['Java', 'Python', 'SQL', 'TypeScript'],
    ['Java: Spring Boot services at Synoriq.', 'Python: FastAPI, PyTorch, PySide6.', 'SQL: query writing, optimisation, migration.', 'TypeScript: React frontends, ContextWord.']),
  skill('backend', 'Backend Engineering', 'chip', 'Services, ETL, APIs', ['Spring Boot', 'FastAPI', 'REST APIs', 'ETL', 'Data migration', 'CI/CD'],
    ['Backend services in Java and Python.', 'ETL, migration and reconciliation workflows.', 'Contributing to CI/CD releases.']),
  skill('ai', 'AI / ML', 'chip', 'Agents, RAG, diffusion', ['Agentic AI', 'RAG', 'NLP', 'PyTorch', 'Stable Diffusion'],
    ['MediSource: multi-agent ordering with RAG and NLP.', 'Home Alchemy: fine-tuned diffusion, 60% faster inference.']),
  skill('db', 'Databases', 'db', 'PostgreSQL & SQL tuning', ['PostgreSQL', 'SQL', 'Query optimisation', 'Data migration'],
    ['DataScope: 680+ tables, 13K+ columns mapped.', 'LMS reports: 2 minutes cut to 20 seconds.']),
  skill('frontend', 'Frontend', 'grid', 'React, Next.js, TypeScript', ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Material UI', 'React Query'],
    ['Excel Validation Dashboard with typed data fetching.', 'Home Alchemy product experience in Next.js.', 'Operations UIs at Synoriq.']),
  skill('tools', 'Tools and Technologies', 'clip', 'Desktop, browser, cloud', ['Qt', 'PySide6', 'Win32 / OLE', 'Chromium APIs', 'CI/CD', 'Agile', 'Cloud'],
    ['Tangerine: Qt / PySide6 and Win32 / OLE.', 'ContextWord: Chromium extension APIs.', 'Agile delivery and cloud testing.']),
];

/* --------------------------- ACHIEVEMENTS --------------------------- */

const ach: Item[] = [
  {
    id: 'perf', label: 'Performance Optimization', art: 'trophy', desc: '2 min → 20 sec.',
    pages: [
      pg('headline', 'HEADLINE', { t: 'stats', items: [{ big: '2m → 20s', label: 'report execution time' }, { big: '60%', label: 'faster model inference' }] }),
      pg('where', 'WHERE', { t: 'list', items: ['Synoriq: report execution cut from 2 minutes to 20 seconds.', 'Home Alchemy: diffusion inference time reduced by 60%.'] }),
    ],
  },
  {
    id: 'dbeng', label: 'Database Engineering', art: 'db', desc: '680+ tables mapped.',
    pages: [
      pg('headline', 'HEADLINE', { t: 'stats', items: [{ big: '680+', label: 'tables mapped by DataScope' }, { big: '13K+', label: 'columns' }] }),
      pg('where', 'WHERE', { t: 'list', items: ['DataScope: schema exploration, SQL validation and safety checks.', 'Synoriq: SQL optimisation, data migration, reconciliation.', 'Clients managing ₹3,000+ crore and ₹500+ crore AUM.'] }),
    ],
  },
  {
    id: 'aiopt', label: 'AI Optimization', art: 'pill', desc: '60% faster inference.',
    pages: [
      pg('headline', 'HEADLINE', { t: 'stats', items: [{ big: '60%', label: 'faster model inference' }] }),
      pg('where', 'WHERE', { t: 'list', items: ['Home Alchemy: fine-tuned Stable Diffusion on PyTorch.', 'MediSource: multi-agent RAG platform (in development).'] }),
    ],
  },
  {
    id: 'product', label: 'Product Development', art: 'house', desc: `${projects.length} products built.`,
    pages: [
      pg('headline', 'HEADLINE', { t: 'stats', items: [{ big: String(projects.length), label: 'products & tools (1 in development)' }] }),
      pg('where', 'THE LINEUP', { t: 'list', items: projects.map((x) => x.t) }),
    ],
  },
];

/* ------------------------------ CONTACT ------------------------------ */

const contact: Item[] = [
  {
    id: 'email', label: 'Email', art: 'mail', desc: me.email,
    pages: [
      pg('send', 'SEND', p(me.email), { t: 'action', label: 'WRITE EMAIL', href: `mailto:${me.email}`, hint: 'Opens your mail app' }),
      pg('copy', 'COPY', p('Copy the address to your clipboard.'), { t: 'action', label: 'COPY ADDRESS', copy: me.email, hint: me.email }),
    ],
  },
  {
    id: 'linkedin', label: 'LinkedIn', art: 'person', desc: 'linkedin.com/in/vivekyadav03',
    pages: [pg('open', 'PROFILE', p('Professional profile and work history.'), { t: 'action', label: 'OPEN LINKEDIN', href: me.linkedin, hint: 'Opens in a new tab' })],
  },
  {
    id: 'github', label: 'GitHub', art: 'clip', desc: 'github.com/theunseenchapter',
    pages: [pg('open', 'PROFILE', p('Source code and projects.'), { t: 'action', label: 'OPEN GITHUB', href: me.github, hint: 'Opens in a new tab' })],
  },
  {
    id: 'resume', label: 'Download Resume', art: 'resume', desc: 'Printable resume · save as PDF.',
    pages: [
      pg('get', 'RESUME', p('Opens in a new tab. Use PRINT, then SAVE AS PDF, to download it.'), { t: 'action', label: 'OPEN RESUME', href: FALLBACK_RESUME_HREF, hint: 'Opens in a new tab' }),
    ],
  },
];

/* ------------------------------ SECTIONS ------------------------------ */

const defaultSections: Section[] = [
  { id: 'intro', label: 'INTRODUCTION', desc: 'Who Vivek is, and how he thinks.', icon: 'person', items: intro },
  { id: 'projects', label: 'PROJECTS', desc: 'Seven builds: data, AI and tools.', icon: 'cart', items: projectSpecs.map(projectItem) },
  { id: 'experience', label: 'EXPERIENCE', desc: 'Production engineering at Synoriq.', icon: 'case', items: exp },
  { id: 'skills', label: 'TECHNICAL SKILLS', desc: 'Languages, backend, AI, data.', icon: 'chip', items: skillItems },
  { id: 'achievements', label: 'ACHIEVEMENTS', desc: 'Results backed by numbers.', icon: 'trophy', items: ach },
  { id: 'contact', label: 'CONTACT', desc: 'Say hello or grab the resume.', icon: 'mail', items: contact },
];


export const defaultSite: Site = {
  brand: 'VIVEK', brandSub: 'ARCADE', press: 'PRESS START.', copyright: '\u00a9 2026 VIVEK YADAV',
  resumeLabel: 'RESUME', resumeDesc: 'Open the printable resume now.',
  resumeRows: [
    { id: 'pdf', label: 'DOWNLOAD PDF', desc: 'Open the printable resume and save it as a PDF.' },
    { id: 'experience', label: 'EXPERIENCE', desc: 'Professional experience and production impact.' },
    { id: 'education', label: 'EDUCATION', desc: 'Degree, college and leadership.' },
    { id: 'skills', label: 'TECHNICAL SKILLS', desc: 'Languages, backend, data, frontend and AI.' },
    { id: 'contact', label: 'CONTACT', desc: 'Email, GitHub and LinkedIn.' },
  ],
};

/** Seed used when content/portfolio.json does not exist yet. */
export const defaultContent: Content = {
  version: 1, updatedAt: null, site: defaultSite,
  profile: {
    me: { ...me, location: 'Mumbai, India', title: 'Software Engineer' },
    stats: stats as [string, string][],
    projects, jobs,
    skills: Object.entries(_skills).map(([name, items]) => ({ name, items })),
    edu,
  },
  sections: defaultSections,
};

/* ---- live content store: set once per render by <Console content=...> ---- */
export let sections: Section[] = defaultSections;
export let site: Site = defaultSite;
export let RESUME_HREF: string = RESUME_HREF_DEFAULT;
export let MENU_COUNT = sections.length; // primary options; index MENU_COUNT is the RESUME quick action
export const quickResume = { icon: 'resume' };
export function setContent(c: Pick<Content, 'sections' | 'site'>, resumeHref: string) {
  // Any action pointing at the printable-resume fallback follows the uploaded PDF when one exists.
  const swap = (b: Block): Block => (b.t === 'action' && b.href === FALLBACK_RESUME_HREF ? { ...b, href: resumeHref } : b);
  sections = c.sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, pages: i.pages.map((pg) => ({ ...pg, blocks: pg.blocks.map(swap) })) })) }));
  site = c.site; RESUME_HREF = resumeHref; MENU_COUNT = c.sections.length;
}
export const getSection = (id: string) => sections.find((s) => s.id === id) ?? sections[0];
export const getItem = (sid: string, id: string) => {
  const s = getSection(sid);
  return s.items.find((i) => i.id === id) ?? s.items[0];
};
