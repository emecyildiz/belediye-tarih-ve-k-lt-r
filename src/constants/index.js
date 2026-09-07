export const COLORS = {
  navy: '#0c1e35',
  navyDark: '#001a3d',
  navyLight: '#1e3a5f',
  gold: '#c5a070',
  goldDark: '#a68945',
  blue: '#2563eb',
  bg: '#f4f6f8',
  white: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#ea580c',
  danger: '#dc2626',
};

export const NAV_ITEMS = [
  { path: '/', label: 'Ana Sayfa', icon: 'home' },
  { path: '/harita', label: 'Harita', icon: 'map' },
  { path: '/tarihi-eserler', label: 'Tarihi Eserler', icon: 'monument' },
  { path: '/kultur-rotalari', label: 'Kültürel Rotalar', icon: 'route' },
  { path: '/etkinlikler', label: 'Etkinlikler', icon: 'calendar' },
  { path: '/profil', label: 'Profil', icon: 'user' },
];

export const CATEGORY_LABELS = {
  tumu: 'Tümü',
  camii: 'Camii',
  kilise: 'Kilise',
  han: 'Han',
  kopru: 'Köprü',
  kale: 'Kale',
  muze: 'Müze',
  doga: 'Doğa Alanı',
  diger: 'Diğer',
};

export const CATEGORY_ICONS = {
  camii: '🕌',
  kilise: '⛪',
  han: '🏪',
  kopru: '🌉',
  kale: '🏰',
  muze: '🏛️',
  doga: '🌿',
  diger: '📍',
};

export const TYPE_LABELS = {
  yapi: 'Yapı',
  anit: 'Anıt',
  arkeolojik: 'Arkeolojik Alan',
};

export const PROTECTION_COLORS = {
  'Korunuyor': '#16a34a',
  'Kısmen Korunuyor': '#ea580c',
  'Korunmuyor': '#dc2626',
};

export const ROUTE_CATEGORIES = [
  { key: 'tumu', label: 'Tüm Rotalar', count: 12 },
  { key: 'tarihi', label: 'Tarihi Rota', count: 5 },
  { key: 'inanc', label: 'İnanç Rotası', count: 3 },
  { key: 'doga', label: 'Doğa Rota', count: 2 },
  { key: 'gastronomi', label: 'Gastronomi Rotası', count: 2 },
  { key: 'kultur', label: 'Kültür Rota', count: 4 },
];

export const EVENT_CATEGORIES = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'kultur', label: 'Kültürel Etkinlik' },
  { key: 'sanat', label: 'Sanat Etkinliği' },
  { key: 'gezi', label: 'Gezi / Tur' },
  { key: 'konferans', label: 'Konferans / Panel' },
  { key: 'atolye', label: 'Atölye' },
  { key: 'sergi', label: 'Sergi' },
  { key: 'festival', label: 'Festival' },
];

export const MAP_CATEGORIES = [
  { key: 'tumu', label: 'Tümü', count: 256 },
  { key: 'camii', label: 'Camii', count: 48 },
  { key: 'kilise', label: 'Kilise', count: 32 },
  { key: 'han', label: 'Han', count: 24 },
  { key: 'kopru', label: 'Köprü', count: 18 },
  { key: 'kale', label: 'Kale', count: 16 },
  { key: 'muze', label: 'Müze', count: 16 },
  { key: 'doga', label: 'Doğa Alanı', count: 28 },
  { key: 'diger', label: 'Diğer', count: 76 },
];

export const CULTURAL_ROUTES_LIST = [
  { id: 1, label: 'İnanç ve Medeniyet Rotası', icon: '🕍' },
  { id: 2, label: 'Tarihi Antakya Rotası', icon: '🏛️' },
  { id: 3, label: 'Hatay Lezzet Rotası', icon: '🍽️' },
  { id: 4, label: 'Harbiye Doğa Rotası', icon: '🌿' },
  { id: 5, label: 'Arkeoloji Rotası', icon: '🏺' },
  { id: 6, label: 'Kale ve Savunma Rotası', icon: '🏰' },
];

export const CATEGORY_COLORS = {
  camii: '#1e3a5f',
  kilise: '#2563eb',
  han: '#7c3aed',
  kopru: '#0891b2',
  kale: '#64748b',
  muze: '#ea580c',
  doga: '#16a34a',
  diger: '#94a3b8',
  event: '#dc3355',
};
