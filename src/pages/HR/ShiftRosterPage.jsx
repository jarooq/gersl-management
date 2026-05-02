import React, { useEffect, useMemo, useState } from 'react';
import { ShiftAPI } from '../../services/hrAdminApi';

const STATUS_BADGE = {
  Scheduled: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Missed:    'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-600',
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
    userId: '',
    date: ymd(today()),
    startTime: '09:00',
    endTime:   '17:00',
    breakMinutes: 60,
    location: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await ShiftAPI.list({ from, to }));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  // Group by date for the calendar-style view.
  const byDate = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const k = r.date;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    return map;
  }, [rows]);

  const dates = useMemo(() => {
    const out = [];
    let d = new Date(from);
    const end = new Date(to);
    while (d <= end) {
      out.push(ymd(d));
      d = addDays(d, 1);
    }
    return out;
  }, [from, to]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.date || !form.startTime || !form.endTime) {
      alert('User, date, start, end are required');
      return;
    }
    setBusy(true);
    try {
      await ShiftAPI.create({
        userId: Number(form.userId),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: Number(form.breakMinutes) || 0,
        location: form.location || undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm({ ...form, userId: '', notes: '' });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this shift?')) return;
    try { await ShiftAPI.remove(id); await load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Shift roster</h1>
          <p className="text-sm text-gray-500">Schedule recurring work blocks for staff.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          {showForm ? 'Cancel' : '+ Schedule shift'}
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <label className="text-sm">
          From <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="ml-1 border rounded px-2 py-1" />
        </label>
        <label className="text-sm">
          To <input type="date" value={to} onChange={e => setTo(e.target.value)} className="ml-1 border rounded px-2 py-1" />
        </label>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white shadow rounded p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="number" placeholder="User ID *" value={form.userId}
                 onChange={e => setForm({ ...form, userId: e.target.value })} className="border rounded px-3 py-2" />
          <input type="date" value={form.date}
                 onChange={e => setForm({ ...form, date: e.target.value })} className="border rounded px-3 py-2" />
          <input type="text" placeholder="Location" value={form.location}
                 onChange={e => setForm({ ...form, location: e.target.value })} className="border rounded px-3 py-2" />
          <input type="time" value={form.startTime}
                 onChange={e => setForm({ ...form, startTime: e.target.value })} className="border rounded px-3 py-2" />
          <input type="time" value={form.endTime}
                 onChange={e => setForm({ ...form, endTime: e.target.value })} className="border rounded px-3 py-2" />
          <input type="number" placeholder="Break (min)" value={form.breakMinutes}
                 onChange={e => setForm({ ...form, breakMinutes: e.target.value })} className="border rounded px-3 py-2" />
          <textarea placeholder="Notes" value={form.notes} rows={2}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="border rounded px-3 py-2 md:col-span-3" />
          <button type="submit" disabled={busy}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded md:col-span-3">
            {busy ? 'Saving…' : 'Save shift'}
          </button>
        </form>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="bg-white shadow rounded divide-y">
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
                        <div key={s.id} className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-center gap-2">
                          <span className="font-medium">#{s.userId}</span>
                          <span>{s.startTime}–{s.endTime}</span>
                          {s.location && <span className="text-gray-500">· {s.location}</span>}
                          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[s.status] ?? 'bg-gray-100'}`}>{s.status}</span>
                          <button onClick={() => remove(s.id)} className="text-red-600 hover:underline text-xs">Delete</button>
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
