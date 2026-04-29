import React, { useState } from 'react';
import { CashAPI } from '../../../services/api';

export default function RecordCashTxModal({ account, onClose, onSaved }) {
  const [transactionType, setTransactionType] = useState('Payment');
  const [amount, setAmount] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError('Amount must be > 0'); return; }
    setSubmitting(true);
    try {
      await CashAPI.recordTransaction({
        cashAccountId: account.id,
        transactionType,
        amount: amt,
        payeeName: payeeName || null,
        description: description || null,
        receiptUrl: receiptUrl || null,
        occurredAt: new Date(occurredAt).toISOString()
      });
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const showReceiptHint = transactionType === 'Payment'
    && Number(amount) > Number(account.receiptRequiredOver || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Record cash transaction</h2>
          <p className="text-xs text-gray-500 mt-1">{account.name} · Balance {account.currency} {Number(account.currentBalance).toLocaleString()}</p>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Type</span>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option>Receipt</option>
                <option>Payment</option>
                <option>Adjustment</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Amount ({account.currency})</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Payee / Source</span>
            <input
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Description</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Receipt URL {showReceiptHint && <span className="text-yellow-700">(required for this amount)</span>}</span>
            <input
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="/uploads/..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Date occurred</span>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>}
        </form>
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Saving…' : 'Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
