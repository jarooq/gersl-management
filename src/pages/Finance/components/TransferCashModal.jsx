import React, { useEffect, useState } from 'react';
import { CashAPI } from '../../../services/api';

export default function TransferCashModal({ fromAccount, onClose, onSaved }) {
  const [accounts, setAccounts] = useState([]);
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await CashAPI.listAccounts({ isActive: true });
        if (cancelled) return;
        const list = (res?.data?.accounts || []).filter(a =>
          a.id !== fromAccount.id && a.currency === fromAccount.currency
        );
        setAccounts(list);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [fromAccount.id, fromAccount.currency]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!toAccountId) { setError('Pick a destination account'); return; }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError('Amount must be > 0'); return; }
    setSubmitting(true);
    try {
      await CashAPI.transferCash({
        fromAccountId: fromAccount.id,
        toAccountId: Number(toAccountId),
        amount: amt,
        description: description || null,
        occurredAt: new Date(occurredAt).toISOString()
      });
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-lg">
        <div className="px-5 py-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-900">Transfer cash</h2>
          <p className="text-xs text-ink-500 mt-1">From {fromAccount.name} ({fromAccount.currency} {Number(fromAccount.currentBalance).toLocaleString()})</p>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3 text-sm">
          <label className="block">
            <span className="font-medium text-ink-700">To account</span>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
              required
            >
              <option value="">Select destination</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.type} — {a.name} ({a.currency} {Number(a.currentBalance).toLocaleString()})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-medium text-ink-700">Amount ({fromAccount.currency})</span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="font-medium text-ink-700">Description</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium text-ink-700">Date occurred</span>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
            />
          </label>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2">{error}</div>}
        </form>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-md hover:bg-ink-50">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50">
            {submitting ? 'Transferring…' : 'Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
}
