import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LiveLocationAPI } from '../../services/hrAdminApi';

const POLL_MS = 10_000;

// Default Leaflet marker icons reference image paths that bundlers can't resolve;
// pin them to the CDN so markers actually render.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo

const fmtAge = (iso) => {
  if (!iso) return '—';
  const ageMs = Date.now() - new Date(iso).getTime();
  const m = Math.round(ageMs / 60000);
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

  // Fit-to-bounds center: average of all rows if any, else Colombo.
  const center = useMemo(() => {
    if (rows.length === 0) return DEFAULT_CENTER;
    const lat = rows.reduce((s, r) => s + Number(r.latitude),  0) / rows.length;
    const lng = rows.reduce((s, r) => s + Number(r.longitude), 0) / rows.length;
    return [lat, lng];
  }, [rows]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Live staff map</h1>
          <p className="text-sm text-gray-500">
            Last 15 min of GPS pings from staff currently tracking · refreshes every {POLL_MS / 1000}s
          </p>
        </div>
        {updatedAt && (
          <span className="text-xs text-gray-500">Updated {updatedAt.toLocaleTimeString()}</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4">{error}</div>
      )}

      <div className="bg-white rounded shadow overflow-hidden mb-6" style={{ height: 500 }}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">Loading map…</div>
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

      {rows.length === 0 && !loading && (
        <div className="bg-white rounded shadow p-6 text-center text-gray-500">
          No staff currently tracking. Ask field staff to enable GPS tracking from the mobile app.
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Latitude</th>
                <th className="px-4 py-3">Longitude</th>
                <th className="px-4 py-3">Speed (km/h)</th>
                <th className="px-4 py-3">Accuracy (m)</th>
                <th className="px-4 py-3">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{r.user_id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{Number(r.latitude).toFixed(5)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{Number(r.longitude).toFixed(5)}</td>
                  <td className="px-4 py-3">{r.speed_kmh != null ? Number(r.speed_kmh).toFixed(1) : '—'}</td>
                  <td className="px-4 py-3">{r.accuracy_m != null ? Math.round(r.accuracy_m) : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtAge(r.recorded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
