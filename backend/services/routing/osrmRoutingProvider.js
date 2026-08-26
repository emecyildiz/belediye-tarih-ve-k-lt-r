const DEFAULT_BASE_URL = 'https://router.project-osrm.org';
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_CACHE_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const ESTIMATED_SPEED_KMH = { walking: 4.5, cycling: 14 };

const routeCache = new Map();

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
  baseUrl = process.env.OSRM_BASE_URL || DEFAULT_BASE_URL,
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

  const profile = profileFor(travelMode);
  const key = cacheKey(profile, travelMode, stops);
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
  const endpoint = `${String(baseUrl).replace(/\/$/, '')}/route/v1/${encodeURIComponent(profile)}/${coordinates}?${params}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
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
    const travelMinutes = profile === travelMode || !estimatedSpeed
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
      routingProfile: profile,
      requestedTravelMode: travelMode,
      durationMethod: profile === travelMode || !estimatedSpeed ? 'routing-profile' : 'distance-speed-estimate',
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
}
