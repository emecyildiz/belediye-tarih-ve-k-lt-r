const DEFAULT_CMS_URL = 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = Number(process.env.PAYLOAD_REQUEST_TIMEOUT_MS) || 5000;
const PAGE_SIZE = 100;

function getCmsUrl() {
  return (process.env.PAYLOAD_CMS_URL || DEFAULT_CMS_URL).replace(/\/$/, '');
}

async function fetchJson(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${getCmsUrl()}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Payload ${path}: HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCollection(slug, { depth = 0, sort = 'legacyId' } = {}) {
  const docs = [];
  let page = 1;
  let hasNextPage = true;
  while (hasNextPage) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page), depth: String(depth), ...(sort ? { sort } : {}) });
    const payload = await fetchJson(`/api/${slug}?${params}`);
    if (!Array.isArray(payload.docs)) throw new Error(`Payload ${slug}: geçersiz yanıt`);
    docs.push(...payload.docs);
    hasNextPage = Boolean(payload.hasNextPage);
    page = Number(payload.nextPage) || page + 1;
  }
  return docs;
}

export async function fetchGlobal(slug, { depth = 0 } = {}) {
  return fetchJson(`/api/globals/${slug}?${new URLSearchParams({ depth: String(depth) })}`);
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

function mediaUrl(value) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.url || '';
}

export function normalizePayloadMonument(doc) {
  return {
    ...doc,
    id: Number(doc.legacyId),
    route: doc.routeLabel || '',
    image: mediaUrl(doc.image),
    images: (doc.gallery || []).map((item) => mediaUrl(item)).filter(Boolean),
    highlights: (doc.highlights || []).map((item) => item.text).filter(Boolean),
    coordinates: [Number(doc.coordinates?.latitude), Number(doc.coordinates?.longitude)],
  };
}

export function normalizePayloadRoute(doc) {
  const monumentIds = (doc.monuments || []).map((item) => Number(typeof item === 'object' ? item.legacyId : item)).filter(Number.isFinite);
  return { ...doc, id: Number(doc.legacyId), image: mediaUrl(doc.image), monumentIds, stops: monumentIds.length };
}

export function normalizePayloadEvent(doc) {
  return { ...doc, id: Number(doc.legacyId), image: mediaUrl(doc.image), ...dateParts(doc.date) };
}

function notificationType(doc) {
  const href = String(doc.href || '');
  if (doc.type === 'event' || href.startsWith('/etkinlikler')) return 'event';
  if (href.startsWith('/tarihi-eserler')) return 'monument';
  if (href.startsWith('/kultur-rotalari')) return 'route';
  return 'system';
}

export function normalizePayloadNotification(doc) {
  const publishedAt = new Date(doc.publishedAt);
  return {
    id: Number(doc.id),
    type: notificationType(doc),
    title: doc.title,
    message: doc.message,
    date: Number.isNaN(publishedAt.getTime()) ? '' : new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(publishedAt),
    createdAt: doc.publishedAt,
    link: doc.href || '/bildirimler',
    read: false,
  };
}

export function monumentsToGeoJSON(items) {
  return {
    type: 'FeatureCollection',
    features: items.filter((item) => item.coordinates.every(Number.isFinite)).map((item) => ({
      type: 'Feature', id: item.id,
      properties: { id: item.id, name: item.name, slug: item.slug, type: item.type, category: item.category, district: item.district, description: item.description, image: item.image },
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
    id: `${item.sourceType}-${item.id}-${index}`, sourceType: item.sourceType, sourceId: item.id, title: item.title,
    action: item.action, actor: 'Payload CMS', createdAt: item.updatedAt, href: item.href,
  }));
}

export async function getPayloadSnapshot() {
  const [monumentDocs, routeDocs, eventDocs, notificationDocs, siteSettings] = await Promise.all([
    fetchCollection('monuments'),
    fetchCollection('cultural-routes', { depth: 1 }),
    fetchCollection('events'),
    fetchCollection('notifications', { sort: '-publishedAt' }),
    fetchGlobal('site-settings'),
  ]);
  const monuments = monumentDocs.map(normalizePayloadMonument).filter((item) => Number.isFinite(item.id));
  const routes = routeDocs.map(normalizePayloadRoute).filter((item) => Number.isFinite(item.id));
  const events = eventDocs.map(normalizePayloadEvent).filter((item) => Number.isFinite(item.id));
  const notifications = notificationDocs.filter((item) => item.active !== false).map(normalizePayloadNotification);
  return {
    monuments, routes, events, notifications,
    homeContent: siteSettings.homeContent,
    aboutContent: siteSettings.aboutContent,
    siteSettings,
    geojson: monumentsToGeoJSON(monuments),
    activity: buildActivity(monuments, routes, events),
    adminUrl: `${getCmsUrl()}/admin`,
    loadedAt: new Date().toISOString(),
  };
}

export async function getPayloadSnapshotOrNull() {
  try {
    return await getPayloadSnapshot();
  } catch (error) {
    console.warn(`Payload CMS kullanılamıyor: ${error.message}`);
    return null;
  }
}
