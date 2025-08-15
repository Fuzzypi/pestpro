// frontend/src/lib/api.js
// Central API base. Uses env if provided; falls back to localhost:5000.

const envUrl = import.meta?.env?.VITE_API_URL;

// Normalize and guard against values like ":5000" (missing host)
function normalize(url) {
  if (!url || typeof url !== 'string') return null;

  // If someone put just ":5000", fix it.
  if (/^:\d{2,5}/.test(url)) {
    return `http://localhost${url}`;
  }

  // If it starts with //:5000 or similar, also fix it.
  if (/^\/\/:\d{2,5}/.test(url)) {
    return `http://localhost${url.slice(1)}`;
  }

  // If it starts with // (protocol-relative), add http:
  if (url.startsWith('//')) return `http:${url}`;

  return url;
}

export const API_URL = normalize(envUrl) || 'http://localhost:5000';
