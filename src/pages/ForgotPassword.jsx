// =============================================================================
// Forgot password page — step 1 of 2.
// Public route. User enters their email; we POST /api/auth/forgot-password
// which returns a generic success message regardless of whether the email
// exists (security best practice). The reset link in the email lands on
// /reset-password?token=… which is the next page.
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      // The backend always returns 200 with a generic success message to
      // avoid leaking which emails are registered. So we only surface an
      // error on network failure / 5xx.
      if (!res.ok && res.status >= 500) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Server error. Please try again later.');
      }
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset link. Try again.');
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
            <p className="text-[11px] text-ink-500">Reset your password</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-success-50 border border-success-600/20 flex items-center justify-center mx-auto mb-3">
              <MailCheck className="w-6 h-6 text-success-700" />
            </div>
            <h1 className="text-h2 text-ink-900 mb-1">Check your email</h1>
            <p className="text-sm text-ink-500 mb-5 leading-relaxed">
              If an account with that email exists, a password reset link is on its
              way. The link expires in one hour.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card transition"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
            <p className="mt-4">
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-xs text-navy-700 hover:text-navy-900 underline"
              >
                Re-send to a different email
              </button>
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-h2 text-ink-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-ink-500 mb-6">
              Enter the email associated with your account. We'll send you a link to
              set a new password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-danger-50 border border-danger-600/20 text-danger-700 rounded-md px-3 py-2.5 text-sm">
                  {error}
                </div>
              )}
              <label className="block">
                <span className="block text-xs font-medium text-ink-700 mb-1">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-ink-200 bg-white pl-9 pr-3 py-2.5 rounded-md text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 disabled:bg-ink-50"
                    placeholder="you@example.org"
                    autoComplete="email"
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
                    Sending…
                  </>
                ) : 'Send reset link'}
              </button>
              <Link
                to="/login"
                className="block text-center text-xs text-navy-700 hover:text-navy-900 mt-2"
              >
                ← Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
