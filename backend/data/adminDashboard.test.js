import test from 'node:test';
import assert from 'node:assert/strict';
import { monuments } from './monuments.js';
import { culturalRoutes } from './routes.js';
import { events } from './events.js';
import { buildChartData, buildStatistics } from './statistics.js';
import { buildAdminDashboard, reviewAdminRecord } from './adminDashboard.js';

function createDashboard(overrides = {}) {
  const sources = { monuments, routes: culturalRoutes, events, ...overrides };
  return buildAdminDashboard({
    ...sources,
    statistics: buildStatistics(sources),
    charts: buildChartData(sources),
  });
}

test('yönetim metrikleri ana veri tablolarıyla eşleşir', () => {
  const dashboard = createDashboard();
  assert.equal(dashboard.metrics.find((item) => item.key === 'monuments').value, monuments.length);
  assert.equal(dashboard.metrics.find((item) => item.key === 'routes').value, culturalRoutes.length);
  assert.equal(dashboard.metrics.find((item) => item.key === 'events').value, events.length);
  assert.equal(dashboard.metrics.find((item) => item.key === 'integrity').value, 100);
});

test('iş akışı başlıkları ilişkili ana kayıttan çözülür', () => {
  const changedMonuments = monuments.map((item) => item.id === 8 ? { ...item, name: 'Güncellenen Yönetim Kaydı' } : item);
  const dashboard = createDashboard({ monuments: changedMonuments });
  assert.equal(dashboard.pendingReviews.find((item) => item.sourceType === 'monument' && item.sourceId === 8).title, 'Güncellenen Yönetim Kaydı');
});

test('onay kararı bekleyen kayıt sayısını azaltır', () => {
  const before = createDashboard().pendingReviews.length;
  assert.equal(reviewAdminRecord(1, 'approved').status, 'approved');
  const after = createDashboard().pendingReviews.length;
  assert.equal(after, before - 1);
});
