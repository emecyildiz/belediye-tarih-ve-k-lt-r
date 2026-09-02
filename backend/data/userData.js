const allowedFavoriteTypes = new Set(['monument', 'route', 'event']);

// Giriş sistemi eklendiğinde bu kayıt userId üzerinden gerçek kullanıcı tablolarına bağlanır.
const demoUserData = {
  userId: 1,
  favorites: {
    monument: [1, 2, 4, 9, 13],
    route: [2, 3, 4, 5, 6],
    event: [1, 3],
  },
  profileOverview: {
    profile: {
      displayName: 'TKMBS Kullanıcısı',
      email: 'kullanici@tkmbs.local',
      district: 'Antakya',
      membershipDate: '2026-01-15',
    },
    preferences: {
      eventReminders: true,
      routeSuggestions: true,
      favoriteUpdates: true,
      weatherAlerts: false,
    },
    visitedCount: 21,
    recentViews: [
      { type: 'monument', id: 4, viewedAt: '2026-08-23T16:20:00+03:00' },
      { type: 'monument', id: 5, viewedAt: '2026-08-22T11:10:00+03:00' },
      { type: 'route', id: 2, viewedAt: '2026-08-21T18:45:00+03:00' },
      { type: 'monument', id: 2, viewedAt: '2026-08-20T14:30:00+03:00' },
    ],
    visitTrend: [
      { label: 'Şub', monumentVisits: 3, routeVisits: 1, eventVisits: 1 },
      { label: 'Mar', monumentVisits: 4, routeVisits: 2, eventVisits: 1 },
      { label: 'Nis', monumentVisits: 5, routeVisits: 2, eventVisits: 1 },
      { label: 'May', monumentVisits: 3, routeVisits: 1, eventVisits: 1 },
      { label: 'Haz', monumentVisits: 4, routeVisits: 3, eventVisits: 1 },
      { label: 'Tem', monumentVisits: 5, routeVisits: 2, eventVisits: 2 },
      { label: 'Ağu', monumentVisits: 4, routeVisits: 2, eventVisits: 1 },
    ],
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

export function getUserProfileOverview(sources) {
  const configs = {
    monument: { rows: sources.monuments, titleKey: 'name', basePath: '/tarihi-eserler' },
    route: { rows: sources.routes, titleKey: 'title', basePath: '/kultur-rotalari' },
    event: { rows: sources.events, titleKey: 'title', basePath: '/etkinlikler' },
  };
  const recentViews = demoUserData.profileOverview.recentViews.map((view) => {
    const config = configs[view.type];
    const item = config?.rows.find((row) => row.id === view.id);
    if (!item) return null;
    return { ...view, title: item[config.titleKey], image: item.image, district: item.district, href: `${config.basePath}/${item.slug || item.id}` };
  }).filter(Boolean);
  return {
    profile: { ...demoUserData.profileOverview.profile },
    preferences: { ...demoUserData.profileOverview.preferences },
    visitedCount: demoUserData.profileOverview.visitedCount,
    recentViews,
    visitTrend: demoUserData.profileOverview.visitTrend.map((item) => ({ ...item })),
  };
}

export function updateUserPreferences(payload = {}) {
  const allowedKeys = Object.keys(demoUserData.profileOverview.preferences);
  allowedKeys.forEach((key) => {
    if (typeof payload[key] === 'boolean') demoUserData.profileOverview.preferences[key] = payload[key];
  });
  return { ...demoUserData.profileOverview.preferences };
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
    travelMode: 'driving',
    preview: payload.preview || null,
    createdAt: new Date().toISOString(),
  };
  demoUserData.customRoutes.push(record);
  return { ...record, selectedIds: [...record.selectedIds] };
}
