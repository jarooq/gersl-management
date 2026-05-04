import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Users, RefreshCw, Filter, Calendar, Briefcase } from 'lucide-react';
import { FieldVisitAPI } from '../../services/api';

// Surfaces the generic Visit model (mobile field visits to beneficiaries —
// project/task linked). Distinct from Orphans → VisitLogs which is the
// orphan-specific visit log.

const FieldVisitsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('All');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await FieldVisitAPI.list({ limit: 500 });
      setRows(Array.isArray(data) ? data : (data?.visits || []));
    } catch (e) {
      setError(e?.message || 'Failed to load field visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const projects = useMemo(() => {
    const set = new Map();
    rows.forEach(r => {
      if (r.project?.id) set.set(r.project.id, r.project.name || `Project #${r.project.id}`);
    });
    return Array.from(set.entries());
  }, [rows]);

  const stats = useMemo(() => {
    const totalBenefs = rows.reduce((s, r) => s + Number(r.beneficiariesServed || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = rows.filter(r => (r.occurredAt || '').slice(0, 10) === today).length;
    const uniqueLocations = new Set(rows.map(r => r.customerName).filter(Boolean)).size;
    return { totalVisits: rows.length, totalBenefs, todayCount, uniqueLocations };
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (filterProject !== 'All') r = r.filter(x => String(x.project?.id) === filterProject);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        (x.customerName || '').toLowerCase().includes(q) ||
        (x.purpose || '').toLowerCase().includes(q) ||
        (x.user?.fullName || '').toLowerCase().includes(q)
      );
    }
    return r;
  }, [rows, filterProject, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Operations · Field Visits</p>
              <h1 className="text-h2 font-bold leading-tight">Field Visits</h1>
              <p className="text-ink-200 text-sm mt-0.5">{stats.totalVisits} visits logged · {stats.totalBenefs} beneficiaries served</p>
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
        <StatCard label="Total visits" value={stats.totalVisits} icon={MapPin} tone="brand" sub="all-time" />
        <StatCard label="Today" value={stats.todayCount} icon={Calendar} tone="warn" sub="logged today" />
        <StatCard label="Beneficiaries served" value={stats.totalBenefs} icon={Users} tone="success" sub="cumulative reach" />
        <StatCard label="Unique sites" value={stats.uniqueLocations} icon={Briefcase} tone="brand" sub="distinct locations" />
      </div>

      <div className="bg-white border border-ink-100 rounded-lg2 shadow-card p-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by site, purpose, or staff…"
          className="flex-1 min-w-[220px] px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent"
        />
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent">
          <option value="All">All projects</option>
          {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
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
                <Th>When</Th>
                <Th>Site / contact</Th>
                <Th>Purpose</Th>
                <Th>Project</Th>
                <Th>Logged by</Th>
                <Th align="right">Beneficiaries</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                  No field visits found. Visits logged from the mobile app appear here.
                </td></tr>
              )}
              {!loading && filtered.map(row => (
                <tr key={row.id} className="hover:bg-ink-50/40">
                  <Td className="text-ink-500 text-xs">{fmtDateTime(row.occurredAt)}</Td>
                  <Td>
                    <div className="font-semibold text-ink-900">{row.customerName || '—'}</div>
                    {row.location && <div className="text-xs text-ink-500">{row.location}</div>}
                  </Td>
                  <Td className="text-ink-700 max-w-xs truncate">{row.purpose || '—'}</Td>
                  <Td className="text-ink-700">{row.project?.name || '—'}</Td>
                  <Td className="text-ink-700">{row.user?.fullName || '—'}</Td>
                  <Td align="right" className="font-bold text-ink-900">{row.beneficiariesServed ?? 0}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(iso); }
};

export default FieldVisitsPage;
