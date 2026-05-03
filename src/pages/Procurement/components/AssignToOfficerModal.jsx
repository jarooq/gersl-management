import React, { useEffect, useState } from 'react';
import { ProcurementAPI } from '../../../services/api';

const METHODS = [
  { value: '', label: 'Decide later' },
  { value: 'Direct', label: 'Direct purchase (low value)' },
  { value: 'RFQ-3', label: 'RFQ — 3 quotations' },
  { value: 'Sealed-Tender', label: 'Sealed tender' },
  { value: 'Framework', label: 'Framework agreement' }
];

export default function AssignToOfficerModal({ requisition, onClose, onAssigned }) {
  const [officers, setOfficers] = useState([]);
  const [officerId, setOfficerId] = useState('');
  const [method, setMethod] = useState(requisition?.procurementMethod || '');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ProcurementAPI.listProcurementOfficers();
        if (cancelled) return;
        const list = res?.data?.officers || res?.officers || [];
        setOfficers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load officers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!officerId) {
      setError('Please pick an officer');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await ProcurementAPI.assignRequisition(requisition.id, {
        officerId: Number(officerId),
        ...(method ? { procurementMethod: method } : {})
      });
      onAssigned?.();
    } catch (e) {
      setError(e?.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-900">Assign procurement request</h2>
          <p className="text-xs text-ink-500 mt-1">
            {requisition.requisitionNumber || `PR-${requisition.id}`} — {requisition.title}
          </p>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Procurement Officer</span>
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">{loading ? 'Loading…' : 'Select officer'}</option>
              {officers.map(o => (
                <option key={o.id} value={o.id}>
                  {o.fullName} — {o.role}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Procurement method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-md hover:bg-ink-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition disabled:opacity-50"
            >
              {submitting ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
