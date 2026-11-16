export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === 'true';

const baseUrl = import.meta.env.BASE_URL || '/';

export function publicAsset(path = '') {
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  const normalizedPath = String(path).replace(/^\/+/, '');
  return `${baseUrl}${normalizedPath}`;
}

export function resolvePublicUrl(url) {
  if (!url) return '';
  const value = String(url);
  if (/^(?:https?:|data:|blob:)/i.test(value) || value.startsWith(baseUrl)) return value;
  return value.startsWith('/') ? publicAsset(value) : value;
}
