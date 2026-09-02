import assert from 'node:assert/strict';
import test from 'node:test';
import { clearGraphHopperRoutingCache, requestGraphHopperRoute } from './graphHopperRoutingProvider.js';

const stops = [
  { coordinates: [36.2021, 36.1605] },
  { coordinates: [36.208, 36.17] },
];

test('GraphHopper yalnızca araç profilini ve GeoJSON yol geometrisini kullanır', async () => {
  clearGraphHopperRoutingCache();
  let requestedUrl = '';
  const result = await requestGraphHopperRoute({
    stops,
    travelMode: 'walking',
    baseUrl: 'http://routing.example.test:8989',
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          paths: [{
            distance: 1450,
            time: 1_020_000,
            points: { type: 'LineString', coordinates: [[36.1605, 36.2021], [36.165, 36.205], [36.17, 36.208]] },
            snapped_waypoints: { coordinates: [[36.1605, 36.2021], [36.17, 36.208]] },
            instructions: [{ text: 'Düz devam edin', distance: 120, time: 80_000, sign: 0 }],
          }],
        }),
      };
    },
  });
  const url = new URL(requestedUrl);
  assert.equal(url.searchParams.get('profile'), 'car');
  assert.equal(result.requestedTravelMode, 'driving');
  assert.deepEqual(url.searchParams.getAll('point'), ['36.2021,36.1605', '36.208,36.17']);
  assert.equal(result.distanceKm, 1.45);
  assert.equal(result.travelMinutes, 17);
  assert.equal(result.geometry.coordinates.length, 3);
  assert.equal(result.durationMethod, 'routing-profile');
});

test('eski ulaşım türleri gönderilse de araç profili kullanılır', async () => {
  clearGraphHopperRoutingCache();
  const profiles = [];
  const fetchImpl = async (url) => {
    profiles.push(new URL(url).searchParams.get('profile'));
    return { ok: true, json: async () => ({ paths: [{ distance: 1000, time: 60_000, points: { coordinates: [[36.1, 36.2], [36.2, 36.3]] } }] }) };
  };
  await requestGraphHopperRoute({ stops, travelMode: 'driving', fetchImpl, baseUrl: 'http://routing.test' });
  await requestGraphHopperRoute({ stops, travelMode: 'cycling', fetchImpl, baseUrl: 'http://routing.test' });
  assert.deepEqual(profiles, ['car']);
});
