// =============================================================================
// Reset password page — step 2 of 2.
// Receives the token via ?token=… (the link from the reset email lands here).
// User picks a new password and we POST /api/auth/reset-password. On success
// we route to /login so they can sign in with the new password.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Pre-fill the token from the URL query param on mount. Editable so the
  // user can paste manually if the email client mangled the link.
  useEffect(() => {
    const t = params.get('token');
    if (t) setToken(t);
  }, [params]);

  const validate = () => {
    if (!token.trim()) return 'Reset token is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Include an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Include a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Include a number.';
    if (!/[!@#$%^&*]/.test(password)) return 'Include a special character (!@#$%^&*).';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword: password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Reset failed.');
      setDone(true);
      // Auto-bounce to /login after a brief success message.
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-card border border-ink-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src="/Logo.png" alt="GERSL" className="h-10 w-10 object-contain" />
          <div>
            <h2 className="text-sm font-semibold text-ink-900 leading-tight">Global Ehsan Relief</h2>
            <p className="text-[11px] text-ink-500">Set a new password</p>
          </div>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-success-50 border border-success-600/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-success-700" />
            </div>
            <h1 className="text-h2 text-ink-900 mb-1">Password updated</h1>
            <p className="text-sm text-ink-500 mb-5">Redirecting to sign in…</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card transition"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-h2 text-ink-900 mb-1">Choose a new password</h1>
            <p className="text-sm text-ink-500 mb-6">
              Min 8 chars with uppercase, lowercase, a number, and one of !@#$%^&*.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-danger-50 border border-danger-600/20 text-danger-700 rounded-md px-3 py-2.5 text-sm">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="block text-xs font-medium text-ink-700 mb-1">Reset token</span>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full border border-ink-200 bg-white pl-9 pr-3 py-2.5 rounded-md text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 disabled:bg-ink-50 font-mono"
                    placeholder="Pre-filled from the email link"
                    required
                    disabled={busy}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-ink-700 mb-1">New password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-ink-200 bg-white pl-9 pr-10 py-2.5 rounded-md text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 disabled:bg-ink-50"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-ink-700 mb-1">Confirm password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full border border-ink-200 bg-white pl-9 pr-3 py-2.5 rounded-md text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 disabled:bg-ink-50"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={busy}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating…
                  </>
                ) : 'Update password'}
              </button>

              <Link
                to="/login"
                className="block text-center text-xs text-navy-700 hover:text-navy-900 mt-2"
              >
                <ArrowLeft size={12} className="inline mr-1" />
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
