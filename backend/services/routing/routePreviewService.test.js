import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRoadRoutePreview } from './routePreviewService.js';

const monuments = [
  { id: 1, name: 'Birinci', slug: 'birinci', district: 'Antakya', category: 'muze', coordinates: [36.2, 36.1] },
  { id: 2, name: 'İkinci', slug: 'ikinci', district: 'Antakya', category: 'kilise', coordinates: [36.3, 36.2] },
];

test('yol sağlayıcısının kıvrımlı geometrisini önizlemeye taşır', async () => {
  const preview = await buildRoadRoutePreview(
    { monuments, stopIds: [1, 2], travelMode: 'walking' },
    { routeProvider: async () => ({
      geometry: { type: 'LineString', coordinates: [[36.1, 36.2], [36.15, 36.24], [36.2, 36.3]] },
      distanceKm: 4.2, travelMinutes: 48, legs: [], snappedWaypoints: [],
      provider: 'osrm', dataSource: 'OpenStreetMap yol ağı', routingProfile: 'driving', requestedTravelMode: 'driving', cached: false,
    }) },
  );
  assert.equal(preview.cbs.followsRoadNetwork, true);
  assert.equal(preview.travelMode, 'driving');
  assert.equal(preview.geojson.features[0].geometry.coordinates.length, 3);
  assert.equal(preview.durationMinutes, 48);
});

test('servis kapalıyken yanıltıcı düz çizgi üretmez', async () => {
  const preview = await buildRoadRoutePreview(
    { monuments, stopIds: [1, 2] },
    { routeProvider: async () => { throw new Error('kapalı'); } },
  );
  assert.equal(preview.cbs.routingStatus, 'unavailable');
  assert.equal(preview.geojson.features.some((feature) => feature.properties.type === 'route-line'), false);
  assert.equal(preview.geometry, null);
});
