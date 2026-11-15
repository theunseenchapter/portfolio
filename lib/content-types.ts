/* Shared content model (client + server). Everything the portfolio shows lives in content/portfolio.json. */
export const ICONS = ['person', 'cart', 'case', 'chip', 'trophy', 'mail', 'resume', 'db', 'pill', 'house', 'clip', 'orange', 'book', 'grid', 'cap', 'building', 'cloud'] as const;

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'steps'; items: [string, string][] }
  | { t: 'stats'; items: { big: string; label: string }[] }
  | { t: 'chips'; items: string[] }
  | { t: 'kv'; rows: [string, string][] }
  | { t: 'img'; src: string; alt: string }
  | { t: 'action'; label: string; href?: string; copy?: string; hint: string };

export type Page = { id: string; label: string; blocks: Block[] };
export type Item = { id: string; label: string; desc: string; art: string; tag?: string; image?: string; pages: Page[] };
export type Section = { id: string; label: string; desc: string; icon: string; items: Item[] };

export type Me = { name: string; email: string; github: string; linkedin: string; location: string; title: string };
export type ProfileProject = { t: string; k: string; d: string; s: string[]; m?: string; ml?: string; st?: string; wide?: boolean };
export type Job = { when: string; org: string; role: string; pts: string[] };
export type Profile = {
  me: Me;
  stats: [string, string][];
  projects: ProfileProject[];
  jobs: Job[];
  skills: { name: string; items: string[] }[];
  edu: { deg: string; school: string; meta: string; extra: string };
};

export const RESUME_ROW_IDS = ['pdf', 'experience', 'education', 'skills', 'contact'] as const;
export type Site = {
  brand: string; brandSub: string; press: string; copyright: string;
  resumeLabel: string; resumeDesc: string;
  resumeRows: { id: string; label: string; desc: string }[];
};

export type Content = { version: 1; updatedAt: string | null; site: Site; profile: Profile; sections: Section[] };

export const MEDIA_URL = '/api/media/';
export const RESUME_URL = '/api/resume';
