import React, { useEffect, useMemo, useState } from 'react';
import { MovementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import NewMovementModal from './components/NewMovementModal';

const STATUS_BADGE = {
  Planned:    'bg-gray-100 text-gray-700',
  Approved:   'bg-blue-100 text-blue-700',
  InMovement: 'bg-indigo-100 text-indigo-700',
  Arrived:    'bg-teal-100 text-teal-700',
  Returned:   'bg-green-100 text-green-700',
  Cancelled:  'bg-gray-200 text-gray-600',
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Movement register</h1>
          <p className="text-sm text-gray-500">Field-trip log: plan, depart, arrive, return.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >New movement</button>
      </header>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'mine' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >My movements</button>
        {isApprover && (
          <button
            onClick={() => setTab('team')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'team' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >Team queue</button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Planned</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading && <tr><td colSpan={8} className="p-4 text-center text-sm text-gray-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-sm text-gray-500">No movements.</td></tr>
            )}
            {rows.map(m => {
              const isOwn = m.userId === user?.id;
              return (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-sm">
                    <div className="text-gray-900">{m.staff?.fullName || `#${m.userId}`}</div>
                    {m.isPassenger && <div className="text-xs text-gray-500">passenger</div>}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="text-gray-900">{m.fromLocation} → {m.toLocation}</div>
                    {m.distanceKm != null && <div className="text-xs text-gray-500">{Number(m.distanceKm).toLocaleString()} km</div>}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700">{m.purpose || '—'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">
                    {m.vehicle ? `${m.vehicle.type}${m.vehicle.plateNo ? ` ${m.vehicle.plateNo}` : ''}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {m.plannedDepartureAt && <div>Dep {fmtTime(m.plannedDepartureAt)}</div>}
                    {m.plannedReturnAt && <div>Ret {fmtTime(m.plannedReturnAt)}</div>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {m.departureAt && <div>Dep {fmtTime(m.departureAt)}</div>}
                    {m.arrivalAt && <div>Arr {fmtTime(m.arrivalAt)}</div>}
                    {m.returnAt && <div>Ret {fmtTime(m.returnAt)}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[m.status] || 'bg-gray-100'}`}>
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
                      <button disabled={busy} onClick={() => onCancel(m)} className="text-gray-500 hover:underline">Cancel</button>
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
