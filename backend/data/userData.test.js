import test from 'node:test';
import assert from 'node:assert/strict';
import { monuments } from './monuments.js';
import { culturalRoutes } from './routes.js';
import { events } from './events.js';
import { getUserFavorites, toggleUserFavorite, getUserProfileOverview, getUserRoutes, saveUserRoute } from './userData.js';

const sources = { monuments, routes: culturalRoutes, events };

test('favori kayıtları geçerli ana tablo kimliklerine bağlıdır', () => {
  const favorites = getUserFavorites();
  assert.ok(favorites.monument.every((id) => monuments.some((item) => item.id === id)));
  assert.ok(favorites.route.every((id) => culturalRoutes.some((item) => item.id === id)));
  assert.ok(favorites.event.every((id) => events.some((item) => item.id === id)));
});

test('favori değişikliği API sonucuyla kullanıcı kaydını eşzamanlı günceller', () => {
  const before = getUserFavorites().monument.includes(2);
  const changed = toggleUserFavorite('monument', 2, sources);
  assert.equal(changed.favorited, !before);
  assert.equal(getUserFavorites().monument.includes(2), !before);
  toggleUserFavorite('monument', 2, sources);
  assert.equal(getUserFavorites().monument.includes(2), before);
});

test('olmayan ana kayda favori ilişkisi oluşturulmaz', () => {
  assert.equal(toggleUserFavorite('monument', 99999, sources), null);
  assert.equal(toggleUserFavorite('invalid', 1, sources), null);
});

test('profil geçmişi geçerli ana kayıt bağlantılarıyla çözülür', () => {
  const overview = getUserProfileOverview(sources);
  assert.ok(overview.visitedCount > 0);
  assert.ok(overview.visitTrend.length >= 7);
  assert.ok(overview.recentViews.every((item) => item.title && item.href));
});

test('özel rota yalnızca geçerli ve tekilleştirilmiş duraklarla kaydedilir', () => {
  const before = getUserRoutes().length;
  const route = saveUserRoute({ title: 'Test Rotası', selectedIds: [1, 1, 2, 9999], travelMode: 'walking', visitMinutes: 30 }, monuments);
  assert.deepEqual(route.selectedIds, [1, 2]);
  assert.equal(getUserRoutes().length, before + 1);
});
