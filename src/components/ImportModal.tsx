import { useModal } from '../lib/useModal';

interface ImportModalProps {
  text: string;
  onTextChange: (text: string) => void;
  onClose: () => void;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  /** True when a copy of the closet from before the last import is available. */
  canRestore: boolean;
  onRestore: () => void;
}

export default function ImportModal({ text, onTextChange, onClose, onFile, onImport, canRestore, onRestore }: ImportModalProps) {
  const ref = useModal(true, onClose);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={ref} className="modal-box" role="dialog" aria-modal="true" aria-labelledby="import-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="import-title" className="modal-title">Import Backup</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <label className="field-label" htmlFor="import-file">Upload .json file</label>
          <input id="import-file" type="file" accept=".json" onChange={onFile} className="file-input" />
          <label className="field-label mt" htmlFor="import-text">Or paste JSON directly</label>
          <textarea
            id="import-text"
            value={text}
            onChange={e => onTextChange(e.target.value)}
            placeholder='{"categories": [...], "items": [...]}'
            rows={6}
            className="text-area"
          />
          <p className="warning-text">⚠️ This replaces your current closet. A copy of it is kept automatically so you can restore it.</p>
          {canRestore && (
            <button type="button" className="btn-ghost btn-sm" onClick={onRestore}>↩ Restore the closet from before the last import</button>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={onImport} disabled={!text.trim()} className="btn-primary">Import</button>
        </div>
      </div>
    </div>
  );
}
