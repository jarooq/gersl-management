// =============================================================================
// BeneficiaryMap — shared Leaflet pin map for WASH / IGP / Orphan / Beneficiary
// layers. Tiles come from OpenStreetMap (no API key required).
//
// Usage:
//   <BeneficiaryMap
//     types={['wash','igp']}        // default: all layers
//     projectId={42}                // optional filters propagated to server
//     donorId={7}
//     district="Trincomalee"
//     height={500}
//   />
//
// The component is self-contained — fetches its own pins from /api/map/pins,
// renders, and lets the user toggle layers.
// =============================================================================

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Droplets, Briefcase, Baby, Users, Loader, RefreshCw } from 'lucide-react';
import { MapAPI } from '../../services/api';

// Centre of Sri Lanka — used as the default view when no pins exist yet.
const SRI_LANKA_CENTRE = [7.8731, 80.7718];

const LAYER_META = {
  wash:        { label: 'WASH',        icon: Droplets,  color: '#0ea5e9' },
  igp:         { label: 'IGP',         icon: Briefcase, color: '#10b981' },
  orphan:      { label: 'Orphans',     icon: Baby,      color: '#ec4899' },
  beneficiary: { label: 'Households',  icon: Users,     color: '#6366f1' },
};

// Fit the map view to the pin bounds whenever pins change.
const FitToPins = ({ pins }) => {
  const map = useMap();
  useEffect(() => {
    if (!pins || pins.length === 0) return;
    const bounds = pins.map(p => [p.lat, p.lng]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [pins, map]);
  return null;
};

const BeneficiaryMap = ({
  types: initialTypes,
  projectId,
  donorId,
  washOrderId,
  igpOrderId,
  district,
  stage,
  height = 500,
  className = '',
}) => {
  const [enabled, setEnabled] = useState(
    new Set(initialTypes && initialTypes.length ? initialTypes : Object.keys(LAYER_META))
  );
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (enabled.size === 0) {
      setPins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await MapAPI.getPins({
        types: [...enabled].join(','),
        projectId, donorId, washOrderId, igpOrderId, district, stage,
      });
      setPins(data?.pins || []);
    } catch (e) {
      setError(e.message || 'Failed to load pins');
      setPins([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, projectId, donorId, washOrderId, igpOrderId, district, stage]);

  useEffect(() => { load(); }, [load]);

  const visiblePins = pins;
  const counts = useMemo(() => {
    const c = {};
    for (const p of visiblePins) c[p.kind] = (c[p.kind] || 0) + 1;
    return c;
  }, [visiblePins]);

  const toggle = (kind) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind); else next.add(kind);
      return next;
    });
  };

  return (
    <div className={`bg-white rounded-lg2 shadow-card border border-ink-100 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-ink-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-ink-600 mr-1">Layers:</span>
        {Object.entries(LAYER_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const isOn = enabled.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition ${
                isOn
                  ? 'text-white shadow-sm'
                  : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
              }`}
              style={isOn ? { backgroundColor: meta.color } : {}}
            >
              <Icon size={12} /> {meta.label}
              {isOn && counts[key] != null && (
                <span className="ml-1 bg-white/30 rounded-full px-1.5 text-[10px] font-bold">{counts[key] || 0}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 text-xs text-ink-500">
          {loading
            ? <span className="inline-flex items-center gap-1"><Loader size={12} className="animate-spin" /> Loading…</span>
            : <span>{visiblePins.length} pin{visiblePins.length === 1 ? '' : 's'}</span>}
          <button onClick={load} title="Refresh" className="hover:text-ink-900">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs">{error}</div>
      )}
      <div style={{ height }}>
        <MapContainer
          center={SRI_LANKA_CENTRE}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visiblePins.map((p) => (
            <CircleMarker
              key={`${p.kind}-${p.id}`}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.85, weight: 1 }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold mb-0.5">{p.label}</div>
                  {p.sublabel && <div className="text-xs text-ink-600">{p.sublabel}</div>}
                  <div className="text-xs mt-1">
                    <span className="font-semibold">{p.programme}</span>
                    {p.status && <> · {p.status}</>}
                  </div>
                  {p.link && (
                    <a
                      href={p.link}
                      className="inline-block mt-2 text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Open detail →
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <FitToPins pins={visiblePins} />
        </MapContainer>
      </div>
    </div>
  );
};

export default BeneficiaryMap;
