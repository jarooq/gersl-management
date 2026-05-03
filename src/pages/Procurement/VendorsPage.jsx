import React, { useEffect, useMemo, useState } from 'react';
import { ProcurementAPI } from '../../services/api';
import VendorFormModal from './components/VendorFormModal';

const STATUS_BADGE = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-ink-100 text-ink-700',
  Blacklisted: 'bg-red-100 text-red-700',
  Suspended: 'bg-yellow-100 text-yellow-800',
  PendingDocs: 'bg-blue-100 text-blue-700'
};

const DD_BADGE = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Cleared: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700'
};

export default function VendorsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (q) params.q = q;
      if (status) params.status = status;
      const res = await ProcurementAPI.listVendorMaster(params);
      setRows(res?.data?.vendors || []);
    } catch (e) {
      setError(e?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onSearch = (e) => { e.preventDefault(); load(); };

  const onBlacklist = async (v) => {
    const reason = window.prompt(`Blacklist ${v.vendorName}? Reason:`);
    if (!reason) return;
    try { await ProcurementAPI.blacklistVendor(v.id, reason); load(); }
    catch (e) { alert(e?.message || 'Failed'); }
  };
  const onUnblacklist = async (v) => {
    if (!window.confirm(`Re-activate ${v.vendorName}?`)) return;
    try { await ProcurementAPI.unblacklistVendor(v.id); load(); }
    catch (e) { alert(e?.message || 'Failed'); }
  };
  const onDueDiligence = async (v, decision) => {
    const notes = window.prompt(`Due diligence — ${decision}. Notes:`) || '';
    try { await ProcurementAPI.setVendorDueDiligence(v.id, { status: decision, notes }); load(); }
    catch (e) { alert(e?.message || 'Failed'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Procurement · Vendors</p>
            <h1 className="text-h2 font-bold leading-tight">Vendor Master</h1>
            <p className="text-ink-200 text-sm mt-0.5">Approved vendor list, due diligence, and blacklist control.</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition"
          >Add Vendor</button>
        </div>
      </div>

      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / code / email"
          className="rounded-md border border-ink-200 px-3 py-2 text-sm w-72"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-ink-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Suspended</option>
          <option>Blacklisted</option>
          <option>PendingDocs</option>
        </select>
        <button className="px-4 py-2 text-sm font-medium text-ink-700 border border-ink-200 rounded-md hover:bg-ink-50">Search</button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-3">{error}</div>}

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Vendor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Categories</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Due diligence</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && <tr><td colSpan={6} className="p-4 text-center text-sm text-ink-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-ink-500">No vendors yet.</td></tr>
            )}
            {!loading && rows.map(v => (
              <tr key={v.id}>
                <td className="px-4 py-2 text-sm font-mono text-ink-700">{v.vendorCode || '—'}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="font-medium text-ink-900">{v.vendorName}</div>
                  <div className="text-xs text-ink-500">{v.email || ''}{v.phone ? ` · ${v.phone}` : ''}</div>
                </td>
                <td className="px-4 py-2 text-xs text-ink-600">{(v.categories || []).join(', ') || '—'}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[v.status] || 'bg-ink-100 text-ink-700'}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${DD_BADGE[v.dueDiligenceStatus] || 'bg-ink-100 text-ink-700'}`}>
                    {v.dueDiligenceStatus}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm space-x-2">
                  <button onClick={() => { setEditing(v); setShowForm(true); }} className="text-navy-700 hover:underline">Edit</button>
                  {v.dueDiligenceStatus !== 'Cleared' && (
                    <button onClick={() => onDueDiligence(v, 'Cleared')} className="text-green-700 hover:underline">Clear DD</button>
                  )}
                  {v.dueDiligenceStatus !== 'Failed' && (
                    <button onClick={() => onDueDiligence(v, 'Failed')} className="text-yellow-700 hover:underline">Fail DD</button>
                  )}
                  {v.status === 'Blacklisted'
                    ? <button onClick={() => onUnblacklist(v)} className="text-emerald-700 hover:underline">Un-blacklist</button>
                    : <button onClick={() => onBlacklist(v)}   className="text-red-700 hover:underline">Blacklist</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <VendorFormModal
          vendor={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
