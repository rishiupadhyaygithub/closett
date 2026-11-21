import { useEffect, useState } from 'react';
import { useModal } from '../lib/useModal';
import type { AccountResult } from '../lib/account';

export type AccountMode = 'save' | 'signin';

interface AccountModalProps {
  mode: AccountMode;
  /** Pieces in this browser that will be offered for merging after signing in. */
  localItemCount: number;
  onSubmit: (email: string) => Promise<AccountResult>;
  onClose: () => void;
}

const RESEND_SECONDS = 60;

const COPY = {
  save: {
    title: 'Save my closet',
    intro: 'Link your email to this closet. You can then open it on any device and get it back if this browser forgets it. No password: we email you a link.',
    button: 'Send confirmation link',
    sent: (email: string) => `We sent a link to ${email}. Click it to finish saving. Your closet keeps working meanwhile.`,
  },
  signin: {
    title: 'Sign in to your saved closet',
    intro: 'Enter the email you saved your closet with. We email you a link that opens it here.',
    button: 'Send sign-in link',
    sent: (email: string) => `We sent a link to ${email}. Open it in this browser to load your closet.`,
  },
};

export default function AccountModal({ mode, localItemCount, onSubmit, onClose }: AccountModalProps) {
  const ref = useModal(true, onClose);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [wait, setWait] = useState(0);
  const copy = COPY[mode];

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || wait > 0) return;
    setBusy(true);
    setError('');
    const r = await onSubmit(email);
    setBusy(false);
    if (r.ok) { setSentTo(email.trim().toLowerCase()); setWait(RESEND_SECONDS); }
    else setError(r.message);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={ref} className="modal-box" role="dialog" aria-modal="true" aria-labelledby="account-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="account-title" className="modal-title">{copy.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <p className="recovery-text">{copy.intro}</p>
          {mode === 'signin' && localItemCount > 0 && (
            <p className="recovery-text">The {localItemCount} piece{localItemCount !== 1 ? 's' : ''} in this browser will be offered for adding to your saved closet.</p>
          )}
          <label className="field-label" htmlFor="account-email">Email</label>
          <input
            id="account-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field-input"
            autoFocus
          />
          {error && <p className="field-error" role="alert">{error}</p>}
          {sentTo && !error && <p className="account-sent" role="status">{copy.sent(sentTo)}</p>}
        </form>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-ghost">{sentTo ? 'Done' : 'Cancel'}</button>
          <button onClick={() => submit()} disabled={busy || wait > 0 || !email.trim()} className="btn-primary">
            {busy ? 'Sending…' : wait > 0 ? `Resend in ${wait}s` : sentTo ? 'Resend link' : copy.button}
          </button>
        </div>
      </div>
    </div>
  );
}
