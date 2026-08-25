const API_BASE = import.meta.env.VITE_API_URL || '/api';

let accessToken = null;
let refreshRequest = null;

export class ApiRequestError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fields = fields;
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new ApiRequestError(payload.error || `API hatası: ${response.status}`, response.status, payload.fields || {});
  }
  return payload.data;
}

async function rawAuthRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  return parseResponse(response);
}

export async function loginSession(credentials) {
  const session = await rawAuthRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  setAccessToken(session.accessToken);
  return session;
}

export async function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = rawAuthRequest('/auth/refresh', { method: 'POST', body: '{}' })
      .then((session) => {
        setAccessToken(session.accessToken);
        return session;
      })
      .catch((error) => {
        clearAccessToken();
        throw error;
      })
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
}

export async function logoutSession() {
  try {
    await rawAuthRequest('/auth/logout', { method: 'POST', body: '{}' });
  } finally {
    clearAccessToken();
  }
}

export async function authenticatedFetch(path, options = {}, retry = true) {
  const headers = { ...(options.headers || {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: 'include', headers });
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    await refreshSession();
    return authenticatedFetch(path, options, false);
  }
  return response;
}
