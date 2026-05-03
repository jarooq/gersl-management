import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LiveLocationAPI } from '../../services/hrAdminApi';

const POLL_MS = 10_000;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo

const fmtAge = (iso) => {
  if (!iso) return '—';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m === 1) return '1 min ago';
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)}h ago`;
};

export default function LiveStaffMapPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await LiveLocationAPI.live();
        if (cancelled) return;
        setRows(data);
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const center = useMemo(() => {
    if (rows.length === 0) return DEFAULT_CENTER;
    return [
      rows.reduce((s, r) => s + Number(r.latitude), 0) / rows.length,
      rows.reduce((s, r) => s + Number(r.longitude), 0) / rows.length,
    ];
  }, [rows]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Live staff map</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last 15 min of GPS pings from staff currently tracking · refreshes every {POLL_MS / 1000}s
          </p>
        </div>
        {updatedAt && (
          <span className="text-xs text-gray-500">Updated {updatedAt.toLocaleTimeString()}</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden" style={{ height: 500 }}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">Loading…</div>
        ) : (
          <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {rows.map((r) => (
              <Marker key={r.user_id} position={[Number(r.latitude), Number(r.longitude)]}>
                <Popup>
                  <div className="text-sm">
                    <strong>User #{r.user_id}</strong>
                    <div>{fmtAge(r.recorded_at)}</div>
                    <div>Speed: {r.speed_kmh != null ? `${Number(r.speed_kmh).toFixed(1)} km/h` : '—'}</div>
                    <div>Accuracy: {r.accuracy_m != null ? `${Math.round(r.accuracy_m)} m` : '—'}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {rows.length === 0 && !loading ? (
        <div className="bg-white border border-gray-200 rounded-md p-6 text-center text-gray-500 text-sm">
          No staff currently tracking. Ask field staff to enable GPS tracking from the mobile app.
        </div>
      ) : rows.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Latitude</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Longitude</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Speed (km/h)</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Accuracy (m)</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">#{r.user_id}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{Number(r.latitude).toFixed(5)}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{Number(r.longitude).toFixed(5)}</td>
                  <td className="px-4 py-2 text-gray-700">{r.speed_kmh != null ? Number(r.speed_kmh).toFixed(1) : '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{r.accuracy_m != null ? Math.round(r.accuracy_m) : '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{fmtAge(r.recorded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
