import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  PageWrap, PageHeader, Card, Button, StatusBadge, ErrorBox, Field, inputClass,
} from '../../components/ui/primitives';
import { ShiftAPI } from '../../services/hrAdminApi';

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
    <PageWrap>
      <PageHeader
        eyebrow="HR · Scheduling"
        title="Shift roster"
        subtitle="Schedule recurring work blocks for staff."
        actions={
          <Button onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Schedule shift'}
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex items-end gap-4 flex-wrap">
          <Field label="From">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputClass} />
          </Field>
          <Field label="To">
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Card>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="User ID *">
                <input type="number" value={form.userId}
                  onChange={e => setForm({ ...form, userId: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Date">
                <input type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Location">
                <input type="text" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Start time">
                <input type="time" value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })} className={inputClass} />
              </Field>
              <Field label="End time">
                <input type="time" value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Break (minutes)">
                <input type="number" value={form.breakMinutes}
                  onChange={e => setForm({ ...form, breakMinutes: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} rows={2}
                onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} />
            </Field>
            <Button type="submit" loading={busy}>Save shift</Button>
          </form>
        </Card>
      )}

      {error && <ErrorBox className="mb-4">{error}</ErrorBox>}

      {loading ? (
        <div className="text-ink-500 text-sm">Loading…</div>
      ) : (
        <Card padded={false}>
          <div className="divide-y divide-ink-100">
            {dates.map(d => {
              const list = byDate.get(d) || [];
              return (
                <div key={d} className="px-5 py-3 grid grid-cols-12 gap-3">
                  <div className="col-span-3 md:col-span-2 flex items-center gap-2 text-sm font-medium text-ink-700">
                    <CalendarDays className="w-4 h-4 text-navy-700" />
                    {new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="col-span-9 md:col-span-10">
                    {list.length === 0 ? (
                      <span className="text-sm text-ink-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {list.map(s => (
                          <div key={s.id} className="bg-ink-50 border border-ink-200 rounded-md px-3 py-1.5 text-sm flex items-center gap-2">
                            <span className="font-semibold text-navy-800">#{s.userId}</span>
                            <span className="text-ink-700">{s.startTime}–{s.endTime}</span>
                            {s.location && <span className="text-ink-500">· {s.location}</span>}
                            <StatusBadge status={s.status} />
                            <button onClick={() => remove(s.id)}
                              className="text-danger-700 hover:underline text-xs font-medium">Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </PageWrap>
  );
}
