import assert from 'node:assert/strict';
import test from 'node:test';
import { clearRoutingCache, requestOsrmRoute, RoutingProviderError } from './osrmRoutingProvider.js';

const stops = [
  { coordinates: [36.2021, 36.1605] },
  { coordinates: [36.208, 36.17] },
];

test('OSRM yanıtını yol geometrisi ve ölçülere dönüştürür', async () => {
  clearRoutingCache();
  let requestedUrl = '';
  const result = await requestOsrmRoute({
    stops,
    travelMode: 'walking',
    baseUrl: 'https://routing.example.test',
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          code: 'Ok',
          waypoints: [{ location: [36.1605, 36.2021] }, { location: [36.17, 36.208] }],
          routes: [{
            distance: 1825.6,
            duration: 901,
            geometry: { type: 'LineString', coordinates: [[36.1605, 36.2021], [36.164, 36.205], [36.17, 36.208]] },
            legs: [{ distance: 1825.6, duration: 901, steps: [] }],
          }],
        }),
      };
    },
  });

  assert.match(requestedUrl, /\/route\/v1\/driving\/36\.1605,36\.2021;36\.17,36\.208/);
  assert.equal(result.distanceKm, 1.83);
  assert.equal(result.travelMinutes, 24);
  assert.equal(result.geometry.coordinates.length, 3);
});

test('geçersiz servis yanıtını kontrollü hataya dönüştürür', async () => {
  clearRoutingCache();
  await assert.rejects(
    requestOsrmRoute({ stops, fetchImpl: async () => ({ ok: false, status: 503 }) }),
    RoutingProviderError,
  );
});
