const DEFAULT_CMS_URL = 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 2500;

function getCmsUrl() {
  return (process.env.PAYLOAD_CMS_URL || DEFAULT_CMS_URL).replace(/\/$/, '');
}

async function fetchCollection(slug, { depth = 0 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ limit: '100', depth: String(depth), sort: 'legacyId' });
    const response = await fetch(`${getCmsUrl()}/api/${slug}?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Payload ${slug}: HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.docs)) throw new Error(`Payload ${slug}: geçersiz yanıt`);
    return payload.docs;
  } finally {
    clearTimeout(timeout);
  }
}

function dateParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: String(value || '').slice(0, 10), dateLabel: '', day: '' };
  return {
    date: date.toISOString().slice(0, 10),
    dateLabel: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(date),
    day: new Intl.DateTimeFormat('tr-TR', { weekday: 'long', timeZone: 'Europe/Istanbul' }).format(date),
  };
}

export function normalizePayloadMonument(doc) {
  return {
    ...doc,
    id: Number(doc.legacyId),
    route: doc.routeLabel || '',
    images: (doc.gallery || []).map((item) => item.url).filter(Boolean),
    highlights: (doc.highlights || []).map((item) => item.text).filter(Boolean),
    coordinates: [Number(doc.coordinates?.latitude), Number(doc.coordinates?.longitude)],
  };
}

export function normalizePayloadRoute(doc) {
  const monumentIds = (doc.monuments || []).map((item) => Number(typeof item === 'object' ? item.legacyId : item)).filter(Number.isFinite);
  return { ...doc, id: Number(doc.legacyId), monumentIds, stops: monumentIds.length };
}

export function normalizePayloadEvent(doc) {
  return { ...doc, id: Number(doc.legacyId), ...dateParts(doc.date) };
}

export function monumentsToGeoJSON(items) {
  return {
    type: 'FeatureCollection',
    features: items.filter((item) => item.coordinates.every(Number.isFinite)).map((item) => ({
      type: 'Feature',
      id: item.id,
      properties: {
        id: item.id, name: item.name, slug: item.slug, type: item.type, category: item.category,
        district: item.district, description: item.description, image: item.image,
      },
      geometry: { type: 'Point', coordinates: [item.coordinates[1], item.coordinates[0]] },
    })),
  };
}

function buildActivity(monuments, routes, events) {
  const records = [
    ...monuments.map((item) => ({ ...item, sourceType: 'monument', title: item.name, action: 'Eser kaydı Payload CMS üzerinde güncellendi', href: `/tarihi-eserler/${item.slug}` })),
    ...routes.map((item) => ({ ...item, sourceType: 'route', action: 'Rota kaydı Payload CMS üzerinde güncellendi', href: `/kultur-rotalari/${item.slug}` })),
    ...events.map((item) => ({ ...item, sourceType: 'event', action: 'Etkinlik kaydı Payload CMS üzerinde güncellendi', href: `/etkinlikler/${item.slug}` })),
  ];
  return records.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 5).map((item, index) => ({
    id: `${item.sourceType}-${item.id}-${index}`,
    sourceType: item.sourceType,
    sourceId: item.id,
    title: item.title,
    action: item.action,
    actor: 'Payload CMS',
    createdAt: item.updatedAt,
    href: item.href,
  }));
}

export async function getPayloadSnapshot() {
  const [monumentDocs, routeDocs, eventDocs] = await Promise.all([
    fetchCollection('monuments'),
    fetchCollection('cultural-routes', { depth: 1 }),
    fetchCollection('events'),
  ]);
  const monuments = monumentDocs.map(normalizePayloadMonument);
  const routes = routeDocs.map(normalizePayloadRoute);
  const events = eventDocs.map(normalizePayloadEvent);
  return {
    monuments,
    routes,
    events,
    geojson: monumentsToGeoJSON(monuments),
    activity: buildActivity(monuments, routes, events),
    adminUrl: `${getCmsUrl()}/admin`,
  };
}

export async function getPayloadSnapshotOrNull() {
  try {
    return await getPayloadSnapshot();
  } catch (error) {
    console.warn(`Payload CMS kullanılamıyor, örnek veri kullanılacak: ${error.message}`);
    return null;
  }
}
