import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchCollection, fetchJson, normalizePayloadMonument, normalizePayloadRoute, normalizePayloadEvent, normalizePayloadNotification, monumentsToGeoJSON } from '../services/cms/payloadCms.js';

test('Payload eser kaydı portal ve GeoJSON sözleşmesine dönüştürülür', () => {
  const monument = normalizePayloadMonument({ legacyId: 7, name: 'Örnek Eser', slug: 'ornek-eser', category: 'muze', district: 'Antakya', coordinates: { latitude: 36.2, longitude: 36.1 }, gallery: [{ url: '/a.jpg' }], highlights: [{ text: 'Özellik' }] });
  assert.equal(monument.id, 7);
  assert.deepEqual(monument.coordinates, [36.2, 36.1]);
  assert.deepEqual(monument.images, ['/a.jpg']);
  assert.deepEqual(monumentsToGeoJSON([monument]).features[0].geometry.coordinates, [36.1, 36.2]);
});

test('Payload medya ilişkisini eski URL alanından öncelikli kullanır', () => {
  const monument = normalizePayloadMonument({
    legacyId: 8,
    image: '/eski.jpg',
    imageMedia: { url: '/api/media/file/ana.jpg', sizes: { card: { url: '/api/media/file/ana-720x480.jpg' } } },
    galleryMedia: [{ media: { url: '/api/media/file/galeri.jpg' } }],
    gallery: [{ url: '/eski-galeri.jpg' }],
    coordinates: { latitude: 36.2, longitude: 36.1 },
  });
  assert.equal(monument.image, 'http://localhost:3000/api/media/file/ana-720x480.jpg');
  assert.deepEqual(monument.images, ['http://localhost:3000/api/media/file/galeri.jpg']);
});

test('Payload rota ilişkileri portalın durak kimliklerine dönüştürülür', () => {
  const route = normalizePayloadRoute({ legacyId: 2, monuments: [{ legacyId: 7 }, { legacyId: 9 }] });
  assert.deepEqual(route.monumentIds, [7, 9]);
  assert.equal(route.stops, 2);
});

test('Payload etkinlik tarihi portal takvim biçimini korur', () => {
  const event = normalizePayloadEvent({ legacyId: 4, date: '2026-09-03T09:00:00.000Z' });
  assert.equal(event.id, 4);
  assert.equal(event.date, '2026-09-03');
  assert.ok(event.dateLabel.includes('2026'));
});

test('Payload bildirim bağlantısı portal bildirim türüne dönüştürülür', () => {
  const notification = normalizePayloadNotification({ id: 42, title: 'Yeni rota', message: 'Rota yayımlandı.', type: 'announcement', publishedAt: '2026-08-26T08:00:00.000Z', href: '/kultur-rotalari/yeni-rota' });
  assert.equal(notification.id, 42);
  assert.equal(notification.type, 'route');
  assert.equal(notification.link, '/kultur-rotalari/yeni-rota');
  assert.equal(notification.read, false);
});

test('Payload koleksiyonu bütün sayfaları birleştirir', async () => {
  const originalFetch = globalThis.fetch;
  const requestedPages = [];
  globalThis.fetch = async (url) => {
    const page = Number(new URL(url).searchParams.get('page'));
    requestedPages.push(page);
    return new Response(JSON.stringify(page === 1
      ? { docs: [{ legacyId: 1 }], hasNextPage: true, nextPage: 2 }
      : { docs: [{ legacyId: 2 }], hasNextPage: false, nextPage: null }),
    { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const docs = await fetchCollection('monuments');
    assert.deepEqual(docs.map((item) => item.legacyId), [1, 2]);
    assert.deepEqual(requestedPages, [1, 2]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Payload ilk geçici 503 yanıtından sonra yalnızca bir kez yeniden dener', async () => {
  let requestCount = 0;
  const data = await fetchJson('/api/monuments', {
    retryDelayMs: 0,
    fetchImpl: async () => {
      requestCount += 1;
      return new Response(requestCount === 1 ? 'hazırlanıyor' : JSON.stringify({ docs: [] }), {
        status: requestCount === 1 ? 503 : 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });
  assert.deepEqual(data, { docs: [] });
  assert.equal(requestCount, 2);
});

test('Payload kalıcı istemci hatalarını yeniden denemez', async () => {
  let requestCount = 0;
  await assert.rejects(() => fetchJson('/api/olmayan-kaynak', {
    retryDelayMs: 0,
    fetchImpl: async () => {
      requestCount += 1;
      return new Response('bulunamadı', { status: 404 });
    },
  }), /HTTP 404/);
  assert.equal(requestCount, 1);
});
