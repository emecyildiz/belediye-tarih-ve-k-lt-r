import test from 'node:test';
import assert from 'node:assert/strict';
import { monuments } from './monuments.js';
import { culturalRoutes, routeToGeoJSON } from './routes.js';

test('rota durak sayıları bağlı eser kayıtlarıyla eşleşir', () => {
  culturalRoutes.forEach((route) => {
    assert.equal(route.stops, route.monumentIds.length, route.title);
    assert.equal(new Set(route.monumentIds).size, route.monumentIds.length, `${route.title} durakları tekil olmalı`);
    assert.ok(route.monumentIds.every((id) => monuments.some((monument) => monument.id === id)), `${route.title} geçerli eser kimlikleri kullanmalı`);
  });
});

test('her örnek rota OpenLayers için çizgi ve durak GeoJSON verisi üretir', () => {
  culturalRoutes.forEach((route) => {
    const geojson = routeToGeoJSON(route, monuments);
    assert.equal(geojson.type, 'FeatureCollection');
    assert.ok(geojson.features.some((feature) => feature.geometry.type === 'LineString'), `${route.title} için rota çizgisi bekleniyor`);
    const stops = geojson.features.filter((feature) => feature.geometry.type === 'Point');
    assert.equal(stops.length, route.stops);
    assert.ok(stops.every((feature) => (
      feature.properties.name
      && feature.properties.district
      && Object.hasOwn(feature.properties, 'image')
    )));
  });
});
