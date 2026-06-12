import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ProcurementAPI } from '../../services/api';
import RecordQuotationModal from './components/RecordQuotationModal';
import BidAnalysisModal from './components/BidAnalysisModal';

const formatMoney = (amount, currency = 'LKR') => {
  if (amount == null) return '—';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const STATUS_BADGE = {
  Draft: 'bg-ink-100 text-ink-700',
  Sent: 'bg-blue-100 text-blue-700',
  Closed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700'
};

const BA_STATUS_BADGE = {
  Draft: 'bg-ink-100 text-ink-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700'
};

export default function RFQWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [bidAnalyses, setBidAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [showBidAnalysisModal, setShowBidAnalysisModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rfqRes, qRes, baRes] = await Promise.all([
        ProcurementAPI.getRFQ(id),
        ProcurementAPI.listQuotationsForRFQ(id),
        ProcurementAPI.listBidAnalyses({ rfqId: id })
      ]);
      setRfq(rfqRes?.data?.rfq || null);
      setQuotations(qRes?.data?.quotations || []);
      setBidAnalyses(baRes?.data?.bidAnalyses || []);
    } catch (e) {
      setError(e?.message || 'Failed to load RFQ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load();   }, [id]);

  const invitedVendors = rfq?.invitations?.map(i => i.vendor).filter(Boolean) || [];
  const respondedVendorIds = useMemo(
    () => new Set(quotations.map(q => q.vendorId)),
    [quotations]
  );
  const pendingVendors = invitedVendors.filter(v => !respondedVendorIds.has(v.id));
  const approvedBA = bidAnalyses.find(ba => ba.status === 'Approved');
  const draftBA = bidAnalyses.find(ba => ba.status === 'Draft');
  const submittedBA = bidAnalyses.find(ba => ba.status === 'Submitted');

  const handleQuotationModalClose = () => {
    setShowQuotationModal(false);
    setEditingQuotation(null);
  };
  const handleQuotationSaved = () => {
    handleQuotationModalClose();
    load();
  };

  const onApprove = async (baId) => {
    try {
      await ProcurementAPI.approveBidAnalysis(baId);
      await load();
    } catch (e) {
      alert(e?.message || 'Approval failed');
    }
  };

  const onReject = async (baId) => {
    const reason = window.prompt('Rejection reason?');
    if (!reason) return;
    try {
      await ProcurementAPI.rejectBidAnalysis(baId, reason);
      await load();
    } catch (e) {
      alert(e?.message || 'Reject failed');
    }
  };

  const onSubmit = async (baId) => {
    try {
      await ProcurementAPI.submitBidAnalysis(baId);
      await load();
    } catch (e) {
      alert(e?.message || 'Submit failed');
    }
  };

  const onDraftPO = async (baId) => {
    try {
      const res = await ProcurementAPI.draftPOFromBidAnalysis({ bidAnalysisId: baId });
      const newPo = res?.data?.po;
      if (newPo?.id) navigate(`/admin/procurement/pos/${newPo.id}`);
    } catch (e) {
      alert(e?.message || 'Failed to draft PO');
    }
  };

  if (loading) return <div className="p-6 text-sm text-ink-500">Loading…</div>;
  if (error)   return <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>;
  if (!rfq)    return <div className="p-6 text-sm text-ink-500">RFQ not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <Link to="/admin/procurement/inbox" className="text-sm text-navy-700 hover:underline">&larr; Back to Inbox</Link>
          <h1 className="text-h1 text-ink-900 mt-1">{rfq.rfqNumber}</h1>
          <p className="text-sm text-ink-500">
            {rfq.requisition?.requisitionNumber || `PR-${rfq.requisitionId}`} — {rfq.requisition?.title || ''}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[rfq.status] || 'bg-ink-100 text-ink-700'}`}>
          {rfq.status}
        </span>
      </header>

      <section className="bg-white border border-ink-100 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-ink-500 text-xs">Closing date</div>
          <div className="text-ink-900">{rfq.closingDate ? new Date(rfq.closingDate).toLocaleString() : '—'}</div>
        </div>
        <div>
          <div className="text-ink-500 text-xs">Payment terms</div>
          <div className="text-ink-900">{rfq.paymentTerms || '—'}</div>
        </div>
        <div>
          <div className="text-ink-500 text-xs">Delivery terms</div>
          <div className="text-ink-900">{rfq.termsOfDelivery || '—'}</div>
        </div>
        <div>
          <div className="text-ink-500 text-xs">Invited vendors</div>
          <div className="text-ink-900">{invitedVendors.length}</div>
        </div>
      </section>

      <section className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Quotations</h2>
          {!approvedBA && (
            <button
              onClick={() => setShowQuotationModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800 shadow-card transition"
            >
              Record quotation
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-ink-100">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Vendor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Total</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Delivery</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Validity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Compliance</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase">Received</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-100">
            {quotations.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-ink-500">No quotations recorded yet.</td></tr>
            )}
            {quotations.map(q => (
              <tr key={q.id}>
                <td className="px-4 py-2 text-sm text-ink-900">{q.vendor?.vendorName || `#${q.vendorId}`}</td>
                <td className="px-4 py-2 text-sm text-ink-900 font-medium">{formatMoney(q.totalAmount, q.currency)}</td>
                <td className="px-4 py-2 text-sm text-ink-600">{q.deliveryDays != null ? `${q.deliveryDays} days` : '—'}</td>
                <td className="px-4 py-2 text-sm text-ink-600">{q.validityDays != null ? `${q.validityDays} days` : '—'}</td>
                <td className="px-4 py-2 text-sm text-ink-600">{q.technicalComplianceScore != null ? `${q.technicalComplianceScore}/100` : '—'}</td>
                <td className="px-4 py-2 text-sm text-ink-600">{q.receivedAt ? new Date(q.receivedAt).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-2 text-right">
                  {!q.isLocked && !approvedBA && (
                    <button
                      onClick={() => { setEditingQuotation(q); setShowQuotationModal(true); }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  )}
                  {q.isLocked && <span className="text-xs text-ink-400">Locked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pendingVendors.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 text-xs text-yellow-800">
            Awaiting quotation from: {pendingVendors.map(v => v.vendorName).join(', ')}
          </div>
        )}
      </section>

      <section className="bg-white border border-ink-100 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Bid Analysis</h2>
          {!approvedBA && quotations.length >= 1 && (
            <button
              onClick={() => setShowBidAnalysisModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
            >
              {draftBA || submittedBA ? 'Edit analysis' : 'Build analysis'}
            </button>
          )}
        </div>
        <div className="px-4 py-3 text-sm">
          {bidAnalyses.length === 0 && <div className="text-ink-500">No bid analysis yet.</div>}
          {bidAnalyses.map(ba => (
            <div key={ba.id} className="border border-ink-100 rounded-md p-3 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BA_STATUS_BADGE[ba.status]}`}>{ba.status}</span>
                  <span className="ml-2 text-ink-700">
                    Recommended: <strong>{ba.recommendedVendor?.vendorName || '—'}</strong>
                  </span>
                  <span className="ml-2 text-ink-500 text-xs">by {ba.preparer?.fullName || '—'}</span>
                </div>
                <div className="flex gap-2">
                  {ba.status === 'Draft' && (
                    <button onClick={() => onSubmit(ba.id)} className="text-sm text-navy-700 hover:underline">Submit</button>
                  )}
                  {ba.status === 'Submitted' && (
                    <>
                      <button onClick={() => onApprove(ba.id)} className="text-sm text-green-700 hover:underline">Approve</button>
                      <button onClick={() => onReject(ba.id)}  className="text-sm text-red-700 hover:underline">Reject</button>
                    </>
                  )}
                  {ba.status === 'Approved' && (
                    <button
                      onClick={() => onDraftPO(ba.id)}
                      className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    >Draft PO</button>
                  )}
                </div>
              </div>
              {ba.rationale && <p className="text-xs text-ink-600 mt-2">{ba.rationale}</p>}
              {ba.rejectionReason && <p className="text-xs text-red-700 mt-2">Rejected: {ba.rejectionReason}</p>}
            </div>
          ))}
        </div>
      </section>

      {showQuotationModal && (
        <RecordQuotationModal
          rfq={rfq}
          vendors={invitedVendors}
          existingQuotation={editingQuotation}
          onClose={handleQuotationModalClose}
          onSaved={handleQuotationSaved}
        />
      )}

      {showBidAnalysisModal && (
        <BidAnalysisModal
          rfq={rfq}
          quotations={quotations}
          existing={draftBA || submittedBA || null}
          onClose={() => setShowBidAnalysisModal(false)}
          onSaved={() => { setShowBidAnalysisModal(false); load(); }}
        />
      )}
    </div>
  );
}
