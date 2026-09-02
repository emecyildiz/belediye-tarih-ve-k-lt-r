import { buildRoadRoutePreview } from './routePreviewService.js';

const metricCache = new Map();
const READY_CACHE_MS = 6 * 60 * 60 * 1000;
const UNAVAILABLE_CACHE_MS = 60 * 1000;

function formatMinutes(minutes) {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (!hours) return `${rest} dk`;
  return rest ? `${hours} sa ${rest} dk` : `${hours} saat`;
}

function cacheKey(route) {
  return [route.id, route.updatedAt, 'driving', ...(route.monumentIds || [])].join(':');
}

async function enrichRoute(route, monuments, previewBuilder, useCache) {
  const key = cacheKey(route);
  const cached = useCache && metricCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.route;
  const preview = await previewBuilder({
    monuments,
    stopIds: route.monumentIds,
    travelMode: 'driving',
    routeId: route.id,
    title: route.title,
  });
  if (preview?.cbs?.routingStatus !== 'ready') {
    if (useCache) metricCache.set(key, { route, expiresAt: Date.now() + UNAVAILABLE_CACHE_MS });
    return route;
  }
  const enriched = {
    ...route,
    distance: `${preview.distanceKm} km`,
    duration: formatMinutes(preview.travelMinutes),
    distanceKm: preview.distanceKm,
    travelMinutes: preview.travelMinutes,
    durationMinutes: preview.travelMinutes,
    routingStatus: 'ready',
  };
  if (useCache) metricCache.set(key, { route: enriched, expiresAt: Date.now() + READY_CACHE_MS });
  return enriched;
}

export async function enrichRoutePageMetrics(page, options = {}) {
  if (!page?.items?.length) return page;
  const monuments = options.monuments || [];
  const previewBuilder = options.previewBuilder || buildRoadRoutePreview;
  const useCache = !options.previewBuilder;
  const concurrency = Math.max(1, Math.min(4, Number(options.concurrency) || 3));
  const items = new Array(page.items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < page.items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        items[index] = await enrichRoute(page.items[index], monuments, previewBuilder, useCache);
      } catch {
        items[index] = page.items[index];
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, page.items.length) }, worker));
  return { ...page, items };
}
