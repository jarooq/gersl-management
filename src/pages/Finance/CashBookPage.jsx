import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CashAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import RecordCashTxModal from './components/RecordCashTxModal';
import TransferCashModal from './components/TransferCashModal';

const STATUS_BADGE = {
  Posted: 'bg-green-100 text-green-700',
  'Pending-Approval': 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-700',
  Reversed: 'bg-gray-200 text-gray-700'
};

const fmt = (v, currency = 'LKR') => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function CashBookPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canRecord  = hasPermission(user, 'finance:cash:transactions:record');
  const canApprove = hasPermission(user, 'finance:cash:transactions:approve');

  const [account, setAccount] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [showRecord, setShowRecord] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accRes, txRes] = await Promise.all([
        CashAPI.getAccount(id),
        CashAPI.listTransactions({ accountId: id, from, to, limit: 200 })
      ]);
      setAccount(accRes?.data?.account || null);
      setRows(txRes?.data?.transactions || []);
    } catch (e) {
      setError(e?.message || 'Failed to load cash book');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Compute opening balance for the displayed window:
  // current balance minus the In/Out within the window for posted rows.
  const opening = useMemo(() => {
    if (!account) return 0;
    let runningDelta = 0;
    for (const r of rows) {
      if (r.status !== 'Posted') continue;
      runningDelta += (r.direction === 'In' ? Number(r.amount) : -Number(r.amount));
    }
    return Number(account.currentBalance) - runningDelta;
  }, [rows, account]);

  // Build a display list with running balance per row (Posted only).
  const display = useMemo(() => {
    let bal = opening;
    return rows.map(r => {
      let lineBal = bal;
      if (r.status === 'Posted') {
        bal = bal + (r.direction === 'In' ? Number(r.amount) : -Number(r.amount));
        lineBal = bal;
      }
      return { ...r, runningBalance: r.status === 'Posted' ? lineBal : null };
    });
  }, [rows, opening]);

  const onApprove = async (txId) => {
    try { await CashAPI.approveTransaction(txId); load(); }
    catch (e) { alert(e?.message || 'Approve failed'); }
  };
  const onReject = async (txId) => {
    const reason = window.prompt('Rejection reason?');
    if (!reason) return;
    try { await CashAPI.rejectTransaction(txId, reason); load(); }
    catch (e) { alert(e?.message || 'Reject failed'); }
  };
  const onReverse = async (txId) => {
    const reason = window.prompt('Reversal reason?');
    if (!reason) return;
    try { await CashAPI.reverseTransaction(txId, reason); load(); }
    catch (e) { alert(e?.message || 'Reverse failed'); }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (error)   return <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>;
  if (!account) return <div className="p-6 text-sm text-gray-500">Account not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link to="/admin/finance/cash/accounts" className="text-sm text-blue-600 hover:underline">&larr; Cash accounts</Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{account.name}</h1>
          <p className="text-sm text-gray-500">
            {account.type} · {account.location || '—'} · Custodian {account.custodian?.fullName || '—'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-gray-500">Current balance</div>
          <div className="text-2xl font-semibold text-gray-900">{fmt(account.currentBalance, account.currency)}</div>
          {account.type === 'PettyCash' && account.imprestLimit != null && (
            <div className="text-xs text-gray-500">Imprest {fmt(account.imprestLimit, account.currency)}</div>
          )}
        </div>
      </header>

      <section className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-md p-3">
        <label className="text-sm">
          <span className="text-xs uppercase text-gray-500 block">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
        </label>
        <label className="text-sm">
          <span className="text-xs uppercase text-gray-500 block">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
        </label>
        <button onClick={load} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Apply</button>
        <div className="ml-auto flex gap-2">
          {canRecord && (
            <>
              <button onClick={() => setShowRecord(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Record receipt / payment</button>
              <button onClick={() => setShowTransfer(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">Transfer</button>
            </>
          )}
        </div>
      </section>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Voucher</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Particulars</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Receipt</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            <tr className="bg-gray-50">
              <td className="px-3 py-2 text-sm text-gray-700" colSpan={6}><em>Opening balance for period</em></td>
              <td className="px-3 py-2 text-sm text-right font-medium">{fmt(opening, account.currency)}</td>
              <td colSpan={2}></td>
            </tr>
            {display.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-sm text-gray-500">No transactions in window.</td></tr>
            )}
            {display.map(r => (
              <tr key={r.id} className={r.status === 'Reversed' ? 'opacity-60 line-through' : ''}>
                <td className="px-3 py-2 text-sm text-gray-700">{new Date(r.occurredAt).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-sm font-mono text-gray-700">{r.voucherNo || '—'}</td>
                <td className="px-3 py-2 text-sm">{r.transactionType}</td>
                <td className="px-3 py-2 text-sm">
                  <div className="text-gray-900">{r.description || r.payeeName || '—'}</div>
                  {r.counterpartyAccountId && r.counterparty && (
                    <div className="text-xs text-gray-500">↔ {r.counterparty.name}</div>
                  )}
                  {r.referenceType && (
                    <div className="text-xs text-gray-500">{r.referenceType}{r.referenceId ? ` #${r.referenceId}` : ''}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-right text-green-700">{r.direction === 'In' ? fmt(r.amount, account.currency) : ''}</td>
                <td className="px-3 py-2 text-sm text-right text-red-700">{r.direction === 'Out' ? fmt(r.amount, account.currency) : ''}</td>
                <td className="px-3 py-2 text-sm text-right">{r.runningBalance != null ? fmt(r.runningBalance, account.currency) : '—'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-700'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-right space-x-2 whitespace-nowrap">
                  {r.status === 'Pending-Approval' && canApprove && r.performedBy !== user?.id && (
                    <>
                      <button onClick={() => onApprove(r.id)} className="text-green-700 hover:underline">Approve</button>
                      <button onClick={() => onReject(r.id)}  className="text-red-700 hover:underline">Reject</button>
                    </>
                  )}
                  {r.status === 'Posted' && canApprove && !r.reversedById && (
                    <button onClick={() => onReverse(r.id)} className="text-yellow-700 hover:underline">Reverse</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={6} className="px-3 py-2 text-sm text-right">Closing balance</td>
              <td className="px-3 py-2 text-sm text-right">{fmt(account.currentBalance, account.currency)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {showRecord && (
        <RecordCashTxModal
          account={account}
          onClose={() => setShowRecord(false)}
          onSaved={() => { setShowRecord(false); load(); }}
        />
      )}
      {showTransfer && (
        <TransferCashModal
          fromAccount={account}
          onClose={() => setShowTransfer(false)}
          onSaved={() => { setShowTransfer(false); load(); }}
        />
      )}
    </div>
  );
}
