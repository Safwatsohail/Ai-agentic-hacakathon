export const API_BASE = process.env.REACT_APP_API_BASE || "";

export function api(path, opts) {
  return fetch(`${API_BASE}${path}`, opts);
}

export function apiStream(path) {
  return new EventSource(`${API_BASE}${path}`);
}