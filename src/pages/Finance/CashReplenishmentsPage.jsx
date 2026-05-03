import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CashAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';

const STATUS_BADGE = {
  Requested: 'bg-yellow-100 text-yellow-800',
  Approved:  'bg-blue-100 text-blue-700',
  Rejected:  'bg-red-100 text-red-700',
  Disbursed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-ink-200 text-ink-600'
};

const fmt = (v, currency = 'LKR') => {
  const n = Number(v); if (!Number.isFinite(n)) return '—';
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function CashReplenishmentsPage() {
  const { user } = useAuth();
  const canApprove = hasPermission(user, 'finance:cash:replenishment:approve');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await CashAPI.listReplenishments(params);
      setRows(res?.data?.replenishments || []);
    } catch (e) {
      setError(e?.message || 'Failed to load replenishments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const action = async (fn) => {
    setBusy(true);
    try { await fn(); await load(); }
    catch (e) { alert(e?.message || 'Action failed'); }
    finally { setBusy(false); }
  };

  const onApprove = (r) => {
    const amt = window.prompt(`Approve replenishment for ${r.currency} ${Number(r.requestedAmount).toLocaleString()}?\nLeave blank to keep requested amount, or enter a different number:`,
      String(r.requestedAmount));
    if (amt === null) return;
    let sourceId = r.sourceAccountId;
    if (!sourceId) {
      const s = window.prompt('Enter source account ID (Cash Book or Locker):');
      if (!s) return;
      sourceId = Number(s);
    }
    action(() => CashAPI.approveReplenishment(r.id, {
      approvedAmount: amt === '' ? undefined : Number(amt),
      sourceAccountId: sourceId
    }));
  };
  const onReject = (r) => {
    const reason = window.prompt('Rejection reason?');
    if (!reason) return;
    action(() => CashAPI.rejectReplenishment(r.id, reason));
  };
  const onDisburse = (r) => {
    if (!window.confirm(`Disburse ${r.currency} ${Number(r.approvedAmount).toLocaleString()} from source #${r.sourceAccountId} to ${r.pettyCashAccount?.name}?`)) return;
    action(() => CashAPI.disburseReplenishment(r.id));
  };
  const onCancel = (r) => {
    if (!window.confirm('Cancel this Requested replenishment?')) return;
    action(() => CashAPI.cancelReplenishment(r.id));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <header>
        <h1 className="text-h1 text-ink-900">Replenishment queue</h1>
        <p className="text-sm text-ink-500">Petty cash imprest top-ups.</p>
      </header>

      <div className="flex items-center gap-2">
        <label className="text-sm">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 rounded-md border border-ink-200 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option>Requested</option>
            <option>Approved</option>
            <option>Disbursed</option>
            <option>Rejected</option>
            <option>Cancelled</option>
          </select>
        </label>
        <button onClick={load} className="px-3 py-1 text-sm border border-ink-200 rounded-md hover:bg-ink-50">Refresh</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">#</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Petty cash</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Requested</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Approved</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Source</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Requester</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && <tr><td colSpan={8} className="p-4 text-center text-sm text-ink-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="p-4 text-center text-sm text-ink-500">No replenishments.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-sm font-mono">#{r.id}</td>
                <td className="px-3 py-2 text-sm">
                  <Link to={`/admin/finance/cash/accounts/${r.pettyCashAccountId}`} className="text-blue-700 hover:underline">
                    {r.pettyCashAccount?.name || `#${r.pettyCashAccountId}`}
                  </Link>
                </td>
                <td className="px-3 py-2 text-sm text-right">{fmt(r.requestedAmount, r.currency)}</td>
                <td className="px-3 py-2 text-sm text-right">{r.approvedAmount != null ? fmt(r.approvedAmount, r.currency) : '—'}</td>
                <td className="px-3 py-2 text-sm">{r.sourceAccount?.name || (r.sourceAccountId ? `#${r.sourceAccountId}` : '—')}</td>
                <td className="px-3 py-2 text-sm">{r.requester?.fullName || '—'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm space-x-2 whitespace-nowrap">
                  {r.status === 'Requested' && canApprove && (
                    <>
                      <button disabled={busy} onClick={() => onApprove(r)} className="text-navy-700 hover:underline">Approve</button>
                      <button disabled={busy} onClick={() => onReject(r)}  className="text-red-700 hover:underline">Reject</button>
                    </>
                  )}
                  {r.status === 'Requested' && r.requestedBy === user?.id && (
                    <button disabled={busy} onClick={() => onCancel(r)} className="text-ink-500 hover:underline">Cancel</button>
                  )}
                  {r.status === 'Approved' && canApprove && (
                    <button disabled={busy} onClick={() => onDisburse(r)} className="text-green-700 hover:underline">Disburse</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
