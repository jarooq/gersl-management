import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProcurementAPI } from '../../services/api';

const STATUS_BADGE = {
  Draft: 'bg-gray-100 text-gray-700',
  'Pending-Approval': 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-700',
  Issued: 'bg-indigo-100 text-indigo-700',
  Acknowledged: 'bg-teal-100 text-teal-700',
  'Partial-Received': 'bg-purple-100 text-purple-700',
  Received: 'bg-green-100 text-green-800',
  Closed: 'bg-green-200 text-green-900',
  Cancelled: 'bg-red-100 text-red-700'
};

const fmt = (amount, currency = 'LKR') => {
  if (amount == null) return '—';
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function PODetailPage() {
  const { id } = useParams();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ProcurementAPI.getPO(id);
      setPo(res?.data?.po || null);
    } catch (e) {
      setError(e?.message || 'Failed to load PO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const action = async (fn, ...args) => {
    setBusy(true);
    try {
      await fn(...args);
      await load();
    } catch (e) {
      alert(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    const reason = window.prompt('Rejection reason?');
    if (!reason) return;
    action(() => ProcurementAPI.rejectPO(id, reason));
  };

  const onCancel = async () => {
    const reason = window.prompt('Cancel reason (optional)?') || '';
    action(() => ProcurementAPI.cancelPO(id, reason));
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (error)   return <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>;
  if (!po)     return <div className="p-6 text-sm text-gray-500">PO not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <Link to="/admin/procurement/inbox" className="text-sm text-blue-600 hover:underline">&larr; Procurement</Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{po.poNumber}</h1>
          <p className="text-sm text-gray-500">
            {po.requisition?.requisitionNumber || `PR-${po.requisitionId}`} — {po.requisition?.title || ''}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[po.status] || 'bg-gray-100 text-gray-700'}`}>
          {po.status}
        </span>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4 text-sm">
          <div className="text-gray-500 text-xs uppercase mb-1">Vendor</div>
          <div className="font-medium text-gray-900">{po.vendor?.vendorName || po.vendorName || '—'}</div>
          <div className="text-gray-600">{po.vendor?.email || ''}</div>
          <div className="text-gray-600">{po.vendor?.phone || ''}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4 text-sm">
          <div className="text-gray-500 text-xs uppercase mb-1">Delivery</div>
          <div>By: {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '—'}</div>
          <div className="text-gray-600">{po.deliveryAddress || '—'}</div>
          <div className="text-gray-600">Terms: {po.paymentTerms || '—'}</div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold">Line items</div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Description</th>
              <th className="text-right px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">Unit</th>
              <th className="text-right px-4 py-2">Unit Price</th>
              <th className="text-right px-4 py-2">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(po.lines || []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No line items.</td></tr>
            )}
            {(po.lines || []).map(l => (
              <tr key={l.id}>
                <td className="px-4 py-2">{l.itemDescription}</td>
                <td className="px-4 py-2 text-right">{Number(l.qty).toLocaleString()}</td>
                <td className="px-4 py-2">{l.unit || ''}</td>
                <td className="px-4 py-2 text-right">{fmt(l.unitPrice, po.currency)}</td>
                <td className="px-4 py-2 text-right">{fmt(l.lineTotal, po.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={4} className="px-4 py-2 text-right text-gray-600">Subtotal</td>
              <td className="px-4 py-2 text-right">{fmt(po.subtotal, po.currency)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={4} className="px-4 py-2 text-right text-gray-600">Tax</td>
              <td className="px-4 py-2 text-right">{fmt(po.tax, po.currency)}</td>
            </tr>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={4} className="px-4 py-2 text-right">Total</td>
              <td className="px-4 py-2 text-right">{fmt(po.totalAmount, po.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {po.approvalNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-900">
          <strong>Approval notes:</strong> {po.approvalNotes}
        </div>
      )}
      {po.cancelReason && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-900">
          <strong>Cancellation reason:</strong> {po.cancelReason}
        </div>
      )}

      <section className="flex flex-wrap gap-2">
        {po.status === 'Draft' && (
          <button
            disabled={busy}
            onClick={() => action(ProcurementAPI.submitPO, id)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >Submit for approval</button>
        )}
        {po.status === 'Pending-Approval' && (
          <>
            <button
              disabled={busy}
              onClick={() => action(ProcurementAPI.approvePO, id)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            >Approve</button>
            <button
              disabled={busy}
              onClick={onReject}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded hover:bg-red-50"
            >Reject</button>
          </>
        )}
        {po.status === 'Approved' && (
          <button
            disabled={busy}
            onClick={() => action(ProcurementAPI.issuePO, id)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
          >Issue to vendor</button>
        )}
        {po.status === 'Issued' && (
          <button
            disabled={busy}
            onClick={() => action(ProcurementAPI.acknowledgePO, id)}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded hover:bg-teal-700 disabled:opacity-50"
          >Mark acknowledged</button>
        )}
        {!['Cancelled', 'Closed', 'Received'].includes(po.status) && (
          <button
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >Cancel PO</button>
        )}
        <a
          href={ProcurementAPI.poPreviewUrl(id)}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >Preview / print</a>
      </section>

      <section className="text-xs text-gray-500 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>Created by {po.creator?.fullName || '—'}</div>
        <div>Approved by {po.approver?.fullName || '—'}{po.approvalDate ? ` on ${new Date(po.approvalDate).toLocaleDateString()}` : ''}</div>
        <div>Issued by {po.issuer?.fullName || '—'}{po.issuedAt ? ` on ${new Date(po.issuedAt).toLocaleDateString()}` : ''}</div>
        <div>{po.acknowledgedAt ? `Acknowledged ${new Date(po.acknowledgedAt).toLocaleDateString()}` : ''}</div>
      </section>
    </div>
  );
}
