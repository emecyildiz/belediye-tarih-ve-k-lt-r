import test from 'node:test';
import assert from 'node:assert/strict';
import { getMonumentsPage, getRoutesPage, getEventsPage, getEventCalendar } from './mockDb.js';

test('eser listesi filtrelemeden sonra sayfalanır', () => {
  const first = getMonumentsPage({ page: 1, pageSize: 5 });
  const second = getMonumentsPage({ page: 2, pageSize: 5 });
  assert.equal(first.items.length, 5);
  assert.equal(first.pagination.totalItems, first.facets.totalItems);
  assert.equal(first.pagination.hasNextPage, true);
  assert.equal(first.items.some((item) => second.items.some((candidate) => candidate.id === item.id)), false);

  const filtered = getMonumentsPage({ categories: 'camii,kilise', page: 1, pageSize: 100 });
  assert.ok(filtered.items.length > 0);
  assert.ok(filtered.items.every((item) => ['camii', 'kilise'].includes(item.category)));
});

test('rota sayfası kart için ilişkili durak adlarını taşır', () => {
  const result = getRoutesPage({ page: 1, pageSize: 4, sort: 'short' });
  assert.equal(result.items.length, 4);
  assert.ok(result.items.every((route) => Array.isArray(route.stopNames) && route.stopNames.length >= 2));
  assert.equal(result.pagination.totalItems, result.facets.totalItems);
});

test('etkinlik araması, sayfalama ve aylık takvim aynı kayıtları kullanır', () => {
  const searched = getEventsPage({ search: 'Hatay', page: 1, pageSize: 6 });
  assert.ok(searched.items.length > 0);
  assert.ok(searched.featured);
  assert.ok(searched.facets.totalItems >= searched.pagination.totalItems);

  const calendar = getEventCalendar({ from: '2026-08-01', to: '2026-08-31' });
  assert.ok(calendar.every((item) => item.date >= '2026-08-01' && item.date <= '2026-08-31'));
});
