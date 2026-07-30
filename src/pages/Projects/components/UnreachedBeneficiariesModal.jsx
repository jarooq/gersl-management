import React, { useEffect, useState } from 'react';
import { X, Phone, MapPin, Users, Download, Search, AlertCircle } from 'lucide-react';
import * as API from '../../../services/api';

// UnreachedBeneficiariesModal
// -------------------------------------------------------------
// Opens from the DistributionProgressCard's "Remaining" cell. Shows the
// active enrolments that haven't been scanned at any distribution event
// yet — the list a field manager acts on directly (call, home visit).
//
// Client-side search on name/id/district for quick lookup within a big
// list (Ramadan Project has 500 rows).
// CSV download for offline call-sheets.

const toCsv = (rows) => {
  const header = ['Beneficiary ID', 'Full Name', 'Gender', 'District', 'Contact', 'Enrolled At'];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => {
    const b = r.beneficiary || {};
    return [b.beneficiaryId, b.fullName, b.gender, b.district, b.contactNumber, r.enrolledAt]
      .map(escape)
      .join(',');
  });
  return [header.join(','), ...body].join('\n');
};

const downloadCsv = (rows, projectName) => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (projectName || 'project').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  a.download = `unreached-beneficiaries-${safeName}-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const UnreachedBeneficiariesModal = ({ projectId, projectName, onClose }) => {
  const [enrolments, setEnrolments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Pull the max page in one go — this list is bounded by active
    // enrolments (typically hundreds, not thousands). If a project ever
    // exceeds the 200 cap the API responds with pagination info and we
    // can revisit as needed.
    API.ProjectBeneficiaryAPI.unreached(projectId, { limit: 200 })
      .then((data) => {
        if (cancelled) return;
        setEnrolments(data?.enrolments || []);
        setTotal(data?.pagination?.total || 0);
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load list'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? enrolments.filter((r) => {
        const b = r.beneficiary || {};
        return (
          (b.fullName || '').toLowerCase().includes(q) ||
          (b.beneficiaryId || '').toLowerCase().includes(q) ||
          (b.district || '').toLowerCase().includes(q) ||
          (b.contactNumber || '').toLowerCase().includes(q)
        );
      })
    : enrolments;

  return (
    <div
      className="fixed inset-0 bg-hs-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg2 shadow-hs-drawer max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-hs-navy-800 text-white rounded-t-lg2 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-300">
              Distribution follow-up
            </p>
            <h2 className="text-lg font-display font-semibold">Unreached beneficiaries</h2>
            {!loading && !error && (
              <p className="text-xs text-hs-slate-300 mt-0.5">
                {total.toLocaleString()} active enrolment{total === 1 ? '' : 's'} with no scan yet
                {projectName ? ` · ${projectName}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-hs-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-hs-slate-200 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hs-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, district, contact…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-hs-slate-200 rounded-md focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <button
            onClick={() => downloadCsv(filtered, projectName)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-sm text-hs-slate-500">Loading…</div>
          )}
          {error && (
            <div className="p-6 flex items-center gap-2 text-hs-red-700 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && total === 0 && (
            <div className="p-10 text-center">
              <Users size={40} className="mx-auto text-hs-teal-500 mb-3" />
              <p className="text-sm font-semibold text-hs-navy-800">Everyone's reached.</p>
              <p className="text-xs text-hs-slate-500 mt-1">
                Every active enrolment has at least one scan — nothing pending.
              </p>
            </div>
          )}
          {!loading && !error && total > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-hs-slate-50 text-hs-slate-600 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-2 font-semibold">Beneficiary</th>
                  <th className="text-left px-4 py-2 font-semibold">District</th>
                  <th className="text-left px-4 py-2 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const b = r.beneficiary || {};
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-hs-slate-100 hover:bg-orange-50/50 transition"
                    >
                      <td className="px-6 py-2.5">
                        <p className="font-semibold text-hs-navy-800">{b.fullName || '—'}</p>
                        <p className="text-[11px] text-hs-slate-500 font-mono">{b.beneficiaryId || '—'}</p>
                      </td>
                      <td className="px-4 py-2.5 text-hs-navy-700">
                        {b.district ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} className="text-hs-slate-400" />
                            {b.district}
                          </span>
                        ) : (
                          <span className="text-hs-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-hs-navy-700">
                        {b.contactNumber ? (
                          <a
                            href={`tel:${b.contactNumber}`}
                            className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
                          >
                            <Phone size={12} />
                            {b.contactNumber}
                          </a>
                        ) : (
                          <span className="text-hs-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && q && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-hs-slate-500">
                      No matches for "{query}" in the {total.toLocaleString()} unreached
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hs-slate-200 bg-hs-slate-50 flex justify-between items-center text-[11px] text-hs-slate-500">
          <span>
            {q
              ? `Showing ${filtered.length.toLocaleString()} of ${total.toLocaleString()}`
              : `Showing ${enrolments.length.toLocaleString()} of ${total.toLocaleString()}`}
          </span>
          <span>Press <kbd className="font-mono border border-hs-slate-200 rounded px-1 bg-white">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

export default UnreachedBeneficiariesModal;
