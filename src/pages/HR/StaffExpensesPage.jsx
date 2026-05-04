import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, CheckCircle, XCircle, Clock, RefreshCw, ThumbsUp, ThumbsDown, Paperclip, Image as ImageIcon } from 'lucide-react';
import { ExpenseAPI } from '../../services/api';
import { API_ORIGIN } from '../../config/apiBase';

// HR / Finance admin view of every expense claim submitted from the mobile app.
// Matches the canonical navy hero + tinted-chip pattern.

const STATUS_TONES = {
  Pending:   { bg: 'bg-mission-50', text: 'text-mission-700', border: 'border-mission-200' },
  Approved:  { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-600/20' },
  Rejected:  { bg: 'bg-danger-50',  text: 'text-danger-700',  border: 'border-danger-600/20' },
  Paid:      { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-600/20' },
};

const StaffExpensesPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await ExpenseAPI.listAdmin();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load expense claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const by = (s) => rows.filter(r => r.status === s);
    return {
      total:    rows.length,
      pending:  by('Pending').length,
      approved: by('Approved').length,
      rejected: by('Rejected').length,
      pendingAmount: by('Pending').reduce((sum, r) => sum + Number(r.amount || 0), 0),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (filterStatus !== 'All') r = r.filter(x => x.status === filterStatus);
    if (filterCategory !== 'All') r = r.filter(x => x.category === filterCategory);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        (x.submitter?.fullName || '').toLowerCase().includes(q) ||
        (x.description || '').toLowerCase().includes(q) ||
        (x.category || '').toLowerCase().includes(q)
      );
    }
    return r;
  }, [rows, filterStatus, filterCategory, search]);

  const decide = async (id, action) => {
    setBusyId(id); setError(null);
    try {
      if (action === 'approve') await ExpenseAPI.approve(id);
      else await ExpenseAPI.reject(id);
      await load();
    } catch (e) {
      setError(e?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const resolveReceipt = (url) => {
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Human Resources · Staff Expenses</p>
              <h1 className="text-h2 font-bold leading-tight">Staff Expense Claims</h1>
              <p className="text-ink-200 text-sm mt-0.5">{stats.pending} pending · LKR {stats.pendingAmount.toLocaleString()} awaiting approval</p>
            </div>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total claims" value={stats.total} icon={Receipt} tone="brand" sub="all-time submissions" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warn" sub="awaiting decision" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle} tone="success" sub="approved & queued" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" sub="declined" />
      </div>

      <div className="bg-white border border-ink-100 rounded-lg2 shadow-card p-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by staff name, description, or category…"
          className="flex-1 min-w-[220px] px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent">
          {['All', 'Pending', 'Approved', 'Rejected', 'Paid'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent">
          {['All', 'Travel', 'Meal', 'Communication', 'Stationery', 'Fuel', 'Other'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-600/20 text-danger-700 rounded-md px-4 py-3 text-sm">{error}</div>
      )}

      <div className="bg-white border border-ink-100 rounded-lg2 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <Th>Staff</Th>
                <Th>Category</Th>
                <Th>Amount</Th>
                <Th>Description</Th>
                <Th>Date</Th>
                <Th>Receipt</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-ink-500">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-ink-500">No expense claims match the current filter.</td></tr>
              )}
              {!loading && filtered.map(row => {
                const tone = STATUS_TONES[row.status] || STATUS_TONES.Pending;
                const receipt = resolveReceipt(row.receiptUrl);
                return (
                  <tr key={row.id} className="hover:bg-ink-50/40">
                    <Td>
                      <div className="font-semibold text-ink-900">{row.submitter?.fullName || `Staff #${row.submittedBy}`}</div>
                      {row.submitter?.role && <div className="text-xs text-ink-500">{row.submitter.role}</div>}
                    </Td>
                    <Td className="text-ink-700">{row.category || '—'}</Td>
                    <Td className="font-bold text-ink-900">LKR {Number(row.amount || 0).toLocaleString()}</Td>
                    <Td className="text-ink-700 max-w-xs truncate">{row.description || '—'}</Td>
                    <Td className="text-ink-500 text-xs">{fmtDate(row.date)}</Td>
                    <Td>
                      {receipt ? (
                        <button onClick={() => setPreviewUrl(receipt)} className="inline-flex items-center gap-1 text-navy-700 hover:underline text-xs">
                          <Paperclip size={13} /> View
                        </button>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tone.bg} ${tone.text} ${tone.border}`}>
                        {row.status}
                      </span>
                    </Td>
                    <Td align="right">
                      {row.status === 'Pending' ? (
                        <div className="inline-flex gap-2">
                          <button
                            disabled={busyId === row.id}
                            onClick={() => decide(row.id, 'approve')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-success-600 text-white hover:bg-success-700 transition disabled:opacity-50"
                          >
                            <ThumbsUp size={13} /> Approve
                          </button>
                          <button
                            disabled={busyId === row.id}
                            onClick={() => decide(row.id, 'reject')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-danger-600 text-white hover:bg-danger-700 transition disabled:opacity-50"
                          >
                            <ThumbsDown size={13} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-lg2 max-w-2xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <ImageIcon size={16} /> Receipt
              </div>
              <button onClick={() => setPreviewUrl(null)} className="text-ink-500 hover:text-ink-900 text-sm">Close</button>
            </div>
            <img src={previewUrl} alt="Receipt" className="max-h-[70vh] mx-auto rounded-md" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        </div>
      )}
    </div>
  );
};

const Th = ({ children, align = 'left' }) => (
  <th className={`px-4 py-2.5 text-${align} text-xs font-semibold text-ink-500 uppercase tracking-wider`}>{children}</th>
);
const Td = ({ children, className = '', align = 'left' }) => (
  <td className={`px-4 py-3 text-sm text-${align} ${className}`}>{children}</td>
);

const StatCard = ({ label, value, icon: Icon, tone, sub }) => {
  const tones = {
    brand:   { bg: 'bg-navy-50',    border: 'border-navy-200',       text: 'text-navy-800' },
    warn:    { bg: 'bg-mission-50', border: 'border-mission-200',    text: 'text-mission-700' },
    success: { bg: 'bg-success-50', border: 'border-success-600/20', text: 'text-success-700' },
    danger:  { bg: 'bg-danger-50',  border: 'border-danger-600/20',  text: 'text-danger-700' },
  }[tone];
  return (
    <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${tones.bg} ${tones.border} border rounded-md flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${tones.text}`} />
        </div>
      </div>
      <p className="text-h1 text-ink-900 mb-0.5">{value}</p>
      <p className="text-xs text-ink-600 font-medium">{label}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(iso); }
};

export default StaffExpensesPage;
