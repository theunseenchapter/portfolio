'use client';

import type { DeployInfo, Phase, SyncResult, SyncStatus } from '@/lib/gitsync';
import { fmtDate } from './api';

type St = 'todo' | 'run' | 'ok' | 'bad' | 'skip';
const ICON: Record<St, string> = { todo: '·', run: '…', ok: '✓', bad: '✗', skip: '–' };

/** Which of the three stages is done / running / failed, from the live phase or the final result. */
export function syncSteps(result: SyncResult | null, phase: Phase, working: boolean): { label: string; st: St }[] {
  if (working && !result) {
    const p = phase === 'idle' ? 'saving' : phase;
    const files: St = p === 'saving' ? 'run' : 'ok';
    const commit: St = p === 'saving' ? 'todo' : p === 'saved' || p === 'preparing' || p === 'committing' ? 'run' : 'ok';
    const push: St = p === 'committed' ? 'run' : p === 'pushing' ? 'run' : 'todo';
    return [
      { label: files === 'run' ? 'Saving…' : 'Files saved.', st: files },
      { label: commit === 'ok' ? 'GitHub commit created.' : 'Creating GitHub commit…', st: commit },
      { label: push === 'run' ? 'Saving to GitHub…' : 'GitHub save successful.', st: push },
    ];
  }
  if (!result) return [];
  const f = result.failure;
  const pushFailed = !!f && ['network', 'push', 'conflict'].includes(f.stage);
  return [
    { label: result.saved ? 'Files saved.' : 'Saving…', st: result.saved ? 'ok' : f?.stage === 'validate' ? 'bad' : 'skip' },
    { label: result.committed ? 'GitHub commit created.' : f?.stage === 'commit' || f?.stage === 'repo' ? 'GitHub commit failed.' : 'No new commit needed.', st: result.committed ? 'ok' : f?.stage === 'commit' || f?.stage === 'repo' ? 'bad' : f?.stage === 'config' ? 'todo' : 'skip' },
    { label: result.pushed ? 'GitHub save successful.' : pushFailed ? 'GitHub save failed.' : result.nothing ? 'Nothing new to save.' : f?.stage === 'config' ? 'GitHub sync not configured.' : 'Save not attempted.', st: result.pushed ? 'ok' : pushFailed ? 'bad' : result.nothing ? 'skip' : 'todo' },
  ];
}

export function syncHeadline(status: SyncStatus | null, result: SyncResult | null, working: boolean): { text: string; tone: 'ok' | 'bad' | 'warn' | 'busy' } {
  if (working) return { text: 'Saving…', tone: 'busy' };
  const f = result?.failure;
  if (result?.pushed) return { text: 'GitHub push successful.', tone: 'ok' };
  if (f) {
    if (f.stage === 'config') return { text: 'Saved locally. GitHub sync is not configured.', tone: 'warn' };
    if (f.stage === 'validate') return { text: 'Not saved: fix the problems below.', tone: 'bad' };
    if (f.stage === 'commit' || f.stage === 'repo') return { text: 'Files saved, but the GitHub commit failed.', tone: 'bad' };
    return { text: 'GitHub save failed. Your changes may not be published.', tone: 'bad' };
  }
  if (result?.nothing) return { text: 'Everything is already on GitHub.', tone: 'ok' };
  if (!status) return { text: 'Checking GitHub sync…', tone: 'busy' };
  if (!status.configured) return { text: 'GitHub sync is not configured. Edits are saved locally only.', tone: 'warn' };
  const waiting = status.pending > 0 || (status.unpushed ?? 0) > 0;
  if (waiting && status.lastFailure) return { text: 'GitHub save failed. Changes are waiting to be retried.', tone: 'bad' };
  if (waiting) return { text: 'Changes are waiting to be saved to GitHub.', tone: 'warn' };
  return { text: 'In sync with GitHub.', tone: 'ok' };
}

const DSTATE = { success: 'OK', failure: 'FAILED', pending: 'IN PROGRESS' } as const;

export default function SyncPanel({ status, result, phase, working, deployment, onRetry, onCheckDeploy, retrying }: {
  status: SyncStatus | null; result: SyncResult | null; phase: Phase; working: boolean; deployment: DeployInfo | null;
  onRetry: (action: 'retry' | 'keep-local') => void; onCheckDeploy: () => void; retrying: boolean;
}) {
  const head = syncHeadline(status, result, working);
  const steps = syncSteps(result, phase, working);
  const f = result?.failure;
  const message = f?.message ?? (!result && status?.lastFailure && ((status.pending > 0) || (status.unpushed ?? 0) > 0) ? status.lastFailure.message : undefined)
    ?? (!result && status && !status.configured ? status.problems.join(' ') : undefined);
  const conflict = f?.conflict;
  const canRetry = !working && !!status?.configured && (!!f ? f.stage !== 'config' && f.stage !== 'validate' : !!status.lastFailure && (status.pending > 0 || (status.unpushed ?? 0) > 0));
  const ls = status?.lastSuccess;
  const sha = ls?.sha?.slice(0, 7);

  return (
    <div className={`panel sync sync-${head.tone}`} aria-live="polite">
      <h2>GITHUB SYNC</h2>
      <p className="sync-head"><i className={`adot${head.tone === 'ok' ? '' : ' dirty'}`} />{head.text}</p>
      {steps.length > 0 && (
        <ul className="sync-steps">{steps.map((s) => <li key={s.label} className={`st-${s.st}`}><b>{ICON[s.st]}</b>{s.label}</li>)}</ul>
      )}
      {result?.commit && <p className="sync-sub">Commit <code>{result.commit.sha}</code>: {result.commit.message}</p>}
      {message && !working && <div className={tone(head.tone)}>{message}</div>}
      {status?.warnings.map((w) => <div className="warn" key={w}>{w}</div>)}
      {canRetry && (
        <div className="sync-actions">
          <button className="ab pri" onClick={() => onRetry('retry')} disabled={retrying}>{retrying ? 'RETRYING…' : 'RETRY PUSH'}</button>
          {conflict && <button className="ab rose" disabled={retrying} onClick={() => { if (window.confirm('Use this dashboard’s version where the same lines were changed on GitHub? Those GitHub edits to the conflicting lines will be replaced (they stay in Git history).')) onRetry('keep-local'); }}>KEEP MY VERSION &amp; PUSH</button>}
        </div>
      )}
      <p className="sync-sub">
        Last successful synchronization: <b>{ls ? fmtDate(ls.at) : 'never'}</b>{ls && <> · <code>{sha}</code> on {ls.branch ?? 'main'}</>}
        {status?.repo && <> · {status.repo}</>}
      </p>
      {status && status.configured && ls && (
        <div className="sync-deploy">
          <p className="sync-sub">
            <b>Deployment</b> (as reported by GitHub for <code>{sha}</code>):{' '}
            {!deployment ? 'not checked yet.' : deployment.overall === 'success' ? 'reported successful.' : deployment.overall === 'failure' ? 'reported FAILED.' : deployment.overall === 'pending' ? 'in progress…' : 'no deployment reported for this commit.'}
            {' '}<button className="ab sm" onClick={onCheckDeploy}>CHECK</button>
          </p>
          {deployment?.items.map((i) => (
            <p className="sync-sub" key={`${i.kind}-${i.name}`}>· {i.url ? <a href={i.url} target="_blank" rel="noreferrer">{i.name} ↗</a> : i.name} ({i.kind}): {DSTATE[i.state]}</p>
          ))}
          {deployment?.note && <p className="sync-sub">{deployment.note}</p>}
          <p className="sync-sub">A successful push only means GitHub received your commit; it does not mean the website has been redeployed.</p>
        </div>
      )}
    </div>
  );
}
const tone = (t: string) => (t === 'bad' ? 'err' : 'warn');
