import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Polyline, Popup, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MovementSegmentAPI } from '../../services/hrAdminApi';

const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo

const today = () => new Date();
const ymd = (d) => d.toISOString().slice(0, 10);
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };

const fmtTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

const TYPE_BADGE = {
  STOP: 'bg-gray-100 text-gray-700 border border-gray-200',
  TRIP: 'bg-blue-50 text-blue-700 border border-blue-200',
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
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Movement segments</h1>
        <p className="text-sm text-gray-500 mt-1">
          STOP / TRIP segments derived nightly from raw GPS pings. Used to verify fuel claims.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 flex items-end gap-4 flex-wrap">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">From</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">To</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">User ID</span>
          <input type="number" value={userId} onChange={e => setUserId(e.target.value)} placeholder="(all)"
            className="border border-gray-300 px-3 py-2 rounded-md text-sm w-28" />
        </label>
        <button onClick={load}
          className="border border-gray-300 hover:bg-gray-50 text-sm font-medium px-3 py-2 rounded-md text-gray-700">
          Refresh
        </button>
        <button onClick={runCluster} disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-md">
          {busy ? 'Running…' : `Recluster ${from}`}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      {(trips.length > 0 || stops.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden" style={{ height: 400 }}>
          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {trips.map(t => (
              <Polyline key={`trip-${t.id}`} positions={t.points} color="#2563eb" weight={4} opacity={0.7}>
                <Popup>
                  <div className="text-sm"><strong>Trip</strong><br />{t.dist} km · {t.dur} min</div>
                </Popup>
              </Polyline>
            ))}
            {stops.map(s => (
              <CircleMarker key={`stop-${s.id}`} center={s.point} radius={8} pathOptions={{ color: '#6b7280', fillColor: '#9ca3af', fillOpacity: 0.7 }}>
                <Popup>
                  <div className="text-sm"><strong>Stop</strong><br />{s.dur} min</div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-6 text-center text-gray-500 text-sm">
          No segments in range. Run the clusterer for a day with location_points data.
        </div>
      ) : (
        Object.entries(groups).sort().map(([date, list]) => (
          <div key={date} className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
              {new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              <span className="ml-2 text-gray-500 font-normal">· {list.length} segment{list.length === 1 ? '' : 's'}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Distance</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{s.user?.fullName ?? `#${s.userId}`}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[s.segmentType] ?? ''}`}>{s.segmentType}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{fmtTime(s.startedAt)} – {fmtTime(s.endedAt)}</td>
                    <td className="px-4 py-2 text-gray-700">{s.durationMinutes} min</td>
                    <td className="px-4 py-2 text-gray-700">{s.distanceKm != null ? `${s.distanceKm} km` : '—'}</td>
                    <td className="px-4 py-2 text-gray-700">{s.pointCount}</td>
                    <td className="px-4 py-2">
                      <a href={`https://www.google.com/maps/search/?api=1&query=${s.startLat},${s.startLng}`}
                        target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline text-xs font-medium">Open →</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
