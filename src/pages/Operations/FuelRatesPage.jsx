import React, { useEffect, useState } from 'react';
import { MovementAPI } from '../../services/api';

const TYPES = ['Bike', 'Car', 'Van', 'PublicTransport'];
const empty = {
  vehicleType: 'Bike',
  ratePerKm: '',
  currency: 'LKR',
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: '',
  notes: ''
};

export default function FuelRatesPage() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await MovementAPI.listFuelRates();
      setRows(res?.data?.rates || []);
    } catch (e) {
      setError(e?.message || 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...draft,
      ratePerKm: Number(draft.ratePerKm),
      effectiveTo: draft.effectiveTo || null
    };
    try {
      if (editingId) await MovementAPI.updateFuelRate(editingId, payload);
      else           await MovementAPI.createFuelRate(payload);
      setDraft(empty);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err?.message || 'Save failed');
    }
  };

  const onEdit = (r) => {
    setEditingId(r.id);
    setDraft({
      vehicleType: r.vehicleType,
      ratePerKm: Number(r.ratePerKm),
      currency: r.currency,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo || '',
      notes: r.notes || ''
    });
  };
  const onDelete = async (id) => {
    if (!window.confirm('Delete this rate?')) return;
    try { await MovementAPI.deleteFuelRate(id); load(); }
    catch (e) { alert(e?.message || 'Failed'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Operations</p>
            <h1 className="text-h2 font-bold leading-tight">Fuel Rates</h1>
            <p className="text-ink-200 text-sm mt-0.5">Per-km reimbursement rates by vehicle type, effective-dated.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white border border-ink-100 rounded-md p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Vehicle type</span>
          <select
            value={draft.vehicleType}
            onChange={(e) => setDraft({ ...draft, vehicleType: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          >
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Rate per km</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={draft.ratePerKm}
            onChange={(e) => setDraft({ ...draft, ratePerKm: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Currency</span>
          <input
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase().slice(0, 8) })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Effective from</span>
          <input
            type="date"
            value={draft.effectiveFrom}
            onChange={(e) => setDraft({ ...draft, effectiveFrom: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Effective to (blank = open)</span>
          <input
            type="date"
            value={draft.effectiveTo}
            onChange={(e) => setDraft({ ...draft, effectiveTo: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        <label className="block sm:col-span-3">
          <span className="text-xs uppercase text-ink-500">Notes</span>
          <input
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        {error && <div className="sm:col-span-3 bg-red-50 border border-red-200 text-red-700 rounded-md p-2">{error}</div>}
        <div className="sm:col-span-3 flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setDraft(empty); }} className="px-3 py-1.5 text-sm border border-ink-200 rounded-md">Cancel</button>
          )}
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition">
            {editingId ? 'Save rate' : 'Add rate'}
          </button>
        </div>
      </form>

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Vehicle</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Rate</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Currency</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">From</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">To</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && <tr><td colSpan={6} className="p-4 text-center text-sm text-ink-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-sm text-ink-500">No rates configured.</td></tr>}
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-sm">{r.vehicleType}</td>
                <td className="px-3 py-2 text-sm text-right font-mono">{Number(r.ratePerKm).toFixed(4)}</td>
                <td className="px-3 py-2 text-sm">{r.currency}</td>
                <td className="px-3 py-2 text-sm">{r.effectiveFrom}</td>
                <td className="px-3 py-2 text-sm">{r.effectiveTo || '—'}</td>
                <td className="px-3 py-2 text-sm text-right space-x-2">
                  <button onClick={() => onEdit(r)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => onDelete(r.id)} className="text-red-700 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
