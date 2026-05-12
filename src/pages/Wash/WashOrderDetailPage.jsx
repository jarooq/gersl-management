import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Upload, Plus, MapPin, X, ChevronRight } from 'lucide-react';
import { WashAPI } from '../../services/api';

const fmt = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

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

const WashOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [order, itemList] = await Promise.all([
        WashAPI.getOrder(id),
        WashAPI.listItems({ orderId: id }),
      ]);
      setData(order);
      setItems(itemList || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="p-12 text-center text-ink-500">Loading…</div>;
  if (!data) return <div className="p-12 text-center text-red-700">Order not found</div>;

  const { order, summary } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <button onClick={() => navigate('/admin/wash')} className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft size={14} /> Back to WASH
      </button>

      {/* Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">{order.orderCode} · WASH order</p>
        <h1 className="text-h2 font-bold leading-tight inline-flex items-center gap-2">
          <Droplets size={22} /> {order.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span><span className="text-mission-300">Donor:</span> <strong>{order.donor?.name || '—'}</strong></span>
          <span><span className="text-mission-300">Project:</span> {order.project?.name || '—'}</span>
          <span><span className="text-mission-300">Deadline:</span> <strong>{order.deadline}</strong></span>
          <span><span className="text-mission-300">Status:</span> {order.status}</span>
          <span><span className="text-mission-300">Payment:</span> {order.paymentStatus}</span>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Planned"     value={order.quantity} />
        <Tile label="Created"     value={summary.totalItems} />
        <Tile label="Budget"      value={fmt(order.totalBudget)} />
        <Tile label="Actual cost" value={fmt(summary.actualCostSum)} />
      </div>

      {/* Stage breakdown */}
      {summary.totalItems > 0 && (
        <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
          <p className="text-xs font-semibold uppercase text-ink-500 mb-2">By stage</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(summary.byStage).map(([stage, count]) => (
              <span key={stage} className={`px-2 py-0.5 rounded font-semibold ${STAGE_COLORS[stage] || 'bg-ink-100 text-ink-700'}`}>
                {stage}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
        <div className="p-4 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-bold text-ink-900">Items ({items.length})</h2>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1 bg-navy-900 text-white text-sm font-semibold rounded px-3 py-1.5 hover:bg-navy-800 transition"
          >
            <Upload size={14} /> Bulk add beneficiaries
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets size={36} className="mx-auto text-ink-300 mb-3" />
            <p className="text-ink-600 mb-1">No items yet.</p>
            <p className="text-xs text-ink-500 mb-3">Add beneficiary names to create installation slots.</p>
            <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 bg-mission-500 hover:bg-mission-600 text-navy-900 font-bold rounded-md px-3 py-1.5 text-sm">
              <Plus size={14} /> Add beneficiaries
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase font-semibold text-ink-600">
                <tr>
                  <th className="text-left px-4 py-2">Item</th>
                  <th className="text-left px-4 py-2">Beneficiary</th>
                  <th className="text-left px-4 py-2">District</th>
                  <th className="text-left px-4 py-2">Unit type</th>
                  <th className="text-center px-4 py-2">GPS</th>
                  <th className="text-center px-4 py-2">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {items.map(it => (
                  <tr
                    key={it.id}
                    className="hover:bg-blue-50 cursor-pointer"
                    onClick={() => navigate(`/admin/wash/items/${it.id}`)}
                  >
                    <td className="px-4 py-2 font-mono text-xs">{it.itemCode}</td>
                    <td className="px-4 py-2">
                      <div className="font-semibold">{it.beneficiaryName || it.beneficiary?.fullName || '—'}</div>
                      {it.beneficiaryNic && <div className="text-xs text-ink-500">{it.beneficiaryNic}</div>}
                    </td>
                    <td className="px-4 py-2">{it.district || '—'}</td>
                    <td className="px-4 py-2">{it.unitType}</td>
                    <td className="px-4 py-2 text-center">
                      {it.installationLat && it.installationLng
                        ? <MapPin size={14} className="inline text-green-600" />
                        : <span className="text-ink-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STAGE_COLORS[it.stage] || 'bg-ink-100 text-ink-700'}`}>{it.stage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showImport && (
        <BulkImportModal
          orderId={id}
          orderUnitType={order.unitType}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); load(); }}
        />
      )}
    </div>
  );
};

const Tile = ({ label, value }) => (
  <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-4">
    <p className="text-xs font-semibold uppercase text-ink-500">{label}</p>
    <p className="text-h2 text-ink-900 mt-1">{value}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Bulk import — CSV paste or per-row form. CSV columns:
//   beneficiaryName, beneficiaryNic, beneficiaryPhone, district, gnDivision,
//   address, installationLat, installationLng
// First non-empty row may be a header (auto-detected).
// ---------------------------------------------------------------------------
const BulkImportModal = ({ orderId, orderUnitType, onClose, onImported }) => {
  const [csv, setCsv] = useState('');
  const [parsed, setParsed] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].toLowerCase();
    const hasHeader = /name|nic|phone|district/i.test(header);
    const rows = hasHeader ? lines.slice(1) : lines;
    const headerCols = hasHeader
      ? lines[0].split(',').map(s => s.trim().toLowerCase())
      : ['beneficiaryname', 'beneficiarynic', 'beneficiaryphone', 'district', 'gndivision', 'address', 'installationlat', 'installationlng'];
    return rows.map(line => {
      const cells = line.split(',').map(c => c.trim());
      const row = {};
      headerCols.forEach((col, i) => {
        const v = cells[i] || '';
        if (col === 'installationlat' || col === 'lat')      row.installationLat = v ? Number(v) : null;
        else if (col === 'installationlng' || col === 'lng') row.installationLng = v ? Number(v) : null;
        else if (col === 'beneficiaryname' || col === 'name')   row.beneficiaryName = v;
        else if (col === 'beneficiarynic'  || col === 'nic')    row.beneficiaryNic = v;
        else if (col === 'beneficiaryphone'|| col === 'phone')  row.beneficiaryPhone = v;
        else if (col === 'gndivision' || col === 'gn')          row.gnDivision = v;
        else row[col] = v;
      });
      return row;
    }).filter(r => r.beneficiaryName);
  };

  const handleCsv = (text) => {
    setCsv(text);
    setParsed(parseCsv(text));
  };

  const submit = async () => {
    if (parsed.length === 0) { setErr('No valid rows to import.'); return; }
    setSaving(true); setErr(null);
    try {
      await WashAPI.bulkAddItems(orderId, parsed.map(r => ({
        ...r,
        unitType: orderUnitType || 'HandPump',
      })));
      onImported();
    } catch (e) {
      setErr(e.message || 'Import failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="bg-navy-900 text-white px-5 py-3 rounded-t-lg2 flex items-center justify-between">
          <h2 className="font-bold inline-flex items-center gap-2"><Upload size={18} /> Bulk add beneficiaries</h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <p className="text-xs text-ink-600">
            Paste CSV with one row per beneficiary. Columns: <code className="bg-ink-100 px-1 rounded">beneficiaryName, beneficiaryNic, beneficiaryPhone, district, gnDivision, address, installationLat, installationLng</code>. Header row is optional.
          </p>
          <textarea
            value={csv}
            onChange={e => handleCsv(e.target.value)}
            rows={8}
            placeholder="Name, NIC, Phone, District, GN, Address, Lat, Lng&#10;Anushka Perera, 199012345678, 0712345678, Trincomalee, Kantale, ..., 8.34, 81.01"
            className="w-full border border-ink-200 rounded px-3 py-2 font-mono text-xs"
          />
          {parsed.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
              ✓ Parsed <strong>{parsed.length}</strong> row{parsed.length === 1 ? '' : 's'}. First: <em>{parsed[0].beneficiaryName}</em>
              {parsed[0].district ? ` (${parsed[0].district})` : ''}
            </div>
          )}
          {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-xs">{err}</div>}
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-ink-200 rounded hover:bg-ink-50">Cancel</button>
          <button onClick={submit} disabled={saving || parsed.length === 0} className="bg-navy-900 text-white text-sm font-semibold rounded px-3 py-1.5 disabled:opacity-50 hover:bg-navy-800 inline-flex items-center gap-1">
            {saving ? 'Importing…' : <><ChevronRight size={14} /> Import {parsed.length} row{parsed.length === 1 ? '' : 's'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WashOrderDetailPage;
