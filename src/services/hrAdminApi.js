// Thin wrappers for the HR/mobile-expansion endpoints. We use fetch + the
// shared API_BASE_URL config, mirroring the pattern in api.js. Auth is
// handled by httpOnly cookies (credentials: 'include') with a localStorage
// Bearer fallback for backward compat.

import { API_BASE_URL } from '../config/apiBase';

const tokenHeader = () => {
  const t = localStorage.getItem('accessToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...tokenHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `${method} ${path} failed (${res.status})`);
  return data;
}

// /api/locations
export const LiveLocationAPI = {
  live:   ({ windowMin } = {}) => {
    const qs = windowMin ? `?windowMin=${encodeURIComponent(windowMin)}` : '';
    return call(`/locations/live${qs}`).then(r => r.data || []);
  },
  byUser: (userId, from, to) => {
    const qs = new URLSearchParams({ userId, ...(from && { from }), ...(to && { to }) }).toString();
    return call(`/locations?${qs}`).then(r => r.data || []);
  },
};

// /api/shifts
export const ShiftAPI = {
  list:   ({ from, to, userId } = {}) => {
    const qs = new URLSearchParams({
      ...(from && { from }), ...(to && { to }), ...(userId && { userId }),
    }).toString();
    return call(`/shifts${qs ? `?${qs}` : ''}`).then(r => r.data || []);
  },
  create: (payload) => call('/shifts', { method: 'POST', body: payload }).then(r => r.data),
  update: (id, payload) => call(`/shifts/${id}`, { method: 'PUT', body: payload }).then(r => r.data),
  remove: (id) => call(`/shifts/${id}`, { method: 'DELETE' }),
};

// /api/movement-segments
export const MovementSegmentAPI = {
  list: ({ userId, from, to } = {}) => {
    const params = {};
    if (userId) params.userId = userId;
    if (from)   params.from = from;
    if (to)     params.to = to;
    const qs = new URLSearchParams(params).toString();
    return call(`/movement-segments${qs ? `?${qs}` : ''}`).then(r => r.data || []);
  },
  cluster: ({ date, userId } = {}) =>
    call('/movement-segments/cluster', {
      method: 'POST',
      body: { ...(date && { date }), ...(userId && { userId }) },
    }),
};

// /api/announcements
export const AnnouncementAPI = {
  list:   () => call('/announcements').then(r => r.data || []),
  create: (payload) => call('/announcements', { method: 'POST', body: payload }).then(r => r.data),
  update: (id, payload) => call(`/announcements/${id}`, { method: 'PUT', body: payload }).then(r => r.data),
  remove: (id) => call(`/announcements/${id}`, { method: 'DELETE' }),
};
