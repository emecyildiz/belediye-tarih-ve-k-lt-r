import { monuments, categoryCounts } from '../../data/monuments.js';
import { culturalRoutes } from '../../data/routes.js';
import { events, eventCategoryCounts } from '../../data/events.js';
import { notifications } from '../../data/mockDb.js';
import { homeContent } from '../../data/homeContent.js';
import { aboutContent } from '../../data/aboutContent.js';
import { getPayloadSnapshot } from './payloadCms.js';

const CACHE_TTL_MS = Number(process.env.PAYLOAD_CONTENT_CACHE_MS) || 3000;
let lastLoadedAt = 0;
let refreshPromise = null;
let lastError = null;

function replaceArray(target, values) {
  target.splice(0, target.length, ...values);
}

function replaceObject(target, value) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, value || {});
}

function replaceCounts(target, items, field) {
  replaceObject(target, { tumu: items.length });
  for (const item of items) {
    const key = item[field];
    if (key) target[key] = (target[key] || 0) + 1;
  }
}

function applySnapshot(snapshot) {
  if (!snapshot.homeContent || !snapshot.aboutContent) throw new Error('Portal Ayarları içinde ana sayfa veya hakkında içeriği eksik');
  replaceArray(monuments, snapshot.monuments);
  replaceArray(culturalRoutes, snapshot.routes);
  replaceArray(events, snapshot.events);
  replaceArray(notifications, snapshot.notifications);
  replaceCounts(categoryCounts, snapshot.monuments, 'category');
  replaceCounts(eventCategoryCounts, snapshot.events, 'category');
  replaceObject(homeContent, snapshot.homeContent);
  replaceObject(aboutContent, snapshot.aboutContent);
  lastLoadedAt = Date.now();
  lastError = null;
}

export async function syncPayloadContent({ force = false } = {}) {
  if (!force && lastLoadedAt && Date.now() - lastLoadedAt < CACHE_TTL_MS) return getPayloadContentStatus();
  if (!refreshPromise) {
    refreshPromise = getPayloadSnapshot()
      .then((snapshot) => { applySnapshot(snapshot); return getPayloadContentStatus(); })
      .catch((error) => {
        lastError = error;
        if (!lastLoadedAt) throw error;
        return getPayloadContentStatus();
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export function getPayloadContentStatus() {
  return {
    source: 'payload-postgresql', ready: Boolean(lastLoadedAt), stale: Boolean(lastError),
    loadedAt: lastLoadedAt ? new Date(lastLoadedAt).toISOString() : null,
    error: lastError?.message || null,
    counts: { monuments: monuments.length, routes: culturalRoutes.length, events: events.length, notifications: notifications.length },
  };
}
