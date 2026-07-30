import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CashAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import CashAccountFormModal from './components/CashAccountFormModal';

const TYPE_BADGE = {
  Locker: 'bg-purple-100 text-purple-700',
  CashBook: 'bg-blue-100 text-blue-700',
  PettyCash: 'bg-amber-100 text-amber-700'
};

const fmt = (amount, currency = 'LKR') => {
  if (amount == null) return '—';
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function CashAccountsPage() {
  const { user } = useAuth();
  const canManage = useMemo(() => hasPermission(user, 'finance:cash:accounts:manage'), [user]);

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Activity summary state — month/30d cash flow across all accounts
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [activityFrom, setActivityFrom] = useState(() => startOfMonth.toISOString().slice(0, 10));
  const [activityTo, setActivityTo]     = useState(() => today.toISOString().slice(0, 10));
  const [activity, setActivity]         = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, sum] = await Promise.all([
        CashAPI.listAccounts({}),
        CashAPI.getSummary().catch(() => null)
      ]);
      setAccounts(list?.data?.accounts || []);
      setSummary(sum?.data || null);
    } catch (e) {
      setError(e?.message || 'Failed to load cash accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const resp = await CashAPI.getActivitySummary({ from: activityFrom, to: activityTo });
      setActivity(resp?.data || null);
    } catch (e) {
      // Non-fatal — the page still works without activity summary.
      console.error('Activity summary load failed:', e);
    } finally {
      setActivityLoading(false);
    }
  }, [activityFrom, activityTo]);

  useEffect(() => { load(); }, []);
  useEffect(() => { loadActivity(); }, [loadActivity]);

  const onDeactivate = async (acc) => {
    if (!window.confirm(`Deactivate ${acc.name}? Balance must be zero.`)) return;
    try { await CashAPI.deactivateAccount(acc.id); load(); }
    catch (e) { alert(e?.message || 'Failed'); }
  };
  const onReactivate = async (acc) => {
    if (!window.confirm(`Reactivate ${acc.name}?`)) return;
    try { await CashAPI.reactivateAccount(acc.id); load(); }
    catch (e) { alert(e?.message || 'Failed'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Finance · Cash</p>
            <h1 className="text-h2 font-bold leading-tight">Cash Accounts</h1>
            <p className="text-ink-200 text-sm mt-0.5">Locker, cash book, and petty cash floats. Transactions are recorded separately.</p>
          </div>
          {canManage && (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition"
            >Add Account</button>
          )}
        </div>
      </div>

      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(summary.byType || []).map(b => (
            <div key={`${b.type}-${b.currency}`} className="bg-white border border-ink-100 rounded-md p-4">
              <div className="text-xs uppercase text-ink-500">{b.type}</div>
              <div className="text-2xl font-semibold mt-1 text-ink-900">{fmt(b.totalBalance, b.currency)}</div>
              <div className="text-xs text-ink-500 mt-1">{b.accountCount} account(s)</div>
            </div>
          ))}
        </section>
      )}

      {/* Cash activity summary — what flowed through the cash module for the
          selected period, grouped by account and by source. Useful for
          monthly board reports. */}
      <section className="bg-white border border-ink-100 rounded-md p-4">
        <div className="flex items-end flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700">Cash activity</h2>
            <p className="text-xs text-ink-500 mt-0.5">Posted transactions across all accounts in the selected window.</p>
          </div>
          <label className="text-sm ml-auto">
            <span className="text-xs uppercase text-ink-500 block">From</span>
            <input type="date" value={activityFrom} onChange={(e) => setActivityFrom(e.target.value)}
                   className="rounded-md border border-ink-200 px-2 py-1 text-sm" />
          </label>
          <label className="text-sm">
            <span className="text-xs uppercase text-ink-500 block">To</span>
            <input type="date" value={activityTo} onChange={(e) => setActivityTo(e.target.value)}
                   className="rounded-md border border-ink-200 px-2 py-1 text-sm" />
          </label>
        </div>

        {activityLoading && !activity && (
          <div className="text-sm text-ink-500">Loading activity…</div>
        )}

        {activity && (
          <>
            {/* Totals row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="border border-ink-100 rounded-md p-3 bg-ink-50">
                <div className="text-xs uppercase text-ink-500">Transactions</div>
                <div className="text-xl font-semibold text-ink-900">{activity.totals.transactionCount}</div>
              </div>
              <div className="border border-green-100 rounded-md p-3 bg-green-50">
                <div className="text-xs uppercase text-green-700">Receipts</div>
                <div className="text-xl font-semibold text-green-800">{fmt(activity.totals.receipts)}</div>
              </div>
              <div className="border border-red-100 rounded-md p-3 bg-red-50">
                <div className="text-xs uppercase text-red-700">Payments</div>
                <div className="text-xl font-semibold text-red-800">{fmt(activity.totals.payments)}</div>
              </div>
              <div className={`border rounded-md p-3 ${activity.totals.net >= 0 ? 'border-navy-100 bg-navy-50' : 'border-amber-100 bg-amber-50'}`}>
                <div className={`text-xs uppercase ${activity.totals.net >= 0 ? 'text-navy-700' : 'text-amber-700'}`}>Net flow</div>
                <div className={`text-xl font-semibold ${activity.totals.net >= 0 ? 'text-navy-900' : 'text-amber-800'}`}>{fmt(activity.totals.net)}</div>
              </div>
            </div>

            {/* Two side-by-side breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* By Account */}
              <div className="border border-ink-100 rounded-md">
                <div className="px-3 py-2 bg-ink-50 border-b border-ink-100 text-xs font-bold uppercase tracking-wider text-ink-700">
                  By account
                </div>
                {activity.byAccount.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-ink-500">No activity in window.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-xs text-ink-500">
                      <tr>
                        <th className="text-left px-3 py-1.5">Account</th>
                        <th className="text-right px-3 py-1.5">In</th>
                        <th className="text-right px-3 py-1.5">Out</th>
                        <th className="text-right px-3 py-1.5">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.byAccount.map(a => (
                        <tr key={a.accountId} className="border-t border-ink-50">
                          <td className="px-3 py-1.5">
                            <Link to={`/admin/finance/cash/accounts/${a.accountId}`} className="text-navy-700 hover:underline">
                              {a.accountName}
                            </Link>
                            <span className="text-xs text-ink-500 ml-2">{a.accountType}</span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-green-700">{fmt(a.receipts, a.currency)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-red-700">{fmt(a.payments, a.currency)}</td>
                          <td className={`px-3 py-1.5 text-right font-mono ${a.net >= 0 ? 'text-navy-800' : 'text-amber-700'}`}>{fmt(a.net, a.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* By Reference Type */}
              <div className="border border-ink-100 rounded-md">
                <div className="px-3 py-2 bg-ink-50 border-b border-ink-100 text-xs font-bold uppercase tracking-wider text-ink-700">
                  By source (where the money came from / went to)
                </div>
                {activity.byReferenceType.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-ink-500">No activity in window.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-xs text-ink-500">
                      <tr>
                        <th className="text-left px-3 py-1.5">Source</th>
                        <th className="text-right px-3 py-1.5">Count</th>
                        <th className="text-right px-3 py-1.5">In</th>
                        <th className="text-right px-3 py-1.5">Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.byReferenceType.map(r => (
                        <tr key={r.referenceType} className="border-t border-ink-50">
                          <td className="px-3 py-1.5">{r.referenceType}</td>
                          <td className="px-3 py-1.5 text-right text-ink-600">{r.count}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-green-700">{r.in > 0 ? fmt(r.in) : '—'}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-red-700">{r.out > 0 ? fmt(r.out) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {summary?.lowFloats?.length > 0 && (
        <section className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="text-sm font-medium text-yellow-900 mb-1">Low floats — at or below reorder point</div>
          <ul className="text-sm text-yellow-800 list-disc pl-5">
            {summary.lowFloats.map(a => (
              <li key={a.id}>{a.name} ({a.type}): {fmt(a.currentBalance, a.currency)} ≤ {fmt(a.reorderPoint, a.currency)}</li>
            ))}
          </ul>
        </section>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Account</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Custodian</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-ink-500 uppercase">Balance</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-ink-500 uppercase">Imprest</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && <tr><td colSpan={7} className="p-4 text-center text-sm text-ink-500">Loading…</td></tr>}
            {!loading && accounts.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-ink-500">No cash accounts yet.</td></tr>
            )}
            {!loading && accounts.map(a => (
              <tr key={a.id} className={!a.isActive ? 'opacity-60' : ''}>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[a.type]}`}>
                    {a.type}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <Link to={`/admin/finance/cash/accounts/${a.id}`} className="font-medium text-blue-700 hover:underline">
                    {a.name}
                  </Link>
                  <div className="text-xs text-ink-500">{a.location || ''}</div>
                </td>
                <td className="px-4 py-2 text-sm text-ink-700">
                  {a.custodian?.fullName || '—'}
                  {a.altCustodian && <div className="text-xs text-ink-500">+ {a.altCustodian.fullName}</div>}
                </td>
                <td className="px-4 py-2 text-sm text-right font-medium">{fmt(a.currentBalance, a.currency)}</td>
                <td className="px-4 py-2 text-sm text-right text-ink-600">{a.type === 'PettyCash' && a.imprestLimit != null ? fmt(a.imprestLimit, a.currency) : '—'}</td>
                <td className="px-4 py-2 text-sm">
                  {a.isActive
                    ? <span className="text-green-700">Active</span>
                    : <span className="text-ink-400">Inactive</span>}
                </td>
                <td className="px-4 py-2 text-sm text-right space-x-2">
                  {canManage && (
                    <>
                      <button onClick={() => { setEditing(a); setShowForm(true); }} className="text-navy-700 hover:underline">Edit</button>
                      {a.isActive
                        ? <button onClick={() => onDeactivate(a)} className="text-red-700 hover:underline">Deactivate</button>
                        : <button onClick={() => onReactivate(a)} className="text-emerald-700 hover:underline">Reactivate</button>}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CashAccountFormModal
          account={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
