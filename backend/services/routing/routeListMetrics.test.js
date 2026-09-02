import assert from 'node:assert/strict';
import test from 'node:test';
import { enrichRoutePageMetrics } from './routeListMetrics.js';

const page = {
  items: [{ id: 1, title: 'Merkez Rotası', monumentIds: [1, 2], duration: '3-4 Saat', distance: '4.2 km' }],
  pagination: { page: 1, totalItems: 1 },
};

test('rota kartındaki mesafe ve süreyi yol ağı önizlemesiyle eşitler', async () => {
  const result = await enrichRoutePageMetrics(page, {
    monuments: [],
    previewBuilder: async () => ({
      distanceKm: 5.4,
      travelMinutes: 71,
      durationMinutes: 121,
      cbs: { routingStatus: 'ready' },
    }),
  });
  assert.equal(result.items[0].distance, '5.4 km');
  assert.equal(result.items[0].duration, '1 sa 11 dk');
  assert.equal(result.items[0].travelMinutes, 71);
  assert.deepEqual(result.pagination, page.pagination);
});

test('yol servisi hazır değilse kayıtlı kart değerlerini korur', async () => {
  const result = await enrichRoutePageMetrics(page, {
    previewBuilder: async () => ({ cbs: { routingStatus: 'unavailable' } }),
  });
  assert.equal(result.items[0].distance, '4.2 km');
  assert.equal(result.items[0].duration, '3-4 Saat');
});
