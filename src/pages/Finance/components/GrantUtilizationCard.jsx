import React, { useEffect, useState } from 'react';
import {
  HandCoins, TrendingUp, Clock, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { FinanceAPI } from '../../../services/api';

// GrantUtilizationCard
// -------------------------------------------------------------
// A per-grant rollup table on the Grants tab. Answers three
// questions the Programme Director cares about:
//
//   1. How much of what we've received have we actually spent?
//   2. At current burn, will each grant complete on time?
//   3. Which grants end within 30 days and need reporting soon?
//
// Server-side aggregation via /api/finance/grants/utilization keeps
// this cheap even with hundreds of grants — the client only renders.

const lkr = (n) => {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `LKR ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `LKR ${(n / 1_000).toFixed(0)}K`;
  return `LKR ${Math.round(n).toLocaleString()}`;
};

const pctTone = (pct) => {
  if (pct == null) return { bar: 'bg-hs-slate-300', text: 'text-hs-slate-500' };
  if (pct >= 90)   return { bar: 'bg-hs-teal-500',  text: 'text-hs-teal-700' };
  if (pct >= 50)   return { bar: 'bg-orange-500',   text: 'text-orange-700' };
  if (pct > 0)     return { bar: 'bg-orange-400',   text: 'text-orange-700' };
  return { bar: 'bg-hs-slate-300', text: 'text-hs-slate-500' };
};

const endsInLabel = (days) => {
  if (days == null) return '—';
  if (days < 0)  return `Ended ${Math.abs(days)}d ago`;
  if (days === 0) return 'Ends today';
  if (days < 30)  return `Ends in ${days}d`;
  const months = Math.round(days / 30);
  return `Ends in ~${months}mo`;
};

const GrantUtilizationCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    FinanceAPI.grantUtilization()
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load grant utilisation'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-hs-slate-100 rounded w-1/3" />
          <div className="h-24 bg-hs-slate-100 rounded" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
        <div className="flex items-center gap-2 text-hs-red-700 text-sm">
          <AlertTriangle size={16} />
          <span>Grant utilisation unavailable: {error}</span>
        </div>
      </div>
    );
  }
  if (!data || data.grants.length === 0) return null;

  const { grants, summary } = data;

  return (
    <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
            Grants
          </p>
          <h3 className="text-base font-display font-semibold text-hs-navy-800 flex items-center gap-1.5">
            <HandCoins size={16} className="text-orange-600" />
            Grant utilisation
          </h3>
        </div>
        <button
          onClick={load}
          className="p-1.5 text-hs-slate-500 hover:text-hs-navy-800 hover:bg-hs-slate-100 rounded-md transition"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Header rollup */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="p-3 rounded-md bg-hs-slate-50">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-hs-slate-600">Grants</p>
          <p className="text-lg font-display font-semibold text-hs-navy-800 mt-1">{summary.grants}</p>
        </div>
        <div className="p-3 rounded-md bg-hs-teal-50">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-hs-teal-700">Received</p>
          <p className="text-lg font-display font-semibold text-hs-teal-700 mt-1">{lkr(summary.received)}</p>
        </div>
        <div className="p-3 rounded-md bg-orange-50">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">Utilised</p>
          <p className="text-lg font-display font-semibold text-orange-700 mt-1">{lkr(summary.utilised)}</p>
        </div>
        <div className="p-3 rounded-md bg-hs-slate-50">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-600">
            <Clock size={11} />
            <span>Ending in 30d</span>
          </div>
          <p className={`text-lg font-display font-semibold mt-1 ${summary.endingSoon > 0 ? 'text-orange-700' : 'text-hs-navy-800'}`}>
            {summary.endingSoon}
          </p>
        </div>
      </div>

      {/* Per-grant table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-hs-slate-200 rounded-md overflow-hidden">
          <thead className="bg-hs-slate-50 text-hs-slate-700">
            <tr>
              <th className="text-left  px-3 py-2 font-semibold">Grant</th>
              <th className="text-left  px-3 py-2 font-semibold">Donor</th>
              <th className="text-right px-3 py-2 font-semibold">Received</th>
              <th className="text-right px-3 py-2 font-semibold">Utilised</th>
              <th className="text-left  px-3 py-2 font-semibold w-40">Utilisation</th>
              <th className="text-right px-3 py-2 font-semibold">Burn/mo</th>
              <th className="text-right px-3 py-2 font-semibold">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {grants.map((g) => {
              const tone = pctTone(g.utilisationPct);
              const timeline = endsInLabel(g.endsInDays);
              const timelineWarn = g.endsInDays != null && g.endsInDays >= 0 && g.endsInDays <= 30;
              return (
                <tr key={g.id} className="border-t border-hs-slate-200 hover:bg-hs-slate-50/50">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-hs-navy-800 truncate max-w-[220px]">{g.grantName}</p>
                    <p className="text-[10px] text-hs-slate-500 font-mono">{g.grantCode}</p>
                  </td>
                  <td className="px-3 py-2 text-hs-navy-700 truncate max-w-[160px]">
                    {g.donor?.name || <span className="text-hs-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-hs-teal-700 font-semibold">{lkr(g.received)}</td>
                  <td className="px-3 py-2 text-right text-orange-700 font-semibold">
                    {g.utilised == null
                      ? <span className="text-hs-slate-400 font-normal" title="No project linked">—</span>
                      : lkr(g.utilised)}
                  </td>
                  <td className="px-3 py-2">
                    {g.utilisationPct == null ? (
                      <span className="text-hs-slate-400 text-[10px]">n/a</span>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[11px] font-semibold ${tone.text}`}>{g.utilisationPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-hs-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${tone.bar} transition-all`}
                            style={{ width: `${Math.min(g.utilisationPct, 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-hs-navy-700 font-mono">
                    {g.monthlyBurn == null
                      ? <span className="text-hs-slate-400 font-sans">—</span>
                      : lkr(g.monthlyBurn)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      timelineWarn ? 'text-orange-700' : 'text-hs-slate-600'
                    }`}>
                      {timelineWarn && <AlertTriangle size={11} />}
                      {timeline}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GrantUtilizationCard;
