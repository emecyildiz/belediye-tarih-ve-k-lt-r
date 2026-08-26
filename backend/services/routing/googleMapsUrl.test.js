import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGoogleMapsDirectionsUrl } from '../../../src/utils/googleMaps.js';

test('Google Haritalar adresine başlangıç, ara durak ve hedefi sıralı taşır', () => {
  const url = new URL(buildGoogleMapsDirectionsUrl([
    { coordinates: [36.20, 36.10] },
    { coordinates: [36.21, 36.11] },
    { coordinates: [36.22, 36.12] },
  ], 'walking'));
  assert.equal(url.searchParams.get('origin'), '36.2,36.1');
  assert.equal(url.searchParams.get('waypoints'), '36.21,36.11');
  assert.equal(url.searchParams.get('destination'), '36.22,36.12');
  assert.equal(url.searchParams.get('travelmode'), 'walking');
});

test('bisiklet modu Google Haritalar sözleşmesine dönüştürülür', () => {
  const url = new URL(buildGoogleMapsDirectionsUrl([
    { coordinates: [36.20, 36.10] },
    { coordinates: [36.21, 36.11] },
  ], 'cycling'));
  assert.equal(url.searchParams.get('travelmode'), 'bicycling');
});

test('iki geçerli durağı olmayan rota dışarı aktarılmaz', () => {
  assert.equal(buildGoogleMapsDirectionsUrl([{ coordinates: [36.20, 36.10] }]), '');
});
