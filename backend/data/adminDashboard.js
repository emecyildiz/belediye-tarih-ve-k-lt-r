const reviewRecords = [
  { id: 1, sourceType: 'monument', sourceId: 8, operation: 'Envanter güncellemesi', submittedBy: 'Kültür Varlıkları Birimi', submittedAt: '2026-08-21T09:45:00+03:00', status: 'pending' },
  { id: 2, sourceType: 'route', sourceId: 13, operation: 'Yeni rota yayını', submittedBy: 'CBS Şube Müdürlüğü', submittedAt: '2026-08-21T08:30:00+03:00', status: 'pending' },
  { id: 3, sourceType: 'event', sourceId: 13, operation: 'Etkinlik programı', submittedBy: 'Kültür ve Sosyal İşler', submittedAt: '2026-08-20T16:10:00+03:00', status: 'pending' },
  { id: 4, sourceType: 'monument', sourceId: 3, operation: 'Konum doğrulaması', submittedBy: 'Saha Veri Ekibi', submittedAt: '2026-08-20T13:20:00+03:00', status: 'pending' },
];

const auditRecords = [
  { id: 1, sourceType: 'monument', sourceId: 1, action: 'Envanter bilgileri güncellendi', actor: 'İçerik Editörü', createdAt: '2026-08-21T11:42:00+03:00' },
  { id: 2, sourceType: 'event', sourceId: 11, action: 'Etkinlik programı yayımlandı', actor: 'Kültür Birimi', createdAt: '2026-08-21T10:18:00+03:00' },
  { id: 3, sourceType: 'route', sourceId: 2, action: 'Rota süresi yeniden hesaplandı', actor: 'CBS Uzmanı', createdAt: '2026-08-21T09:06:00+03:00' },
  { id: 4, sourceType: 'monument', sourceId: 8, action: 'Yeni medya kaydı eklendi', actor: 'Saha Veri Ekibi', createdAt: '2026-08-20T16:34:00+03:00' },
];

const typeConfig = {
  monument: { collection: 'monuments', titleKey: 'name', path: '/tarihi-eserler' },
  route: { collection: 'routes', titleKey: 'title', path: '/kultur-rotalari' },
  event: { collection: 'events', titleKey: 'title', path: '/etkinlikler' },
};

function resolveSource(record, sources) {
  const config = typeConfig[record.sourceType];
  const source = sources[config?.collection]?.find((item) => item.id === record.sourceId);
  if (!source || !config) return null;
  return {
    ...record,
    title: source[config.titleKey],
    href: `${config.path}/${source.slug || source.id}`,
    district: source.district || 'Hatay',
  };
}

export function buildAdminDashboard({ monuments, routes, events, statistics, charts }) {
  const sources = { monuments, routes, events };
  const reporting = charts.reporting;
  const pendingReviews = reviewRecords.filter((item) => item.status === 'pending').map((item) => resolveSource(item, sources)).filter(Boolean);
  const activity = auditRecords.map((item) => resolveSource(item, sources)).filter(Boolean);
  const mapRecords = monuments.filter((item) => Array.isArray(item.coordinates) && item.coordinates.length === 2);

  return {
    generatedAt: '2026-08-21T14:30:00+03:00',
    metrics: [
      { key: 'monuments', label: 'Kayıtlı Eser', value: statistics.toplamEser, detail: `${mapRecords.length} konum doğrulandı` },
      { key: 'routes', label: 'Kültürel Rota', value: statistics.kulturRota, detail: `${routes.reduce((total, item) => total + Number(item.stops || 0), 0)} toplam durak` },
      { key: 'events', label: 'Etkinlik Kaydı', value: statistics.etkinlik, detail: `${new Set(events.map((item) => item.category)).size} kategori` },
      { key: 'visits', label: 'Toplam Ziyaret', value: reporting.metrics.find((item) => item.key === 'visits')?.value || 0, detail: 'Son rapor dönemi' },
      { key: 'pending', label: 'Onay Bekleyen', value: pendingReviews.length, detail: 'İşlem gerektiren kayıt' },
      { key: 'integrity', label: 'Veri Bütünlüğü', value: reporting.integrity.valid ? 100 : 0, suffix: '%', detail: reporting.integrity.valid ? 'Tüm ilişkiler geçerli' : 'Kontrol gerekli' },
    ],
    trend: reporting.trend,
    topContent: reporting.topContent,
    eventSchedule: [...events].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5).map((item) => ({
      id: item.id, title: item.title, date: item.date, dateLabel: item.dateLabel, time: item.time,
      district: item.district, categoryLabel: item.categoryLabel, href: `/etkinlikler/${item.slug || item.id}`,
    })),
    pendingReviews,
    activity,
    systemStatus: [
      { key: 'database', label: 'Veri kaynağı', status: 'healthy', value: 'Bağlı' },
      { key: 'relations', label: 'Kayıt ilişkileri', status: reporting.integrity.valid ? 'healthy' : 'warning', value: reporting.integrity.valid ? 'Tutarlı' : 'Kontrol gerekli' },
      { key: 'map', label: 'CBS konumları', status: mapRecords.length === monuments.length ? 'healthy' : 'warning', value: `${mapRecords.length}/${monuments.length}` },
    ],
  };
}

export function reviewAdminRecord(id, decision) {
  const record = reviewRecords.find((item) => item.id === Number(id));
  if (!record || record.status !== 'pending') return null;
  if (!['approved', 'rejected'].includes(decision)) return null;
  record.status = decision;
  record.reviewedAt = new Date().toISOString();
  return { ...record };
}
