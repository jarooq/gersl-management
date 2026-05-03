import React, { useEffect, useState } from 'react';
import { ProcurementAPI } from '../../../services/api';

const blankLine = () => ({ itemDescription: '', qty: 1, unit: '', unitPrice: 0 });

export default function RecordQuotationModal({ rfq, vendors = [], existingQuotation = null, onClose, onSaved }) {
  const editing = !!existingQuotation;
  const [vendorId, setVendorId] = useState(existingQuotation?.vendorId || vendors[0]?.id || '');
  const [totalAmount, setTotalAmount] = useState(existingQuotation?.totalAmount || '');
  const [currency, setCurrency] = useState(existingQuotation?.currency || 'LKR');
  const [deliveryDays, setDeliveryDays] = useState(existingQuotation?.deliveryDays ?? '');
  const [validityDays, setValidityDays] = useState(existingQuotation?.validityDays ?? '');
  const [paymentTerms, setPaymentTerms] = useState(existingQuotation?.paymentTerms || rfq?.paymentTerms || '');
  const [technicalComplianceScore, setTechnicalComplianceScore] = useState(
    existingQuotation?.technicalComplianceScore ?? ''
  );
  const [notes, setNotes] = useState(existingQuotation?.notes || '');
  const [lines, setLines] = useState(
    existingQuotation?.lines?.length
      ? existingQuotation.lines.map(l => ({
          itemDescription: l.itemDescription,
          qty: Number(l.qty),
          unit: l.unit || '',
          unitPrice: Number(l.unitPrice)
        }))
      : [blankLine()]
  );
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Auto-update totalAmount when lines change (only if user has lines populated)
    const hasLines = lines.some(l => l.itemDescription || l.unitPrice);
    if (hasLines) {
      const sum = lines.reduce((acc, l) => acc + Number(l.qty || 0) * Number(l.unitPrice || 0), 0);
      setTotalAmount(Number(sum.toFixed(2)));
    }
  }, [lines]);

  const updateLine = (i, field, value) => {
    setLines(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };
  const addLine = () => setLines(prev => [...prev, blankLine()]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!vendorId) { setError('Vendor is required'); return; }
    const cleanLines = lines.filter(l => l.itemDescription && Number(l.unitPrice) >= 0);
    const payload = {
      vendorId: Number(vendorId),
      totalAmount: Number(totalAmount),
      currency,
      deliveryDays: deliveryDays === '' ? null : Number(deliveryDays),
      validityDays: validityDays === '' ? null : Number(validityDays),
      paymentTerms,
      technicalComplianceScore: technicalComplianceScore === '' ? null : Number(technicalComplianceScore),
      notes,
      lines: cleanLines
    };

    setSubmitting(true);
    try {
      if (editing) {
        await ProcurementAPI.updateQuotation(existingQuotation.id, payload);
      } else {
        await ProcurementAPI.createQuotation(rfq.id, payload);
      }
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-900">
            {editing ? 'Edit Quotation' : 'Record Quotation'}
          </h2>
          <p className="text-xs text-ink-500 mt-1">{rfq.rfqNumber}</p>
        </div>

        <form onSubmit={submit} className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Vendor</span>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                disabled={editing}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Select vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.vendorName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Currency</span>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 8))}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Delivery (days)</span>
              <input
                type="number"
                min={0}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Validity (days)</span>
              <input
                type="number"
                min={0}
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Tech compliance (0-100)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={technicalComplianceScore}
                onChange={(e) => setTechnicalComplianceScore(e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Payment terms</span>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
            />
          </label>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-700">Line items</span>
              <button type="button" onClick={addLine} className="text-sm text-navy-700 hover:underline">+ Add line</button>
            </div>
            <div className="mt-2 space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input
                    placeholder="Item description"
                    value={l.itemDescription}
                    onChange={(e) => updateLine(i, 'itemDescription', e.target.value)}
                    className="col-span-5 rounded-md border border-ink-200 px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={l.qty}
                    onChange={(e) => updateLine(i, 'qty', e.target.value)}
                    className="col-span-2 rounded-md border border-ink-200 px-2 py-1 text-sm"
                  />
                  <input
                    placeholder="Unit"
                    value={l.unit}
                    onChange={(e) => updateLine(i, 'unit', e.target.value)}
                    className="col-span-2 rounded-md border border-ink-200 px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit price"
                    value={l.unitPrice}
                    onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                    className="col-span-2 rounded-md border border-ink-200 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="col-span-1 text-red-600 hover:text-red-800 text-sm"
                  >×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Total amount</span>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Notes</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
            />
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>
          )}
        </form>

        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-md hover:bg-ink-50"
          >Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition disabled:opacity-50"
          >
            {submitting ? 'Saving…' : (editing ? 'Save' : 'Record')}
          </button>
        </div>
      </div>
    </div>
  );
}
