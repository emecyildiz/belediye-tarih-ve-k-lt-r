const PUBLIC_PROFILE_BASE_URLS = {
  driving: 'https://routing.openstreetmap.de/routed-car',
  cycling: 'https://routing.openstreetmap.de/routed-bike',
  walking: 'https://routing.openstreetmap.de/routed-foot',
};
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_CACHE_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const ESTIMATED_SPEED_KMH = { walking: 4.5, cycling: 14 };
const PUBLIC_REQUEST_INTERVAL_MS = 1_050;

const routeCache = new Map();
let publicRequestGate = Promise.resolve();
let lastPublicRequestAt = 0;

export class RoutingProviderError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'RoutingProviderError';
  }
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function profileFor(travelMode) {
  const configured = {
    driving: process.env.OSRM_PROFILE_DRIVING,
    cycling: process.env.OSRM_PROFILE_CYCLING,
    walking: process.env.OSRM_PROFILE_WALKING,
  };
  // router.project-osrm.org herkese açık örnek sunucusu araç profiliyle hazırlanır.
  // Yaya/bisiklet profilleri belediyenin kendi OSRM sunucusu devreye alındığında env ile seçilebilir.
  return configured[travelMode] || 'driving';
}

function routingTarget(travelMode, explicitBaseUrl) {
  if (explicitBaseUrl || process.env.OSRM_BASE_URL) {
    const routingProfile = profileFor(travelMode);
    return {
      baseUrl: explicitBaseUrl || process.env.OSRM_BASE_URL,
      apiProfile: routingProfile,
      routingProfile,
      isPublicFallback: false,
    };
  }

  return {
    baseUrl: PUBLIC_PROFILE_BASE_URLS[travelMode] || PUBLIC_PROFILE_BASE_URLS.driving,
    // routing.openstreetmap.de profili alt alan adında seçer; OSRM yolundaki
    // profil bölümü bu sunucularda yine "driving" olarak kalır.
    apiProfile: 'driving',
    routingProfile: travelMode,
    isPublicFallback: true,
  };
}

async function waitForPublicRequestSlot() {
  const reservation = publicRequestGate.then(async () => {
    const remaining = PUBLIC_REQUEST_INTERVAL_MS - (Date.now() - lastPublicRequestAt);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    lastPublicRequestAt = Date.now();
  });
  publicRequestGate = reservation.catch(() => {});
  await reservation;
}

function validCoordinatePair(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]));
}

function cacheKey(profile, travelMode, stops) {
  return `${profile}:${travelMode}:${stops.map((stop) => stop.coordinates.map((value) => Number(value).toFixed(6)).join(',')).join(';')}`;
}

function readCache(key, cacheMs) {
  const cached = routeCache.get(key);
  if (!cached || Date.now() - cached.createdAt > cacheMs) {
    routeCache.delete(key);
    return null;
  }
  return cached.value;
}

function writeCache(key, value) {
  if (routeCache.size >= MAX_CACHE_ENTRIES) routeCache.delete(routeCache.keys().next().value);
  routeCache.set(key, { value, createdAt: Date.now() });
}

export async function requestOsrmRoute({
  stops,
  travelMode = 'walking',
  fetchImpl = globalThis.fetch,
  baseUrl,
  timeoutMs = positiveNumber(process.env.ROUTING_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
  cacheMs = positiveNumber(process.env.ROUTING_CACHE_MS, DEFAULT_CACHE_MS),
} = {}) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new RoutingProviderError('Yol güzergâhı için en az iki geçerli durak gerekir.');
  }
  if (!stops.every((stop) => validCoordinatePair(stop.coordinates))) {
    throw new RoutingProviderError('Durak koordinatlarından biri geçersiz.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new RoutingProviderError('Sunucuda yol servisine bağlanacak ağ istemcisi bulunamadı.');
  }

  const target = routingTarget(travelMode, baseUrl);
  const key = cacheKey(`${target.baseUrl}:${target.routingProfile}`, travelMode, stops);
  const cached = readCache(key, cacheMs);
  if (cached) return { ...cached, cached: true };

  const coordinates = stops
    .map((stop) => `${Number(stop.coordinates[1])},${Number(stop.coordinates[0])}`)
    .join(';');
  const params = new URLSearchParams({
    alternatives: 'false',
    steps: 'true',
    overview: 'full',
    geometries: 'geojson',
  });
  const endpoint = `${String(target.baseUrl).replace(/\/$/, '')}/route/v1/${encodeURIComponent(target.apiProfile)}/${coordinates}?${params}`;
  if (target.isPublicFallback) await waitForPublicRequestSlot();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TKMBS-Hatay-Belediye-Portal/1.0',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const route = payload?.routes?.[0];
    if (payload?.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
      throw new Error(payload?.message || payload?.code || 'Geçerli güzergâh dönmedi');
    }

    const distanceKm = Number(route.distance || 0) / 1000;
    const serviceTravelMinutes = Math.max(1, Math.round(Number(route.duration || 0) / 60));
    const estimatedSpeed = ESTIMATED_SPEED_KMH[travelMode];
    const travelMinutes = target.routingProfile === travelMode || !estimatedSpeed
      ? serviceTravelMinutes
      : Math.max(1, Math.round((distanceKm / estimatedSpeed) * 60));
    const value = {
      geometry: route.geometry,
      distanceKm: Number(distanceKm.toFixed(2)),
      travelMinutes,
      legs: (route.legs || []).map((leg, index) => ({
        index,
        distanceKm: Number((Number(leg.distance || 0) / 1000).toFixed(2)),
        travelMinutes: Math.max(1, Math.round(Number(leg.duration || 0) / 60)),
        steps: (leg.steps || []).map((step) => ({
          name: step.name || '',
          distanceMeters: Math.round(Number(step.distance || 0)),
          durationSeconds: Math.round(Number(step.duration || 0)),
          maneuver: step.maneuver?.type || '',
        })),
      })),
      snappedWaypoints: (payload.waypoints || []).map((waypoint) => waypoint.location),
      provider: 'osrm',
      dataSource: 'OpenStreetMap yol ağı',
      routingProfile: target.routingProfile,
      requestedTravelMode: travelMode,
      durationMethod: target.routingProfile === travelMode || !estimatedSpeed ? 'routing-profile' : 'distance-speed-estimate',
      cached: false,
    };
    writeCache(key, value);
    return value;
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'zaman aşımına uğradı' : error?.message;
    throw new RoutingProviderError(`Yol güzergâhı alınamadı: ${reason}`, error);
  } finally {
    clearTimeout(timer);
  }
}

export function clearRoutingCache() {
  routeCache.clear();
  lastPublicRequestAt = 0;
}
