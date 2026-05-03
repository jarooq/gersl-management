import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import {
  PageWrap, PageHeader, Card, Button, ErrorBox, EmptyState, Field, inputClass,
} from '../../components/ui/primitives';
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
    <PageWrap>
      <PageHeader
        eyebrow="Communications"
        title="Announcements"
        subtitle="Broadcasts shown in the staff mobile app."
        actions={
          <Button onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ New announcement'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={submit} className="space-y-3">
            <Field label="Title *">
              <input type="text" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className={inputClass} />
            </Field>
            <Field label="Body *">
              <textarea rows={4} value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                className={inputClass} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Audience" hint="e.g. all, role:Admin, dept:HR">
                <input type="text" value={form.audience}
                  onChange={e => setForm({ ...form, audience: e.target.value })}
                  className={inputClass} />
              </Field>
              <Field label="Expires at (optional)">
                <input type="datetime-local" value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                  className={inputClass} />
              </Field>
            </div>
            <Button type="submit" loading={busy}>Publish</Button>
          </form>
        </Card>
      )}

      {error && <ErrorBox className="mb-4">{error}</ErrorBox>}

      {loading ? (
        <div className="text-ink-500 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-10 h-10" />}
          title="No announcements yet"
          message="Publish the first one with the button above. Mobile staff will see it the next time they refresh their feed."
        />
      ) : (
        <div className="space-y-3">
          {rows.map(a => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-h3 text-ink-900">{a.title}</h3>
                  <p className="text-sm text-ink-700 whitespace-pre-line mt-1">{a.body}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-ink-500 flex-wrap">
                    <span>Audience: <strong className="text-ink-700">{a.audience || 'all'}</strong></span>
                    <span aria-hidden>·</span>
                    <span>Published {fmtDate(a.publishedAt)}</span>
                    {a.expiresAt && (
                      <>
                        <span aria-hidden>·</span>
                        <span className={isExpired(a.expiresAt) ? 'text-danger-600 font-medium' : ''}>
                          Expires {fmtDate(a.expiresAt)}
                        </span>
                      </>
                    )}
                    {a.creator && (
                      <>
                        <span aria-hidden>·</span>
                        <span>By {a.creator.fullName}</span>
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => remove(a.id)}
                  className="text-danger-700 hover:underline text-sm font-medium">
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageWrap>
  );
}
