import React, { useEffect, useState } from 'react';
import { ProcurementAPI } from '../../services/api';

const METHODS = ['', 'Direct', 'RFQ-3', 'Sealed-Tender', 'Framework'];

const emptyDraft = {
  scopeType: 'global',
  scopeId: '',
  minAmount: 0,
  maxAmount: '',
  currency: 'LKR',
  requiredMethod: 'Direct',
  approverRole: 'Procurement Officer',
  requiresCommittee: false,
  effectiveFrom: '',
  effectiveTo: '',
  notes: ''
};

export default function ProcurementThresholdsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ProcurementAPI.listThresholds();
      setRows(res?.data?.thresholds || []);
    } catch (e) {
      setError(e?.message || 'Failed to load thresholds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({
      ...emptyDraft,
      ...row,
      scopeId: row.scopeId ?? '',
      minAmount: Number(row.minAmount),
      maxAmount: row.maxAmount ?? '',
      effectiveFrom: row.effectiveFrom || '',
      effectiveTo: row.effectiveTo || ''
    });
  };
  const cancelEdit = () => { setEditingId(null); setDraft(emptyDraft); };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...draft,
      scopeId: draft.scopeId === '' ? null : Number(draft.scopeId),
      minAmount: Number(draft.minAmount),
      maxAmount: draft.maxAmount === '' ? null : Number(draft.maxAmount),
      effectiveFrom: draft.effectiveFrom || null,
      effectiveTo:   draft.effectiveTo   || null
    };
    try {
      if (editingId) await ProcurementAPI.updateThreshold(editingId, payload);
      else           await ProcurementAPI.createThreshold(payload);
      cancelEdit();
      load();
    } catch (err) {
      setError(err?.message || 'Save failed');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this threshold?')) return;
    try { await ProcurementAPI.deleteThreshold(id); load(); }
    catch (e) { alert(e?.message || 'Failed'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Procurement</p>
            <h1 className="text-h2 font-bold leading-tight">Procurement Thresholds</h1>
            <p className="text-ink-200 text-sm mt-0.5">Approval matrix by amount band, scoped to global / donor / project.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white border border-ink-100 rounded-md p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Scope</span>
          <select
            value={draft.scopeType}
            onChange={(e) => setDraft({ ...draft, scopeType: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          >
            <option value="global">Global</option>
            <option value="donor">Donor</option>
            <option value="project">Project</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Scope ID</span>
          <input
            type="number"
            value={draft.scopeId}
            onChange={(e) => setDraft({ ...draft, scopeId: e.target.value })}
            disabled={draft.scopeType === 'global'}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Currency</span>
          <input
            type="text"
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Min amount</span>
          <input
            type="number"
            min={0}
            value={draft.minAmount}
            onChange={(e) => setDraft({ ...draft, minAmount: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Max amount (blank = unlimited)</span>
          <input
            type="number"
            value={draft.maxAmount}
            onChange={(e) => setDraft({ ...draft, maxAmount: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Required method</span>
          <select
            value={draft.requiredMethod || ''}
            onChange={(e) => setDraft({ ...draft, requiredMethod: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          >
            {METHODS.map(m => <option key={m} value={m}>{m || '—'}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Approver role</span>
          <input
            type="text"
            value={draft.approverRole || ''}
            onChange={(e) => setDraft({ ...draft, approverRole: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-ink-500">Requires committee</span>
          <input
            type="checkbox"
            checked={!!draft.requiresCommittee}
            onChange={(e) => setDraft({ ...draft, requiresCommittee: e.target.checked })}
            className="mt-2 ml-1"
          />
        </label>
        <label className="block sm:col-span-3">
          <span className="text-xs uppercase text-ink-500">Notes</span>
          <input
            type="text"
            value={draft.notes || ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1"
          />
        </label>
        {error && <div className="sm:col-span-3 bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-xs">{error}</div>}
        <div className="sm:col-span-3 flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={cancelEdit} className="px-3 py-1.5 text-sm border border-ink-200 rounded-md">Cancel</button>
          )}
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition">
            {editingId ? 'Save threshold' : 'Add threshold'}
          </button>
        </div>
      </form>

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Scope</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Range</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Method</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Approver</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Committee</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && <tr><td colSpan={6} className="p-4 text-center text-sm text-ink-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-sm text-ink-500">No thresholds defined.</td></tr>
            )}
            {rows.map(t => (
              <tr key={t.id}>
                <td className="px-3 py-2 text-sm text-ink-900">
                  {t.scopeType}{t.scopeId ? ` #${t.scopeId}` : ''}
                </td>
                <td className="px-3 py-2 text-sm text-ink-700">
                  {t.currency} {Number(t.minAmount).toLocaleString()} – {t.maxAmount ? Number(t.maxAmount).toLocaleString() : '∞'}
                </td>
                <td className="px-3 py-2 text-sm">{t.requiredMethod || '—'}</td>
                <td className="px-3 py-2 text-sm">{t.approverRole || '—'}</td>
                <td className="px-3 py-2 text-sm">{t.requiresCommittee ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-sm text-right space-x-2">
                  <button onClick={() => startEdit(t)} className="text-navy-700 hover:underline">Edit</button>
                  <button onClick={() => onDelete(t.id)} className="text-red-700 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
