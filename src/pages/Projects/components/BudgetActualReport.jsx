import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProjectAPI } from '../../../services/api';

// Compact currency formatter for LKR with thousand separators.
const fmt = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);

// Pick a colour band for utilization — green / amber / red.
const utilTone = (pct) => {
  if (pct == null) return { bar: 'bg-ink-300', text: 'text-ink-600', bg: 'bg-ink-50' };
  if (pct < 70)    return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
  if (pct < 100)   return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
};

const BudgetActualReport = ({ projectId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ startDate: '', endDate: '', fiscalYear: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ProjectAPI.getBudgetActual(projectId, filter);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const monthlyMax = useMemo(
    () => Math.max(1, ...((data?.byMonth || []).map((m) => Number(m.actual || 0)))),
    [data]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-8 text-center text-ink-500">
        Loading budget vs actual…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg2 p-6">
        <div className="flex items-center gap-2 text-red-700 font-semibold">
          <AlertTriangle size={18} /> {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totals, byCategory, byMonth, byStatus } = data;
  const tone = utilTone(totals.utilizationPct);
  const overBudget = totals.variance < 0;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">From</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="border border-ink-200 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">To</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="border border-ink-200 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Fiscal year</label>
            <input
              type="text"
              placeholder="e.g. 2026"
              value={filter.fiscalYear}
              onChange={(e) => setFilter({ ...filter, fiscalYear: e.target.value })}
              className="border border-ink-200 rounded-md px-3 py-1.5 text-sm w-28"
            />
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold rounded-md px-3 py-1.5 hover:bg-navy-800 transition"
          >
            <RefreshCw size={14} /> Apply
          </button>
          <div className="ml-auto text-xs text-ink-500">
            {data.expensesConsidered} expense{data.expensesConsidered === 1 ? '' : 's'} ·{' '}
            {data.budgetsConsidered} budget{data.budgetsConsidered === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Headline tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
          <p className="text-xs font-semibold uppercase text-ink-500">Budget</p>
          <p className="text-h2 text-ink-900 mt-1">{fmt(totals.budget)}</p>
        </div>
        <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
          <p className="text-xs font-semibold uppercase text-ink-500">Actual (Approved + Paid)</p>
          <p className="text-h2 text-ink-900 mt-1">{fmt(totals.actual)}</p>
          <p className="text-xs text-ink-500 mt-1">Pending: {fmt(totals.pending)}</p>
        </div>
        <div className={`rounded-lg2 shadow-card border border-ink-100 p-4 ${overBudget ? 'bg-red-50' : 'bg-white'}`}>
          <p className="text-xs font-semibold uppercase text-ink-500">Variance</p>
          <p className={`text-h2 mt-1 ${overBudget ? 'text-red-700' : 'text-green-700'}`}>
            {overBudget ? '−' : ''}
            {fmt(Math.abs(totals.variance))}
          </p>
          <p className="text-xs text-ink-500 mt-1 inline-flex items-center gap-1">
            {overBudget ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {overBudget ? 'Over budget' : 'Under budget'}
          </p>
        </div>
        <div className={`rounded-lg2 shadow-card border border-ink-100 p-4 ${tone.bg}`}>
          <p className="text-xs font-semibold uppercase text-ink-500">Utilization</p>
          <p className={`text-h2 mt-1 ${tone.text}`}>{fmtPct(totals.utilizationPct)}</p>
          <div className="mt-2 h-2 bg-ink-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${tone.bar} transition-all`}
              style={{ width: `${Math.min(100, Math.max(0, totals.utilizationPct ?? 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* By Category table */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
        <div className="p-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink-900">Spend by category</h3>
          <span className="text-xs text-ink-500">{byCategory.length} categor{byCategory.length === 1 ? 'y' : 'ies'}</span>
        </div>
        {byCategory.length === 0 ? (
          <div className="p-8 text-center text-ink-500 text-sm">No expenses recorded in this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-xs font-semibold text-ink-600 uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Category</th>
                  <th className="text-right px-4 py-2">Budget</th>
                  <th className="text-right px-4 py-2">Actual</th>
                  <th className="text-right px-4 py-2">Variance</th>
                  <th className="text-right px-4 py-2 w-40">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {byCategory.map((row) => {
                  const t = utilTone(row.utilizationPct);
                  const rowOver = row.variance != null && row.variance < 0;
                  return (
                    <tr key={row.category} className="hover:bg-ink-50">
                      <td className="px-4 py-2 font-semibold text-ink-900">{row.category}</td>
                      <td className="px-4 py-2 text-right text-ink-700">
                        {row.budget == null ? <span className="text-ink-400">—</span> : fmt(row.budget)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-ink-900">{fmt(row.actual)}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${rowOver ? 'text-red-700' : row.variance == null ? 'text-ink-400' : 'text-green-700'}`}>
                        {row.variance == null ? '—' : `${rowOver ? '−' : ''}${fmt(Math.abs(row.variance))}`}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${t.bar}`}
                              style={{ width: `${Math.min(100, Math.max(0, row.utilizationPct ?? 0))}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${t.text} w-12 text-right`}>
                            {fmtPct(row.utilizationPct)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly trend + status mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-ink-900 inline-flex items-center gap-2">
              <Calendar size={16} className="text-ink-500" /> Monthly actual spend
            </h3>
            <span className="text-xs text-ink-500">{byMonth.length} month{byMonth.length === 1 ? '' : 's'}</span>
          </div>
          {byMonth.length === 0 ? (
            <div className="py-8 text-center text-ink-500 text-sm">No approved spend yet.</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {byMonth.map((m) => {
                const h = Math.max(4, (Number(m.actual) / monthlyMax) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="text-[10px] text-ink-500 truncate w-full text-center" title={fmt(m.actual)}>
                      {fmt(m.actual).replace('LKR ', '')}
                    </div>
                    <div
                      className="w-full bg-navy-900 rounded-t-sm transition-all"
                      style={{ height: `${h}%` }}
                      title={`${m.month}: ${fmt(m.actual)}`}
                    />
                    <div className="text-[10px] text-ink-600 font-semibold">{m.month}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
          <h3 className="text-base font-bold text-ink-900 mb-3 inline-flex items-center gap-2">
            <CheckCircle size={16} className="text-ink-500" /> Status mix
          </h3>
          <div className="space-y-2 text-sm">
            {Object.entries(byStatus).map(([status, info]) => (
              <div key={status} className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    status === 'Approved' ? 'bg-green-100 text-green-700' :
                    status === 'Paid'     ? 'bg-blue-100 text-blue-700' :
                    status === 'Pending'  ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                  }`}
                >
                  {status}
                </span>
                <span className="text-ink-700 text-xs">
                  {info.count} · <span className="font-semibold">{fmt(info.amount)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetActualReport;
