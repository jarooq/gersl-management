import React, { useEffect, useMemo, useState } from 'react';
import { ProcurementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import AssignToOfficerModal from './components/AssignToOfficerModal';
import RFQBuilderModal from './components/RFQBuilderModal';

const URGENCY_BADGE = {
  Low: 'bg-gray-100 text-gray-700',
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
  Cancelled: 'bg-gray-100 text-gray-600'
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
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Procurement Inbox</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isManager
            ? 'Assign incoming procurement requests to officers and choose the procurement method.'
            : 'Requests assigned to you. Pick one to start the RFQ flow.'}
        </p>
      </header>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {isManager && (
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === 'unassigned'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Queue
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4 text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PR #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estimated</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Officer</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                {activeTab === 'unassigned' ? 'No unassigned requests.' : 'Nothing in your queue right now.'}
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-sm text-gray-900 font-mono">{r.requisitionNumber || `PR-${r.id}`}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.title}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{r.department || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{formatMoney(r.estimatedAmount, r.currency)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${URGENCY_BADGE[r.urgency] || URGENCY_BADGE.Normal}`}>
                    {r.urgency || 'Normal'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-700'}`}>
                    {r.status || '—'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">{r.procurementMethod || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
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
                    <span className="text-xs text-gray-400">{r.status}</span>
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
