import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, MapPin, Info } from 'lucide-react';
import {
  PageWrap, PageHeader, Card, EmptyState, ErrorBox, Th, Td,
} from '../../components/ui/primitives';
import { LiveLocationAPI } from '../../services/hrAdminApi';

const POLL_MS = 10_000;
const WINDOW_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '12 hours', value: 720 },
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [6.9271, 79.8612];

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
  const [windowMin, setWindowMin] = useState(60);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await LiveLocationAPI.live({ windowMin });
        if (cancelled) return;
        setRows(data); setUpdatedAt(new Date()); setError(null);
      } catch (e) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setLoading(false); }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [windowMin]);

  const center = useMemo(() => {
    if (rows.length === 0) return DEFAULT_CENTER;
    return [
      rows.reduce((s, r) => s + Number(r.latitude), 0) / rows.length,
      rows.reduce((s, r) => s + Number(r.longitude), 0) / rows.length,
    ];
  }, [rows]);

  return (
    <PageWrap>
      <PageHeader
        eyebrow="HR · Operations"
        title="Live staff map"
        subtitle={`Last ${windowMin} min of GPS pings · refreshes every ${POLL_MS / 1000}s`}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={windowMin}
              onChange={(e) => setWindowMin(Number(e.target.value))}
              className="px-3 py-1.5 border border-ink-200 rounded-md text-xs focus:ring-2 focus:ring-navy-700 focus:border-transparent bg-white"
              aria-label="Window"
            >
              {WINDOW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {updatedAt && (
              <span className="inline-flex items-center gap-2 text-xs text-ink-500">
                <Activity className="w-3.5 h-3.5 text-success-600" />
                {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        }
      />

      {error && <ErrorBox className="mb-4">{error}</ErrorBox>}

      {/* Help banner — explains why a staff member might NOT appear here */}
      <div className="mb-4 bg-mission-50 border border-mission-200 rounded-md px-4 py-3 text-sm text-ink-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-mission-600 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          Field staff appear here once they (a) install the GERSL mobile app,
          (b) sign in, and (c) tap the GPS icon in the app bar (or "GPS tracking is on" tile)
          to enable background location tracking. Stationary phones only push when they move
          ≥10 m, so widening the window above is the easiest way to see who's been active recently.
        </div>
      </div>

      <Card padded={false} className="overflow-hidden mb-4" >
        <div style={{ height: 480 }}>
          {loading ? (
            <div className="h-full flex items-center justify-center text-ink-500 text-sm">Loading map…</div>
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
                      <strong>{r.user_full_name || `User #${r.user_id}`}</strong>
                      {r.user_role && <div className="text-xs text-ink-500">{r.user_role}{r.user_department ? ` · ${r.user_department}` : ''}</div>}
                      <div className="mt-1">{fmtAge(r.recorded_at)}</div>
                      <div>Speed: {r.speed_kmh != null ? `${Number(r.speed_kmh).toFixed(1)} km/h` : '—'}</div>
                      <div>Accuracy: {r.accuracy_m != null ? `${Math.round(r.accuracy_m)} m` : '—'}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </Card>

      {!loading && rows.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-10 h-10" />}
          title="No staff currently tracking"
          message="Field staff need to enable GPS tracking from the mobile app for their location to appear here."
        />
      ) : rows.length > 0 && (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <Th>User</Th><Th>Latitude</Th><Th>Longitude</Th>
                <Th>Speed (km/h)</Th><Th>Accuracy (m)</Th><Th>Last seen</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-ink-50">
                  <Td>
                    <div className="font-semibold text-navy-800">{r.user_full_name || `User #${r.user_id}`}</div>
                    {(r.user_role || r.user_department) && (
                      <div className="text-xs text-ink-500">{[r.user_role, r.user_department].filter(Boolean).join(' · ')}</div>
                    )}
                  </Td>
                  <Td mono>{Number(r.latitude).toFixed(5)}</Td>
                  <Td mono>{Number(r.longitude).toFixed(5)}</Td>
                  <Td>{r.speed_kmh != null ? Number(r.speed_kmh).toFixed(1) : '—'}</Td>
                  <Td>{r.accuracy_m != null ? Math.round(r.accuracy_m) : '—'}</Td>
                  <Td className="text-ink-500">{fmtAge(r.recorded_at)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </PageWrap>
  );
}
