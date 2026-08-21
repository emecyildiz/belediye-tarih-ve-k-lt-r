const allowedFavoriteTypes = new Set(['monument', 'route', 'event']);

// Giriş sistemi eklendiğinde bu kayıt userId üzerinden gerçek kullanıcı tablolarına bağlanır.
const demoUserData = {
  userId: 1,
  favorites: {
    monument: [1, 4],
    route: [2],
    event: [3],
  },
  customRoutes: [],
};

export function getUserFavorites() {
  return Object.fromEntries(Object.entries(demoUserData.favorites).map(([type, ids]) => [type, [...ids]]));
}

export function toggleUserFavorite(type, id, sources) {
  const numericId = Number(id);
  if (!allowedFavoriteTypes.has(type) || !Number.isInteger(numericId)) return null;
  const source = type === 'monument' ? sources.monuments : type === 'route' ? sources.routes : sources.events;
  if (!source.some((item) => item.id === numericId)) return null;
  const current = demoUserData.favorites[type];
  const favorited = !current.includes(numericId);
  demoUserData.favorites[type] = favorited ? [...current, numericId] : current.filter((itemId) => itemId !== numericId);
  return { type, id: numericId, favorited, ids: [...demoUserData.favorites[type]] };
}

export function getUserRoutes() {
  return demoUserData.customRoutes.map((route) => ({ ...route, selectedIds: [...route.selectedIds] }));
}

export function saveUserRoute(payload, monuments) {
  const selectedIds = [...new Set((payload.selectedIds || []).map(Number))]
    .filter((id) => monuments.some((item) => item.id === id));
  if (!String(payload.title || '').trim() || !selectedIds.length) return null;
  const record = {
    id: demoUserData.customRoutes.length ? Math.max(...demoUserData.customRoutes.map((item) => item.id)) + 1 : 1,
    userId: demoUserData.userId,
    title: String(payload.title).trim(),
    selectedIds,
    travelMode: ['walking', 'cycling', 'driving'].includes(payload.travelMode) ? payload.travelMode : 'walking',
    visitMinutes: Number(payload.visitMinutes) || 25,
    preview: payload.preview || null,
    createdAt: new Date().toISOString(),
  };
  demoUserData.customRoutes.push(record);
  return { ...record, selectedIds: [...record.selectedIds] };
}
