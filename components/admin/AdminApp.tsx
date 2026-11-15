'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '@/lib/content-types';
import type { DeployInfo, Phase, SyncResult, SyncStatus } from '@/lib/gitsync';
import { AuthError, api, fmtDate, fmtSize, type ApiError } from './api';
import { ItemsEditor, ProfileEditor, SectionsEditor, SiteEditor, blankItem, blankProject } from './Editors';
import { MediaManager, ResumeManager, type MediaItem } from './Panels';
import SyncPanel, { syncHeadline } from './SyncPanel';
import { PickCtx } from './ui';

type Initial = {
  content: Content; resume: { name: string; size: number; uploadedAt: string } | null;
  archive: { name: string; size: number; uploadedAt: string; file: string }[]; media: MediaItem[]; expiresAt: number;
};
const TABS = ['OVERVIEW', 'CONTENT', 'PROJECTS', 'RESUME', 'MEDIA'] as const;
type Tab = (typeof TABS)[number];

export default function AdminApp({ initial }: { initial: Initial }) {
  const [content, setContent] = useState(initial.content);
  const [saved, setSaved] = useState(() => JSON.stringify(initial.content));
  const [tab, setTab] = useState<Tab>('OVERVIEW');
  const [sub, setSub] = useState('nav');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; bad?: boolean } | null>(null);
  const [resume, setResume] = useState(initial.resume);
  const [mediaCount, setMediaCount] = useState(initial.media.length);
  const [exp, setExp] = useState(initial.expiresAt);
  const [now, setNow] = useState(() => Date.now());
  const [expired, setExpired] = useState(false);
  const [picker, setPicker] = useState<((url: string) => void) | null>(null);
  const active = useRef(Date.now());
  /* GitHub sync (Phase 2): server state, the latest save/retry result, live phase while a save runs, deployment info from GitHub */
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [retrying, setRetrying] = useState(false);
  const [deploy, setDeploy] = useState<DeployInfo | null>(null);
  const deployTimer = useRef<number | null>(null);

  const dirty = useMemo(() => JSON.stringify(content) !== saved, [content, saved]);
  const notify = useCallback((msg: string, bad?: boolean) => { setToast({ msg, bad }); window.setTimeout(() => setToast(null), 3200); }, []);
  const onAuth = useCallback(() => setExpired(true), []);

  const refreshSync = useCallback(async () => {
    try { const j = await api<{ status: SyncStatus }>('/api/admin/sync'); setSync(j.status); setPhase(j.status.phase); return j.status; }
    catch (e) { if (e instanceof AuthError) setExpired(true); return null; }
  }, []);
  const checkDeploy = useCallback(async () => {
    try { const j = await api<{ deployment?: DeployInfo | null }>('/api/admin/sync?deployment=1'); if (j.deployment) setDeploy(j.deployment); return j.deployment ?? null; }
    catch (e) { if (e instanceof AuthError) setExpired(true); return null; }
  }, []);
  /* after a push, poll GitHub (every 10 s, up to 10 min) until it reports something final; GitHub is the only source of truth */
  const watchDeploy = useCallback(() => {
    if (deployTimer.current) window.clearInterval(deployTimer.current);
    let n = 0;
    const run = async () => { const d = await checkDeploy(); if (++n >= 60 || (d && (d.overall === 'success' || d.overall === 'failure'))) { if (deployTimer.current) window.clearInterval(deployTimer.current); deployTimer.current = null; } };
    void run(); deployTimer.current = window.setInterval(run, 10_000);
  }, [checkDeploy]);
  useEffect(() => { void refreshSync().then((st) => { if (st?.lastSuccess) void checkDeploy(); }); return () => { if (deployTimer.current) window.clearInterval(deployTimer.current); }; }, [refreshSync, checkDeploy]);
  /* resume / image changes are written to disk immediately; they wait for SAVE CHANGES to be committed and pushed */
  const onResumeChange = useCallback((m: Initial['resume']) => { setResume(m); void refreshSync(); }, [refreshSync]);
  const onMediaCount = useCallback((n: number) => { setMediaCount(n); void refreshSync(); }, [refreshSync]);

  /* session clock + keep-alive while the admin is active; warn before the unsaved page is left */
  useEffect(() => {
    const mark = () => { active.current = Date.now(); };
    ['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, mark));
    const tick = window.setInterval(() => { setNow(Date.now()); }, 1000);
    const ping = window.setInterval(async () => {
      if (Date.now() - active.current > 5 * 60_000) return;
      try { const j = await api<{ authenticated: boolean; expiresAt: number }>('/api/admin/session?touch=1'); if (!j.authenticated) setExpired(true); else setExp(j.expiresAt); } catch (e) { if (e instanceof AuthError) setExpired(true); }
    }, 4 * 60_000);
    return () => { ['pointerdown', 'keydown'].forEach((e) => window.removeEventListener(e, mark)); clearInterval(tick); clearInterval(ping); };
  }, []);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  useEffect(() => { if (now > exp && !expired) setExpired(true); }, [now, exp, expired]);

  /** Runs `job` while polling the server's live phase so the dashboard can show the GitHub save stages. */
  async function withProgress<T>(job: () => Promise<T>): Promise<T> {
    const poll = window.setInterval(() => { void refreshSync(); }, 600);
    try { return await job(); } finally { window.clearInterval(poll); }
  }
  function afterSync(r: SyncResult) {
    setResult(r);
    if (r.pushed) { notify('Saved and pushed to GitHub.'); watchDeploy(); }
    else if (r.nothing) notify('Saved. Nothing new to push.');
    else if (r.failure?.stage === 'config') notify('Saved locally. GitHub sync is not configured.', true);
    else if (r.failure) notify('Saved locally, but the GitHub push failed. You can retry.', true);
  }
  async function save() {
    setSaving(true); setErrors([]); setResult(null); setPhase('saving');
    try {
      if (dirty) {
        const r = await withProgress(() => api<{ content: Content; sync: SyncResult }>('/api/admin/content', { method: 'PUT', body: content }));
        setContent(r.content); setSaved(JSON.stringify(r.content)); setExp(Date.now() + 30 * 60_000);
        afterSync(r.sync);
      } else { // only uploads or a failed push are waiting: commit + push them
        const r = await withProgress(() => api<{ sync: SyncResult; status: SyncStatus }>('/api/admin/sync', { method: 'POST', body: { action: 'retry' } }));
        setExp(Date.now() + 30 * 60_000); afterSync(r.sync);
      }
    } catch (e) {
      if (e instanceof AuthError) setExpired(true);
      else { const er = e as ApiError; setErrors(er.details?.length ? er.details : [er.message]); notify(er.status === 409 ? 'A save is already in progress.' : 'Fix the highlighted problems and save again.', true); }
    }
    setSaving(false); void refreshSync();
  }
  async function retry(action: 'retry' | 'keep-local') {
    setRetrying(true); setSaving(true); setErrors([]); setResult(null); setPhase('preparing');
    try { const r = await withProgress(() => api<{ sync: SyncResult }>('/api/admin/sync', { method: 'POST', body: { action } })); afterSync(r.sync); }
    catch (e) { if (e instanceof AuthError) setExpired(true); else setErrors([(e as ApiError).message]); }
    setSaving(false); setRetrying(false); void refreshSync();
  }
  async function logout() {
    if (dirty && !window.confirm('You have unsaved changes. Log out anyway?')) return;
    try { await api('/api/admin/logout', { method: 'POST' }); } catch { /* cookie may already be gone */ }
    window.location.href = '/';
  }
  const downloadBackup = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })); a.download = 'portfolio-backup.json'; a.click(); };

  const setSections = (sections: Content['sections']) => setContent((c) => ({ ...c, sections }));
  const projSec = content.sections.find((s) => s.id === 'projects');
  const waiting = !!sync?.configured && (sync.pending > 0 || (sync.unpushed ?? 0) > 0); // uploads or commits not on GitHub yet
  const canSave = dirty || waiting;
  const head = syncHeadline(sync, result, saving);
  const remain = Math.max(0, exp - now);
  const mm = String(Math.floor(remain / 60000)).padStart(2, '0'), ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');
  const counts = { sections: content.sections.length, items: content.sections.reduce((n, s) => n + s.items.length, 0), pages: content.sections.reduce((n, s) => n + s.items.reduce((m, i) => m + i.pages.length, 0), 0) };

  const subTabs = [['nav', 'SITE & NAV'], ['profile', 'PROFILE'], ...content.sections.map((s) => [s.id, s.label] as [string, string])];
  const secSel = content.sections.find((s) => s.id === sub);

  return (
    <PickCtx.Provider value={(cb) => setPicker(() => cb)}>
      <div className="adm">
        <header className="adm-top">
          <span className="adm-logo">VIVEK <b>ARCADE</b> // ADMIN</span>
          <div className="adm-meta">
            <span><i className={`adot${dirty ? ' dirty' : ''}`} />{dirty ? 'UNSAVED CHANGES' : `Last saved: ${fmtDate(content.updatedAt)}`}</span>
            <span className="sync-chip" title="GitHub synchronization"><i className={`adot${head.tone === 'ok' ? '' : ' dirty'}`} />GitHub: {head.tone === 'ok' ? 'synced' : head.tone === 'busy' ? 'working…' : head.tone === 'bad' ? 'push failed' : sync && !sync.configured ? 'not configured' : 'pending'}</span>
            <span title="Session time remaining">⏱ {mm}:{ss}</span>
            <a className="ab" href="/" target="_blank" rel="noreferrer">VIEW SITE ↗</a>
            <button className="ab pri" onClick={save} disabled={!canSave || saving}>{saving ? 'SAVING…' : 'SAVE CHANGES'}</button>
            <button className="ab rose" onClick={logout}>LOGOUT</button>
          </div>
        </header>
        <div className="adm-body">
          <nav className="adm-nav" aria-label="Admin sections">
            {TABS.map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
          </nav>
          <main>
            {remain < 5 * 60_000 && !expired && <div className="warn">Your session ends in {mm}:{ss}. Save your changes now.</div>}
            <SyncPanel status={sync} result={result} phase={phase} working={saving} deployment={deploy} onRetry={retry} onCheckDeploy={() => { void checkDeploy(); }} retrying={retrying} />
            {errors.length > 0 && <div className="err" role="alert"><b>Could not save:</b><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}

            {tab === 'OVERVIEW' && (
              <>
                <div className="panel">
                  <h2>ADMIN OVERVIEW</h2>
                  <div className="grid g4">
                    {([['SECTIONS', counts.sections], ['ITEMS', counts.items], ['PAGES', counts.pages], ['IMAGES', mediaCount]] as const).map(([l, n]) => (
                      <div className="lcdbox astat" key={l}><b>{n}</b><span>{l}</span></div>
                    ))}
                  </div>
                </div>
                <div className="panel">
                  <h2>STATUS</h2>
                  <p><i className={`adot${dirty ? ' dirty' : ''}`} />{dirty ? 'You have unsaved changes.' : waiting ? 'Uploads or commits are waiting for GitHub: press SAVE CHANGES.' : 'Everything is saved.'} Last saved: {fmtDate(content.updatedAt)}.</p>
                  <p>Resume: {resume ? <>{resume.name} · {fmtSize(resume.size)} · {fmtDate(resume.uploadedAt)}</> : 'not uploaded (public link falls back to /resume)'}.</p>
                  <p>Session expires after 30 min idle or 4 h total. Remaining: {mm}:{ss}.</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <button className="ab" onClick={() => setTab('CONTENT')}>EDIT CONTENT</button><button className="ab" onClick={() => setTab('PROJECTS')}>MANAGE PROJECTS</button>
                    <button className="ab" onClick={() => setTab('RESUME')}>RESUME</button><button className="ab" onClick={downloadBackup}>DOWNLOAD JSON BACKUP</button>
                  </div>
                </div>
                <div className="panel"><h2>HOW IT WORKS</h2><p>Edit anything, then press <b>SAVE CHANGES</b>. Content is validated and committed to GitHub automatically with a descriptive message. On Vercel, the GitHub Contents API is used directly, so the server does not need Git installed.</p></div>
              </>
            )}

            {tab === 'CONTENT' && (
              <>
                <div className="adm-nav" style={{ position: 'static', gridAutoFlow: 'column', overflowX: 'auto', marginBottom: 14 }}>
                  {subTabs.map(([id, label]) => <button key={id} className={id === sub ? 'on' : ''} onClick={() => setSub(id)}>{label}</button>)}
                </div>
                <div className="panel">
                  {sub === 'nav' && (<>
                    <h2>SITE TEXT & NAVIGATION</h2>
                    <SiteEditor site={content.site} set={(site) => setContent((c) => ({ ...c, site }))} />
                    <h3>MAIN MENU SECTIONS (add, rename, reorder)</h3>
                    <SectionsEditor sections={content.sections} onChange={setSections} />
                  </>)}
                  {sub === 'profile' && (<><h2>PROFILE, CONTACT & RESUME PAGE DATA</h2><ProfileEditor p={content.profile} set={(profile) => setContent((c) => ({ ...c, profile }))} /></>)}
                  {secSel && (<>
                    <h2>{secSel.label}</h2>
                    <ItemsEditor items={secSel.items} make={blankItem} onChange={(items) => setSections(content.sections.map((s) => (s.id === secSel.id ? { ...s, items } : s)))} />
                  </>)}
                </div>
              </>
            )}

            {tab === 'PROJECTS' && (
              <div className="panel">
                <h2>PROJECT MANAGER</h2>
                {projSec ? <ItemsEditor repo items={projSec.items} make={blankProject} onChange={(items) => setSections(content.sections.map((s) => (s.id === 'projects' ? { ...s, items } : s)))} />
                  : <div className="warn">No section with the id “projects” exists. Create one under CONTENT → SITE & NAV.</div>}
              </div>
            )}

            {tab === 'RESUME' && <ResumeManager initial={resume} initialArchive={initial.archive} notify={notify} onAuth={onAuth} onChange={onResumeChange} />}
            {tab === 'MEDIA' && <MediaManager initial={initial.media} notify={notify} onAuth={onAuth} onCount={onMediaCount} />}
          </main>
        </div>

        {picker && (
          <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setPicker(null)}>
            <div className="panel"><div style={{ display: 'flex', justifyContent: 'space-between' }}><h2>CHOOSE AN IMAGE</h2><button className="ab sm" onClick={() => setPicker(null)}>CLOSE</button></div>
              <MediaManager initial={[]} notify={notify} onAuth={onAuth} onCount={onMediaCount} onSelect={(url) => { picker(url); setPicker(null); }} /></div>
          </div>
        )}
        {expired && (
          <div className="pw-overlay"><div className="pw-card"><div className="pw-screen">
            <h2>SESSION ENDED</h2><p className="sub">Your admin session expired. {dirty ? 'You have unsaved changes: download a backup, then log in again.' : 'Log in again to continue.'}</p>
            <div className="pw-row">{dirty && <button className="ab full" onClick={downloadBackup}>BACKUP JSON</button>}<button className="ab pri full" onClick={() => { window.location.href = '/'; }}>BACK TO SITE</button></div>
          </div></div></div>
        )}
        {toast && <div className={`atoast${toast.bad ? ' bad' : ''}`} role="status">{toast.msg}</div>}
      </div>
    </PickCtx.Provider>
  );
}
