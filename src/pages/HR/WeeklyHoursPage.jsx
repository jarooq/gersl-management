import React, { useEffect, useMemo, useState } from 'react';
import { Clock, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { AttendanceAPI } from '../../services/api';

// =============================================================================
// Weekly Hours — HR/manager view of net work hours across all active staff.
//
// Sri Lankan 45h/week rule with 1h auto-lunch deduction (server side; the
// table just renders the numbers). Days with missing punch IN/OUT show up
// as red "!" so HR can chase up before the week closes.
// =============================================================================

const TARGET_HOURS  = 45;
const UNDER_THRESHOLD = 35;     // < 35h flags as "low"
const OVER_THRESHOLD  = 50;     // > 50h flags as "OT review"

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(1) : '—';
}

// Monday-anchored YYYY-MM-DD for a given JS Date.
function mondayOf(d) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  const day = t.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  t.setDate(t.getDate() + offset);
  return t.toISOString().slice(0, 10);
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyHoursPage() {
  const [weekOf, setWeekOf] = useState(() => mondayOf(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'totalHours', dir: 'desc' });

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    AttendanceAPI.weeklyHoursAll({ weekOf })
      .then((d) => { if (alive) { setData(d || null); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e?.message || 'Failed to load'); setLoading(false); } });
    return () => { alive = false; };
  }, [weekOf]);

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    const q = search.trim().toLowerCase();
    let rows = q
      ? data.rows.filter(r =>
          r.fullName?.toLowerCase().includes(q) ||
          r.role?.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q))
      : data.rows.slice();
    rows.sort((a, b) => {
      const va = a[sort.key]; const vb = b[sort.key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [data, search, sort]);

  const toggleSort = (key) => setSort((s) =>
    s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });

  const shiftWeek = (days) => {
    const d = new Date(weekOf + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setWeekOf(mondayOf(d));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
        <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Human Resources</p>
        <h1 className="text-h2 font-bold leading-tight inline-flex items-center gap-2">
          <Clock size={22} /> Weekly Hours
        </h1>
        <p className="text-ink-200 text-sm mt-1">
          Net work hours per staff member. 45h/week target with 1h unpaid lunch
          auto-deducted after 5 hours worked.
        </p>
      </div>

      {/* Week navigator + filters */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-3 flex flex-wrap items-center gap-3">
        <button onClick={() => shiftWeek(-7)} className="px-3 py-1.5 border border-ink-200 rounded text-sm hover:bg-ink-50">‹ Previous</button>
        <input
          type="date"
          value={weekOf}
          onChange={(e) => setWeekOf(mondayOf(new Date(e.target.value)))}
          className="border border-ink-200 rounded px-2 py-1.5 text-sm"
        />
        <button onClick={() => shiftWeek(7)} className="px-3 py-1.5 border border-ink-200 rounded text-sm hover:bg-ink-50">Next ›</button>
        <button onClick={() => setWeekOf(mondayOf(new Date()))} className="px-3 py-1.5 text-sm text-blue-700 hover:underline">This week</button>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2 text-sm">
          <Search size={14} className="text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, role, department"
            className="border border-ink-200 rounded px-2 py-1.5 text-sm w-64"
          />
        </div>
      </div>

      {/* Summary tiles */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="Staff tracked"  value={data.summary.staffCount} />
          <Tile label="Avg hours"      value={`${fmt(data.summary.averageHours)}h`} />
          <Tile label="Under 35h"      value={data.summary.underTarget} tone={data.summary.underTarget > 0 ? 'amber' : 'ink'} />
          <Tile label="Over 50h"       value={data.summary.overTarget}  tone={data.summary.overTarget  > 0 ? 'red'   : 'ink'} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase font-semibold text-ink-600">
            <tr>
              <Th label="Staff"        sortKey="fullName"   sort={sort} onClick={toggleSort} />
              <Th label="Department"   sortKey="department" sort={sort} onClick={toggleSort} />
              <Th label="Mon" align="right" />
              <Th label="Tue" align="right" />
              <Th label="Wed" align="right" />
              <Th label="Thu" align="right" />
              <Th label="Fri" align="right" />
              <Th label="Sat" align="right" />
              <Th label="Sun" align="right" />
              <Th label="Total"   sortKey="totalHours"  sort={sort} onClick={toggleSort} align="right" />
              <Th label="Balance" sortKey="balance"     sort={sort} onClick={toggleSort} align="right" />
              <Th label="!"       sortKey="missingDays" sort={sort} onClick={toggleSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading && (
              <tr><td colSpan={12} className="p-6 text-center text-ink-500">Loading…</td></tr>
            )}
            {!loading && filteredRows.length === 0 && (
              <tr><td colSpan={12} className="p-6 text-center text-ink-500">No staff matched.</td></tr>
            )}
            {filteredRows.map((r) => {
              const isUnder = r.totalHours < UNDER_THRESHOLD;
              const isOver  = r.totalHours > OVER_THRESHOLD;
              return (
                <tr key={r.userId} className="hover:bg-orange-50/50">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-ink-900">{r.fullName}</div>
                    <div className="text-xs text-ink-500">{r.role}</div>
                  </td>
                  <td className="px-3 py-2 text-ink-700">{r.department || '—'}</td>
                  {DAY_LABELS.map((_, i) => {
                    const d = r.daily?.[i];
                    return (
                      <td key={i} className="px-3 py-2 text-right">
                        {d ? (
                          d.missing
                            ? <span className="text-red-600 font-bold" title={d.missing}>!</span>
                            : <span>{fmt(d.netHours)}</span>
                        ) : <span className="text-ink-300">—</span>}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-2 text-right font-bold ${isUnder ? 'text-amber-700' : isOver ? 'text-red-700' : 'text-ink-900'}`}>
                    {fmt(r.totalHours)}h
                  </td>
                  <td className={`px-3 py-2 text-right ${r.balance >= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                    {r.balance >= 0 ? '+' : ''}{fmt(r.balance)}h
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.missingDays > 0
                      ? <span className="text-red-600 font-bold inline-flex items-center gap-1">
                          <AlertTriangle size={12} /> {r.missingDays}
                        </span>
                      : <span className="text-ink-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-500">
        <TrendingUp size={11} className="inline mr-1" />
        Hours computed from <code>attendance_punches</code>. Lunch break is deducted automatically (1h) when daily worked ≥ 5h <em>and</em> no explicit BreakIn/BreakOut punches were recorded.
      </p>
    </div>
  );
}

function Tile({ label, value, tone = 'ink' }) {
  const tones = {
    ink:   'bg-ink-50  text-ink-700',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red:   'bg-red-50   text-red-700   border-red-200',
  };
  return (
    <div className={`rounded-lg2 shadow-card border border-ink-100 p-4 ${tones[tone] || tones.ink}`}>
      <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-h2 font-bold mt-1">{value}</p>
    </div>
  );
}

function Th({ label, sortKey, sort, onClick, align }) {
  const isActive = sortKey && sort?.key === sortKey;
  const cls = `px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'} ${sortKey ? 'cursor-pointer select-none hover:bg-ink-100' : ''}`;
  return (
    <th className={cls} onClick={sortKey ? () => onClick(sortKey) : undefined}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span className="text-[10px]">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );
}
