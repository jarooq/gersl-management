import React, { useEffect, useState } from 'react';
import { AnnouncementAPI } from '../../services/hrAdminApi';

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const isExpired = (iso) => iso && new Date(iso) < new Date();

export default function AnnouncementsAdminPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', expiresAt: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRows(await AnnouncementAPI.list()); setError(null); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      alert('Title and body are required'); return;
    }
    setBusy(true);
    try {
      await AnnouncementAPI.create({
        title: form.title.trim(), body: form.body.trim(),
        audience: form.audience || 'all',
        expiresAt: form.expiresAt || null,
      });
      setShowForm(false);
      setForm({ title: '', body: '', audience: 'all', expiresAt: '' });
      await load();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await AnnouncementAPI.remove(id); await load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Broadcasts shown in the staff mobile app.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {showForm ? 'Cancel' : '+ New announcement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <input
            type="text" placeholder="Title *" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
          />
          <textarea
            placeholder="Body *" rows={4} value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Audience (e.g. all, role:Admin)"
              value={form.audience}
              onChange={e => setForm({ ...form, audience: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
            <input type="datetime-local" placeholder="Expires at"
              value={form.expiresAt}
              onChange={e => setForm({ ...form, expiresAt: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
          </div>
          <button type="submit" disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </form>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-6 text-center text-gray-500 text-sm">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(a => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-md p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{a.body}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 flex-wrap">
                    <span>Audience: {a.audience || 'all'}</span>
                    <span>·</span>
                    <span>Published {fmtDate(a.publishedAt)}</span>
                    {a.expiresAt && (
                      <>
                        <span>·</span>
                        <span className={isExpired(a.expiresAt) ? 'text-red-600' : ''}>
                          Expires {fmtDate(a.expiresAt)}
                        </span>
                      </>
                    )}
                    {a.creator && (
                      <>
                        <span>·</span>
                        <span>By {a.creator.fullName}</span>
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => remove(a.id)}
                  className="text-red-700 hover:underline text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
