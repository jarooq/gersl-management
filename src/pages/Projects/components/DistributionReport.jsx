import React, { useEffect, useState } from 'react';
import { X, Printer, Download, MapPin, Users, CheckCircle2, CalendarDays, FileBarChart } from 'lucide-react';
import * as API from '../../../services/api';

// DistributionReport
// -------------------------------------------------------------
// A one-page, printable summary of a project's distribution activity —
// generated so field managers can send it to donors as an impact report
// without hand-writing one. Uses window.print() with print-specific CSS
// so the page prints cleanly (no shell, no navigation, header on every
// printed page, page-break control on long tables).
//
// Everything is fetched fresh on open: the stats endpoint (already
// includes byEvent + byDistrict) and the project detail (for name,
// code, dates, budget, partner).

const money = (n, currency = 'LKR') => {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${currency} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const shortDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return '—'; }
};

const DistributionReport = ({ projectId, onClose }) => {
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      API.ProjectAPI.getById(projectId),
      API.ProjectBeneficiaryAPI.stats(projectId),
    ])
      .then(([p, s]) => {
        if (cancelled) return;
        setProject(p);
        setStats(s);
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load report'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePrint = () => window.print();

  const generatedAt = new Date().toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-hs-navy-900/50 backdrop-blur-sm z-50 overflow-y-auto print:bg-transparent print:backdrop-blur-none print:relative print:inset-auto print:overflow-visible">
      {/* Print-specific styles — hide everything except .report-print
          when printing, so the shell and modal chrome don't leak. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print, .report-print * { visibility: visible; }
          .report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; box-shadow: none; }
          .no-print { display: none !important; }
          .print-page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
          @page { margin: 12mm; }
        }
      `}</style>

      <div className="min-h-full flex items-start justify-center p-4 print:p-0">
        <div className="report-print bg-white rounded-lg shadow-hs-drawer max-w-3xl w-full print:shadow-none print:max-w-none print:rounded-none">
          {/* Toolbar — hidden on print */}
          <div className="no-print sticky top-0 z-10 bg-hs-slate-50 border-b border-hs-slate-200 px-5 py-3 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-2 text-hs-navy-800">
              <FileBarChart size={16} className="text-orange-600" />
              <span className="text-sm font-semibold">Distribution Report</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={loading || !!error}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={14} />
                <span>Print / Save as PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-hs-slate-500 hover:text-hs-navy-800 hover:bg-hs-slate-100 rounded-md transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 print:p-0 print:pt-2">
            {loading && (
              <p className="text-center text-sm text-hs-slate-500 py-16">Building report…</p>
            )}
            {error && !loading && (
              <p className="text-center text-sm text-hs-red-700 py-8">{error}</p>
            )}
            {!loading && !error && project && stats && (
              <>
                {/* Letterhead */}
                <div className="pb-5 mb-6 border-b-2 border-orange-500">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-md bg-hs-navy-800 flex items-center justify-center shrink-0">
                        <img src="/Logo.png" alt="GERSL" className="h-12 w-12 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Global Ehsan Relief</p>
                        <h1 className="text-lg font-display font-semibold text-hs-navy-800 leading-tight">
                          Distribution Impact Report
                        </h1>
                        <p className="text-[11px] text-hs-slate-500 mt-0.5">
                          Sri Lanka · 65 Abdul Majeed Road, Kinniya-04, Trincomalee
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-hs-slate-500">
                      <p>Generated {generatedAt}</p>
                    </div>
                  </div>
                </div>

                {/* Project block */}
                <div className="print-page-break-avoid mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500 mb-1">Project</p>
                  <h2 className="text-h2 font-display text-hs-navy-800">{project.name}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                    <div>
                      <p className="text-hs-slate-500">Code</p>
                      <p className="font-semibold text-hs-navy-800 font-mono">{project.projectCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-hs-slate-500">Start</p>
                      <p className="font-semibold text-hs-navy-800">{shortDate(project.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-hs-slate-500">End</p>
                      <p className="font-semibold text-hs-navy-800">{shortDate(project.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-hs-slate-500">Budget</p>
                      <p className="font-semibold text-hs-navy-800">{money(project.budget, project.currency)}</p>
                    </div>
                  </div>
                </div>

                {/* Impact summary */}
                <div className="print-page-break-avoid mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500 mb-2">Impact summary</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-md bg-hs-teal-50">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-hs-teal-700">
                        <CheckCircle2 size={12} />
                        <span>Beneficiaries reached</span>
                      </div>
                      <p className="text-2xl font-display font-semibold text-hs-teal-700 mt-1">
                        {stats.scans.beneficiariesServed.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-orange-50">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700">
                        <Users size={12} />
                        <span>Coverage</span>
                      </div>
                      <p className="text-2xl font-display font-semibold text-orange-700 mt-1">
                        {stats.scans.coveragePct.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-hs-slate-50">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-600">
                        <Users size={12} />
                        <span>Enrolled</span>
                      </div>
                      <p className="text-2xl font-display font-semibold text-hs-navy-800 mt-1">
                        {stats.enrolments.active.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-hs-slate-50">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-600">
                        <CalendarDays size={12} />
                        <span>Distribution events</span>
                      </div>
                      <p className="text-2xl font-display font-semibold text-hs-navy-800 mt-1">
                        {stats.events.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Events timeline */}
                {Array.isArray(stats.byEvent) && stats.byEvent.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500 mb-2">Events</p>
                    <table className="w-full text-xs border border-hs-slate-200 rounded-md overflow-hidden">
                      <thead className="bg-hs-slate-50 text-hs-slate-700">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">Event</th>
                          <th className="text-left px-3 py-2 font-semibold">Date</th>
                          <th className="text-left px-3 py-2 font-semibold">Location</th>
                          <th className="text-right px-3 py-2 font-semibold">Scans</th>
                          <th className="text-right px-3 py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.byEvent.map((e) => (
                          <tr key={e.id} className="border-t border-hs-slate-200 print-page-break-avoid">
                            <td className="px-3 py-1.5 text-hs-navy-800 font-medium">{e.name}</td>
                            <td className="px-3 py-1.5 text-hs-navy-700">{shortDate(e.scheduledDate)}</td>
                            <td className="px-3 py-1.5 text-hs-navy-700">{e.location || '—'}</td>
                            <td className="px-3 py-1.5 text-right font-semibold text-orange-700">{e.scanCount.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right text-hs-slate-600">{e.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Districts */}
                {Array.isArray(stats.byDistrict) && stats.byDistrict.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500">
                      <MapPin size={11} className="text-hs-slate-400" />
                      <span>Coverage by district</span>
                    </div>
                    <table className="w-full text-xs border border-hs-slate-200 rounded-md overflow-hidden">
                      <thead className="bg-hs-slate-50 text-hs-slate-700">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">District</th>
                          <th className="text-right px-3 py-2 font-semibold">Enrolled</th>
                          <th className="text-right px-3 py-2 font-semibold">Reached</th>
                          <th className="text-right px-3 py-2 font-semibold">Remaining</th>
                          <th className="text-right px-3 py-2 font-semibold">Coverage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.byDistrict.map((d) => (
                          <tr key={d.district} className="border-t border-hs-slate-200 print-page-break-avoid">
                            <td className="px-3 py-1.5 text-hs-navy-800 font-medium">{d.district}</td>
                            <td className="px-3 py-1.5 text-right text-hs-navy-700">{d.active.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right text-hs-teal-700 font-semibold">{d.served.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right text-hs-navy-700">{d.remaining.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right font-semibold text-orange-700">{d.coveragePct.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sign-off */}
                <div className="print-page-break-avoid mt-10 pt-6 border-t border-hs-slate-200 grid grid-cols-2 gap-8 text-[11px]">
                  <div>
                    <p className="text-hs-slate-500">Prepared by</p>
                    <div className="border-b border-hs-navy-700 h-8 mt-4" />
                    <p className="text-hs-slate-500 mt-1">Field Officer</p>
                  </div>
                  <div>
                    <p className="text-hs-slate-500">Approved by</p>
                    <div className="border-b border-hs-navy-700 h-8 mt-4" />
                    <p className="text-hs-slate-500 mt-1">Programme Manager</p>
                  </div>
                </div>

                <p className="text-center text-[9px] text-hs-slate-400 mt-8">
                  Global Ehsan Relief · Sri Lanka · Report generated automatically from live scan data
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionReport;
