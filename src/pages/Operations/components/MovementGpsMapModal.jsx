import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Loader, AlertTriangle } from 'lucide-react';
import { MovementAPI } from '../../../services/api';

// =============================================================================
// MovementGpsMapModal — supervisor's tool for reviewing flagged movements.
// Renders the actual GPS polyline captured by the mobile background tracker
// during the trip window, plus markers for extended stops the analyzer
// flagged.
// =============================================================================

const SRI_LANKA_CENTRE = [7.8731, 80.7718];

const MovementGpsMapModal = ({ movement, onClose }) => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    MovementAPI.gpsTrack(movement.id)
      .then((r) => { if (alive) { setPoints(r?.data?.points || []); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e?.message || 'Failed to load GPS track'); setLoading(false); } });
    return () => { alive = false; };
  }, [movement.id]);

  // Convert points to [lat,lng] polyline format. Filter out anything with
  // bad coords so leaflet doesn't render off the map.
  const polyline = points
    .map(p => [Number(p.latitude), Number(p.longitude)])
    .filter(([la, ln]) => Number.isFinite(la) && Number.isFinite(ln));

  const center = polyline.length > 0 ? polyline[Math.floor(polyline.length / 2)] : SRI_LANKA_CENTRE;
  const stops = Array.isArray(movement.extendedStops) ? movement.extendedStops : [];
  const flags = Array.isArray(movement.flagReasons) ? movement.flagReasons : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop w-full max-w-5xl max-h-[92vh] flex flex-col">
        <div className="bg-orange-500 text-white px-5 py-3 rounded-t-lg2 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-mission-300 font-semibold">Movement #{movement.id}</p>
            <h2 className="font-bold text-base inline-flex items-center gap-2">
              <MapPin size={16} /> {movement.fromLocation} → {movement.toLocation}
            </h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 text-sm">
          <Stat label="Planned"  value={movement.distanceKm != null ? `${Number(movement.distanceKm).toLocaleString()} km` : '—'} />
          <Stat label="Actual (from GPS)" value={movement.actualDistanceKm != null ? `${Number(movement.actualDistanceKm).toLocaleString()} km` : '—'} />
          <Stat label="Deviation" value={movement.deviationPct != null ? `${movement.deviationPct}%` : '—'} tone={movement.deviationPct > 50 ? 'red' : 'ink'} />
        </div>

        {flags.length > 0 && (
          <div className="px-4 pb-3">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
              <p className="font-bold text-amber-900 inline-flex items-center gap-1">
                <AlertTriangle size={14} /> Flag reasons
              </p>
              <ul className="mt-1 list-disc list-inside text-amber-800 text-xs space-y-0.5">
                {flags.map((f, i) => (<li key={i}>{f.message || f.kind}</li>))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex-1 px-4 pb-4">
          <div className="border border-ink-200 rounded overflow-hidden" style={{ height: 460 }}>
            {loading ? (
              <div className="h-full flex items-center justify-center text-ink-500">
                <Loader size={18} className="animate-spin mr-2" /> Loading GPS track…
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-red-700 px-6 text-center">{error}</div>
            ) : (
              <MapContainer center={center} zoom={polyline.length > 1 ? 11 : 8} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {polyline.length > 1 && (
                  <Polyline positions={polyline} pathOptions={{ color: '#0D1D3D', weight: 3 }} />
                )}
                {polyline.length > 0 && (
                  <CircleMarker center={polyline[0]} radius={7} pathOptions={{ color: '#16A34A', fillColor: '#16A34A', fillOpacity: 0.9 }}>
                    <Popup>Trip start</Popup>
                  </CircleMarker>
                )}
                {polyline.length > 1 && (
                  <CircleMarker center={polyline[polyline.length - 1]} radius={7} pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.9 }}>
                    <Popup>Trip end</Popup>
                  </CircleMarker>
                )}
                {stops.map((s, i) => (
                  <CircleMarker
                    key={i}
                    center={[s.lat, s.lng]}
                    radius={9}
                    pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.85, weight: 2 }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold">Extended stop</p>
                        <p>{s.minutes} min</p>
                        <p className="text-ink-500">{new Date(s.startAt).toLocaleString()}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-2">
            Green = trip start · Red = trip end · Amber = extended stop ({'>'}30 min in one place, not at start/end)
          </p>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, tone = 'ink' }) => (
  <div className={`rounded border p-3 ${tone === 'red' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-ink-50 border-ink-100 text-ink-700'}`}>
    <p className="text-[11px] uppercase font-semibold tracking-wider opacity-75">{label}</p>
    <p className="text-lg font-bold mt-0.5">{value}</p>
  </div>
);

export default MovementGpsMapModal;
