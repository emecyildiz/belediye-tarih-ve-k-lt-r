import test from 'node:test';
import assert from 'node:assert/strict';
import { monuments } from './monuments.js';
import { culturalRoutes } from './routes.js';
import { events } from './events.js';
import { buildChartData, buildStatistics } from './statistics.js';

const sources = { monuments, routes: culturalRoutes, events };

test('özet sayıları ana tablolardaki kayıt sayılarıyla eşleşir', () => {
  const statistics = buildStatistics(sources);
  assert.equal(statistics.toplamEser, monuments.length);
  assert.equal(statistics.kulturRota, culturalRoutes.length);
  assert.equal(statistics.etkinlik, events.length);
  assert.equal(statistics.harita.toplamEser, monuments.length);
  assert.equal(statistics.catalog.kayitliEserler, monuments.length);
});

test('ziyaret toplamları bütün rapor kırılımlarında aynıdır', () => {
  const report = buildChartData(sources).reporting;
  const metric = report.metrics.find((item) => item.key === 'visits').value;
  assert.equal(report.trend.reduce((total, item) => total + item.total, 0), metric);
  assert.equal(report.devices.reduce((total, item) => total + item.count, 0), metric);
  assert.equal(report.districts.reduce((total, item) => total + item.count, 0), metric);
  assert.deepEqual(report.integrity, {
    valid: true,
    danglingReferences: 0,
    sourceCounts: { monuments: monuments.length, routes: culturalRoutes.length, events: events.length },
  });
});

test('rapor başlıkları sabit metinden değil ilişkili ana kayıttan gelir', () => {
  const renamedMonuments = monuments.map((item) => item.id === 1 ? { ...item, name: 'Güncellenen Eser Adı' } : item);
  const renamedEvents = events.map((item) => item.id === 14 ? { ...item, title: 'Güncellenen Etkinlik Adı' } : item);
  const report = buildChartData({ ...sources, monuments: renamedMonuments, events: renamedEvents }).reporting;
  assert.equal(report.topContent.find((item) => item.sourceType === 'monument' && item.sourceId === 1).title, 'Güncellenen Eser Adı');
  assert.equal(report.eventPerformance.find((item) => item.eventId === 14).title, 'Güncellenen Etkinlik Adı');
});

test('silinmiş ana kayda bağlı analiz satırı veri bütünlüğü hatası üretir', () => {
  const report = buildChartData({ ...sources, events: events.filter((item) => item.id !== 14) }).reporting;
  assert.equal(report.integrity.valid, false);
  assert.equal(report.integrity.danglingReferences, 2);
});
