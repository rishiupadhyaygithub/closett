import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthModal() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError(''); setSuccess('');

    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccess('Account created! If you don\'t get an email, just sign in directly — email confirmation may be disabled.');
        setMode('login');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          if (err.message.toLowerCase().includes('email not confirmed')) {
            setError('Email not confirmed. Check your inbox for a confirmation link, or contact support if you didn\'t receive one.');
          } else if (err.message.toLowerCase().includes('invalid login credentials')) {
            setError('Wrong email or password.');
          } else {
            throw err;
          }
          return;
        }
        // auth state change in App.tsx handles the rest
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box auth-box">
        <div className="auth-brand">
          <span className="brand-icon" style={{ fontSize: 28 }}>✦</span>
          <span className="brand-name" style={{ fontSize: 24 }}>Closett</span>
        </div>
        <p className="auth-tagline">
          Your digital wardrobe, built for Indian skin tones and body types.
        </p>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >Sign In</button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
          >Create Account</button>
        </div>

        <div className="auth-body">
          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="you@example.com"
              className="field-input"
              autoFocus
            />
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Min 6 characters"
              className="field-input"
            />
          </div>

          {error   && <p className="auth-msg auth-msg--error">{error}</p>}
          {success && <p className="auth-msg auth-msg--success">{success}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !email.trim() || !password.trim()}
            className="btn-primary auth-submit"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </div>

        <p className="auth-footer-note">
          Your closet syncs across all devices. Data is private to your account.
        </p>
      </div>
    </div>
  );
}
