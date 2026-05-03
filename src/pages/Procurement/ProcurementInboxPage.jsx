import React, { useEffect, useMemo, useState } from 'react';
import { ProcurementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import AssignToOfficerModal from './components/AssignToOfficerModal';
import RFQBuilderModal from './components/RFQBuilderModal';

const URGENCY_BADGE = {
  Low: 'bg-ink-100 text-ink-700',
  Normal: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700'
};

const STATUS_BADGE = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-indigo-100 text-indigo-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  'In-Sourcing': 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-ink-100 text-ink-600'
};

const formatMoney = (amount, currency = 'LKR') => {
  if (amount == null) return '—';
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function ProcurementInboxPage() {
  const { user } = useAuth();
  const isManager = useMemo(
    () => hasPermission(user, 'procurement:request:assign'),
    [user]
  );

  const [activeTab, setActiveTab] = useState(isManager ? 'unassigned' : 'mine');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [rfqTarget, setRfqTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const fn = activeTab === 'unassigned' ? ProcurementAPI.getUnassigned : ProcurementAPI.getMyQueue;
      const res = await fn({ limit: 100 });
      setRows(res?.data?.requisitions || []);
    } catch (e) {
      setError(e?.message || 'Failed to load procurement inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeTab]);

  const handleAssigned = () => {
    setAssignTarget(null);
    load();
  };

  const handleRFQCreated = () => {
    setRfqTarget(null);
    load();
  };

  const canStartRFQ = (r) => {
    if (!r) return false;
    if (['Closed', 'Cancelled', 'Rejected', 'Converted'].includes(r.status)) return false;
    if (activeTab !== 'mine') return false;
    return true;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Procurement</p>
            <h1 className="text-h2 font-bold leading-tight">Procurement Inbox</h1>
            <p className="text-ink-200 text-sm mt-0.5">
              {isManager
                ? 'Assign incoming procurement requests to officers and choose the procurement method.'
                : 'Requests assigned to you. Pick one to start the RFQ flow.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-ink-100">
        {isManager && (
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === 'unassigned'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            Unassigned
          </button>
        )}
        <button
          onClick={() => setActiveTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            activeTab === 'mine'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          My Queue
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4 text-sm">{error}</div>
      )}

      <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">PR #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Department</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Estimated</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Urgency</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Method</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Officer</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-ink-500">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-ink-500">
                {activeTab === 'unassigned' ? 'No unassigned requests.' : 'Nothing in your queue right now.'}
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-sm text-ink-900 font-mono">{r.requisitionNumber || `PR-${r.id}`}</td>
                <td className="px-4 py-2 text-sm text-ink-900">{r.title}</td>
                <td className="px-4 py-2 text-sm text-ink-600">{r.department || '—'}</td>
                <td className="px-4 py-2 text-sm text-ink-900">{formatMoney(r.estimatedAmount, r.currency)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${URGENCY_BADGE[r.urgency] || URGENCY_BADGE.Normal}`}>
                    {r.urgency || 'Normal'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[r.status] || 'bg-ink-100 text-ink-700'}`}>
                    {r.status || '—'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-ink-600">{r.procurementMethod || '—'}</td>
                <td className="px-4 py-2 text-sm text-ink-600">
                  {r.assignedOfficer ? r.assignedOfficer.fullName : '—'}
                </td>
                <td className="px-4 py-2">
                  {activeTab === 'unassigned' && isManager && (
                    <button
                      onClick={() => setAssignTarget(r)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Assign
                    </button>
                  )}
                  {canStartRFQ(r) && (
                    <button
                      onClick={() => setRfqTarget(r)}
                      className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                    >
                      Start RFQ
                    </button>
                  )}
                  {!canStartRFQ(r) && activeTab === 'mine' && (
                    <span className="text-xs text-ink-400">{r.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assignTarget && (
        <AssignToOfficerModal
          requisition={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}

      {rfqTarget && (
        <RFQBuilderModal
          requisition={rfqTarget}
          onClose={() => setRfqTarget(null)}
          onCreated={handleRFQCreated}
        />
      )}
    </div>
  );
}
