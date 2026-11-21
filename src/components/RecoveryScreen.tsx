import type { AutoBackup } from '../lib/autoBackup';

interface RecoveryScreenProps {
  /** lost: the sign-in pointed at a closet that no longer exists. signedOut: the user signed out of a saved closet. */
  variant: 'lost' | 'signedOut';
  /** Latest closet snapshot kept in this browser, if any. */
  backup: AutoBackup | null;
  busy: boolean;
  onSignIn: () => void;
  onRestoreBackup: () => void;
  onRestoreFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartFresh: () => void;
}

function formatSaved(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const COPY = {
  lost: {
    title: "Your closet couldn't be found",
    intro: 'This browser was signed in to a closet that no longer exists on the server. Nothing has been changed yet. Choose how to continue.',
  },
  signedOut: {
    title: 'Signed out',
    intro: 'Your saved closet is safe on the server. Sign in again to open it, or start a separate closet in this browser.',
  },
};

/** Shown instead of silently starting an empty closet. */
export default function RecoveryScreen({ variant, backup, busy, onSignIn, onRestoreBackup, onRestoreFile, onStartFresh }: RecoveryScreenProps) {
  const copy = COPY[variant];
  return (
    <div className="modal-overlay">
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
        <div className="modal-header">
          <h2 id="recovery-title" className="modal-title">{copy.title}</h2>
        </div>
        <div className="modal-body">
          <p className="recovery-text">{copy.intro}</p>
          <button type="button" className="btn-primary recovery-option" disabled={busy} onClick={onSignIn}>
            ☁ Sign in with your email
          </button>
          {backup && (
            <button type="button" className="btn-ghost recovery-option" disabled={busy} onClick={onRestoreBackup}>
              ↩ Restore {backup.itemCount} piece{backup.itemCount !== 1 ? 's' : ''} saved in this browser on {formatSaved(backup.savedAt)}
            </button>
          )}
          <label className="field-label mt" htmlFor="recovery-file">Restore from a backup file (.json export)</label>
          <input id="recovery-file" type="file" accept=".json" disabled={busy} onChange={onRestoreFile} className="file-input" />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" disabled={busy} onClick={onStartFresh}>Start a new, empty closet</button>
        </div>
      </div>
    </div>
  );
}
