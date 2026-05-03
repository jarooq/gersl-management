import React, { useEffect, useMemo, useState } from 'react';
import { ShiftAPI } from '../../services/hrAdminApi';

const STATUS_BADGE = {
  Scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
  Completed: 'bg-green-50 text-green-700 border border-green-200',
  Missed:    'bg-red-50 text-red-700 border border-red-200',
  Cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const today = () => new Date();
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export default function ShiftRosterPage() {
  const [from, setFrom] = useState(ymd(today()));
  const [to, setTo] = useState(ymd(addDays(today(), 14)));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    userId: '', date: ymd(today()), startTime: '09:00', endTime: '17:00',
    breakMinutes: 60, location: '', notes: '',
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRows(await ShiftAPI.list({ from, to })); setError(null); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [from, to]); // eslint-disable-line

  const byDate = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date).push(r);
    }
    return map;
  }, [rows]);

  const dates = useMemo(() => {
    const out = [];
    let d = new Date(from);
    const end = new Date(to);
    while (d <= end) { out.push(ymd(d)); d = addDays(d, 1); }
    return out;
  }, [from, to]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.date || !form.startTime || !form.endTime) {
      alert('User, date, start, end are required'); return;
    }
    setBusy(true);
    try {
      await ShiftAPI.create({
        userId: Number(form.userId), date: form.date,
        startTime: form.startTime, endTime: form.endTime,
        breakMinutes: Number(form.breakMinutes) || 0,
        location: form.location || undefined, notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm({ ...form, userId: '', notes: '' });
      await load();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this shift?')) return;
    try { await ShiftAPI.remove(id); await load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shift roster</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule recurring work blocks for staff.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {showForm ? 'Cancel' : '+ Schedule shift'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 flex gap-4 items-end flex-wrap">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">From</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">To</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
        </label>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="number" placeholder="User ID *" value={form.userId}
              onChange={e => setForm({ ...form, userId: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
            <input type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
            <input type="text" placeholder="Location" value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
            <input type="time" value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
            <input type="time" value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
            <input type="number" placeholder="Break (min)" value={form.breakMinutes}
              onChange={e => setForm({ ...form, breakMinutes: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
          </div>
          <textarea placeholder="Notes" value={form.notes} rows={2}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm" />
          <button type="submit" disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">
            {busy ? 'Saving…' : 'Save shift'}
          </button>
        </form>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-100">
          {dates.map(d => {
            const list = byDate.get(d) || [];
            return (
              <div key={d} className="px-4 py-3 grid grid-cols-12 gap-2">
                <div className="col-span-2 text-sm font-medium text-gray-700">
                  {new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div className="col-span-10">
                  {list.length === 0 ? (
                    <span className="text-sm text-gray-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {list.map(s => (
                        <div key={s.id} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm flex items-center gap-2">
                          <span className="font-medium text-gray-900">#{s.userId}</span>
                          <span className="text-gray-700">{s.startTime}–{s.endTime}</span>
                          {s.location && <span className="text-gray-500">· {s.location}</span>}
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[s.status] ?? ''}`}>{s.status}</span>
                          <button onClick={() => remove(s.id)} className="text-red-700 hover:underline text-xs font-medium">Delete</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
