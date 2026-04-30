import React, { useEffect, useMemo, useState } from 'react';
import { CashAPI } from '../../../services/api';

export default function RequestReplenishmentModal({ pettyAccount, onClose, onSaved }) {
  const expectedRequest = useMemo(
    () => Math.max(0, Number(pettyAccount.imprestLimit || 0) - Number(pettyAccount.currentBalance || 0)),
    [pettyAccount]
  );

  const [sources, setSources] = useState([]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await CashAPI.listAccounts({ isActive: true });
        if (cancelled) return;
        const list = (res?.data?.accounts || [])
          .filter(a => a.id !== pettyAccount.id
                    && ['CashBook', 'Locker'].includes(a.type)
                    && a.currency === pettyAccount.currency);
        setSources(list);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [pettyAccount.id, pettyAccount.currency]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (expectedRequest <= 0) {
      setError('Petty cash is at or above imprest limit — nothing to replenish');
      return;
    }
    setSubmitting(true);
    try {
      await CashAPI.requestReplenishment({
        pettyCashAccountId: pettyAccount.id,
        sourceAccountId: sourceAccountId ? Number(sourceAccountId) : null,
        notes: notes || null
      });
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Request replenishment</h2>
          <p className="text-xs text-gray-500 mt-1">
            {pettyAccount.name} · current {pettyAccount.currency} {Number(pettyAccount.currentBalance).toLocaleString()}
            {' / imprest '}{pettyAccount.currency} {Number(pettyAccount.imprestLimit || 0).toLocaleString()}
          </p>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3 text-sm">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-xs uppercase text-gray-500">Top-up amount</div>
            <div className="text-xl font-semibold text-gray-900">
              {pettyAccount.currency} {expectedRequest.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">imprestLimit − currentBalance</div>
          </div>

          <label className="block">
            <span className="font-medium text-gray-700">Source account (optional — set later if blank)</span>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Decide on approval</option>
              {sources.map(s => (
                <option key={s.id} value={s.id}>{s.type} — {s.name} ({s.currency} {Number(s.currentBalance).toLocaleString()})</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="font-medium text-gray-700">Notes</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2">{error}</div>}
        </form>
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
