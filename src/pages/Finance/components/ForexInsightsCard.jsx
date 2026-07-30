import React, { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Globe, AlertCircle, RefreshCw,
} from 'lucide-react';
import { FinanceAPI } from '../../../services/api';

// ForexInsightsCard
// -------------------------------------------------------------
// A three-part rollup for the Finance Dashboard tab, showing:
//
//   1. Realised YTD gain / loss / net — sum of exchangeGainLoss on
//      receipts booked so far this year.
//
//   2. Unrealised exposure — for each foreign-currency invoice that
//      is not yet Paid, the outstanding LKR at booking rate vs the
//      current Sampath O/D Buying rate.
//
//   3. Monthly trend — a sparkline-style bar row for the last 12
//      months' realised net.
//
// All amounts in LKR unless noted. Only shown when there's forex
// activity to report (never a blank card).

const lkr = (n, opts = {}) => {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const short = opts.short === true;
  if (short && abs >= 1_000_000) return `LKR ${(n / 1_000_000).toFixed(1)}M`;
  if (short && abs >= 1_000)      return `LKR ${(n / 1_000).toFixed(0)}K`;
  return `LKR ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const toneFor = (n) => {
  if (n == null) return 'text-hs-slate-500';
  if (n > 0) return 'text-hs-teal-700';
  if (n < 0) return 'text-hs-red-700';
  return 'text-hs-slate-500';
};

const ForexInsightsCard = ({ year: yearProp }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year] = useState(yearProp || new Date().getFullYear());

  const load = () => {
    setLoading(true);
    setError(null);
    FinanceAPI.forexSummary(year)
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load forex summary'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [year]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-hs-slate-100 rounded w-1/3" />
          <div className="h-8 bg-hs-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
        <div className="flex items-center gap-2 text-hs-red-700 text-sm">
          <AlertCircle size={16} />
          <span>Forex summary unavailable: {error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { realized, unrealized, byCurrency, monthly } = data;
  const hasAnyActivity = realized.gain > 0 || Math.abs(realized.loss) > 0 || byCurrency.length > 0;
  if (!hasAnyActivity) return null;

  // Normalise monthly bars to a common max so the sparkline reads well.
  const monthlyMax = Math.max(1, ...monthly.map((m) => Math.abs(m.net)));

  return (
    <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
            Finance · {year}
          </p>
          <h3 className="text-base font-display font-semibold text-hs-navy-800 flex items-center gap-1.5">
            <Globe size={16} className="text-orange-600" />
            Forex insights
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

      {/* Realised + unrealised strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="p-3 rounded-md bg-hs-teal-50">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-hs-teal-700">
            <TrendingUp size={12} />
            <span>Realised gain YTD</span>
          </div>
          <p className="text-lg font-display font-semibold text-hs-teal-700 mt-1">
            {lkr(realized.gain, { short: true })}
          </p>
        </div>
        <div className="p-3 rounded-md bg-hs-red-50">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-hs-red-700">
            <TrendingDown size={12} />
            <span>Realised loss YTD</span>
          </div>
          <p className="text-lg font-display font-semibold text-hs-red-700 mt-1">
            {lkr(realized.loss, { short: true })}
          </p>
        </div>
        <div className="p-3 rounded-md bg-hs-slate-50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-hs-slate-600">
            Realised net
          </div>
          <p className={`text-lg font-display font-semibold mt-1 ${toneFor(realized.net)}`}>
            {lkr(realized.net, { short: true })}
          </p>
        </div>
        <div className="p-3 rounded-md bg-orange-50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">
            Unrealised (at today's rate)
          </div>
          <p className={`text-lg font-display font-semibold mt-1 ${toneFor(unrealized.net)}`}>
            {lkr(unrealized.net, { short: true })}
          </p>
        </div>
      </div>

      {/* Per-currency exposure */}
      {byCurrency.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500 mb-2">
            Open exposure by currency
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-hs-slate-200 rounded-md overflow-hidden">
              <thead className="bg-hs-slate-50 text-hs-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Ccy</th>
                  <th className="text-right px-3 py-2 font-semibold">Open</th>
                  <th className="text-right px-3 py-2 font-semibold">Foreign O/S</th>
                  <th className="text-right px-3 py-2 font-semibold">Booked LKR</th>
                  <th className="text-right px-3 py-2 font-semibold">Avg rate</th>
                  <th className="text-right px-3 py-2 font-semibold">Today's rate</th>
                  <th className="text-right px-3 py-2 font-semibold">Unrealised</th>
                </tr>
              </thead>
              <tbody>
                {byCurrency.map((c) => (
                  <tr key={c.currency} className="border-t border-hs-slate-200">
                    <td className="px-3 py-1.5 font-semibold text-hs-navy-800">{c.currency}</td>
                    <td className="px-3 py-1.5 text-right text-hs-navy-700">{c.openInvoicesCount}</td>
                    <td className="px-3 py-1.5 text-right text-hs-navy-700">
                      {c.outstandingForeign.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-1.5 text-right text-hs-navy-700">{lkr(c.outstandingLkrBooked, { short: true })}</td>
                    <td className="px-3 py-1.5 text-right text-hs-slate-600 font-mono">
                      {c.avgBookingRate.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {c.currentRate == null ? (
                        <span className="text-hs-slate-400">—</span>
                      ) : (
                        <span className="text-hs-navy-700">{c.currentRate.toFixed(2)}</span>
                      )}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-semibold ${toneFor(c.unrealizedGainLoss)}`}>
                      {c.unrealizedGainLoss == null ? '—' : lkr(c.unrealizedGainLoss, { short: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 12-month realised trend — a horizontal bar row per month, above
          zero = gain (teal), below zero = loss (red). */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500 mb-2">
          Realised net (last 12 months)
        </p>
        <div className="flex items-end gap-1 h-16">
          {monthly.map((m) => {
            const h = Math.max(4, Math.round((Math.abs(m.net) / monthlyMax) * 56));
            const tone = m.net > 0 ? 'bg-hs-teal-500' : m.net < 0 ? 'bg-hs-red-500' : 'bg-hs-slate-200';
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end" title={`${m.month}: ${lkr(m.net)}`}>
                <div className={`w-full ${tone} rounded-sm`} style={{ height: `${h}px` }} />
                <p className="text-[9px] text-hs-slate-500 mt-1 font-mono">
                  {m.month.slice(5)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ForexInsightsCard;
