import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, MapPin, Clock, User, ChevronRight, X, Save, Camera, FileDown } from 'lucide-react';
import { WashAPI } from '../../services/api';

const STAGES = ['Ordered', 'Surveyed', 'Materials', 'Construction', 'Testing', 'HandedOver', 'Reported'];
const STAGE_COLORS = {
  Ordered:      'bg-ink-100 text-ink-700',
  Surveyed:     'bg-blue-100 text-blue-700',
  Materials:    'bg-indigo-100 text-indigo-700',
  Construction: 'bg-amber-100 text-amber-700',
  Testing:      'bg-purple-100 text-purple-700',
  HandedOver:   'bg-green-100 text-green-700',
  Reported:     'bg-emerald-100 text-emerald-700',
  Cancelled:    'bg-red-100 text-red-700',
};

const fmt = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const WashItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStageModal, setShowStageModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItem(await WashAPI.getItem(id)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-12 text-center text-ink-500">Loading…</div>;
  if (!item) return <div className="p-12 text-center text-red-700">Item not found</div>;

  const stageIdx = STAGES.indexOf(item.stage);
  const nextStage = stageIdx >= 0 && stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;
  const fundsGateBlocked =
    item.order?.workStartCondition === 'OnFundsReceived' && item.order?.paymentStatus !== 'Paid';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <button onClick={() => navigate(`/admin/wash/orders/${item.orderId}`)} className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft size={14} /> Back to order {item.order?.orderCode}
      </button>

      {/* Funds-gate warning — donor configured this order to start only after
          funds are received, and the order is still unpaid. Soft warning,
          not a hard block (server still allows the transition; admins can
          override with intent). */}
      {fundsGateBlocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg2 p-3 flex gap-2 items-start">
          <span className="text-amber-700 font-bold shrink-0 mt-0.5">⚠</span>
          <div className="text-sm">
            <p className="font-bold text-amber-900">Funds not received yet</p>
            <p className="text-amber-800">
              This order is set to start work only after donor payment (status: <strong>{item.order?.paymentStatus}</strong>).
              Advancing the stage now means GERSL is fronting the cost — make sure that's intentional.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">{item.itemCode} · WASH item</p>
        <h1 className="text-h2 font-bold leading-tight inline-flex items-center gap-2">
          <Droplets size={20} /> {item.beneficiaryName || item.beneficiary?.fullName || 'Unnamed beneficiary'}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span><span className="text-mission-300">Type:</span> <strong>{item.unitType}</strong></span>
          <span><span className="text-mission-300">District:</span> {item.district || '—'}</span>
          <span><span className="text-mission-300">Stage:</span> <span className={`px-2 py-0.5 rounded text-xs font-bold ${STAGE_COLORS[item.stage]}`}>{item.stage}</span></span>
        </div>
      </div>

      {/* Stage progression bar */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STAGES.map((s, i) => {
            const reached = stageIdx >= i;
            return (
              <React.Fragment key={s}>
                <div className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap ${reached ? STAGE_COLORS[s] : 'bg-ink-50 text-ink-400'}`}>
                  {s}
                </div>
                {i < STAGES.length - 1 && <ChevronRight size={14} className={reached && stageIdx > i ? 'text-ink-500' : 'text-ink-300'} />}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {nextStage && (
            <button
              onClick={() => setShowStageModal(true)}
              className="inline-flex items-center gap-2 bg-mission-500 hover:bg-mission-600 text-navy-900 font-bold rounded-md px-4 py-2 text-sm transition"
            >
              Advance to {nextStage} <ChevronRight size={14} />
            </button>
          )}
          <a
            href={WashAPI.itemReportUrl(item.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-md px-4 py-2 transition"
          >
            <FileDown size={14} /> Open item PDF
          </a>
        </div>
      </div>

      {/* Beneficiary + Location card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="Beneficiary">
          <Row label="Name"     value={item.beneficiaryName || item.beneficiary?.fullName} />
          <Row label="NIC"      value={item.beneficiaryNic} />
          <Row label="Phone"    value={item.beneficiaryPhone} />
          <Row label="Household size" value={item.householdSize} />
        </Card>
        <Card title="Location">
          <Row label="District"     value={item.district} />
          <Row label="DS division"  value={item.dsDivision} />
          <Row label="GN division"  value={item.gnDivision} />
          <Row label="Address"      value={item.address} />
          {item.installationLat && item.installationLng ? (
            <Row label="GPS" value={
              <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${item.installationLat}&mlon=${item.installationLng}#map=16/${item.installationLat}/${item.installationLng}`} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                <MapPin size={12} /> {Number(item.installationLat).toFixed(5)}, {Number(item.installationLng).toFixed(5)}
              </a>
            } />
          ) : <Row label="GPS" value={<span className="text-ink-400 text-xs italic">Not captured yet</span>} />}
        </Card>
        <Card title="Cost">
          <Row label="Planned" value={fmt(item.plannedCost)} />
          <Row label="Actual"  value={fmt(item.actualCost)} />
          <Row label="Donor ref" value={item.donorRef} />
          <Row label="Planned completion" value={item.plannedCompletion} />
        </Card>
        <Card title="Assignments">
          <Row label="Contractor" value={item.contractor?.name} />
          <Row label="Supervisor" value={item.supervisor?.fullName} />
          <Row label="Created by" value={item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'} />
        </Card>
      </div>

      {/* Stage timeline */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
        <div className="p-4 border-b border-ink-100">
          <h2 className="font-bold text-ink-900 inline-flex items-center gap-2"><Clock size={16} /> Progress timeline</h2>
          <p className="text-xs text-ink-500">{item.stageUpdates?.length || 0} entries</p>
        </div>
        {(item.stageUpdates || []).length === 0 ? (
          <div className="p-8 text-center text-ink-500 text-sm">No stage updates yet.</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {item.stageUpdates.map(u => (
              <div key={u.id} className="p-4 flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STAGE_COLORS[u.stage]?.split(' ')[0] || 'bg-ink-300'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${STAGE_COLORS[u.stage] || 'bg-ink-100 text-ink-700'}`}>{u.stage}</span>
                    {u.percentComplete != null && <span className="text-xs text-ink-500">{u.percentComplete}%</span>}
                    <span className="text-xs text-ink-500 inline-flex items-center gap-1"><User size={11} /> {u.updater?.fullName || 'system'}</span>
                    <span className="text-xs text-ink-400 ml-auto">{new Date(u.createdAt).toLocaleString()}</span>
                  </div>
                  {u.notes && <p className="text-sm text-ink-700 mt-1">{u.notes}</p>}
                  {u.latitude && u.longitude && (
                    <p className="text-xs text-ink-500 mt-1 inline-flex items-center gap-1">
                      <MapPin size={11} /> {Number(u.latitude).toFixed(5)}, {Number(u.longitude).toFixed(5)}
                    </p>
                  )}
                  {Array.isArray(u.photoUrls) && u.photoUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {u.photoUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1 text-blue-700 hover:underline">
                          <Camera size={11} /> photo {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showStageModal && nextStage && (
        <StageTransitionModal
          itemId={id}
          currentStage={item.stage}
          nextStage={nextStage}
          onClose={() => setShowStageModal(false)}
          onAdvanced={() => { setShowStageModal(false); load(); }}
        />
      )}
    </div>
  );
};

const Card = ({ title, children }) => (
  <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
    <p className="text-xs font-semibold uppercase text-ink-500 mb-2">{title}</p>
    <div className="space-y-1.5 text-sm">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <span className="text-ink-500 text-xs">{label}</span>
    <span className="font-medium text-right break-words">{value || <span className="text-ink-400 text-xs italic">—</span>}</span>
  </div>
);

const StageTransitionModal = ({ itemId, currentStage, nextStage, onClose, onAdvanced }) => {
  const [notes, setNotes] = useState('');
  const [percentComplete, setPct] = useState(100);
  const [photoUrlsText, setPhotoUrlsText] = useState('');
  const [coords, setCoords] = useState({ lat: '', lng: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const captureGps = () => {
    if (!navigator.geolocation) { setErr('GPS not available in this browser'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude.toFixed(7), lng: pos.coords.longitude.toFixed(7) }),
      err => setErr('GPS denied or unavailable: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    setSaving(true); setErr(null);
    try {
      const photoUrls = photoUrlsText.split(/\s+/).filter(Boolean);
      await WashAPI.transitionStage(itemId, {
        newStage: nextStage,
        notes: notes || null,
        percentComplete: Number(percentComplete),
        photoUrls,
        latitude:  coords.lat ? Number(coords.lat) : null,
        longitude: coords.lng ? Number(coords.lng) : null,
      });
      onAdvanced();
    } catch (e) {
      setErr(e.message || 'Failed to advance');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop w-full max-w-lg">
        <div className="bg-orange-500 text-white px-5 py-3 rounded-t-lg2 flex items-center justify-between">
          <h2 className="font-bold inline-flex items-center gap-2">
            <ChevronRight size={18} /> {currentStage} → {nextStage}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full border border-ink-200 rounded px-2 py-1.5" placeholder="Optional context for this transition…" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Percent complete</label>
            <input type="number" min={0} max={100} value={percentComplete} onChange={e => setPct(e.target.value)} className="w-full border border-ink-200 rounded px-2 py-1.5" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Photo URLs (space-separated)</label>
            <input value={photoUrlsText} onChange={e => setPhotoUrlsText(e.target.value)} className="w-full border border-ink-200 rounded px-2 py-1.5 font-mono text-xs" placeholder="https://…  https://…" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">GPS</label>
            <div className="flex gap-2 items-center">
              <input value={coords.lat} onChange={e => setCoords({ ...coords, lat: e.target.value })} className="flex-1 border border-ink-200 rounded px-2 py-1.5" placeholder="lat" />
              <input value={coords.lng} onChange={e => setCoords({ ...coords, lng: e.target.value })} className="flex-1 border border-ink-200 rounded px-2 py-1.5" placeholder="lng" />
              <button onClick={captureGps} type="button" className="inline-flex items-center gap-1 bg-blue-600 text-white rounded px-2 py-1.5 text-xs hover:bg-blue-700">
                <MapPin size={12} /> capture
              </button>
            </div>
          </div>
          {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-xs">{err}</div>}
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-ink-200 rounded hover:bg-ink-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="bg-mission-500 hover:bg-mission-600 text-navy-900 text-sm font-bold rounded px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1">
            <Save size={14} /> {saving ? 'Saving…' : `Advance to ${nextStage}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WashItemDetailPage;
