import React, { useEffect, useState } from 'react';
import {
  Users, CalendarDays, ScanLine, CheckCircle2, TrendingUp, AlertCircle,
} from 'lucide-react';
import * as API from '../../../services/api';
import UnreachedBeneficiariesModal from './UnreachedBeneficiariesModal';

// DistributionProgressCard
// -------------------------------------------------------------
// A compact summary that answers the field manager's daily question:
// "How many of our project's beneficiaries have actually received aid?"
//
// For a "Ramadan 500 families" project this shows, at a glance:
//   - Coverage %          — beneficiaries served / active enrolments
//   - Beneficiaries served — distinct enrolments that got at least one scan
//   - Remaining            — still-unscanned active enrolments
//   - Total scans          — raw scan count (may equal served, once enforce-
//                            one-scan-per-enrolment holds)
//   - Event lifecycle      — planned / active / closed counts
//
// Fetches /api/projects/:projectId/distribution-stats. Auto-refreshes on
// projectId change; can be forced to refetch by bumping `refreshKey`.

const StatCell = ({ icon: Icon, label, value, tone = 'slate', tooltip, onClick }) => {
  const toneClasses = {
    slate:  'bg-hs-slate-50 text-hs-navy-700',
    orange: 'bg-orange-50 text-orange-700',
    green:  'bg-hs-teal-50 text-hs-teal-700',
    red:    'bg-hs-red-50 text-hs-red-700',
  }[tone];
  const clickableClass = onClick
    ? 'hover:brightness-95 cursor-pointer transition text-left w-full'
    : '';
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`flex items-center gap-2.5 p-3 rounded-md ${toneClasses} ${clickableClass}`}
      title={tooltip}
    >
      <Icon size={18} className="shrink-0 opacity-80" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-lg font-display font-semibold leading-tight">{value}</p>
      </div>
    </Wrapper>
  );
};

const DistributionProgressCard = ({ projectId, projectName, refreshKey = 0 }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnreached, setShowUnreached] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    API.ProjectBeneficiaryAPI.stats(projectId)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load stats'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, refreshKey]);

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-hs-slate-100 rounded w-1/3" />
          <div className="h-3 bg-hs-slate-100 rounded w-2/3" />
          <div className="h-8 bg-hs-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
        <div className="flex items-center gap-2 text-hs-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">Distribution progress unavailable: {error}</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { enrolments, events, scans } = stats;
  const coverage = scans.coveragePct;
  const active = enrolments.active;

  // Colour code the progress by how far along coverage is.
  const barTone =
    coverage >= 90 ? 'bg-hs-teal-500' :
    coverage >= 50 ? 'bg-orange-500'  :
    coverage > 0   ? 'bg-orange-400'  :
                     'bg-hs-slate-300';

  return (
    <div className="bg-white rounded-lg2 shadow-hs-card border border-hs-slate-200 p-5 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
            Distribution
          </p>
          <h3 className="text-base font-display font-semibold text-hs-navy-800">
            Beneficiaries reached
          </h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-display font-semibold text-hs-navy-800 leading-none">
            {coverage.toFixed(1)}<span className="text-lg text-hs-slate-500">%</span>
          </p>
          <p className="text-[11px] text-hs-slate-500 mt-0.5">
            {scans.beneficiariesServed.toLocaleString()} of {active.toLocaleString()} active
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-hs-slate-100 rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={coverage} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${barTone} transition-all`} style={{ width: `${Math.min(coverage, 100)}%` }} />
      </div>

      {/* Cell grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCell
          icon={CheckCircle2}
          label="Served"
          value={scans.beneficiariesServed.toLocaleString()}
          tone="green"
          tooltip="Distinct active enrolments that received at least one scan."
        />
        <StatCell
          icon={Users}
          label="Remaining"
          value={scans.remaining.toLocaleString()}
          tone={scans.remaining === 0 ? 'green' : 'orange'}
          tooltip={scans.remaining === 0
            ? 'Everyone reached.'
            : 'Active enrolments that haven\'t been scanned yet. Click to see who.'}
          onClick={scans.remaining > 0 ? () => setShowUnreached(true) : undefined}
        />
        <StatCell
          icon={ScanLine}
          label="Total scans"
          value={scans.totalScans.toLocaleString()}
          tone="slate"
          tooltip="Raw QR scans across all events for this project."
        />
        <StatCell
          icon={TrendingUp}
          label="Enrolled"
          value={active.toLocaleString()}
          tone="slate"
          tooltip={`Active QR enrolments. Total incl. withdrawn/replaced: ${enrolments.total.toLocaleString()}.`}
        />
      </div>

      {showUnreached && (
        <UnreachedBeneficiariesModal
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowUnreached(false)}
        />
      )}

      {/* Event lifecycle strip */}
      <div className="mt-4 pt-3 border-t border-hs-slate-100 flex items-center justify-between text-[11px] text-hs-slate-500 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={12} className="text-hs-slate-400" />
          <span>Events</span>
        </span>
        <span className="flex items-center gap-4">
          <span><span className="text-hs-slate-700 font-semibold">{events.planned}</span> planned</span>
          <span><span className="text-hs-teal-700 font-semibold">{events.active}</span> active</span>
          <span><span className="text-hs-slate-500 font-semibold">{events.closed}</span> closed</span>
          <span className="text-hs-slate-400">·</span>
          <span><span className="text-hs-navy-700 font-semibold">{events.total}</span> total</span>
        </span>
      </div>
    </div>
  );
};

export default DistributionProgressCard;
