// Single source of truth for the backend API base URL.
// In dev, falls back to http://localhost:3001/api. In prod, falls back to the
// same-origin /api so the frontend works behind any reverse proxy.
// Override at deploy time with VITE_API_URL.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : '/api');

// Origin (no /api suffix) — for image/static URLs.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
