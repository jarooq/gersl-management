import React, { useEffect, useMemo, useState } from 'react';
import { CashAPI } from '../../../services/api';
import API from '../../../services/api';

// Default LKR denominations; users edit qty per denom.
const DEFAULT_DENOMS = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];

const sumDenoms = (b) =>
  Object.entries(b || {}).reduce((acc, [d, q]) => acc + Number(d) * Number(q || 0), 0);

export default function CashCountModal({ account, existingCount = null, onClose, onSaved }) {
  const editing = !!existingCount;
  const [phase, setPhase] = useState(editing ? 'submit' : 'start'); // start | submit
  const [count, setCount] = useState(existingCount);
  const [users, setUsers] = useState([]);
  const [breakdown, setBreakdown] = useState(() => {
    const b = {};
    if (existingCount?.denominationBreakdown) {
      Object.assign(b, existingCount.denominationBreakdown);
    } else {
      DEFAULT_DENOMS.forEach(d => { b[d] = 0; });
    }
    return b;
  });
  const [witnessUserId, setWitnessUserId] = useState(existingCount?.witnessUserId || '');
  const [notes, setNotes] = useState(existingCount?.notes || '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (account.type !== 'Locker') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await API.Users.getAll().catch(() => ({ data: [] }));
        if (cancelled) return;
        const list = res?.data?.users || res?.data || [];
        setUsers(Array.isArray(list) ? list.filter(u => u.status === 'Active') : []);
      } catch { /* ignore — fall back to empty list */ }
    })();
    return () => { cancelled = true; };
  }, [account.type]);

  const counted = useMemo(() => sumDenoms(breakdown), [breakdown]);
  const expected = Number(count?.expectedBalance ?? account.currentBalance);
  const variance = useMemo(() => Number((counted - expected).toFixed(2)), [counted, expected]);

  const onStart = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await CashAPI.startCount({ cashAccountId: account.id });
      setCount(res?.data?.count);
      setPhase('submit');
    } catch (err) {
      setError(err?.message || 'Failed to start count');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (account.type === 'Locker' && !witnessUserId) {
      setError('Locker counts require a witness'); return;
    }
    setSubmitting(true);
    try {
      const cleaned = {};
      Object.entries(breakdown).forEach(([d, q]) => { if (Number(q)) cleaned[d] = Number(q); });
      await CashAPI.submitCount(count.id, {
        denominationBreakdown: cleaned,
        countedBalance: counted,
        witnessUserId: witnessUserId ? Number(witnessUserId) : null,
        notes: notes || null
      });
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const updateDenom = (denom, qty) => {
    setBreakdown(prev => ({ ...prev, [denom]: Math.max(0, Number(qty) || 0) }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-900">Cash count — {account.name}</h2>
          <p className="text-xs text-ink-500 mt-1">
            Expected (system): {account.currency} {Number(expected).toLocaleString()}
            {account.type === 'Locker' && <span className="ml-2 text-yellow-700">Witness required</span>}
          </p>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {phase === 'start' && (
            <div className="space-y-3 text-sm">
              <p className="text-ink-700">
                Start a count. The system will lock in the current balance ({account.currency} {Number(expected).toLocaleString()}) as the expected total.
                Then enter the physical denomination breakdown.
              </p>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2">{error}</div>}
            </div>
          )}

          {phase === 'submit' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="font-medium text-ink-700">Denomination</div>
                <div className="font-medium text-ink-700 text-right">Qty</div>
                <div className="font-medium text-ink-700 text-right">Subtotal</div>
                {DEFAULT_DENOMS.map(d => (
                  <React.Fragment key={d}>
                    <div className="text-ink-700 self-center">{account.currency} {d.toLocaleString()}</div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        value={breakdown[d] ?? 0}
                        onChange={(e) => updateDenom(d, e.target.value)}
                        className="w-full text-right rounded-md border border-ink-200 px-2 py-1"
                      />
                    </div>
                    <div className="text-right self-center">
                      {(d * Number(breakdown[d] || 0)).toLocaleString()}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="border-t border-ink-100 pt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-ink-500">Counted total</div>
                  <div className="text-xl font-semibold">{account.currency} {counted.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-ink-500">Variance</div>
                  <div className={`text-xl font-semibold ${variance === 0 ? 'text-ink-900' : variance > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                  </div>
                </div>
              </div>

              {account.type === 'Locker' && (
                <label className="block text-sm">
                  <span className="font-medium text-ink-700">Witness</span>
                  <select
                    value={witnessUserId}
                    onChange={(e) => setWitnessUserId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
                  >
                    <option value="">Select witness</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName} — {u.role}</option>)}
                  </select>
                </label>
              )}

              <label className="block text-sm">
                <span className="font-medium text-ink-700">Notes</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
                />
              </label>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-md hover:bg-ink-50">Close</button>
          {phase === 'start' && (
            <button
              onClick={onStart}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition disabled:opacity-50"
            >
              {submitting ? 'Starting…' : 'Start count'}
            </button>
          )}
          {phase === 'submit' && (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit count'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
