import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Heart, Users, Sparkles, ShieldCheck } from 'lucide-react';

// === Login v2 — NGO professional ===
// Two-column layout: navy mission panel on the left, white sign-in card on
// the right. Mobile collapses to a single column with a compact brand strip.

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(username, password);
    if (result.success) navigate('/admin');
    else setError(result.message);
    setIsLoading(false);
  };

  const pillars = [
    { icon: Heart,      label: 'Compassionate care' },
    { icon: Users,      label: 'Community-led' },
    { icon: Sparkles,   label: 'Transparent impact' },
    { icon: ShieldCheck,label: 'Accountable stewardship' },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-5 bg-ink-50 text-ink-900">
      {/* === Left mission panel — navy, decorative === */}
      <div className="hidden lg:flex lg:col-span-2 bg-navy-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative ornament */}
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-mission-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src="/Logo.png" alt="GERSL" className="h-12 w-12 object-contain" />
            <div>
              <h2 className="text-lg font-semibold leading-tight">Global Ehsan Relief</h2>
              <p className="text-xs text-ink-200">Sri Lanka</p>
            </div>
          </div>

          <h1 className="text-display leading-tight">
            Serving with <span className="text-mission-400">compassion</span>,
            measured in <span className="text-mission-400">impact</span>.
          </h1>
          <p className="text-base text-ink-200 mt-5 max-w-md leading-relaxed">
            A unified platform for orphan care, beneficiary support, finance, and field operations —
            built for the staff who do the work.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          {pillars.map((p) => {
            const PillarIcon = p.icon;
            return (
              <div key={p.label} className="flex items-center gap-2.5 text-sm text-ink-100">
                <span className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-mission-400">
                  <PillarIcon className="w-4 h-4" />
                </span>
                <span>{p.label}</span>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 text-xs text-ink-300">
          <p>65 Abdul Majeed Road, Kinniya-04, Trincomalee, Sri Lanka</p>
          <p className="mt-1">© {new Date().getFullYear()} Global Ehsan Relief — All rights reserved.</p>
        </div>
      </div>

      {/* === Right sign-in column === */}
      <div className="lg:col-span-3 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand strip */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <img src="/Logo.png" alt="GERSL" className="h-10 w-10 object-contain" />
            <div>
              <h2 className="text-sm font-semibold text-ink-900 leading-tight">Global Ehsan Relief</h2>
              <p className="text-[11px] text-ink-500">Sri Lanka · Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-wider text-navy-700 mb-1.5">Welcome back</p>
            <h1 className="text-h1 text-ink-900">Sign in</h1>
            <p className="text-sm text-ink-500 mt-1">Use your staff credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger-50 border border-danger-600/20 text-danger-700 rounded-md px-3 py-2.5 text-sm flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="block">
              <span className="block text-xs font-medium text-ink-700 mb-1">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-ink-200 bg-white px-3 py-2.5 rounded-md text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 disabled:bg-ink-50"
                placeholder="e.g. admin"
                autoComplete="username"
                required
                disabled={isLoading}
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-1">
                <span className="block text-xs font-medium text-ink-700">Password</span>
                {/* Added 2026-05-15. Backend has had /api/auth/forgot-password
                    + /reset-password since launch; this is the first time we
                    surface the entry point on the web login. */}
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-navy-700 hover:text-navy-900 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-ink-200 bg-white px-3 py-2.5 rounded-md text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 disabled:bg-ink-50"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-[11px] text-ink-400 lg:hidden">
            © {new Date().getFullYear()} Global Ehsan Relief · Sri Lanka
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
