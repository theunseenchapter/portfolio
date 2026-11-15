import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import type { Content } from './content-types';
import { buildCommitMessage, type FileChange } from './commit-message';
import { P, checkPdf, mediaPath, readContent, resumeInfo, writeContent } from './store';
import { validateContent } from './validate';

/* ------------------------------------------------------------------------------------------
   Git as the database. Server-side only: this module must never be imported by client code.

   Rules this file enforces:
   - credentials come from env (GITHUB_TOKEN) and are handed to git through the process
     environment, never argv, never stored in .git/config, never returned to the browser;
   - only the portfolio's own files (content/portfolio.json, resume, media) are ever staged or
     committed, so unrelated repository changes and .env can never be swept in;
   - no force push, no reset --hard, no clean: unrelated work in the repo is never touched;
   - one save/sync at a time (in-process queue + lock directory for multi-process servers).
------------------------------------------------------------------------------------------ */

const ROOT = process.cwd();
const MANAGED = ['content/portfolio.json', 'content/resume', 'content/media'];
const ALLOW: RegExp[] = [
  /^content\/portfolio\.json$/,
  /^content\/resume\/current\.(pdf|json)$/,
  /^content\/resume\/archive\/resume-\d{8}T\d{6}Z(-[a-f0-9]{4})?\.(pdf|json)$/,
  /^content\/media\/[A-Za-z0-9._-]{1,80}\.(png|jpe?g|gif|webp)$/i,
];
const LOCK_DIR = path.join(P.backups, '.sync.lock'); // content/backups/ is git-ignored
const LOCK_STALE_MS = 10 * 60_000;

export type Phase = 'idle' | 'saving' | 'saved' | 'preparing' | 'committing' | 'committed' | 'pushing';
export type SyncFailure = { stage: 'validate' | 'config' | 'repo' | 'commit' | 'network' | 'push' | 'conflict'; message: string; conflict?: boolean };
export type SyncResult = {
  at: string; configured: boolean; saved?: boolean; committed: boolean; pushed: boolean; nothing?: boolean;
  commit?: { sha: string; message: string }; headSha?: string; failure?: SyncFailure;
};
type Record_ = { at: string; sha?: string; message?: string; branch?: string };
type Persisted = { lastSuccess?: Record_; lastFailure?: { at: string; stage: string; message: string } };
export type DeployItem = { name: string; kind: 'deployment' | 'status' | 'check'; state: 'pending' | 'success' | 'failure'; url?: string; detail?: string };
export type DeployInfo = { sha: string; overall: 'none' | 'pending' | 'success' | 'failure'; items: DeployItem[]; note?: string; checkedAt: string };
export type SyncStatus = {
  configured: boolean; problems: string[]; warnings: string[]; repo?: string; branch?: string;
  busy: boolean; phase: Phase; pending: number; unpushed: number | null;
  lastSuccess?: Record_; lastFailure?: Persisted['lastFailure']; lastResult?: SyncResult;
};

type Shared = { busy: boolean; phase: Phase; persisted: Persisted; last?: SyncResult; cache: { pending: number; unpushed: number | null }; deploy?: { at: number; info: DeployInfo } };
const G = globalThis as unknown as { __pfSync?: Shared };
const S: Shared = (G.__pfSync ??= { busy: false, phase: 'idle', persisted: {}, cache: { pending: 0, unpushed: null } });

export class BusyError extends Error { constructor() { super('Another save is already in progress.'); } }

/* ---------------------------------- config ---------------------------------- */
type Config = { token: string; slug?: string; branch: string; author: { name: string; email: string } };
const SLUG = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH = /^(?!-)(?!.*\.\.)[A-Za-z0-9._/-]{1,100}$/;

function parseSlug(url: string): string | null {
  const m = url.trim().match(/github\.com[:/]+([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
  return m ? `${m[1]}/${m[2]}` : null;
}
function getConfig(): { ok: true; cfg: Config } | { ok: false; problems: string[] } {
  const problems: string[] = [];
  const token = (process.env.GITHUB_TOKEN ?? '').trim();
  if (!token) problems.push('GITHUB_TOKEN is not set on the server.');
  let slug: string | undefined;
  const rawRepo = (process.env.GITHUB_REPOSITORY ?? '').trim();
  if (rawRepo) { slug = parseSlug(rawRepo) ?? rawRepo.replace(/\.git$/, ''); if (!SLUG.test(slug)) problems.push('GITHUB_REPOSITORY must look like "owner/repo".'); }
  const branch = (process.env.GITHUB_BRANCH ?? 'main').trim() || 'main';
  if (!BRANCH.test(branch)) problems.push('GITHUB_BRANCH is not a valid branch name.');
  const name = (process.env.GIT_AUTHOR_NAME ?? '').trim() || 'Portfolio Admin';
  const email = (process.env.GIT_AUTHOR_EMAIL ?? '').trim() || 'portfolio-admin@users.noreply.github.com';
  if (/[<>\n\r]/.test(name + email)) problems.push('GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL contain invalid characters.');
  return problems.length ? { ok: false, problems } : { ok: true, cfg: { token, slug, branch, author: { name, email } } };
}

/* ------------------------------------ git ------------------------------------ */
type GitOut = { code: number; stdout: string; stderr: string };
const secrets = () => {
  const t = (process.env.GITHUB_TOKEN ?? '').trim();
  return t ? [t, Buffer.from(`x-access-token:${t}`).toString('base64')] : [];
};
/** Removes the token (raw or base64) and any user:password@ in URLs from text that could reach logs or the UI. */
export function scrub(s: string): string {
  let out = s;
  for (const x of secrets()) out = out.split(x).join('***');
  return out.replace(/\/\/[^/@\s]+@/g, '//').trim();
}

function git(args: string[], o: { net?: boolean; input?: string; timeout?: number; token?: string } = {}): Promise<GitOut> {
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', LC_ALL: 'C', GIT_OPTIONAL_LOCKS: '0' };
  delete env.ADMIN_PASSCODE; delete env.SESSION_SECRET; delete env.GITHUB_TOKEN; // children never need the app's secrets
  if (o.net && o.token) {
    // Auth through environment config (git >= 2.31): invisible in `ps`, not written to .git/config.
    env.GIT_CONFIG_COUNT = '1';
    env.GIT_CONFIG_KEY_0 = 'http.https://github.com/.extraheader';
    env.GIT_CONFIG_VALUE_0 = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${o.token}`).toString('base64')}`;
  }
  return new Promise((resolve) => {
    const child = execFile('git', args, { cwd: ROOT, env, timeout: o.timeout ?? (o.net ? 120_000 : 30_000), maxBuffer: 16 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      const e = err as (Error & { code?: number | string }) | null;
      const code = !e ? 0 : typeof e.code === 'number' ? e.code : e.code === 'ENOENT' ? -1 : 1;
      resolve({ code, stdout: String(stdout ?? ''), stderr: scrub(String(stderr ?? '') + (code === -1 ? 'git executable not found' : '')) });
    });
    if (o.input !== undefined) { child.stdin?.end(o.input); }
  });
}
const lastLines = (s: string, n = 3) => scrub(s).split('\n').filter(Boolean).slice(-n).join(' ').slice(0, 400);

/* -------------------------------- locking -------------------------------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function acquire(wait: boolean): Promise<boolean> {
  const deadline = Date.now() + (wait ? 90_000 : 0);
  for (;;) {
    if (!S.busy) {
      try {
        await fs.mkdir(P.backups, { recursive: true });
        await fs.mkdir(LOCK_DIR);
        S.busy = true;
        return true;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'EEXIST') {
          const st = await fs.stat(LOCK_DIR).catch(() => null);
          if (st && Date.now() - st.mtimeMs > LOCK_STALE_MS) { await fs.rm(LOCK_DIR, { recursive: true, force: true }); continue; } // crashed holder
        } else throw e;
      }
    }
    if (Date.now() >= deadline) return false;
    await sleep(200);
  }
}
/** Runs fn while holding the single save/sync lock. wait=false throws BusyError instead of queueing. */
export async function exclusive<T>(fn: () => Promise<T>, o: { wait?: boolean } = {}): Promise<T> {
  if (!(await acquire(!!o.wait))) throw new BusyError();
  try { return await fn(); }
  finally { S.phase = 'idle'; S.busy = false; await fs.rm(LOCK_DIR, { recursive: true, force: true }).catch(() => {}); }
}
const setPhase = (p: Phase) => { S.phase = p; };

/* ------------------------------- repo handling ------------------------------- */
type Repo = { slug: string; prefix: string; gitDir: string; remoteUrl: string };
const rel = (p: string, prefix: string) => (prefix && p.startsWith(prefix) ? p.slice(prefix.length) : prefix ? null : p);

async function ensureRepo(cfg: Config): Promise<{ ok: true; repo: Repo } | { ok: false; message: string }> {
  let inside = await git(['rev-parse', '--is-inside-work-tree']);
  if (inside.code === -1) return { ok: false, message: 'Git is not installed on the server (or not on PATH).' };
  let created = false;
  if (inside.code !== 0 || inside.stdout.trim() !== 'true') {
    if (!/not a git repository/i.test(inside.stderr)) return { ok: false, message: `Git cannot use this folder: ${lastLines(inside.stderr)}` };
    if (!cfg.slug) return { ok: false, message: 'This folder is not a Git repository. Set GITHUB_REPOSITORY (owner/repo) to connect it, or run the site from a clone of your repository.' };
    // First-time connect: attach to the existing remote branch WITHOUT touching any working-tree file.
    const url = `https://github.com/${cfg.slug}.git`;
    const steps: string[][] = [['init', '-q'], ['symbolic-ref', 'HEAD', `refs/heads/${cfg.branch}`], ['remote', 'add', 'origin', url]];
    for (const a of steps) { const r = await git(a); if (r.code !== 0) return { ok: false, message: `Could not initialise Git: ${lastLines(r.stderr)}` }; if (a[0] === 'init') created = true; }
    const f = await git(['fetch', '--no-tags', '-q', url, `+refs/heads/${cfg.branch}:refs/remotes/origin/${cfg.branch}`], { net: true, token: cfg.token });
    const ok = f.code === 0 && (await git(['reset', '-q', '--mixed', `refs/remotes/origin/${cfg.branch}`])).code === 0; // index := remote, files untouched
    if (!ok) {
      if (created) await fs.rm(path.join(ROOT, '.git'), { recursive: true, force: true }); // undo only what we just created
      return { ok: false, message: f.code !== 0 ? `Could not read branch "${cfg.branch}" from GitHub (it must already exist - push the project once first): ${classify(f.stderr)}` : 'Could not attach to the remote branch.' };
    }
    inside = await git(['rev-parse', '--is-inside-work-tree']);
  }
  const [prefix, gd, head, origin] = await Promise.all([
    git(['rev-parse', '--show-prefix']), git(['rev-parse', '--absolute-git-dir']),
    git(['symbolic-ref', '--short', '-q', 'HEAD']), git(['remote', 'get-url', 'origin']),
  ]);
  let slug = cfg.slug;
  if (origin.code === 0) {
    const have = parseSlug(origin.stdout);
    if (!have) return { ok: false, message: 'The "origin" remote is not a GitHub repository.' };
    if (slug && have.toLowerCase() !== slug.toLowerCase()) return { ok: false, message: `This folder's origin is ${have}, but GITHUB_REPOSITORY is ${slug}. Refusing to push to a different repository.` };
    slug = have;
  } else if (slug) {
    await git(['remote', 'add', 'origin', `https://github.com/${slug}.git`]);
  } else return { ok: false, message: 'No "origin" remote and GITHUB_REPOSITORY is not set.' };
  if (!slug) return { ok: false, message: 'Repository could not be determined.' };
  const cur = head.stdout.trim();
  if (!cur) return { ok: false, message: 'Git is in detached-HEAD state. Check out the branch to publish to.' };
  if (cur !== cfg.branch) return { ok: false, message: `This folder is on branch "${cur}", but publishing targets "${cfg.branch}". Check out "${cfg.branch}" first.` };

  const gitDir = gd.stdout.trim();
  for (const d of ['rebase-merge', 'rebase-apply']) { // a previous run was interrupted mid-rebase
    if (await fs.access(path.join(gitDir, d)).then(() => true, () => false)) await git(['rebase', '--abort']);
  }
  return { ok: true, repo: { slug, prefix: prefix.stdout.trim(), gitDir, remoteUrl: `https://github.com/${slug}.git` } };
}

function classify(stderr: string): string {
  const s = stderr.toLowerCase();
  if (/protected branch|gh006|gh013|hook declined|required status check/.test(s)) return 'The branch is protected and refuses direct pushes. Allow this token to push to it, or use a different branch.';
  if (/bad credentials|authentication failed|invalid username|could not read username|http 401|returned error: 401/.test(s)) return 'GitHub rejected the access token (invalid or expired).';
  if (/403|permission to .* denied|permission denied|write access/.test(s)) return 'The token does not have write access to this repository (needs Contents: Read and write).';
  if (/repository not found|not found|404/.test(s)) return 'Repository not found, or the token cannot see it.';
  if (/could not resolve host|timed out|timeout|unable to access|connection|network/.test(s)) return `Could not reach GitHub (${lastLines(stderr, 1)}).`;
  return lastLines(stderr) || 'Unknown Git error.';
}

/* ------------------------------ changed files ------------------------------ */
async function managedChanges(prefix: string): Promise<FileChange[]> {
  const r = await git(['status', '--porcelain=v1', '-z', '-uall', '--no-renames', '--', ...MANAGED]);
  if (r.code !== 0) return [];
  const out: FileChange[] = [];
  for (const entry of r.stdout.split('\0')) {
    if (entry.length < 4) continue;
    const xy = entry.slice(0, 2); const p = rel(entry.slice(3), prefix);
    if (!p || !ALLOW.some((re) => re.test(p))) continue; // allow-list: nothing else is ever staged
    out.push({ path: p, status: xy === '??' || xy.includes('A') ? 'added' : xy.includes('D') ? 'deleted' : 'modified' });
  }
  return out;
}
async function headContent(): Promise<Content | null> {
  const r = await git(['show', 'HEAD:./content/portfolio.json']);
  if (r.code !== 0) return null;
  try { const v = validateContent(JSON.parse(r.stdout)); return v.ok ? v.content : null; } catch { return null; }
}

/* ---------------------------------- sync ---------------------------------- */
async function ahead(branch: string): Promise<{ ahead: number; behind: number } | null> {
  const r = await git(['rev-list', '--left-right', '--count', `HEAD...refs/remotes/origin/${branch}`]);
  if (r.code !== 0) return null;
  const [a, b] = r.stdout.trim().split(/\s+/).map(Number);
  return { ahead: a || 0, behind: b || 0 };
}

async function persist(gitDir: string | undefined, patch: Partial<Persisted>) {
  S.persisted = { ...S.persisted, ...patch };
  if (!gitDir) return;
  await fs.writeFile(path.join(gitDir, 'portfolio-sync.json'), JSON.stringify(S.persisted)).catch(() => {});
}
async function loadPersisted(gitDir: string) {
  try { S.persisted = JSON.parse(await fs.readFile(path.join(gitDir, 'portfolio-sync.json'), 'utf8')); } catch { /* none yet */ }
}

/** Commit managed changes (if any) and push to GitHub. Call only while holding the lock. */
async function sync(keepLocal: boolean): Promise<SyncResult> {
  const res: SyncResult = { at: new Date().toISOString(), configured: true, committed: false, pushed: false };
  const done = (r: SyncResult) => { S.last = r; return r; };
  const c = getConfig();
  if (!c.ok) return done({ ...res, configured: false, failure: { stage: 'config', message: c.problems.join(' ') } });
  const cfg = c.cfg;

  setPhase('preparing');
  const er = await ensureRepo(cfg);
  if (!er.ok) { await persist(undefined, { lastFailure: { at: res.at, stage: 'repo', message: er.message } }); return done({ ...res, failure: { stage: 'repo', message: er.message } }); }
  const repo = er.repo;
  await loadPersisted(repo.gitDir);
  const fail = async (f: SyncFailure) => { await persist(repo.gitDir, { lastFailure: { at: new Date().toISOString(), stage: f.stage, message: f.message } }); return done({ ...res, failure: f }); };

  /* 1. commit only the portfolio's own files */
  setPhase('committing');
  const changes = await managedChanges(repo.prefix);
  if (changes.length) {
    const files = changes.map((f) => f.path);
    const add = await git(['add', '-A', '--', ...files]);
    if (add.code !== 0) return fail({ stage: 'commit', message: `Could not stage files: ${lastLines(add.stderr)}` });
    const staged = await git(['diff', '--cached', '--quiet', '--', ...files]);
    if (staged.code === 1) {
      const msg = buildCommitMessage(changes, await headContent(), await readContent());
      const cm = await git(['-c', `user.name=${cfg.author.name}`, '-c', `user.email=${cfg.author.email}`, '-c', 'commit.gpgsign=false',
        'commit', '--no-verify', '--only', '-m', msg.subject, '-m', msg.body, '--', ...files]);
      if (cm.code !== 0) return fail({ stage: 'commit', message: `Git commit failed: ${lastLines(cm.stderr + cm.stdout)}` });
      res.committed = true; res.commit = { sha: (await git(['rev-parse', '--short', 'HEAD'])).stdout.trim(), message: msg.subject };
      setPhase('committed');
    }
  }

  /* 2. integrate remote changes (never force), then push */
  setPhase('pushing');
  const refspec = `+refs/heads/${cfg.branch}:refs/remotes/origin/${cfg.branch}`;
  const ident = ['-c', `user.name=${cfg.author.name}`, '-c', `user.email=${cfg.author.email}`, '-c', 'commit.gpgsign=false'];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const f = await git(['fetch', '--no-tags', '-q', repo.remoteUrl, refspec], { net: true, token: cfg.token });
    if (f.code !== 0) return fail({ stage: 'network', message: classify(f.stderr) });
    const ab = await ahead(cfg.branch);
    if (!ab) return fail({ stage: 'push', message: 'Could not compare with the remote branch.' });
    if (ab.ahead === 0) { res.nothing = !res.committed; res.headSha = (await git(['rev-parse', 'HEAD'])).stdout.trim(); break; }
    if (ab.behind > 0) {
      const rb = await git([...ident, 'rebase', ...(keepLocal ? ['-X', 'theirs'] : []), `refs/remotes/origin/${cfg.branch}`]);
      if (rb.code !== 0) {
        const text = rb.stdout + rb.stderr;
        await git(['rebase', '--abort']);
        if (/conflict/i.test(text)) return fail({ stage: 'conflict', conflict: true, message: 'GitHub has newer changes to the same files, so they could not be merged automatically. Your edits are saved and committed locally - nothing was lost.' });
        if (/unstaged|uncommitted|would be overwritten/i.test(text)) return fail({ stage: 'push', message: 'GitHub has newer commits, but this folder has other uncommitted changes that block merging. Commit or stash them, then retry.' });
        return fail({ stage: 'push', message: `Could not merge GitHub changes: ${lastLines(text)}` });
      }
    }
    const pu = await git(['push', '-q', repo.remoteUrl, `HEAD:refs/heads/${cfg.branch}`], { net: true, token: cfg.token });
    if (pu.code === 0) {
      const sha = (await git(['rev-parse', 'HEAD'])).stdout.trim();
      await git(['update-ref', `refs/remotes/origin/${cfg.branch}`, sha]);
      res.pushed = true; res.headSha = sha;
      const subject = (await git(['log', '-1', '--format=%s'])).stdout.trim();
      await persist(repo.gitDir, { lastSuccess: { at: new Date().toISOString(), sha, message: res.commit?.message ?? subject, branch: cfg.branch }, lastFailure: undefined });
      S.deploy = undefined;
      return done(res);
    }
    if (/non-fast-forward|fetch first|stale info|\(fetch first\)|rejected/.test(pu.stderr.toLowerCase()) && !/protected|gh006|gh013|hook declined/.test(pu.stderr.toLowerCase())) continue; // raced with another push: fetch + rebase again
    return fail({ stage: 'push', message: classify(pu.stderr) });
  }
  if (!res.pushed && !res.nothing && !res.failure) return fail({ stage: 'push', message: 'GitHub kept changing while pushing. Please retry.' });
  if (res.nothing) await persist(repo.gitDir, { lastFailure: undefined });
  return done(res);
}

/* ------------------------------- public API ------------------------------- */
/** Validate everything that will be committed besides the JSON shape: referenced images exist, resume PDF is intact. */
export async function preflight(c: Content): Promise<string[]> {
  const errors: string[] = [];
  const refs = new Map<string, string>();
  for (const s of c.sections) for (const it of s.items) {
    if (it.image?.startsWith('/api/media/')) refs.set(it.image, `${s.label} / ${it.label}`);
    for (const pg of it.pages) for (const b of pg.blocks) if (b.t === 'img' && b.src.startsWith('/api/media/')) refs.set(b.src, `${s.label} / ${it.label} / ${pg.label}`);
  }
  for (const [url, where] of Array.from(refs)) {
    const name = url.slice('/api/media/'.length);
    if (!(await fs.access(mediaPath(name)).then(() => true, () => false))) errors.push(`${where}: image "${name}" does not exist in content/media. Upload it again or clear the field.`);
  }
  if (await resumeInfo()) {
    const bad = checkPdf(await fs.readFile(P.resume).catch(() => Buffer.alloc(0)));
    if (bad) errors.push(`Resume: ${bad}`);
  }
  return errors;
}

export type SaveOutcome = { kind: 'invalid'; errors: string[] } | { kind: 'ok'; content: Content; sync: SyncResult };
/** SAVE CHANGES: validate -> write files -> commit -> push, all under one lock. Local files are kept even if GitHub fails. */
export function saveAndSync(content: Content): Promise<SaveOutcome> {
  return exclusive(async () => {
    setPhase('saving');
    const errors = await preflight(content);
    if (errors.length) return { kind: 'invalid', errors } as SaveOutcome;
    const saved = await writeContent(content);
    setPhase('saved');
    const result = await sync(false);
    return { kind: 'ok', content: saved, sync: { ...result, saved: true } } as SaveOutcome;
  });
}
/** Retry / sync already-saved files (uploads, a failed push, a conflict). */
export function syncSaved(o: { keepLocal?: boolean } = {}): Promise<SyncResult> {
  return exclusive(async () => {
    setPhase('saving');
    const errors = await preflight(await readContent());
    if (errors.length) return { at: new Date().toISOString(), configured: true, committed: false, pushed: false, failure: { stage: 'validate', message: errors.join(' ') } } as SyncResult;
    return { ...(await sync(!!o.keepLocal)), saved: true };
  }, { wait: false });
}

export async function gitStatus(): Promise<SyncStatus> {
  const c = getConfig();
  const base: SyncStatus = {
    configured: c.ok, problems: c.ok ? [] : c.problems, warnings: [], busy: S.busy, phase: S.phase,
    pending: S.cache.pending, unpushed: S.cache.unpushed, lastSuccess: S.persisted.lastSuccess, lastFailure: S.persisted.lastFailure, lastResult: S.last,
  };
  if (S.busy) return base; // do not touch git while a commit/push is running
  const inside = await git(['rev-parse', '--is-inside-work-tree']);
  if (inside.code === -1) { base.configured = false; base.problems.push('Git is not installed on the server.'); return base; }
  const branch = c.ok ? c.cfg.branch : (process.env.GITHUB_BRANCH ?? 'main');
  base.branch = branch;
  if (c.ok && c.cfg.slug) base.repo = c.cfg.slug;
  if (inside.code !== 0) {
    if (c.ok && !c.cfg.slug) { base.configured = false; base.problems.push('Not a Git repository and GITHUB_REPOSITORY is not set.'); }
    else if (c.ok) base.warnings.push('This folder is not a Git repository yet; the first save will connect it to the GitHub repository.');
    S.cache = { pending: 0, unpushed: null };
    return base;
  }
  const [prefix, gd, origin] = await Promise.all([git(['rev-parse', '--show-prefix']), git(['rev-parse', '--absolute-git-dir']), git(['remote', 'get-url', 'origin'])]);
  await loadPersisted(gd.stdout.trim());
  base.lastSuccess = S.persisted.lastSuccess; base.lastFailure = S.persisted.lastFailure;
  if (origin.code === 0) { const s = parseSlug(origin.stdout); if (s) base.repo = base.repo ?? s; }
  base.pending = (await managedChanges(prefix.stdout.trim())).length;
  const ab = await ahead(branch);
  base.unpushed = ab ? ab.ahead : null;
  S.cache = { pending: base.pending, unpushed: base.unpushed };
  if ((await git(['ls-files', '--error-unmatch', '.env'])).code === 0) base.warnings.push('.env is tracked by Git. Run "git rm --cached .env" and commit, then rotate your secrets.');
  return base;
}

/* ---------------------------- deployment status ---------------------------- */
/** Asks GitHub what deployments / statuses / checks it knows for a commit. Never infers success from a successful push. */
export async function deploymentFor(sha: string): Promise<DeployInfo> {
  if (S.deploy && S.deploy.info.sha === sha && Date.now() - S.deploy.at < 5000) return S.deploy.info;
  const info: DeployInfo = { sha, overall: 'none', items: [], checkedAt: new Date().toISOString() };
  const c = getConfig();
  const slug = c.ok ? c.cfg.slug ?? (await originSlug()) : undefined;
  if (!c.ok || !slug) { info.note = 'GitHub is not configured, so deployment information is unavailable.'; return info; }
  const gh = async (p: string) => {
    const r = await fetch(`https://api.github.com/repos/${slug}${p}`, {
      headers: { Authorization: `Bearer ${c.cfg.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'portfolio-admin' },
      signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
    return r.json();
  };
  const denied: string[] = [];
  const guard = async <T,>(label: string, f: () => Promise<T>): Promise<T | null> => { try { return await f(); } catch (e) { denied.push(`${label} (${(e as Error).message})`); return null; } };
  const [st, ck, dp] = await Promise.all([
    guard('statuses', () => gh(`/commits/${sha}/status`)),
    guard('checks', () => gh(`/commits/${sha}/check-runs?per_page=30`)),
    guard('deployments', () => gh(`/deployments?sha=${sha}&per_page=10`)),
  ]);
  const map = (s: string) => (['success'].includes(s) ? 'success' : ['failure', 'error'].includes(s) ? 'failure' : 'pending') as DeployItem['state'];
  for (const s of st?.statuses ?? []) info.items.push({ name: String(s.context), kind: 'status', state: map(s.state), url: safeUrl(s.target_url), detail: s.description ? String(s.description).slice(0, 120) : undefined });
  for (const r of ck?.check_runs ?? []) {
    if (r.status === 'completed' && ['neutral', 'skipped'].includes(r.conclusion)) continue;
    const state: DeployItem['state'] = r.status !== 'completed' ? 'pending' : r.conclusion === 'success' ? 'success' : 'failure';
    info.items.push({ name: String(r.name), kind: 'check', state, url: safeUrl(r.html_url) });
  }
  for (const d of Array.isArray(dp) ? dp : []) {
    const sts = await guard('deployment status', () => gh(`/deployments/${d.id}/statuses?per_page=1`));
    const s = Array.isArray(sts) ? sts[0] : null;
    if (!s || s.state === 'inactive') continue; // superseded or not reported yet
    info.items.push({ name: `${d.environment ?? 'deployment'}`, kind: 'deployment', state: map(s.state === 'in_progress' || s.state === 'queued' ? 'pending' : s.state), url: safeUrl(s.environment_url || s.target_url || s.log_url) });
  }
  info.overall = info.items.some((i) => i.state === 'failure') ? 'failure' : info.items.some((i) => i.state === 'pending') ? 'pending' : info.items.some((i) => i.state === 'success') ? 'success' : 'none';
  if (denied.length) info.note = `Some deployment details could not be read (${denied.join(', ')}). The token may need read access to Deployments, Commit statuses and Checks.`;
  else if (info.overall === 'none') info.note = 'GitHub has not reported any deployment for this commit. If your host deploys from GitHub it may not report back, or may not have started yet.';
  S.deploy = { at: Date.now(), info };
  return info;
}
const safeUrl = (u: unknown) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : undefined);
async function originSlug() { const r = await git(['remote', 'get-url', 'origin']); return r.code === 0 ? parseSlug(r.stdout) ?? undefined : undefined; }
