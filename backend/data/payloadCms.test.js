import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePayloadMonument, normalizePayloadRoute, normalizePayloadEvent, monumentsToGeoJSON } from '../services/cms/payloadCms.js';

test('Payload eser kaydı portal ve GeoJSON sözleşmesine dönüştürülür', () => {
  const monument = normalizePayloadMonument({ legacyId: 7, name: 'Örnek Eser', slug: 'ornek-eser', category: 'muze', district: 'Antakya', coordinates: { latitude: 36.2, longitude: 36.1 }, gallery: [{ url: '/a.jpg' }], highlights: [{ text: 'Özellik' }] });
  assert.equal(monument.id, 7);
  assert.deepEqual(monument.coordinates, [36.2, 36.1]);
  assert.deepEqual(monument.images, ['/a.jpg']);
  assert.deepEqual(monumentsToGeoJSON([monument]).features[0].geometry.coordinates, [36.1, 36.2]);
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
