import { createHash, randomUUID } from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AnalyticsValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AnalyticsValidationError';
  }
}

function requiredUuid(value, label) {
  const normalized = String(value || '').trim();
  if (!UUID_PATTERN.test(normalized)) throw new AnalyticsValidationError(`${label} geçersiz.`);
  return normalized.toLowerCase();
}

function normalizePath(value) {
  const path = String(value || '').trim().split('?')[0].slice(0, 240);
  if (!path.startsWith('/')) throw new AnalyticsValidationError('Sayfa adresi geçersiz.');
  return path;
}

export function classifyContentPath(path) {
  const matchers = [
    { pattern: /^\/tarihi-eserler\/([^/]+)$/, type: 'monument' },
    { pattern: /^\/kultur-rotalari\/([^/]+)$/, type: 'route' },
    { pattern: /^\/etkinlikler\/([^/]+)$/, type: 'event' },
  ];
  for (const item of matchers) {
    const match = path.match(item.pattern);
    if (match) return { contentType: item.type, contentSlug: decodeURIComponent(match[1]).slice(0, 160) };
  }
  return { contentType: null, contentSlug: null };
}

export function normalizePageView(payload = {}, now = new Date()) {
  const path = normalizePath(payload.path);
  const content = classifyContentPath(path);
  const visitorId = requiredUuid(payload.visitorId, 'Ziyaretçi kimliği');
  const sessionId = requiredUuid(payload.sessionId, 'Oturum kimliği');
  const tenSecondBucket = Math.floor(now.getTime() / 10_000);
  return {
    id: payload.id ? requiredUuid(payload.id, 'Olay kimliği') : randomUUID(),
    eventType: 'page_view',
    visitorId,
    sessionId,
    path,
    ...content,
    occurredAt: now.toISOString(),
    dedupeKey: createHash('sha256').update(`${visitorId}:${sessionId}:${path}:${tenSecondBucket}`).digest('hex'),
  };
}
