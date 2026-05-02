import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcurementAPI } from '../../../services/api';
import { API_BASE_URL } from '../../../config/apiBase';

// Helper: pick today + 7d formatted as datetime-local default.
const defaultClosingDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setSeconds(0, 0);
  // toISOString gives Z; <input type="datetime-local"> wants local without TZ.
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 16);
};

export default function RFQBuilderModal({ requisition, onClose, onCreated }) {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [createdRfq, setCreatedRfq] = useState(null);

  const [scopeOfWork, setScopeOfWork] = useState(requisition?.description || '');
  const [closingDate, setClosingDate] = useState(defaultClosingDate);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 days from invoice');
  const [termsOfDelivery, setTermsOfDelivery] = useState('Delivered to GERSL HQ');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Reuse the existing vendors list endpoint.
        const res = await fetch(`${API_BASE_URL}/procurement/vendors`, {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` }
        }).then(r => r.json());
        if (cancelled) return;
        const list = res?.data?.vendors || res?.vendors || res?.data || [];
        setVendors(list.filter(v => v.status === 'Active'));
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load vendors');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v =>
      v.vendorName?.toLowerCase().includes(q) ||
      v.vendorType?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q)
    );
  }, [vendors, search]);

  const toggleVendor = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submitDraft = async (e) => {
    e?.preventDefault?.();
    if (selectedIds.size < 1) {
      setError('Pick at least one vendor');
      return;
    }
    if (selectedIds.size < 3) {
      // Soft warning; the policy is 3-quote default. Not a hard block.
      const ok = window.confirm('Fewer than 3 vendors selected — donor policy usually requires 3. Continue?');
      if (!ok) return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await ProcurementAPI.createRFQ({
        requisitionId: requisition.id,
        scopeOfWork,
        closingDate: new Date(closingDate).toISOString(),
        termsOfDelivery,
        paymentTerms,
        vendorIds: Array.from(selectedIds)
      });
      setCreatedRfq(res?.data?.rfq);
    } catch (e) {
      setError(e?.message || 'Failed to create RFQ');
    } finally {
      setSubmitting(false);
    }
  };

  const sendNow = async () => {
    if (!createdRfq) return;
    setError(null);
    setSending(true);
    try {
      await ProcurementAPI.sendRFQ(createdRfq.id);
      onCreated?.();
    } catch (e) {
      setError(e?.message || 'Failed to send RFQ');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {createdRfq ? `RFQ ${createdRfq.rfqNumber} — Draft created` : 'Create RFQ'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {requisition.requisitionNumber || `PR-${requisition.id}`} — {requisition.title}
          </p>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          {!createdRfq && (
            <form onSubmit={submitDraft} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Scope of work</span>
                <textarea
                  rows={3}
                  value={scopeOfWork}
                  onChange={(e) => setScopeOfWork(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Closing date</span>
                  <input
                    type="datetime-local"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Payment terms</span>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Terms of delivery</span>
                <input
                  type="text"
                  value={termsOfDelivery}
                  onChange={(e) => setTermsOfDelivery(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Invite vendors <span className="text-gray-400">({selectedIds.size} selected)</span>
                  </span>
                  <input
                    placeholder="Search vendors…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm rounded-md border border-gray-300 px-2 py-1 w-48"
                  />
                </div>
                <div className="border border-gray-200 rounded-md max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {loading && <div className="p-3 text-sm text-gray-500">Loading vendors…</div>}
                  {!loading && filteredVendors.length === 0 && (
                    <div className="p-3 text-sm text-gray-500">No active vendors found.</div>
                  )}
                  {!loading && filteredVendors.map(v => (
                    <label key={v.id} className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id)}
                        onChange={() => toggleVendor(v.id)}
                        className="mt-0.5"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{v.vendorName}</div>
                        <div className="text-gray-500 text-xs">
                          {v.vendorType || '—'} • {v.email || 'no email'} • {v.phone || ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>
              )}
            </form>
          )}

          {createdRfq && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-sm">
                Draft RFQ <strong>{createdRfq.rfqNumber}</strong> created with {createdRfq.invitations?.length || 0} vendor(s).
              </div>
              <p className="text-sm text-gray-600">
                Click <em>Send</em> to mark the RFQ as Sent and email each invited vendor, or
                <button
                  type="button"
                  onClick={() => { onCreated?.(); navigate(`/admin/procurement/rfqs/${createdRfq.id}`); }}
                  className="text-blue-600 hover:underline ml-1"
                >open the workspace</button>
                to record quotations.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {createdRfq ? 'Close' : 'Cancel'}
          </button>
          {!createdRfq && (
            <button
              type="button"
              onClick={submitDraft}
              disabled={submitting || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create draft'}
            </button>
          )}
          {createdRfq && (
            <button
              type="button"
              onClick={sendNow}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send to vendors'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
