import React, { useEffect, useMemo, useState } from 'react';
import { MovementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import NewMovementModal from './components/NewMovementModal';

const STATUS_BADGE = {
  Planned:    'bg-ink-100 text-ink-700',
  Approved:   'bg-blue-100 text-blue-700',
  InMovement: 'bg-indigo-100 text-indigo-700',
  Arrived:    'bg-teal-100 text-teal-700',
  Returned:   'bg-green-100 text-green-700',
  Cancelled:  'bg-ink-200 text-ink-600',
  Rejected:   'bg-red-100 text-red-700'
};

const APPROVER_ROLES = new Set([
  'Admin', 'CEO', 'Director Programmes',
  'Programme Manager', 'HR Manager', 'Finance Manager', 'Procurement Manager'
]);

const fmtTime = (v) => v ? new Date(v).toLocaleString() : '—';

export default function MovementRegisterPage() {
  const { user } = useAuth();
  const isApprover = useMemo(() => APPROVER_ROLES.has(user?.role), [user]);

  const [tab, setTab] = useState('mine');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await MovementAPI.listMovements({ scope: tab, limit: 200 });
      setRows(res?.data?.movements || []);
    } catch (e) {
      setError(e?.message || 'Failed to load movements');
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

  const onApprove = (m) => action(() => MovementAPI.approveMovement(m.id));
  const onReject = (m) => {
    const reason = window.prompt('Rejection reason?');
    if (!reason) return;
    action(() => MovementAPI.rejectMovement(m.id, reason));
  };
  const onDepart = (m) => action(() => MovementAPI.depart(m.id));
  const onArrive = (m) => action(() => MovementAPI.arrive(m.id));
  const onReturn = (m) => {
    const km = window.prompt('Distance travelled (km)? Leave blank to skip.');
    if (km === null) return;
    action(() => MovementAPI.returnMovement(m.id, km === '' ? null : Number(km)));
  };
  const onCancel = (m) => {
    const reason = window.prompt('Cancel reason (optional)?') || '';
    action(() => MovementAPI.cancelMovement(m.id, reason));
  };

  const onClaimFuel = async (m) => {
    let km = m.distanceKm;
    if (!km) {
      const v = window.prompt('Distance (km) for this claim?');
      if (!v) return;
      km = Number(v);
    }
    try {
      const res = await MovementAPI.deriveFuelClaim({ movementId: m.id, distanceKm: km });
      const claimId = res?.data?.claim?.id;
      alert(`Fuel claim drafted (#${claimId}). Net amount: ${res?.data?.claim?.currency || 'LKR'} ${Number(res?.data?.claim?.netAmount || 0).toLocaleString()}. Submit it from the Fuel claims page.`);
    } catch (e) {
      alert(e?.message || 'Failed to derive fuel claim');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-ink-900">Movement register</h1>
          <p className="text-sm text-ink-500">Field-trip log: plan, depart, arrive, return.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition"
        >New movement</button>
      </header>

      <div className="flex gap-2 border-b border-ink-100">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'mine' ? 'border-blue-600 text-blue-600' : 'border-transparent text-ink-500 hover:text-ink-700'}`}
        >My movements</button>
        {isApprover && (
          <button
            onClick={() => setTab('team')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'team' ? 'border-blue-600 text-blue-600' : 'border-transparent text-ink-500 hover:text-ink-700'}`}
          >Team queue</button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Staff</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Route</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Purpose</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Vehicle</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Planned</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Actual</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && <tr><td colSpan={8} className="p-4 text-center text-sm text-ink-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-sm text-ink-500">No movements.</td></tr>
            )}
            {rows.map(m => {
              const isOwn = m.userId === user?.id;
              return (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-sm">
                    <div className="text-ink-900">{m.staff?.fullName || `#${m.userId}`}</div>
                    {m.isPassenger && <div className="text-xs text-ink-500">passenger</div>}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="text-ink-900">{m.fromLocation} → {m.toLocation}</div>
                    {m.distanceKm != null && <div className="text-xs text-ink-500">{Number(m.distanceKm).toLocaleString()} km</div>}
                  </td>
                  <td className="px-3 py-2 text-sm text-ink-700">{m.purpose || '—'}</td>
                  <td className="px-3 py-2 text-sm text-ink-700">
                    {m.vehicle ? `${m.vehicle.type}${m.vehicle.plateNo ? ` ${m.vehicle.plateNo}` : ''}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-600">
                    {m.plannedDepartureAt && <div>Dep {fmtTime(m.plannedDepartureAt)}</div>}
                    {m.plannedReturnAt && <div>Ret {fmtTime(m.plannedReturnAt)}</div>}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-600">
                    {m.departureAt && <div>Dep {fmtTime(m.departureAt)}</div>}
                    {m.arrivalAt && <div>Arr {fmtTime(m.arrivalAt)}</div>}
                    {m.returnAt && <div>Ret {fmtTime(m.returnAt)}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[m.status] || 'bg-ink-100'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm space-x-2 whitespace-nowrap">
                    {tab === 'team' && m.status === 'Planned' && isApprover && !isOwn && (
                      <>
                        <button disabled={busy} onClick={() => onApprove(m)} className="text-green-700 hover:underline">Approve</button>
                        <button disabled={busy} onClick={() => onReject(m)}  className="text-red-700 hover:underline">Reject</button>
                      </>
                    )}
                    {isOwn && ['Planned', 'Approved'].includes(m.status) && (
                      <button disabled={busy} onClick={() => onDepart(m)} className="text-blue-600 hover:underline">Depart</button>
                    )}
                    {isOwn && m.status === 'InMovement' && (
                      <button disabled={busy} onClick={() => onArrive(m)} className="text-teal-700 hover:underline">Arrive</button>
                    )}
                    {isOwn && ['InMovement', 'Arrived'].includes(m.status) && (
                      <button disabled={busy} onClick={() => onReturn(m)} className="text-emerald-700 hover:underline">Return</button>
                    )}
                    {isOwn && !['Returned', 'Cancelled', 'Rejected'].includes(m.status) && (
                      <button disabled={busy} onClick={() => onCancel(m)} className="text-ink-500 hover:underline">Cancel</button>
                    )}
                    {isOwn && m.status === 'Returned' && !m.isPassenger && (
                      <button disabled={busy} onClick={() => onClaimFuel(m)} className="text-amber-700 hover:underline">Claim fuel</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewMovementModal
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}
