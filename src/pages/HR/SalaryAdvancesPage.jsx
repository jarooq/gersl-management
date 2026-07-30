import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, CheckCircle, XCircle, Clock, RefreshCw, ThumbsUp, ThumbsDown, Wallet, X } from 'lucide-react';
import { SalaryAdvanceAPI, CashAPI } from '../../services/api';

// Canonical admin page: navy hero + tinted stat cards + filterable table.
// Uses the same shape as ExpensesPage (HR view).

const STATUS_TONES = {
  Pending:   { bg: 'bg-mission-50', text: 'text-mission-700', border: 'border-mission-200' },
  Approved:  { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-600/20' },
  Rejected:  { bg: 'bg-danger-50',  text: 'text-danger-700',  border: 'border-danger-600/20' },
  Cancelled: { bg: 'bg-ink-100',    text: 'text-ink-700',     border: 'border-ink-200' },
  Deducted:  { bg: 'bg-navy-50',    text: 'text-navy-800',    border: 'border-navy-200' },
};

const SalaryAdvancesPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  // Disburse-from-cash UI state
  const [disburseRow, setDisburseRow]   = useState(null);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [pickedAccountId, setPickedAccountId] = useState('');
  const [disburseBusy, setDisburseBusy] = useState(false);

  const openDisburse = async (row) => {
    setDisburseRow(row);
    setError(null);
    if (cashAccounts.length === 0) {
      try {
        const resp = await CashAPI.listAccounts();
        const list = resp?.data?.accounts || resp?.data || [];
        const active = list.filter(a => a.isActive !== false);
        setCashAccounts(active);
        if (active.length === 1) setPickedAccountId(String(active[0].id));
      } catch (e) {
        setError('Could not load cash accounts: ' + (e?.message || 'unknown'));
      }
    }
  };

  const confirmDisburse = async () => {
    if (!disburseRow || !pickedAccountId) return;
    setDisburseBusy(true); setError(null);
    try {
      await CashAPI.disburseFromSource(
        'SalaryAdvance', disburseRow.id, parseInt(pickedAccountId, 10),
        { payeeName: disburseRow.user?.fullName || disburseRow.staffName || null }
      );
      setDisburseRow(null);
      setPickedAccountId('');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Disburse failed');
    } finally {
      setDisburseBusy(false);
    }
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await SalaryAdvanceAPI.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load salary advances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const by = (s) => rows.filter(r => r.status === s);
    return {
      total:     rows.length,
      pending:   by('Pending').length,
      approved:  by('Approved').length,
      rejected:  by('Rejected').length,
      pendingAmount: by('Pending').reduce((sum, r) => sum + Number(r.amount || 0), 0),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (filterStatus !== 'All') r = r.filter(x => x.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        (x.user?.fullName || '').toLowerCase().includes(q) ||
        (x.user?.email || '').toLowerCase().includes(q) ||
        (x.reason || '').toLowerCase().includes(q)
      );
    }
    return r;
  }, [rows, filterStatus, search]);

  const decide = async (id, action) => {
    setBusyId(id); setError(null);
    try {
      if (action === 'approve') await SalaryAdvanceAPI.approve(id);
      else await SalaryAdvanceAPI.reject(id);
      await load();
    } catch (e) {
      setError(e?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero */}
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-orange-500/15 border border-orange-500/30 rounded-md flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Human Resources · Salary Advances</p>
              <h1 className="text-h2 font-bold leading-tight">Salary Advances</h1>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={DollarSign} tone="brand" sub="all-time requests" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warn" sub="awaiting decision" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle} tone="success" sub="approved & active" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" sub="declined" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-ink-100 rounded-lg2 shadow-card p-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by staff name, email, or reason…"
          className="flex-1 min-w-[220px] px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent"
        >
          {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Deducted'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-600/20 text-danger-700 rounded-md px-4 py-3 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-ink-100 rounded-lg2 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <Th>Staff</Th>
                <Th>Amount</Th>
                <Th>Reason</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th>Decided by</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No salary advances match the current filter.</td></tr>
              )}
              {!loading && filtered.map(row => {
                const tone = STATUS_TONES[row.status] || STATUS_TONES.Pending;
                return (
                  <tr key={row.id} className="hover:bg-ink-50/40">
                    <Td>
                      <div className="font-semibold text-ink-900">{row.user?.fullName || `Staff #${row.userId}`}</div>
                      {row.user?.email && <div className="text-xs text-ink-500">{row.user.email}</div>}
                    </Td>
                    <Td className="font-bold text-ink-900">LKR {Number(row.amount || 0).toLocaleString()}</Td>
                    <Td className="text-ink-700 max-w-xs truncate">{row.reason || '—'}</Td>
                    <Td className="text-ink-500 text-xs">{fmtDate(row.createdAt)}</Td>
                    <Td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tone.bg} ${tone.text} ${tone.border}`}>
                        {row.status}
                      </span>
                    </Td>
                    <Td className="text-ink-700">
                      {row.decider?.fullName || (row.status === 'Pending' ? '—' : '?')}
                      {row.decidedAt && <div className="text-xs text-ink-500">{fmtDate(row.decidedAt)}</div>}
                    </Td>
                    <Td align="right">
                      {row.status === 'Pending' && (
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
                      )}
                      {row.status === 'Approved' && (
                        <button
                          onClick={() => openDisburse(row)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-orange-500 text-white hover:bg-navy-800 transition"
                        >
                          <Wallet size={13} /> Pay from cash
                        </button>
                      )}
                      {!['Pending', 'Approved'].includes(row.status) && (
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

      {disburseRow && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !disburseBusy && setDisburseRow(null)}>
          <div className="bg-white rounded-lg2 shadow-pop max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="text-navy-700" size={20} />
                <h3 className="text-lg font-bold text-ink-900">Pay advance from cash</h3>
              </div>
              <button onClick={() => !disburseBusy && setDisburseRow(null)} className="text-ink-500 hover:text-ink-900">
                <X size={18} />
              </button>
            </div>
            <div className="text-sm text-ink-600 mb-1">
              <span className="font-semibold text-ink-900">{disburseRow.user?.fullName || disburseRow.staffName || '—'}</span>
              {disburseRow.reason ? ` — ${disburseRow.reason}` : ''}
            </div>
            <div className="text-2xl font-extrabold text-ink-900 mb-4">
              LKR {Number(disburseRow.amount || 0).toLocaleString()}
            </div>

            <label className="block text-xs font-semibold text-ink-700 mb-1 uppercase tracking-wider">
              Cash account
            </label>
            <select
              value={pickedAccountId}
              onChange={(e) => setPickedAccountId(e.target.value)}
              className="w-full px-3 py-2.5 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent mb-2"
            >
              <option value="">— Select an account —</option>
              {cashAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.type} · {a.currency} {Number(a.currentBalance || 0).toLocaleString()}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-500 mb-5">
              Posts a Payment voucher in the chosen account. The advance status stays
              Approved until it's recovered from a future payroll run (Deducted).
            </p>

            <div className="flex gap-2 justify-end">
              <button
                disabled={disburseBusy}
                onClick={() => setDisburseRow(null)}
                className="px-4 py-2 text-sm font-semibold border border-ink-200 text-ink-700 rounded-md hover:bg-ink-50 disabled:opacity-50"
              >Cancel</button>
              <button
                disabled={disburseBusy || !pickedAccountId}
                onClick={confirmDisburse}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-md bg-orange-500 text-white hover:bg-navy-800 disabled:opacity-50"
              >
                <Wallet size={14} />
                {disburseBusy ? 'Posting…' : 'Disburse'}
              </button>
            </div>
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

export default SalaryAdvancesPage;
