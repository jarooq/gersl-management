import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, MapPin } from 'lucide-react';
import {
  PageWrap, PageHeader, Card, EmptyState, ErrorBox, Th, Td,
} from '../../components/ui/primitives';
import { LiveLocationAPI } from '../../services/hrAdminApi';

const POLL_MS = 10_000;

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

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await LiveLocationAPI.live();
        if (cancelled) return;
        setRows(data); setUpdatedAt(new Date()); setError(null);
      } catch (e) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setLoading(false); }
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
    <PageWrap>
      <PageHeader
        eyebrow="HR · Operations"
        title="Live staff map"
        subtitle={`Last 15 min of GPS pings · refreshes every ${POLL_MS / 1000}s`}
        actions={
          updatedAt && (
            <span className="inline-flex items-center gap-2 text-xs text-ink-500">
              <Activity className="w-3.5 h-3.5 text-success-600" />
              Updated {updatedAt.toLocaleTimeString()}
            </span>
          )
        }
      />

      {error && <ErrorBox className="mb-4">{error}</ErrorBox>}

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
                  <Td className="font-semibold text-navy-800">#{r.user_id}</Td>
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
