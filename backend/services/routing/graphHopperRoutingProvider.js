const DEFAULT_BASE_URL = 'http://localhost:8989';
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_CACHE_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

const routeCache = new Map();

export class GraphHopperRoutingError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'GraphHopperRoutingError';
  }
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function validCoordinatePair(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]));
}

function cacheKey(profile, stops) {
  return `${profile}:${stops.map((stop) => stop.coordinates.map((value) => Number(value).toFixed(6)).join(',')).join(';')}`;
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

export async function requestGraphHopperRoute({
  stops,
  travelMode: _travelMode,
  fetchImpl = globalThis.fetch,
  baseUrl = process.env.GRAPHHOPPER_BASE_URL || DEFAULT_BASE_URL,
  timeoutMs = positiveNumber(process.env.ROUTING_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
  cacheMs = positiveNumber(process.env.ROUTING_CACHE_MS, DEFAULT_CACHE_MS),
} = {}) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new GraphHopperRoutingError('Yol güzergâhı için en az iki geçerli durak gerekir.');
  }
  if (!stops.every((stop) => validCoordinatePair(stop.coordinates))) {
    throw new GraphHopperRoutingError('Durak koordinatlarından biri geçersiz.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new GraphHopperRoutingError('Sunucuda yol servisine bağlanacak ağ istemcisi bulunamadı.');
  }

  const travelMode = 'driving';
  const profile = process.env.GRAPHHOPPER_PROFILE_DRIVING || 'car';
  const key = cacheKey(profile, stops);
  const cached = readCache(key, cacheMs);
  if (cached) return { ...cached, cached: true };

  const params = new URLSearchParams({
    profile,
    locale: 'tr',
    instructions: 'true',
    calc_points: 'true',
    points_encoded: 'false',
    elevation: 'false',
  });
  for (const stop of stops) params.append('point', `${Number(stop.coordinates[0])},${Number(stop.coordinates[1])}`);
  const endpoint = `${String(baseUrl).replace(/\/$/, '')}/route?${params}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const path = payload?.paths?.[0];
    if (!path?.points?.coordinates?.length) {
      throw new Error(payload?.message || payload?.hints?.[0]?.message || 'Geçerli güzergâh dönmedi');
    }

    const distanceKm = Number(path.distance || 0) / 1000;
    const travelMinutes = Math.max(1, Math.round(Number(path.time || 0) / 60_000));
    const value = {
      geometry: { type: 'LineString', coordinates: path.points.coordinates },
      distanceKm: Number(distanceKm.toFixed(2)),
      travelMinutes,
      legs: [],
      instructions: (path.instructions || []).map((instruction) => ({
        text: instruction.text || '',
        streetName: instruction.street_name || '',
        distanceMeters: Math.round(Number(instruction.distance || 0)),
        durationSeconds: Math.round(Number(instruction.time || 0) / 1000),
        sign: instruction.sign,
      })),
      snappedWaypoints: path.snapped_waypoints?.coordinates || [],
      provider: 'graphhopper',
      dataSource: 'Yerel OpenStreetMap yol ağı',
      routingProfile: profile,
      requestedTravelMode: travelMode,
      durationMethod: 'routing-profile',
      cached: false,
    };
    writeCache(key, value);
    return value;
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'zaman aşımına uğradı' : error?.message;
    throw new GraphHopperRoutingError(`Yol güzergâhı alınamadı: ${reason}`, error);
  } finally {
    clearTimeout(timer);
  }
}

export function clearGraphHopperRoutingCache() {
  routeCache.clear();
}
