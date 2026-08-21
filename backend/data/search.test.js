import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCatalog } from './mockDb.js';

test('genel arama eser, rota ve etkinlik kayıtlarını ortak sözleşmede döndürür', () => {
  const result = searchCatalog({ q: 'Hatay', page: 1, pageSize: 50 });
  assert.ok(result.pagination.totalItems > 0);
  assert.equal(result.facets.totalItems, result.facets.monuments + result.facets.routes + result.facets.events);
  assert.ok(result.items.every((item) => item.kind && item.title && item.href));
});

test('arama tür filtresi sayfalama öncesinde uygulanır', () => {
  const result = searchCatalog({ q: 'Antakya', type: 'event', page: 1, pageSize: 3 });
  assert.ok(result.items.length > 0);
  assert.ok(result.items.every((item) => item.kind === 'event'));
  assert.ok(result.items.length <= 3);
});
