'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthError, api, fmtDate, fmtSize, type ApiError } from './api';

type Notify = (msg: string, bad?: boolean) => void;
type ResumeMeta = { name: string; size: number; uploadedAt: string };
type Archived = ResumeMeta & { file: string };
export type MediaItem = { name: string; url: string; size: number; uploadedAt: string; used: boolean };
const MAX_PDF = 5 * 1024 * 1024, MAX_IMG = 3 * 1024 * 1024;

/* ------------------------------ resume manager ------------------------------ */
export function ResumeManager({ initial, initialArchive, notify, onAuth, onChange }: {
  initial: ResumeMeta | null; initialArchive: Archived[]; notify: Notify; onAuth: () => void; onChange: (m: ResumeMeta | null) => void;
}) {
  const [cur, setCur] = useState(initial);
  const [arch, setArch] = useState(initialArchive);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [bust, setBust] = useState(() => Date.now());
  const [preview, setPreview] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const guardErr = (e: unknown) => { if (e instanceof AuthError) onAuth(); else notify((e as ApiError).message, true); };
  const apply = (r: { current?: ResumeMeta | null; archive: Archived[] }) => { if ('current' in r) { setCur(r.current ?? null); onChange(r.current ?? null); } setArch(r.archive); setBust(Date.now()); };

  async function upload(file?: File) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) return notify('Please choose a .pdf file.', true);
    if (file.type && file.type !== 'application/pdf') return notify('That file is not a PDF.', true);
    if (file.size > MAX_PDF) return notify(`PDF is too large (${fmtSize(file.size)}). Max ${fmtSize(MAX_PDF)}.`, true);
    if (file.size === 0) return notify('The file is empty.', true);
    if (cur && !window.confirm(`Replace “${cur.name}” with “${file.name}”? The current resume will be archived.`)) return;
    setBusy(true);
    try { const fd = new FormData(); fd.append('file', file); apply(await api('/api/admin/resume', { method: 'POST', form: fd })); notify('Resume uploaded. Public link updated.'); }
    catch (e) { guardErr(e); }
    setBusy(false); if (input.current) input.current.value = '';
  }
  const patch = async (action: 'restore' | 'delete', file: string) => {
    if (action === 'delete' && !window.confirm('Permanently delete this archived resume?')) return;
    if (action === 'restore' && !window.confirm('Restore this resume? The current one will be archived.')) return;
    try { apply(await api('/api/admin/resume', { method: 'PATCH', body: { action, file } })); notify(action === 'restore' ? 'Resume restored.' : 'Archived resume deleted.'); } catch (e) { guardErr(e); }
  };

  return (
    <>
      <div className="panel">
        <h2>CURRENT RESUME</h2>
        {cur ? (
          <div className="lcdbox" style={{ marginBottom: 12 }}>
            <b>{cur.name}</b> · {fmtSize(cur.size)} · uploaded {fmtDate(cur.uploadedAt)}<br />
            Public link: <code>/api/resume</code> (always the latest file)
          </div>
        ) : <div className="warn">No PDF uploaded yet. Visitors currently see the printable <b>/resume</b> page.</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {cur && <button className="ab" onClick={() => setPreview((p) => !p)}>{preview ? 'HIDE PREVIEW' : 'PREVIEW'}</button>}
          {cur && <a className="ab" href="/api/resume?download=1">DOWNLOAD</a>}
          {cur && <a className="ab" href="/api/resume" target="_blank" rel="noreferrer">OPEN PUBLIC LINK ↗</a>}
        </div>
        <div className={`drop${over ? ' over' : ''}`} role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files[0]); }}>
          {busy ? 'UPLOADING…' : cur ? 'Drop a new PDF here (or click) to replace the resume' : 'Drop a PDF here (or click) to upload'}
          <br /><small>PDF only · max {fmtSize(MAX_PDF)} · the previous version is archived automatically</small>
          <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        {preview && cur && <iframe className="frame" style={{ marginTop: 14 }} src={`/api/resume?t=${bust}`} title="Resume preview" />}
      </div>
      <div className="panel">
        <h2>ARCHIVE ({arch.length})</h2>
        {!arch.length && <p>Replaced resumes appear here (latest 10 are kept).</p>}
        {arch.map((a) => (
          <div className="lrow lflat" key={a.file}>
            <div className="lb" style={{ gridTemplateColumns: '1fr' }}><span><b>{a.name}</b> · {fmtSize(a.size)} · {fmtDate(a.uploadedAt)}</span></div>
            <span className="lctl"><a className="ab sm" href={`/api/admin/resume?file=${a.file}`}>DOWNLOAD</a><button className="ab sm pri" onClick={() => patch('restore', a.file)}>RESTORE</button><button className="ab sm rose" onClick={() => patch('delete', a.file)}>✕</button></span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------ media manager ------------------------------ */
export function MediaManager({ initial, notify, onAuth, onSelect, onCount }: {
  initial: MediaItem[]; notify: Notify; onAuth: () => void; onSelect?: (url: string) => void; onCount?: (n: number) => void;
}) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const refresh = useCallback(async () => { try { const r = await api<{ media: MediaItem[] }>('/api/admin/media'); setItems(r.media); onCount?.(r.media.length); } catch (e) { if (e instanceof AuthError) onAuth(); } }, [onAuth, onCount]);
  useEffect(() => { refresh(); }, [refresh]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      if (f.size > MAX_IMG) { notify(`${f.name}: larger than ${fmtSize(MAX_IMG)}.`, true); continue; }
      try { const fd = new FormData(); fd.append('file', f); const r = await api<{ media: MediaItem[]; url: string }>('/api/admin/media', { method: 'POST', form: fd }); setItems(r.media); onCount?.(r.media.length); notify(`Uploaded ${f.name}`); }
      catch (e) { if (e instanceof AuthError) { onAuth(); break; } notify(`${f.name}: ${(e as ApiError).message}`, true); }
    }
    setBusy(false); if (input.current) input.current.value = '';
  }
  async function del(m: MediaItem) {
    if (!window.confirm(m.used ? 'This image is used in your content and will break. Delete anyway?' : 'Delete this image?')) return;
    try { const r = await api<{ media: MediaItem[] }>(`/api/admin/media?name=${encodeURIComponent(m.name)}&force=${m.used ? 1 : 0}`, { method: 'DELETE' }); setItems(r.media); onCount?.(r.media.length); }
    catch (e) { if (e instanceof AuthError) onAuth(); else notify((e as ApiError).message, true); }
  }
  return (
    <div className={onSelect ? undefined : 'panel'}>
      {!onSelect && <h2>MEDIA LIBRARY ({items.length})</h2>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="ab pri" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'UPLOADING…' : '＋ UPLOAD IMAGES'}</button>
        <small>PNG · JPG · GIF · WebP · max {fmtSize(MAX_IMG)} each</small>
        <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => upload(e.target.files)} />
      </div>
      {!items.length && <p>No images yet.</p>}
      <div className="mgrid">
        {items.map((m) => (
          <div key={m.name} className={`mcell${onSelect ? ' pick' : ''}`} onClick={onSelect ? () => onSelect(m.url) : undefined}>
            <img src={m.url} alt="" loading="lazy" />
            <div><span>{fmtSize(m.size)}{m.used ? ' · in use' : ''}</span>
              {!onSelect && <span style={{ display: 'flex', gap: 4 }}>
                <button className="ab sm" onClick={() => { navigator.clipboard?.writeText(m.url); notify('URL copied'); }}>COPY URL</button>
                <button className="ab sm rose" onClick={() => del(m)} aria-label="Delete image">✕</button></span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
