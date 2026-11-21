import type { AutoBackup } from '../lib/autoBackup';

interface RecoveryScreenProps {
  /** Latest closet snapshot kept in this browser, if any. */
  backup: AutoBackup | null;
  busy: boolean;
  onRestoreBackup: () => void;
  onRestoreFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartFresh: () => void;
}

function formatSaved(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Shown when this browser's sign-in points at a closet that no longer exists, instead of silently starting an empty one. */
export default function RecoveryScreen({ backup, busy, onRestoreBackup, onRestoreFile, onStartFresh }: RecoveryScreenProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
        <div className="modal-header">
          <h2 id="recovery-title" className="modal-title">Your closet couldn't be found</h2>
        </div>
        <div className="modal-body">
          <p className="recovery-text">
            This browser was signed in to a closet that no longer exists on the server. Nothing has been changed yet.
            Choose how to continue.
          </p>
          {backup && (
            <button type="button" className="btn-primary recovery-option" disabled={busy} onClick={onRestoreBackup}>
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
