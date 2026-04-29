import React, { useEffect, useMemo, useState } from 'react';
import { ProcurementAPI } from '../../services/api';
import VendorFormModal from './components/VendorFormModal';

const STATUS_BADGE = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-700',
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
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vendor master</h1>
          <p className="text-sm text-gray-500">Approved vendor list, due diligence, and blacklist control.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >Add vendor</button>
      </header>

      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / code / email"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm w-72"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Suspended</option>
          <option>Blacklisted</option>
          <option>PendingDocs</option>
        </select>
        <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Search</button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-3">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categories</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due diligence</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading && <tr><td colSpan={6} className="p-4 text-center text-sm text-gray-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-gray-500">No vendors yet.</td></tr>
            )}
            {!loading && rows.map(v => (
              <tr key={v.id}>
                <td className="px-4 py-2 text-sm font-mono text-gray-700">{v.vendorCode || '—'}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="font-medium text-gray-900">{v.vendorName}</div>
                  <div className="text-xs text-gray-500">{v.email || ''}{v.phone ? ` · ${v.phone}` : ''}</div>
                </td>
                <td className="px-4 py-2 text-xs text-gray-600">{(v.categories || []).join(', ') || '—'}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[v.status] || 'bg-gray-100 text-gray-700'}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${DD_BADGE[v.dueDiligenceStatus] || 'bg-gray-100 text-gray-700'}`}>
                    {v.dueDiligenceStatus}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm space-x-2">
                  <button onClick={() => { setEditing(v); setShowForm(true); }} className="text-blue-600 hover:underline">Edit</button>
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
