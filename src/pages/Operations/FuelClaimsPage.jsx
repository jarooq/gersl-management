import React, { useEffect, useMemo, useState } from 'react';
import { MovementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_BADGE = {
  Draft:     'bg-ink-100 text-ink-700',
  Submitted: 'bg-yellow-100 text-yellow-800',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
  Paid:      'bg-emerald-100 text-emerald-800',
  Merged:    'bg-purple-100 text-purple-700',
  Cancelled: 'bg-gray-200 text-ink-600'
};

const APPROVER_ROLES = new Set([
  'Admin', 'CEO', 'Director Programmes',
  'Programme Manager', 'HR Manager', 'Finance Manager', 'Procurement Manager'
]);

const fmt = (v, currency = 'LKR') => {
  const n = Number(v); if (!Number.isFinite(n)) return '—';
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function FuelClaimsPage() {
  const { user } = useAuth();
  const isApprover = useMemo(() => APPROVER_ROLES.has(user?.role), [user]);

  const [tab, setTab] = useState('mine');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [duplicates, setDuplicates] = useState({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await MovementAPI.listFuelClaims({ scope: tab });
      const claims = res?.data?.claims || [];
      setRows(claims);
      // Pre-fetch duplicate checks for Submitted claims when on the pending tab
      if (tab === 'pending') {
        const dups = {};
        await Promise.all(claims.slice(0, 20).map(async c => {
          try {
            const dr = await MovementAPI.duplicateCheck(c.id);
            dups[c.id] = dr?.data?.overlaps || [];
          } catch (_) { dups[c.id] = []; }
        }));
        setDuplicates(dups);
      } else {
        setDuplicates({});
      }
    } catch (e) {
      setError(e?.message || 'Failed to load fuel claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const action = async (fn) => {
    setBusy(true);
    try { await fn(); await load(); }
    catch (e) { alert(e?.message || 'Action failed'); }
    finally { setBusy(false); }
  };

  const onSubmit  = (c) => action(() => MovementAPI.submitFuelClaim(c.id));
  const onApprove = (c) => action(() => MovementAPI.approveFuelClaim(c.id));
  const onReject  = (c) => {
    const reason = window.prompt('Rejection reason?');
    if (!reason) return;
    action(() => MovementAPI.rejectFuelClaim(c.id, reason));
  };
  const onMerge   = (c, primaryId) => {
    const share = window.prompt('Passenger share % (0 = no payout)?', '0') || '0';
    action(() => MovementAPI.mergeFuelClaim(c.id, primaryId, Number(share)));
  };
  const onCancel  = (c) => {
    if (!window.confirm('Cancel this claim?')) return;
    action(() => MovementAPI.cancelFuelClaim(c.id));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <header>
        <h1 className="text-h1 text-ink-900">Fuel claims</h1>
        <p className="text-sm text-ink-500">Auto-derived from Returned movements; lunch-hour deductions applied.</p>
      </header>

      <div className="flex gap-2 border-b border-ink-100">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'mine' ? 'border-blue-600 text-blue-600' : 'border-transparent text-ink-500 hover:text-ink-700'}`}
        >My claims</button>
        {isApprover && (
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-ink-500 hover:text-ink-700'}`}
          >Pending approval</button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Staff</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Trip</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Distance</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Rate</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Lunch ded.</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-500 uppercase">Net</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && <tr><td colSpan={8} className="p-4 text-center text-sm text-ink-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-sm text-ink-500">No claims.</td></tr>
            )}
            {rows.map(c => {
              const dups = duplicates[c.id] || [];
              return (
                <tr key={c.id} className={c.status === 'Cancelled' ? 'opacity-60' : ''}>
                  <td className="px-3 py-2 text-sm">
                    <div className="text-ink-900">{c.staff?.fullName || `#${c.userId}`}</div>
                    {c.passengers?.length > 0 && <div className="text-xs text-ink-500">+ {c.passengers.length} passenger(s)</div>}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="text-ink-900">{c.movement?.fromLocation} → {c.movement?.toLocation}</div>
                    <div className="text-xs text-ink-500">
                      {c.vehicleType}{c.vehicle?.plateNo ? ` · ${c.vehicle.plateNo}` : ''}
                      {c.movement?.departureAt ? ` · ${new Date(c.movement.departureAt).toLocaleDateString()}` : ''}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-right">{Number(c.distanceKm || 0).toLocaleString()} km</td>
                  <td className="px-3 py-2 text-sm text-right">{c.currency} {Number(c.ratePerKm || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-sm text-right text-yellow-700">{c.lunchDeduction > 0 ? `− ${fmt(c.lunchDeduction, c.currency)}` : ''}</td>
                  <td className="px-3 py-2 text-sm text-right font-semibold">{fmt(c.netAmount, c.currency)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status]}`}>
                      {c.status}
                    </span>
                    {dups.length > 0 && (
                      <div className="text-xs text-red-700 mt-1">
                        ⚠ {dups.length} possible duplicate{dups.length > 1 ? 's' : ''}
                        <ul className="text-[11px] text-red-700/80 mt-0.5">
                          {dups.slice(0, 3).map(d => (
                            <li key={d.otherMovementId}>{d.otherUserName} ({d.overlapPct}% overlap){d.otherClaimId ? `, claim #${d.otherClaimId}` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm space-x-2 whitespace-nowrap">
                    {c.userId === user?.id && c.status === 'Draft' && (
                      <button disabled={busy} onClick={() => onSubmit(c)} className="text-blue-600 hover:underline">Submit</button>
                    )}
                    {tab === 'pending' && c.userId !== user?.id && c.status === 'Submitted' && (
                      <>
                        <button disabled={busy} onClick={() => onApprove(c)} className="text-green-700 hover:underline">Approve</button>
                        <button disabled={busy} onClick={() => onReject(c)}  className="text-red-700 hover:underline">Reject</button>
                        {dups.filter(d => d.otherClaimId).slice(0, 1).map(d => (
                          <button
                            key={d.otherClaimId}
                            disabled={busy}
                            onClick={() => onMerge(c, d.otherClaimId)}
                            className="text-purple-700 hover:underline"
                          >Merge into #{d.otherClaimId}</button>
                        ))}
                      </>
                    )}
                    {c.userId === user?.id && !['Paid', 'Cancelled', 'Rejected', 'Merged'].includes(c.status) && (
                      <button disabled={busy} onClick={() => onCancel(c)} className="text-ink-500 hover:underline">Cancel</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
