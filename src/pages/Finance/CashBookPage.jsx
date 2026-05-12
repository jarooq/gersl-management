import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CashAPI, TokenManager } from '../../services/api';
import { API_BASE_URL } from '../../config/apiBase';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import RecordCashTxModal from './components/RecordCashTxModal';
import TransferCashModal from './components/TransferCashModal';
import CashCountModal from './components/CashCountModal';
import RequestReplenishmentModal from './components/RequestReplenishmentModal';
import BulkReceiptsModal from './components/BulkReceiptsModal';

// Open the voucher PDF in a new tab. Auth via ?token=… because PDF viewers
// can't carry Authorization headers — the backend whitelists this surface.
const openVoucher = (transactionId) => {
  const token = TokenManager?.getAccessToken?.() || localStorage.getItem('accessToken') || '';
  const url = `${API_BASE_URL.replace(/\/$/, '')}/cash/transactions/${transactionId}/voucher${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const STATUS_BADGE = {
  Posted: 'bg-green-100 text-green-700',
  'Pending-Approval': 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-700',
  Reversed: 'bg-ink-200 text-ink-700'
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
  const canRunCount     = hasPermission(user, 'finance:cash:count:run');
  const canApproveCount = hasPermission(user, 'finance:cash:count:approve');
  const canRequestReplen = hasPermission(user, 'finance:cash:replenishment:request');

  const [account, setAccount] = useState(null);
  const [report, setReport] = useState(null);
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [showRecord, setShowRecord] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [activeCount, setActiveCount] = useState(null);
  const [showReplen, setShowReplen] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [replenishments, setReplenishments] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accRes, reportRes, countRes, replenRes] = await Promise.all([
        CashAPI.getAccount(id),
        CashAPI.getCashBookReport(id, { from, to }),
        CashAPI.listCounts({ accountId: id }).catch(() => ({ data: { counts: [] } })),
        CashAPI.listReplenishments({ pettyCashAccountId: id }).catch(() => ({ data: { replenishments: [] } }))
      ]);
      setAccount(accRes?.data?.account || null);
      setReport(reportRes?.data || null);
      setCounts(countRes?.data?.counts || []);
      setReplenishments(replenRes?.data?.replenishments || []);
    } catch (e) {
      setError(e?.message || 'Failed to load cash book');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Server-supplied accurate opening + per-row running balance.
  const opening = report?.opening ?? 0;
  const closing = report?.closing ?? Number(account?.currentBalance || 0);
  const totals = report?.totals || { receipts: 0, payments: 0 };
  const display = report?.lines || [];

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

  const onApproveCount = async (countId) => {
    try { await CashAPI.approveCount(countId); load(); }
    catch (e) { alert(e?.message || 'Approve failed'); }
  };
  const onDisputeCount = async (countId) => {
    const reason = window.prompt('Dispute reason?');
    if (!reason) return;
    try { await CashAPI.disputeCount(countId, reason); load(); }
    catch (e) { alert(e?.message || 'Dispute failed'); }
  };
  const onCancelCount = async (countId) => {
    if (!window.confirm('Cancel this Pending count?')) return;
    try { await CashAPI.cancelCount(countId); load(); }
    catch (e) { alert(e?.message || 'Cancel failed'); }
  };

  if (loading) return <div className="p-6 text-sm text-ink-500">Loading…</div>;
  if (error)   return <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>;
  if (!account) return <div className="p-6 text-sm text-ink-500">Account not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link to="/admin/finance/cash/accounts" className="text-sm text-navy-700 hover:underline">&larr; Cash accounts</Link>
          <h1 className="text-h1 text-ink-900 mt-1">{account.name}</h1>
          <p className="text-sm text-ink-500">
            {account.type} · {account.location || '—'} · Custodian {account.custodian?.fullName || '—'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-ink-500">Current balance</div>
          <div className="text-h1 text-ink-900">{fmt(account.currentBalance, account.currency)}</div>
          {account.type === 'PettyCash' && account.imprestLimit != null && (
            <div className="text-xs text-ink-500">Imprest {fmt(account.imprestLimit, account.currency)}</div>
          )}
        </div>
      </header>

      <section className="flex flex-wrap items-end gap-3 bg-white border border-ink-100 rounded-md p-3">
        <label className="text-sm">
          <span className="text-xs uppercase text-ink-500 block">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-ink-200 px-2 py-1 text-sm" />
        </label>
        <label className="text-sm">
          <span className="text-xs uppercase text-ink-500 block">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-ink-200 px-2 py-1 text-sm" />
        </label>
        <button onClick={load} className="px-3 py-1.5 text-sm border border-ink-200 rounded-md hover:bg-ink-50">Apply</button>
        <a
          href={CashAPI.cashBookReportUrl(id, 'html', { from, to })}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 text-sm border border-ink-200 rounded-md hover:bg-ink-50"
        >Print preview</a>
        <a
          href={CashAPI.cashBookReportUrl(id, 'csv', { from, to })}
          className="px-3 py-1.5 text-sm border border-ink-200 rounded-md hover:bg-ink-50"
        >Download CSV</a>
        <a
          href={CashAPI.cashBookReportUrl(id, 'pdf', { from, to })}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800"
          title="Audit-friendly cash book PDF for the selected period"
        >Download PDF</a>
        <div className="ml-auto flex gap-2">
          {canRecord && (
            <>
              <button onClick={() => setShowRecord(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition">Record receipt / payment</button>
              <button onClick={() => setShowBulk(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800" title="Paste a CSV of donor / fundraiser receipts to post in one shot">Bulk import</button>
              <button onClick={() => setShowTransfer(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">Transfer</button>
            </>
          )}
          {canRunCount && (
            <button onClick={() => { setActiveCount(null); setShowCount(true); }}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">
              Run cash count
            </button>
          )}
          {account.type === 'PettyCash' && canRequestReplen && (
            <button onClick={() => setShowReplen(true)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700">
              Request replenishment
            </button>
          )}
        </div>
      </section>

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Voucher</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Particulars</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Receipt</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Payment</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Balance</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            <tr className="bg-ink-50">
              <td className="px-3 py-2 text-sm text-ink-700" colSpan={6}><em>Opening balance for period</em></td>
              <td className="px-3 py-2 text-sm text-right font-medium">{fmt(opening, account.currency)}</td>
              <td colSpan={2}></td>
            </tr>
            {display.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-sm text-ink-500">No transactions in window.</td></tr>
            )}
            {display.map(r => (
              <tr key={r.id} className={r.status === 'Reversed' ? 'opacity-60 line-through' : ''}>
                <td className="px-3 py-2 text-sm text-ink-700">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-sm font-mono text-ink-700">{r.voucherNo || '—'}</td>
                <td className="px-3 py-2 text-sm">{r.transactionType}</td>
                <td className="px-3 py-2 text-sm">
                  <div className="text-ink-900">{r.particulars || '—'}</div>
                  {r.reference && (
                    <div className="text-xs text-ink-500">{r.reference.type}{r.reference.id ? ` #${r.reference.id}` : ''}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-right text-green-700">{r.receipt != null ? fmt(r.receipt, account.currency) : ''}</td>
                <td className="px-3 py-2 text-sm text-right text-red-700">{r.payment != null ? fmt(r.payment, account.currency) : ''}</td>
                <td className="px-3 py-2 text-sm text-right">{r.runningBalance != null ? fmt(r.runningBalance, account.currency) : '—'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[r.status] || 'bg-ink-100 text-ink-700'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-right space-x-2 whitespace-nowrap">
                  {r.status === 'Posted' && (
                    <button
                      onClick={() => openVoucher(r.id)}
                      className="text-navy-700 hover:underline"
                      title="Download printable voucher PDF"
                    >
                      Voucher
                    </button>
                  )}
                  {r.status === 'Pending-Approval' && canApprove && r.performer?.id !== user?.id && (
                    <>
                      <button onClick={() => onApprove(r.id)} className="text-green-700 hover:underline">Approve</button>
                      <button onClick={() => onReject(r.id)}  className="text-red-700 hover:underline">Reject</button>
                    </>
                  )}
                  {r.status === 'Posted' && canApprove && (
                    <button onClick={() => onReverse(r.id)} className="text-yellow-700 hover:underline">Reverse</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-ink-50">
              <td colSpan={4} className="px-3 py-2 text-sm text-right text-ink-600">Period totals</td>
              <td className="px-3 py-2 text-sm text-right text-green-700">{fmt(totals.receipts, account.currency)}</td>
              <td className="px-3 py-2 text-sm text-right text-red-700">{fmt(totals.payments, account.currency)}</td>
              <td className="px-3 py-2 text-sm text-right">{fmt(closing, account.currency)}</td>
              <td colSpan={2}></td>
            </tr>
            <tr className="bg-ink-100 font-semibold">
              <td colSpan={6} className="px-3 py-2 text-sm text-right">Closing balance</td>
              <td className="px-3 py-2 text-sm text-right">{fmt(closing, account.currency)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <section className="bg-white border border-ink-100 rounded-md">
        <div className="px-4 py-3 border-b border-ink-100 font-semibold text-sm">Cash counts</div>
        <div className="p-4 text-sm space-y-2">
          {counts.length === 0 && <div className="text-ink-500">No counts yet.</div>}
          {counts.map(c => (
            <div key={c.id} className="border border-ink-100 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    c.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                    c.status === 'Disputed' ? 'bg-red-100 text-red-700' :
                    'bg-ink-100 text-ink-700'
                  }`}>{c.status}</span>
                  <span className="ml-2 text-ink-700">
                    Expected {fmt(c.expectedBalance, account.currency)}
                    {c.countedBalance != null && <> · Counted {fmt(c.countedBalance, account.currency)}</>}
                    {c.variance != null && <>
                      {' · '}
                      <span className={Number(c.variance) === 0 ? 'text-ink-700' : Number(c.variance) > 0 ? 'text-green-700' : 'text-red-700'}>
                        Variance {Number(c.variance) > 0 ? '+' : ''}{Number(c.variance).toLocaleString()}
                      </span>
                    </>}
                  </span>
                  <span className="ml-2 text-ink-500 text-xs">{new Date(c.occurredAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  {c.status === 'Pending' && (
                    <>
                      <button onClick={() => { setActiveCount(c); setShowCount(true); }} className="text-sm text-navy-700 hover:underline">Submit</button>
                      <button onClick={() => onCancelCount(c.id)} className="text-sm text-ink-500 hover:underline">Cancel</button>
                    </>
                  )}
                  {c.status === 'Submitted' && canApproveCount && c.countedBy !== user?.id && (
                    <>
                      <button onClick={() => onApproveCount(c.id)} className="text-sm text-green-700 hover:underline">Approve</button>
                      <button onClick={() => onDisputeCount(c.id)} className="text-sm text-red-700 hover:underline">Dispute</button>
                    </>
                  )}
                </div>
              </div>
              {c.disputeReason && <div className="text-xs text-red-700 mt-1">Disputed: {c.disputeReason}</div>}
              {c.adjustmentTx && (
                <div className="text-xs text-ink-500 mt-1">Posted adjustment {c.adjustmentTx.voucherNo} · balance now {fmt(c.adjustmentTx.balanceAfter, account.currency)}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {showRecord && (
        <RecordCashTxModal
          account={account}
          onClose={() => setShowRecord(false)}
          onSaved={() => { setShowRecord(false); load(); }}
        />
      )}
      {showBulk && (
        <BulkReceiptsModal
          accountId={account.id}
          accountName={account.name}
          currency={account.currency}
          onClose={() => setShowBulk(false)}
          onSuccess={({ count, total }) => {
            setShowBulk(false);
            alert(`✅ Posted ${count} receipt${count !== 1 ? 's' : ''} — total ${account.currency} ${Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
            load();
          }}
        />
      )}
      {showTransfer && (
        <TransferCashModal
          fromAccount={account}
          onClose={() => setShowTransfer(false)}
          onSaved={() => { setShowTransfer(false); load(); }}
        />
      )}

      {showCount && (
        <CashCountModal
          account={account}
          existingCount={activeCount}
          onClose={() => { setShowCount(false); setActiveCount(null); }}
          onSaved={() => { setShowCount(false); setActiveCount(null); load(); }}
        />
      )}

      {showReplen && account.type === 'PettyCash' && (
        <RequestReplenishmentModal
          pettyAccount={account}
          onClose={() => setShowReplen(false)}
          onSaved={() => { setShowReplen(false); load(); }}
        />
      )}

      {account.type === 'PettyCash' && replenishments.length > 0 && (
        <section className="bg-white border border-ink-100 rounded-md">
          <div className="px-4 py-3 border-b border-ink-100 font-semibold text-sm">Replenishments</div>
          <div className="p-4 text-sm space-y-2">
            {replenishments.map(r => (
              <div key={r.id} className="border border-ink-100 rounded-md p-3 flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'Disbursed' ? 'bg-green-100 text-green-700' :
                    r.status === 'Approved'  ? 'bg-blue-100 text-blue-700' :
                    r.status === 'Requested' ? 'bg-yellow-100 text-yellow-800' :
                    r.status === 'Rejected'  ? 'bg-red-100 text-red-700' :
                    'bg-ink-100 text-ink-700'
                  }`}>{r.status}</span>
                  <span className="ml-2 text-ink-700">
                    {fmt(r.approvedAmount ?? r.requestedAmount, r.currency)}
                    {r.sourceAccount && <> · from {r.sourceAccount.name}</>}
                  </span>
                  <span className="ml-2 text-xs text-ink-500">{new Date(r.requestedAt).toLocaleDateString()}</span>
                </div>
                {r.disbursementTx && (
                  <span className="text-xs text-ink-500">{r.disbursementTx.voucherNo}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
