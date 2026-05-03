import React, { useEffect, useState } from 'react';
import { MovementAPI } from '../../../services/api';

export default function NewMovementModal({ onClose, onSaved }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    fromLocation: '',
    toLocation: '',
    purpose: '',
    vehicleId: '',
    plannedDepartureAt: new Date().toISOString().slice(0, 16),
    plannedReturnAt: '',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await MovementAPI.listVehicles({ mine: 'true', isActive: 'true' });
        if (!cancelled) setVehicles(res?.data?.vehicles || []);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.fromLocation.trim() || !form.toLocation.trim()) {
      setError('from + to are required'); return;
    }
    setSubmitting(true);
    try {
      await MovementAPI.createMovement({
        fromLocation: form.fromLocation.trim(),
        toLocation: form.toLocation.trim(),
        purpose: form.purpose || null,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
        plannedDepartureAt: form.plannedDepartureAt ? new Date(form.plannedDepartureAt).toISOString() : null,
        plannedReturnAt: form.plannedReturnAt ? new Date(form.plannedReturnAt).toISOString() : null,
        notes: form.notes || null
      });
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Failed to create movement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-lg">
        <div className="px-5 py-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-900">New movement</h2>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-medium text-ink-700">From *</span>
              <input
                value={form.fromLocation}
                onChange={(e) => update('fromLocation', e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
                required
              />
            </label>
            <label className="block">
              <span className="font-medium text-ink-700">To *</span>
              <input
                value={form.toLocation}
                onChange={(e) => update('toLocation', e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="font-medium text-ink-700">Purpose</span>
            <textarea
              rows={2}
              value={form.purpose}
              onChange={(e) => update('purpose', e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium text-ink-700">Vehicle</span>
            <select
              value={form.vehicleId}
              onChange={(e) => update('vehicleId', e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
            >
              <option value="">—</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.type}{v.plateNo ? ` · ${v.plateNo}` : ''}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-medium text-ink-700">Planned departure</span>
              <input
                type="datetime-local"
                value={form.plannedDepartureAt}
                onChange={(e) => update('plannedDepartureAt', e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-medium text-ink-700">Planned return</span>
              <input
                type="datetime-local"
                value={form.plannedReturnAt}
                onChange={(e) => update('plannedReturnAt', e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block">
            <span className="font-medium text-ink-700">Notes</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2"
            />
          </label>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2">{error}</div>}
        </form>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-md hover:bg-ink-50">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition disabled:opacity-50">
            {submitting ? 'Saving…' : 'Plan trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
