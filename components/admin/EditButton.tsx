'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/* Public "edit" icon + passcode modal. The passcode is only ever sent to /api/admin/login; nothing about it lives here. */
export function PasscodeModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pass || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ passcode: pass }), credentials: 'same-origin' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setPass(''); onDone(); return; }
      setErr(j.error || 'Access denied.'); setShake((n) => n + 1); setPass('');
    } catch { setErr('Network error. Try again.'); }
    setBusy(false);
    input.current?.focus();
  }

  return (
    <div className="pw-overlay" role="dialog" aria-modal="true" aria-labelledby="pw-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className={`pw-card${shake ? ' shake' : ''}`} key={shake} onSubmit={submit} autoComplete="off">
        <div className="pw-screen">
          <div className="pw-lock" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor"><path d="M3 5V3h1V2h4v1h1v2h1v6H2V5h1zm1 0h4V3H4v2zm2 3v2h1V8H6z" fillRule="evenodd" /></svg>
          </div>
          <h2 id="pw-title">ADMIN ACCESS</h2>
          <p className="sub">Enter the passcode to edit this portfolio.</p>
          <input ref={input} className="pw-input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" spellCheck={false} aria-label="Admin passcode" aria-invalid={!!err} maxLength={100} />
          <div className="pw-err" role="alert">{err}</div>
          <div className="pw-row">
            <button type="button" className="ab full" onClick={onClose}>CANCEL</button>
            <button type="submit" className="ab pri full" disabled={busy || !pass}>{busy ? 'CHECKING…' : 'UNLOCK'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditButton() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (path.startsWith('/admin')) return null;

  async function click() {
    try {
      const j = await (await fetch('/api/admin/session', { cache: 'no-store', credentials: 'same-origin' })).json();
      if (j.authenticated) { router.push('/admin'); return; }
    } catch { /* fall through to the passcode prompt */ }
    setOpen(true);
  }
  return (
    <>
      <button type="button" className="edit-fab" onClick={click} aria-label="Edit portfolio (admin)" title="Edit">
        <svg width="20" height="20" viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor" aria-hidden><path d="M9 1h1v1h1v1h-1v1H9V3H8V2h1V1zM7 3h1v1h1v1H8v1H7V5H6V4h1V3zM5 5h1v1h1v1H6v1H5V7H4V6h1V5zM3 7h1v1h1v1H4v1H2v-2h1V7z" /></svg>
      </button>
      {open && <PasscodeModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); router.push('/admin'); }} />}
    </>
  );
}
