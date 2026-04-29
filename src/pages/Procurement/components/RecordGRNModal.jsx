import React, { useState } from 'react';
import { ProcurementAPI } from '../../../services/api';

export default function RecordGRNModal({ po, onClose, onSaved }) {
  const [deliveryNoteNo, setDeliveryNoteNo] = useState('');
  const [deliveryNoteUrl, setDeliveryNoteUrl] = useState('');
  const [location, setLocation] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [lines, setLines] = useState(
    (po.lines || []).map(l => ({
      poLineId: l.id,
      itemDescription: l.itemDescription,
      maxQty: Number(l.qty),
      qtyReceived: Number(l.qty),
      qtyAccepted: Number(l.qty),
      qtyRejected: 0,
      rejectionReason: ''
    }))
  );
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const updateLine = (i, patch) => {
    setLines(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const submit = async () => {
    setError(null);
    // Auto-balance accepted/rejected to match received
    const cleaned = lines.map(l => {
      const recvd = Number(l.qtyReceived || 0);
      const rej = Math.max(0, Math.min(Number(l.qtyRejected || 0), recvd));
      const acc = Math.max(0, recvd - rej);
      return { ...l, qtyReceived: recvd, qtyAccepted: acc, qtyRejected: rej };
    });
    if (cleaned.every(l => l.qtyReceived === 0)) {
      setError('At least one line must have qtyReceived > 0');
      return;
    }
    setSubmitting(true);
    try {
      await ProcurementAPI.createGRN(po.id, {
        deliveryNoteNo,
        deliveryNoteUrl,
        location,
        conditionNotes,
        lines: cleaned.map(l => ({
          poLineId: l.poLineId,
          itemDescription: l.itemDescription,
          qtyReceived: l.qtyReceived,
          qtyAccepted: l.qtyAccepted,
          qtyRejected: l.qtyRejected,
          rejectionReason: l.qtyRejected > 0 ? l.rejectionReason : null
        }))
      });
      onSaved?.();
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Record Goods Receipt — {po.poNumber}</h2>
          <p className="text-xs text-gray-500 mt-1">Vendor: {po.vendor?.vendorName || po.vendorName}</p>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Delivery note #</span>
              <input
                value={deliveryNoteNo}
                onChange={(e) => setDeliveryNoteNo(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Receiving location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Delivery note photo URL</span>
            <input
              value={deliveryNoteUrl}
              onChange={(e) => setDeliveryNoteUrl(e.target.value)}
              placeholder="/uploads/..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Line receipt</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2">Item</th>
                    <th className="text-right px-3 py-2">PO Qty</th>
                    <th className="text-right px-3 py-2">Received</th>
                    <th className="text-right px-3 py-2">Rejected</th>
                    <th className="text-left px-3 py-2">Rejection reason</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 border-b border-gray-100">{l.itemDescription}</td>
                      <td className="px-3 py-2 border-b border-gray-100 text-right">{l.maxQty}</td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.qtyReceived}
                          onChange={(e) => updateLine(i, { qtyReceived: e.target.value })}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.qtyRejected}
                          onChange={(e) => updateLine(i, { qtyRejected: e.target.value })}
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        {Number(l.qtyRejected) > 0 && (
                          <input
                            value={l.rejectionReason}
                            onChange={(e) => updateLine(i, { rejectionReason: e.target.value })}
                            placeholder="Reason"
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Condition notes</span>
            <textarea
              rows={2}
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >Cancel</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save GRN draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
