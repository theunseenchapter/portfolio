import { MENU_COUNT, RESUME_HREF, getItem, getSection, sections, type Block, type Page } from '@/data/arcade';

/* ------------------------------------------------------------------ */
/* Central navigation state machine for the Vivek Arcade console.      */
/*                                                                     */
/*   phase: boot → title → run                                         */
/*   run:   a stack of frames. stack[0] is always the main menu.       */
/*          Each frame owns its own cursor / tab / scroll, so popping  */
/*          (B) restores the parent exactly as it was left.            */
/*                                                                     */
/*   step() is pure: it returns the next state plus a list of effects  */
/*   (open link, copy, sound...) for the UI layer to perform.          */
/* ------------------------------------------------------------------ */

export type Frame =
  | { k: 'menu'; cur: number }
  | { k: 'resume'; cur: number }
  | { k: 'section'; sec: string; cur: number }
  | { k: 'detail'; sec: string; item: string; tab: number; scroll: number }
  | { k: 'settings'; cur: number };

export type Settings = { sound: boolean; scanlines: boolean; bigText: boolean };
export type Phase = 'boot' | 'title' | 'run';

export type State = {
  power: boolean;
  phase: Phase;
  bootId: number;
  stack: Frame[];
  settings: Settings;
  toast: { msg: string; id: number } | null;
};

export type Action =
  | { t: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'X' | 'Y' | 'START' | 'SELECT' | 'HOME' | 'POWER' | 'RESUME' | 'BOOT_DONE' | 'CLEAR_TOAST' }
  | { t: 'SET_SETTINGS'; settings: Settings };

export type Effect =
  | { t: 'open'; href: string }
  | { t: 'copy'; text: string }
  | { t: 'sound'; k: 'move' | 'open' | 'back' | 'deny' | 'on' | 'off' }
  | { t: 'textview' };

export type Ctx = { maxScroll: number };

export const SETTINGS_ROWS = ['SOUND', 'CRT LINES', 'BIG TEXT', 'TEXT VERSION', 'KEYBOARD'] as const;
export const KEY_HELP = 'ARROWS MOVE · ENTER/Z = A · ESC/X = B · Q = X · Y = RESUME · M = START · O = SELECT · H = HOME · P = POWER · R = RESUME';

export const initialState = (settings: Settings): State => ({
  power: false,
  phase: 'boot',
  bootId: 0,
  stack: [{ k: 'menu', cur: 0 }],
  settings,
  toast: null,
});

export const top = (s: State): Frame => s.stack[s.stack.length - 1];

export const pageOf = (f: Extract<Frame, { k: 'detail' }>): Page => getItem(f.sec, f.item).pages[f.tab];
export const actionOf = (page: Page): Extract<Block, { t: 'action' }> | undefined =>
  page.blocks.find((b): b is Extract<Block, { t: 'action' }> => b.t === 'action');

const wrap = (n: number, d: number, len: number) => (n + d + len) % len;
const replaceTop = (s: State, f: Frame): State => ({ ...s, stack: [...s.stack.slice(0, -1), f] });

let toastId = 0;
const withToast = (s: State, msg: string): State => ({ ...s, toast: { msg, id: ++toastId } });

export function step(s: State, a: Action, ctx: Ctx = { maxScroll: 0 }): { state: State; fx: Effect[] } {
  const same = { state: s, fx: [] as Effect[] };
  const fx: Effect[] = [];

  if (a.t === 'SET_SETTINGS') return { state: { ...s, settings: a.settings }, fx };
  if (a.t === 'CLEAR_TOAST') return { state: { ...s, toast: null }, fx };

  /* ---- power ---- */
  if (a.t === 'POWER') {
    const on = !s.power;
    const next = { ...s, power: on, bootId: on && s.phase === 'boot' ? s.bootId + 1 : s.bootId };
    return { state: next, fx: [{ t: 'sound', k: on ? 'on' : 'off' }] };
  }

  /* While off, only A / START wake the console. Navigation state is untouched. */
  if (!s.power) {
    if (a.t === 'A' || a.t === 'START') return step(s, { t: 'POWER' }, ctx);
    return same;
  }

  if (a.t === 'BOOT_DONE') return s.phase === 'boot' ? { state: { ...s, phase: 'title' }, fx } : same;

  /* ---- boot: A / START skip ---- */
  if (s.phase === 'boot') {
    if (a.t === 'A' || a.t === 'START') return { state: { ...s, phase: 'title' }, fx: [{ t: 'sound', k: 'open' }] };
    return same;
  }

  /* ---- title / HOME ---- */
  if (s.phase === 'title') {
    if (a.t === 'A' || a.t === 'START') return { state: { ...s, phase: 'run' }, fx: [{ t: 'sound', k: 'open' }] };
    if (a.t === 'RESUME') return { state: s, fx: [{ t: 'open', href: RESUME_HREF }] };
    return same;
  }

  /* ---- run ---- */
  const f = top(s);

  if (a.t === 'RESUME') return { state: s, fx: [{ t: 'open', href: RESUME_HREF }, { t: 'sound', k: 'open' }] };

  if (a.t === 'HOME') return { state: { ...s, phase: 'title', stack: [s.stack[0]], toast: null }, fx: [{ t: 'sound', k: 'back' }] };
  if (a.t === 'X') return step(s, { t: 'LEFT' }, ctx);
  if (a.t === 'Y') return step(s, { t: 'RESUME' }, ctx);

  if (a.t === 'START') {
    // Jump to the main menu hub, keeping the menu's own cursor.
    if (s.stack.length === 1) return { state: s, fx: [{ t: 'sound', k: 'deny' }] };
    return { state: { ...s, stack: [s.stack[0]] }, fx: [{ t: 'sound', k: 'back' }] };
  }

  if (a.t === 'SELECT') {
    if (f.k === 'settings') return { state: { ...s, stack: s.stack.slice(0, -1) }, fx: [{ t: 'sound', k: 'back' }] };
    return { state: { ...s, stack: [...s.stack, { k: 'settings', cur: 0 }] }, fx: [{ t: 'sound', k: 'open' }] };
  }

  if (a.t === 'B') {
    if (s.stack.length > 1) return { state: { ...s, stack: s.stack.slice(0, -1) }, fx: [{ t: 'sound', k: 'back' }] };
    return { state: { ...s, phase: 'title' }, fx: [{ t: 'sound', k: 'back' }] }; // menu → HOME
  }

  if (a.t === 'UP' || a.t === 'DOWN') {
    const d = a.t === 'UP' ? -1 : 1;
    switch (f.k) {
      case 'menu':
        return { state: replaceTop(s, { ...f, cur: wrap(f.cur, d, MENU_COUNT + 1) }), fx: [{ t: 'sound', k: 'move' }] };
      case 'section':
        return { state: replaceTop(s, { ...f, cur: wrap(f.cur, d, getSection(f.sec).items.length) }), fx: [{ t: 'sound', k: 'move' }] };
      case 'settings':
        return { state: replaceTop(s, { ...f, cur: wrap(f.cur, d, SETTINGS_ROWS.length) }), fx: [{ t: 'sound', k: 'move' }] };
      case 'detail': {
        const scroll = Math.max(0, Math.min(ctx.maxScroll, f.scroll + d));
        if (scroll === f.scroll) return same;
        return { state: replaceTop(s, { ...f, scroll }), fx: [{ t: 'sound', k: 'move' }] };
      }
    }
  }

  if (a.t === 'LEFT' || a.t === 'RIGHT') {
    if (f.k !== 'detail') return same;
    const d = a.t === 'LEFT' ? -1 : 1;
    const len = getItem(f.sec, f.item).pages.length;
    const tab = f.tab + d;
    if (tab < 0 || tab >= len) return { state: s, fx: [{ t: 'sound', k: 'deny' }] };
    return { state: replaceTop(s, { ...f, tab, scroll: 0 }), fx: [{ t: 'sound', k: 'move' }] };
  }

  if (a.t === 'A') {
    switch (f.k) {
      case 'menu': {
        if (f.cur === MENU_COUNT) return { state: { ...s, stack: [...s.stack, { k: 'resume', cur: 0 }] }, fx: [{ t: 'sound', k: 'open' }] };
        const sec = sections[f.cur].id;
        return { state: { ...s, stack: [...s.stack, { k: 'section', sec, cur: 0 }] }, fx: [{ t: 'sound', k: 'open' }] };
      }
      case 'resume': {
        if (f.cur === 0) return { state: s, fx: [{ t: 'open', href: RESUME_HREF }, { t: 'sound', k: 'open' }] };
        const destinations = [
          { sec: 'experience', cur: 0 },
          { sec: 'intro', cur: 3 },
          { sec: 'skills', cur: 0 },
          { sec: 'contact', cur: 0 },
        ];
        const destination = destinations[f.cur - 1];
        return { state: { ...s, stack: [...s.stack, { k: 'section', ...destination }] }, fx: [{ t: 'sound', k: 'open' }] };
      }
      case 'section': {
        const item = getSection(f.sec).items[f.cur].id;
        return { state: { ...s, stack: [...s.stack, { k: 'detail', sec: f.sec, item, tab: 0, scroll: 0 }] }, fx: [{ t: 'sound', k: 'open' }] };
      }
      case 'detail': {
        const act = actionOf(pageOf(f));
        if (act?.href) return { state: s, fx: [{ t: 'open', href: act.href }, { t: 'sound', k: 'open' }] };
        if (act?.copy) return { state: withToast(s, 'COPIED!'), fx: [{ t: 'copy', text: act.copy }, { t: 'sound', k: 'open' }] };
        const len = getItem(f.sec, f.item).pages.length;
        if (f.tab >= len - 1) return { state: s, fx: [{ t: 'sound', k: 'deny' }] };
        return { state: replaceTop(s, { ...f, tab: f.tab + 1, scroll: 0 }), fx: [{ t: 'sound', k: 'move' }] };
      }
      case 'settings': {
        const st = s.settings;
        switch (SETTINGS_ROWS[f.cur]) {
          case 'SOUND': return { state: { ...s, settings: { ...st, sound: !st.sound } }, fx: [{ t: 'sound', k: 'open' }] };
          case 'CRT LINES': return { state: { ...s, settings: { ...st, scanlines: !st.scanlines } }, fx: [{ t: 'sound', k: 'open' }] };
          case 'BIG TEXT': return { state: { ...s, settings: { ...st, bigText: !st.bigText } }, fx: [{ t: 'sound', k: 'open' }] };
          case 'TEXT VERSION': return { state: s, fx: [{ t: 'textview' }] };
          default: return same;
        }
      }
    }
  }
  return same;
}

/* ---- derived helpers used by the UI and the screen-reader announcer ---- */

export function crumbs(s: State): string[] {
  const out = ['HOME'];
  for (const f of s.stack) {
    if (f.k === 'menu') out.push('MENU');
    else if (f.k === 'resume') out.push('RESUME');
    else if (f.k === 'section') out.push(getSection(f.sec).label);
    else if (f.k === 'detail') out.push(getItem(f.sec, f.item).label.toUpperCase());
    else out.push('SETTINGS');
  }
  return out;
}

export function describe(s: State): string {
  if (!s.power) return 'Console is off. Press power to turn it on.';
  if (s.phase === 'boot') return 'Booting Vivek Arcade.';
  if (s.phase === 'title') return 'Vivek Arcade. Press start.';
  const f = top(s);
  const nav = 'Use up and down to move, A to open, B to go back.';
  if (f.k === 'menu') {
    const label = f.cur === MENU_COUNT ? 'Resume, quick action' : sections[f.cur].label;
    const desc = f.cur === MENU_COUNT ? 'Open the printable resume' : sections[f.cur].desc;
    return `Main menu. ${f.cur + 1} of ${MENU_COUNT + 1}: ${label}. ${desc} ${nav}`;
  }
  if (f.k === 'section') {
    const sec = getSection(f.sec);
    const it = sec.items[f.cur];
    return `${sec.label} menu. ${f.cur + 1} of ${sec.items.length}: ${it.label}. ${it.desc} ${nav}`;
  }
  if (f.k === 'settings') {
    const r = SETTINGS_ROWS[f.cur];
    const v = r === 'SOUND' ? s.settings.sound : r === 'CRT LINES' ? s.settings.scanlines : r === 'BIG TEXT' ? s.settings.bigText : null;
    return `Settings. ${f.cur + 1} of ${SETTINGS_ROWS.length}: ${r}${v === null ? '' : v ? ', on' : ', off'}. Press A to change, B to go back.`;
  }
  if (f.k === 'resume') {
    const labels = ['Download PDF', 'Experience', 'Education', 'Technical skills', 'Contact'];
    return `Resume menu. ${f.cur + 1} of ${labels.length}: ${labels[f.cur]}. Press A to open, B to go back.`;
  }
  const it = getItem(f.sec, f.item);
  const page = it.pages[f.tab];
  const text = page.blocks.map(blockText).join(' ');
  return `${it.label}, page ${f.tab + 1} of ${it.pages.length}: ${page.label}. ${text} Left and right change page, B goes back.`;
}

export function blockText(b: Block): string {
  switch (b.t) {
    case 'p':
    case 'h': return b.text;
    case 'list': return b.items.join('. ');
    case 'steps': return b.items.map(([n, t]) => `${n}: ${t}`).join('. ');
    case 'stats': return b.items.map((x) => `${x.big} ${x.label}`).join('. ');
    case 'chips': return b.items.join(', ');
    case 'kv': return b.rows.map(([k, v]) => `${k}: ${v}`).join('. ');
    case 'action': return `${b.label}. ${b.hint}.`;
  }
}
