import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Polyline, Popup, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Route } from 'lucide-react';
import {
  PageWrap, PageHeader, Card, Button, Badge, EmptyState, ErrorBox, Field, inputClass, Th, Td,
} from '../../components/ui/primitives';
import { MovementSegmentAPI } from '../../services/hrAdminApi';

const DEFAULT_CENTER = [6.9271, 79.8612];

const today = () => new Date();
const ymd = (d) => d.toISOString().slice(0, 10);
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };

const fmtTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

export default function MovementSegmentsPage() {
  const [from, setFrom] = useState(yesterday());
  const [to, setTo] = useState(ymd(today()));
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await MovementSegmentAPI.list({ userId: userId || undefined, from, to }));
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const runCluster = async () => {
    if (!confirm(`Recluster ${userId ? 'user #' + userId : 'all users'} for ${from}? Existing segments for that day will be replaced.`)) return;
    setBusy(true);
    try {
      const res = await MovementSegmentAPI.cluster({ date: from, userId: userId ? Number(userId) : undefined });
      alert(`Reclustered. ${userId ? `Segments for user #${userId}: ${res.segments}` : `Users processed: ${res.summary?.length ?? 0}`}`);
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const groups = rows.reduce((acc, r) => {
    (acc[r.date] ??= []).push(r);
    return acc;
  }, {});

  const { mapCenter, trips, stops } = useMemo(() => {
    const t = [], s = [];
    for (const r of rows) {
      const start = [Number(r.startLat), Number(r.startLng)];
      const end   = [Number(r.endLat), Number(r.endLng)];
      if (Number.isNaN(start[0]) || Number.isNaN(end[0])) continue;
      if (r.segmentType === 'TRIP') t.push({ id: r.id, points: [start, end], dist: r.distanceKm, dur: r.durationMinutes });
      else                          s.push({ id: r.id, point: start, dur: r.durationMinutes });
    }
    const all = [...t.flatMap(x => x.points), ...s.map(x => x.point)];
    const center = all.length === 0 ? DEFAULT_CENTER : [
      all.reduce((a, p) => a + p[0], 0) / all.length,
      all.reduce((a, p) => a + p[1], 0) / all.length,
    ];
    return { mapCenter: center, trips: t, stops: s };
  }, [rows]);

  return (
    <PageWrap>
      <PageHeader
        eyebrow="HR · GPS"
        title="Movement segments"
        subtitle="STOP / TRIP segments derived nightly from raw GPS pings. Used to verify fuel claims."
      />

      <Card className="mb-4">
        <div className="flex items-end gap-4 flex-wrap">
          <Field label="From">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputClass} />
          </Field>
          <Field label="To">
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClass} />
          </Field>
          <Field label="User ID">
            <input type="number" value={userId} onChange={e => setUserId(e.target.value)} placeholder="(all)"
              className={`${inputClass} w-32`} />
          </Field>
          <Button variant="secondary" onClick={load}>Refresh</Button>
          <Button onClick={runCluster} loading={busy}>Recluster {from}</Button>
        </div>
      </Card>

      {error && <ErrorBox className="mb-4">{error}</ErrorBox>}

      {(trips.length > 0 || stops.length > 0) && (
        <Card padded={false} className="overflow-hidden mb-4">
          <div style={{ height: 380 }}>
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {trips.map(t => (
                <Polyline key={`trip-${t.id}`} positions={t.points} color="#1f3e85" weight={4} opacity={0.8}>
                  <Popup>
                    <div className="text-sm"><strong>Trip</strong><br />{t.dist} km · {t.dur} min</div>
                  </Popup>
                </Polyline>
              ))}
              {stops.map(s => (
                <CircleMarker key={`stop-${s.id}`} center={s.point} radius={8}
                  pathOptions={{ color: '#3a5879', fillColor: '#7891b0', fillOpacity: 0.7 }}>
                  <Popup>
                    <div className="text-sm"><strong>Stop</strong><br />{s.dur} min</div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-ink-500 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Route className="w-10 h-10" />}
          title="No segments in range"
          message="Run the clusterer for a day with location_points data, or widen the date filter."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).sort().map(([date, list]) => (
            <Card key={date} padded={false} className="overflow-hidden">
              <div className="bg-ink-50 px-5 py-2.5 border-b border-ink-100 text-sm font-semibold text-ink-800">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                <span className="ml-2 text-ink-500 font-normal">· {list.length} segment{list.length === 1 ? '' : 's'}</span>
              </div>
              <table className="w-full">
                <thead className="bg-ink-50 border-b border-ink-100">
                  <tr>
                    <Th>User</Th><Th>Type</Th><Th>Time</Th><Th>Duration</Th>
                    <Th>Distance</Th><Th>Points</Th><Th>Map</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {list.map(s => (
                    <tr key={s.id} className="hover:bg-ink-50">
                      <Td className="font-semibold text-navy-800">{s.user?.fullName ?? `#${s.userId}`}</Td>
                      <Td><Badge tone={s.segmentType === 'TRIP' ? 'info' : 'neutral'}>{s.segmentType}</Badge></Td>
                      <Td mono>{fmtTime(s.startedAt)} – {fmtTime(s.endedAt)}</Td>
                      <Td>{s.durationMinutes} min</Td>
                      <Td>{s.distanceKm != null ? `${s.distanceKm} km` : '—'}</Td>
                      <Td>{s.pointCount}</Td>
                      <Td>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${s.startLat},${s.startLng}`}
                          target="_blank" rel="noreferrer"
                          className="text-navy-700 hover:underline text-xs font-medium">Open →</a>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </PageWrap>
  );
}
