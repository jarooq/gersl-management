import React, { useEffect } from 'react';
import { AlertTriangle, X, ArrowRight, Users } from 'lucide-react';

// SimilarBeneficiariesWarning
// -------------------------------------------------------------
// A soft-block modal shown before creating a beneficiary if the
// backend's /api/beneficiaries/similar endpoint returned candidate
// matches. The user can either:
//
//   - "Cancel" — dismiss the modal and adjust the form
//   - "Create anyway" — proceed with the create (dupes happen: a
//     shared name across districts, sibling records, etc.)
//
// This is a data-quality guard, not a hard rule — dupes get created
// only intentionally.

const reasonColor = (reason) => {
  if (reason.includes('NIC'))     return 'bg-hs-red-50 text-hs-red-700';
  if (reason.includes('phone'))   return 'bg-orange-50 text-orange-700';
  if (reason.includes('DOB'))     return 'bg-orange-50 text-orange-700';
  return 'bg-hs-slate-100 text-hs-slate-700';
};

const SimilarBeneficiariesWarning = ({ matches, onCancel, onProceed }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const count = matches.length;

  return (
    <div
      className="fixed inset-0 bg-hs-navy-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg2 shadow-hs-drawer max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-hs-navy-800 text-white rounded-t-lg2 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-orange-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-300">
                Possible duplicate
              </p>
              <h3 className="text-base font-display font-semibold leading-tight">
                {count} similar {count === 1 ? 'beneficiary' : 'beneficiaries'} already {count === 1 ? 'exists' : 'exist'}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-hs-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-sm text-hs-slate-600">
            Please review these records before creating a new one — you might be looking at the same person.
          </p>

          {matches.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-md border border-hs-slate-200 bg-hs-slate-50/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-hs-navy-800">{m.fullName || '—'}</p>
                  <p className="text-[11px] text-hs-slate-500 font-mono">{m.beneficiaryId || '—'}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-hs-slate-200 text-hs-slate-600 shrink-0">
                  {m.status || 'Unknown'}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-hs-navy-700">
                {m.nic && <div><span className="text-hs-slate-500">NIC: </span>{m.nic}</div>}
                {m.contactNumber && <div><span className="text-hs-slate-500">Phone: </span>{m.contactNumber}</div>}
                {m.district && <div><span className="text-hs-slate-500">District: </span>{m.district}</div>}
                {m.gender && <div><span className="text-hs-slate-500">Gender: </span>{m.gender}</div>}
              </div>

              {m.reasons?.length > 0 && (
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {m.reasons.map((r) => (
                    <span
                      key={r}
                      className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${reasonColor(r)}`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-hs-slate-200 bg-hs-slate-50 flex items-center justify-between gap-2 rounded-b-lg2">
          <p className="text-[11px] text-hs-slate-500 flex items-center gap-1">
            <Users size={12} />
            <span>Duplicates hurt reporting accuracy.</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-semibold text-hs-navy-700 hover:bg-hs-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onProceed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-md transition"
            >
              <span>Create anyway</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarBeneficiariesWarning;
