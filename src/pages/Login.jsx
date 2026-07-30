import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Heart, Users, Sparkles, ShieldCheck } from 'lucide-react';

// === Login v3 — HubSpot console ===
// Two-column layout: dark hs-navy mission panel on the left, white sign-in
// card on the right. Orange used only for accents + the primary CTA.
// Mobile collapses to a single column with a compact brand strip.

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
    <div className="min-h-screen grid lg:grid-cols-5 bg-hs-slate-50 text-hs-navy-800">
      {/* === Left mission panel — dark navy, orange accents === */}
      <div className="hidden lg:flex lg:col-span-2 bg-hs-navy-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-md bg-white flex items-center justify-center">
              <img src="/Logo.png" alt="GERSL" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold leading-tight">Global Ehsan Relief</h2>
              <p className="text-xs text-hs-slate-300">Sri Lanka</p>
            </div>
          </div>

          <h1 className="text-display font-display leading-tight">
            Serving with <span className="text-orange-400">compassion</span>,
            measured in <span className="text-orange-400">impact</span>.
          </h1>
          <p className="text-base text-hs-slate-300 mt-5 max-w-md leading-relaxed">
            A unified platform for orphan care, beneficiary support, finance, and field operations —
            built for the staff who do the work.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          {pillars.map((p) => {
            const PillarIcon = p.icon;
            return (
              <div key={p.label} className="flex items-center gap-2.5 text-sm text-hs-slate-200">
                <span className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-orange-400">
                  <PillarIcon className="w-4 h-4" />
                </span>
                <span>{p.label}</span>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 text-xs text-hs-slate-400">
          <p>65 Abdul Majeed Road, Kinniya-04, Trincomalee, Sri Lanka</p>
          <p className="mt-1">© {new Date().getFullYear()} Global Ehsan Relief — All rights reserved.</p>
        </div>
      </div>

      {/* === Right sign-in column === */}
      <div className="lg:col-span-3 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand strip */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-md bg-hs-navy-700 flex items-center justify-center">
              <img src="/Logo.png" alt="GERSL" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-display font-semibold text-hs-navy-800 leading-tight">Global Ehsan Relief</h2>
              <p className="text-[11px] text-hs-slate-500">Sri Lanka · Management Console</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1.5">Welcome back</p>
            <h1 className="text-h1 font-display text-hs-navy-800">Sign in</h1>
            <p className="text-sm text-hs-slate-500 mt-1">Use your staff credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-hs-red-50 border border-hs-red-500/20 text-hs-red-700 rounded-md px-3 py-2.5 text-sm flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="block">
              <span className="block text-xs font-semibold text-hs-navy-700 mb-1">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-hs-slate-300 bg-white px-3 py-2.5 rounded-md text-sm text-hs-navy-800 placeholder-hs-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-hs-slate-50"
                placeholder="e.g. admin"
                autoComplete="username"
                required
                disabled={isLoading}
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-1">
                <span className="block text-xs font-semibold text-hs-navy-700">Password</span>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-hs-slate-300 bg-white px-3 py-2.5 rounded-md text-sm text-hs-navy-800 placeholder-hs-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-hs-slate-50"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-md shadow-hs-card transition disabled:opacity-50 disabled:cursor-not-allowed"
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

          <p className="mt-8 text-[11px] text-hs-slate-400 lg:hidden">
            © {new Date().getFullYear()} Global Ehsan Relief · Sri Lanka
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
