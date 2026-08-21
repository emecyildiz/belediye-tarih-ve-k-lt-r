import express from 'express';
import cors from 'cors';
import { monuments, categoryCounts, monumentsToGeoJSON } from './backend/data/monuments.js';
import { culturalRoutes } from './backend/data/routes.js';
import { buildRoutePreview } from './backend/services/cbs/mockCbsProvider.js';
import { events, eventCategoryCounts } from './backend/data/events.js';
import { statistics, weather, chartData } from './backend/data/statistics.js';
import { notifications } from './backend/data/mockDb.js';

const app = express();
app.use(cors());
app.use(express.json());

const ok = (data, extra = {}) => ({ success: true, data, ...extra });
const fail = (res, msg, code = 500) => res.status(code).json({ success: false, error: msg });

const weatherLabels = {
  0: 'Açık', 1: 'Çoğunlukla açık', 2: 'Parçalı bulutlu', 3: 'Kapalı',
  45: 'Sisli', 48: 'Kırağılı sis', 51: 'Hafif çisenti', 53: 'Çisenti',
  55: 'Yoğun çisenti', 61: 'Hafif yağmurlu', 63: 'Yağmurlu', 65: 'Kuvvetli yağmur',
  71: 'Hafif kar', 73: 'Karlı', 75: 'Yoğun kar', 80: 'Sağanak yağışlı',
  81: 'Sağanak yağışlı', 82: 'Kuvvetli sağanak', 95: 'Gök gürültülü',
  96: 'Dolu ihtimalli fırtına', 99: 'Dolu ve fırtına',
};

async function fetchAntakyaWeather() {
  if (typeof fetch !== 'function') return { ...weather, live: false };
  const params = new URLSearchParams({
    latitude: '36.2021', longitude: '36.1605',
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'Europe/Istanbul', forecast_days: '5',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error(`Weather service ${response.status}`);
    const payload = await response.json();
    const current = payload.current || {};
    const daily = payload.daily || {};
    const condition = weatherLabels[current.weather_code] || 'Değişken hava';
    return {
      temp: Math.round(current.temperature_2m),
      temperature: Math.round(current.temperature_2m),
      desc: condition,
      condition,
      feelsLike: Math.round(current.apparent_temperature),
      windSpeed: Math.round(current.wind_speed_10m),
      isDay: Boolean(current.is_day),
      location: 'Antakya',
      updatedAt: current.time,
      live: true,
      forecast: (daily.time || []).map((date, index) => ({
        date,
        tempMax: Math.round(daily.temperature_2m_max[index]),
        tempMin: Math.round(daily.temperature_2m_min[index]),
        code: daily.weather_code[index],
      })),
    };
  } catch (error) {
    console.warn('Canlı hava durumu alınamadı:', error.message);
    return { ...weather, live: false };
  }
}

// --- GeoJSON / Harita ---
app.get('/api/locations', (req, res) => {
  const { category, district } = req.query;
  let filtered = [...monuments];
  if (category && category !== 'tumu') filtered = filtered.filter((m) => m.category === category);
  if (district) filtered = filtered.filter((m) => m.district === district);
  res.json(ok(monumentsToGeoJSON(filtered), { count: filtered.length }));
});

app.get('/api/locations/:id', (req, res) => {
  const item = monuments.find((m) => m.id === parseInt(req.params.id));
  if (!item) return fail(res, 'Konum bulunamadı', 404);
  res.json(ok(item));
});

app.get('/api/locations/slug/:slug', (req, res) => {
  const item = monuments.find((m) => m.slug === req.params.slug);
  if (!item) return fail(res, 'Konum bulunamadı', 404);
  res.json(ok(item));
});

// --- Tarihi Eserler ---
app.get('/api/monuments', (req, res) => {
  const { category, type, district, search } = req.query;
  let filtered = [...monuments];
  if (category && category !== 'tumu') filtered = filtered.filter((m) => m.category === category);
  if (type) filtered = filtered.filter((m) => m.type === type);
  if (district) filtered = filtered.filter((m) => m.district === district);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }
  res.json(ok(filtered, { count: filtered.length, total: monuments.length }));
});

app.get('/api/monuments/:id', (req, res) => {
  const item = monuments.find((m) => m.id === parseInt(req.params.id));
  if (!item) return fail(res, 'Eser bulunamadı', 404);
  const nearby = monuments
    .filter((m) => m.id !== item.id)
    .slice(0, 3)
    .map((m) => ({ id: m.id, name: m.name, slug: m.slug, distance: m.distance, image: m.image }));
  res.json(ok({ ...item, nearby }));
});

app.get('/api/categories', (_req, res) => {
  res.json(ok(categoryCounts));
});

// --- Kültürel Rotalar ---
app.get('/api/routes', (req, res) => {
  const { category, district } = req.query;
  let filtered = [...culturalRoutes];
  if (category && category !== 'tumu') filtered = filtered.filter((r) => r.category === category);
  if (district) filtered = filtered.filter((r) => r.district === district);
  res.json(ok(filtered, { count: filtered.length }));
});

app.post('/api/routes/preview', (req, res) => {
  const preview = buildRoutePreview({
    monuments,
    stopIds: req.body?.stopIds,
    travelMode: req.body?.travelMode,
    visitMinutes: req.body?.visitMinutes,
    title: req.body?.title,
  });
  res.json(ok(preview));
});

app.get('/api/routes/:id', (req, res) => {
  const route = culturalRoutes.find(
    (r) => r.id === parseInt(req.params.id) || r.slug === req.params.id
  );
  if (!route) return fail(res, 'Rota bulunamadı', 404);
  const preview = buildRoutePreview({
    monuments,
    stopIds: route.monumentIds,
    travelMode: route.travelMode || 'walking',
    routeId: route.id,
    title: route.title,
  });
  res.json(ok({ ...route, ...preview }));
});

app.get('/api/routes/:id/geojson', (req, res) => {
  const route = culturalRoutes.find(
    (r) => r.id === parseInt(req.params.id) || r.slug === req.params.id
  );
  if (!route) return fail(res, 'Rota bulunamadı', 404);
  const preview = buildRoutePreview({
    monuments,
    stopIds: route.monumentIds,
    travelMode: route.travelMode || 'walking',
    routeId: route.id,
    title: route.title,
  });
  res.json(ok(preview.geojson));
});

// --- Etkinlikler ---
app.get('/api/events', (req, res) => {
  const { category } = req.query;
  let filtered = [...events];
  if (category && category !== 'tumu') filtered = filtered.filter((e) => e.category === category);
  res.json(ok(filtered, { count: filtered.length }));
});

app.get('/api/events/:id', (req, res) => {
  const item = events.find((e) => e.id === parseInt(req.params.id));
  if (!item) return fail(res, 'Etkinlik bulunamadı', 404);
  res.json(ok(item));
});

app.get('/api/events/categories/counts', (_req, res) => {
  res.json(ok(eventCategoryCounts));
});

// --- İstatistikler & Yardımcı ---
app.get('/api/statistics', (_req, res) => res.json(ok(statistics)));
app.get('/api/weather', async (_req, res) => res.json(ok(await fetchAntakyaWeather())));
app.get('/api/charts', (_req, res) => res.json(ok(chartData)));

app.get('/api/news', (_req, res) => {
  res.json(ok(events.slice(0, 3).map((e) => ({
    id: e.id,
    title: e.title,
    content: e.description,
    date: e.date,
    image: e.image
  })), { count: 3 }));
});

app.get('/api/notifications/count', (_req, res) => {
  res.json(ok(notifications.filter((item) => !item.read).length));
});

app.get('/api/notifications', (_req, res) => {
  res.json(ok(notifications));
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// CRUD placeholder - gerçek DB entegrasyonu için
app.post('/api/locations', (_req, res) => res.json(ok(null, { message: 'Konum eklendi' })));
app.put('/api/locations/:id', (req, res) => res.json(ok(null, { message: `Konum ${req.params.id} güncellendi` })));
app.delete('/api/locations/:id', (req, res) => res.json(ok(null, { message: `Konum ${req.params.id} silindi` })));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 TKMBS Backend: http://localhost:${PORT}`);
  console.log(`📍 GeoJSON: http://localhost:${PORT}/api/locations`);
  console.log(`🏛️  Eserler: http://localhost:${PORT}/api/monuments\n`);
});
