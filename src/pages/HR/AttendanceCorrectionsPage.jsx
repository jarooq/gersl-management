import React, { useEffect, useMemo, useState } from 'react';
import { AttendanceCorrectionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_BADGE = {
  Pending:   'bg-yellow-100 text-yellow-800',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-200 text-gray-600'
};

const HR_ROLES = new Set(['Admin', 'CEO', 'HR Manager', 'HR Officer']);
const PATCHABLE = ['checkInTime', 'checkOutTime', 'status', 'leaveType', 'location', 'notes'];

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthAgoISO = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); };

export default function AttendanceCorrectionsPage() {
  const { user } = useAuth();
  const isHR = useMemo(() => HR_ROLES.has(user?.role), [user]);

  const [tab, setTab] = useState(isHR ? 'pending' : 'mine');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Report range pickers
  const [from, setFrom] = useState(monthAgoISO());
  const [to, setTo] = useState(todayISO());

  // Request-correction form
  const [form, setForm] = useState({
    attendanceId: '',
    staffId: '',
    attendanceDate: todayISO(),
    field: 'checkInTime',
    newValue: '',
    reason: ''
  });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AttendanceCorrectionAPI.list({ scope: tab });
      setRows(res?.data?.corrections || []);
    } catch (e) {
      setError(e?.message || 'Failed to load corrections');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const action = async (fn) => {
    setBusy(true);
    try { await fn(); await load(); }
    catch (e) { alert(e?.message || 'Action failed'); }
    finally { setBusy(false); }
  };

  const onSubmitRequest = async (e) => {
    e.preventDefault();
    if (!form.staffId || !form.attendanceDate || !form.field || !form.reason) {
      alert('Staff, date, field, reason are required'); return;
    }
    setBusy(true);
    try {
      await AttendanceCorrectionAPI.request({
        ...form,
        attendanceId: form.attendanceId ? Number(form.attendanceId) : null,
        staffId: Number(form.staffId)
      });
      setShowForm(false);
      setForm({
        attendanceId: '', staffId: '', attendanceDate: todayISO(),
        field: 'checkInTime', newValue: '', reason: ''
      });
      load();
    } catch (e) {
      alert(e?.message || 'Failed to submit request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance corrections</h1>
          <p className="text-sm text-gray-500">Request a fix to a punch; HR Manager approves with audit trail.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >{showForm ? 'Hide form' : 'Request correction'}</button>
      </header>

      {showForm && (
        <form onSubmit={onSubmitRequest} className="bg-white border border-gray-200 rounded-md p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <label className="block">
            <span className="text-xs uppercase text-gray-500">Staff ID</span>
            <input
              type="number"
              value={form.staffId}
              onChange={(e) => setForm({ ...form, staffId: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-gray-500">Attendance row ID (blank for missing-day)</span>
            <input
              type="number"
              value={form.attendanceId}
              onChange={(e) => setForm({ ...form, attendanceId: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-gray-500">Date</span>
            <input
              type="date"
              value={form.attendanceDate}
              onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-gray-500">Field</span>
            <select
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
            >
              {PATCHABLE.map(f => <option key={f}>{f}</option>)}
              <option value="newRecord">newRecord (create missing day)</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs uppercase text-gray-500">New value{form.field === 'newRecord' && ' (JSON: {status, checkInTime, ...})'}</span>
            <input
              value={form.newValue}
              onChange={(e) => setForm({ ...form, newValue: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="block sm:col-span-3">
            <span className="text-xs uppercase text-gray-500">Reason</span>
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
              required
            />
          </label>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md">Cancel</button>
            <button type="submit" disabled={busy} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      )}

      <section className="bg-white border border-gray-200 rounded-md p-4 flex flex-wrap items-end gap-3 text-sm">
        <div className="font-medium text-gray-700">Register reports</div>
        <label>
          <span className="text-xs uppercase text-gray-500 block">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1" />
        </label>
        <label>
          <span className="text-xs uppercase text-gray-500 block">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1" />
        </label>
        <a
          href={AttendanceCorrectionAPI.attendanceRegisterUrl({ from, to })}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >Download attendance CSV</a>
        <a
          href={AttendanceCorrectionAPI.movementRegisterUrl({ from, to })}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >Download movement CSV</a>
      </section>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'mine' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >My requests</button>
        {isHR && (
          <>
            <button
              onClick={() => setTab('pending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >Pending</button>
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >All</button>
          </>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Old → New</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="p-4 text-center text-sm text-gray-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-gray-500">No corrections.</td></tr>
            )}
            {rows.map(c => (
              <tr key={c.id}>
                <td className="px-3 py-2 text-sm text-gray-700">{c.attendanceDate}</td>
                <td className="px-3 py-2 text-sm">
                  <div className="text-gray-900">Staff #{c.staffId}</div>
                  <div className="text-xs text-gray-500">by {c.requester?.fullName || '—'}</div>
                </td>
                <td className="px-3 py-2 text-sm">{c.field}</td>
                <td className="px-3 py-2 text-sm">
                  <span className="text-gray-500">{c.oldValue || '—'}</span>
                  <span className="mx-1 text-gray-400">→</span>
                  <span className="text-gray-900">{c.newValue || '—'}</span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">{c.reason}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                  {c.rejectionReason && <div className="text-xs text-red-700 mt-1">{c.rejectionReason}</div>}
                </td>
                <td className="px-3 py-2 text-sm space-x-2 whitespace-nowrap">
                  {c.status === 'Pending' && isHR && c.requestedBy !== user?.id && (
                    <>
                      <button disabled={busy} onClick={() => action(() => AttendanceCorrectionAPI.approve(c.id))} className="text-green-700 hover:underline">Approve</button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          const r = window.prompt('Rejection reason?');
                          if (!r) return;
                          action(() => AttendanceCorrectionAPI.reject(c.id, r));
                        }}
                        className="text-red-700 hover:underline"
                      >Reject</button>
                    </>
                  )}
                  {c.status === 'Pending' && c.requestedBy === user?.id && (
                    <button disabled={busy} onClick={() => action(() => AttendanceCorrectionAPI.cancel(c.id))} className="text-gray-500 hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
