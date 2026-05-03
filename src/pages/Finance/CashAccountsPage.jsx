import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => { load(); }, []);

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
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
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
