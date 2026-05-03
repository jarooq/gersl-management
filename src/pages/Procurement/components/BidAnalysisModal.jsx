import React, { useMemo, useState } from 'react';
import { ProcurementAPI } from '../../../services/api';

const DEFAULT_CRITERIA = { price: 50, delivery: 20, quality: 20, compliance: 10 };

const totalWeights = (c) => Object.values(c).reduce((acc, v) => acc + Number(v || 0), 0);

export default function BidAnalysisModal({ rfq, quotations = [], existing = null, onClose, onSaved }) {
  const editing = !!existing;
  const [criteria, setCriteria] = useState(
    existing?.scoringCriteria || DEFAULT_CRITERIA
  );
  const [scores, setScores] = useState(() => {
    if (existing?.scores?.length) {
      const map = {};
      existing.scores.forEach(s => {
        map[`${s.vendorId}:${s.criterionKey}`] = Number(s.rawScore);
      });
      return map;
    }
    // Auto-suggest: lowest price gets 100; others scaled inversely.
    const minPrice = Math.min(...quotations.map(q => Number(q.totalAmount)));
    const map = {};
    quotations.forEach(q => {
      Object.keys(DEFAULT_CRITERIA).forEach(k => {
        if (k === 'price' && Number.isFinite(minPrice) && minPrice > 0) {
          map[`${q.vendorId}:${k}`] = Math.round((minPrice / Number(q.totalAmount)) * 100);
        } else if (k === 'compliance' && q.technicalComplianceScore != null) {
          map[`${q.vendorId}:${k}`] = Number(q.technicalComplianceScore);
        } else {
          map[`${q.vendorId}:${k}`] = 50;
        }
      });
    });
    return map;
  });
  const [recommendedVendorId, setRecommendedVendorId] = useState(
    existing?.recommendedVendorId || quotations[0]?.vendorId || ''
  );
  const [rationale, setRationale] = useState(existing?.rationale || '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const weightTotal = totalWeights(criteria);

  const weightedTotals = useMemo(() => {
    const totals = {};
    quotations.forEach(q => {
      let total = 0;
      Object.entries(criteria).forEach(([k, w]) => {
        const raw = Number(scores[`${q.vendorId}:${k}`] ?? 0);
        total += (raw * Number(w)) / 100;
      });
      totals[q.vendorId] = Number(total.toFixed(2));
    });
    return totals;
  }, [scores, criteria, quotations]);

  const updateCriterionWeight = (key, value) => {
    setCriteria(prev => ({ ...prev, [key]: Number(value) }));
  };

  const updateScore = (vendorId, key, value) => {
    setScores(prev => ({ ...prev, [`${vendorId}:${key}`]: Number(value) }));
  };

  const submit = async () => {
    setError(null);
    if (Math.abs(weightTotal - 100) > 0.01) {
      setError(`Criterion weights must total 100 (currently ${weightTotal})`);
      return;
    }
    if (!recommendedVendorId) {
      setError('Pick a recommended vendor');
      return;
    }
    const scorePayload = quotations.flatMap(q =>
      Object.keys(criteria).map(k => ({
        vendorId: q.vendorId,
        criterionKey: k,
        rawScore: Number(scores[`${q.vendorId}:${k}`] ?? 0),
        quotationId: q.id
      }))
    );
    setSubmitting(true);
    try {
      if (editing) {
        await ProcurementAPI.updateBidAnalysis(existing.id, {
          scoringCriteria: criteria,
          scores: scorePayload,
          recommendedVendorId: Number(recommendedVendorId),
          rationale
        });
      } else {
        await ProcurementAPI.createBidAnalysis({
          requisitionId: rfq.requisitionId,
          rfqId: rfq.id,
          scoringCriteria: criteria,
          scores: scorePayload,
          recommendedVendorId: Number(recommendedVendorId),
          rationale
        });
      }
      onSaved?.();
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-900">{editing ? 'Edit Bid Analysis' : 'Build Bid Analysis'}</h2>
          <p className="text-xs text-ink-500 mt-1">{rfq.rfqNumber} — {quotations.length} quotation(s)</p>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-ink-700">Scoring criteria (weights must total 100)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {Object.keys(criteria).map(key => (
                <label key={key} className="block">
                  <span className="text-xs uppercase text-ink-500">{key}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={criteria[key]}
                    onChange={(e) => updateCriterionWeight(key, e.target.value)}
                    className="mt-1 block w-full rounded-md border border-ink-200 px-2 py-1 text-sm"
                  />
                </label>
              ))}
            </div>
            <div className={`text-xs mt-1 ${Math.abs(weightTotal - 100) > 0.01 ? 'text-red-600' : 'text-ink-500'}`}>
              Total weight: {weightTotal}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 border-b border-ink-100">Vendor</th>
                  {Object.keys(criteria).map(k => (
                    <th key={k} className="text-left px-3 py-2 border-b border-ink-100 text-xs uppercase text-ink-600">
                      {k} <span className="text-ink-400">({criteria[k]})</span>
                    </th>
                  ))}
                  <th className="text-right px-3 py-2 border-b border-ink-100 text-xs uppercase text-ink-600">Weighted total</th>
                  <th className="text-center px-3 py-2 border-b border-ink-100 text-xs uppercase text-ink-600">Recommend</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.vendorId}>
                    <td className="px-3 py-2 border-b border-ink-100">
                      <div className="font-medium text-ink-900">{q.vendor?.vendorName || `#${q.vendorId}`}</div>
                      <div className="text-xs text-ink-500">{q.currency} {Number(q.totalAmount).toLocaleString()}</div>
                    </td>
                    {Object.keys(criteria).map(k => (
                      <td key={k} className="px-2 py-2 border-b border-ink-100">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scores[`${q.vendorId}:${k}`] ?? ''}
                          onChange={(e) => updateScore(q.vendorId, k, e.target.value)}
                          className="w-20 rounded-md border border-ink-200 px-2 py-1 text-sm"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 border-b border-ink-100 text-right font-semibold">
                      {weightedTotals[q.vendorId] ?? 0}
                    </td>
                    <td className="px-3 py-2 border-b border-ink-100 text-center">
                      <input
                        type="radio"
                        name="recommended"
                        checked={Number(recommendedVendorId) === q.vendorId}
                        onChange={() => setRecommendedVendorId(q.vendorId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Rationale</span>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="mt-1 block w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
              placeholder="Why this vendor was selected — price/quality trade-off, compliance notes…"
            />
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-md hover:bg-ink-50"
          >Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : (editing ? 'Save' : 'Create draft')}
          </button>
        </div>
      </div>
    </div>
  );
}
