export const statistics = {
  toplamEser: 1248,
  yapi: 862,
  anit: 145,
  arkeolojik: 143,
  diger: 98,
  kulturRota: 8,
  etkinlik: 18,
  qrNoktasi: 195,
  kullanici: 1450,
  harita: {
    toplamEser: 315,
    kulturRota: 8,
    etkinlik: 18,
    qrNoktasi: 195
  },
  home: {
    kayitliEser: { cami: 1248, kilise: 167, muze: 152 },
    rota: 6,
    qr: 152
  },
  catalog: {
    kayitliEserler: 25,
    kulturRotalar: 13,
    toplamFavori: 27,
    gecmisZiyaret: 21
  }
};

export const weather = {
  temperature: 25,
  condition: "Güneşli",
  location: "Antakya",
  forecast: [
    { day: "Pzt", time: "09:00", temp: 24, icon: "sun" },
    { day: "Sal", time: "12:00", temp: 27, icon: "sun" },
    { day: "Çar", time: "15:00", temp: 26, icon: "cloud" },
    { day: "Per", time: "18:00", temp: 23, icon: "cloud" },
    { day: "Cum", time: "21:00", temp: 21, icon: "moon" }
  ]
};

export const chartData = {
  eserler: [
    { label: "Cami", value: 1248, color: "#1e3a5f" },
    { label: "Kilise", value: 167, color: "#2563eb" },
    { label: "Müze", value: 152, color: "#60a5fa" }
  ],
  ziyaretci: [
    { month: "Oca", views: 4200, visitors: 2800 },
    { month: "Şub", views: 5100, visitors: 3200 },
    { month: "Mar", views: 6800, visitors: 4100 },
    { month: "Nis", views: 7200, visitors: 4500 },
    { month: "May", views: 8900, visitors: 5600 },
    { month: "Haz", views: 9500, visitors: 6100 }
  ],
  reporting: {
    dateRange: { start: '2026-07-21', end: '2026-08-21', label: '21 Temmuz 2026 - 21 Ağustos 2026' },
    metrics: [
      { key: 'visits', label: 'Toplam Ziyaret', value: 276291, change: 18.7, format: 'number' },
      { key: 'visitors', label: 'Eşsiz Ziyaretçi', value: 18532, change: 21.4, format: 'number' },
      { key: 'views', label: 'Sayfa Görüntüleme', value: 642109, change: 22.1, format: 'number' },
      { key: 'sessions', label: 'Ortalama Oturum', value: 272, change: 11.2, format: 'duration' },
      { key: 'participation', label: 'Etkinlik Katılımı', value: 12845, change: 15.8, format: 'number' },
    ],
    trend: [
      { label: '24 Tem', total: 22000, unique: 13000 }, { label: '28 Tem', total: 26000, unique: 17000 },
      { label: '1 Ağu', total: 19000, unique: 12000 }, { label: '5 Ağu', total: 38000, unique: 23000 },
      { label: '9 Ağu', total: 21000, unique: 14000 }, { label: '13 Ağu', total: 47000, unique: 29000 },
      { label: '17 Ağu', total: 25000, unique: 16000 }, { label: '21 Ağu', total: 30000, unique: 19000 },
    ],
    devices: [
      { label: 'Mobil', value: 62.4, count: 172864, color: '#173f9f' },
      { label: 'Masaüstü', value: 31.3, count: 86711, color: '#3482e4' },
      { label: 'Tablet', value: 6.3, count: 16716, color: '#ef4d3f' },
    ],
    districts: [
      { label: 'Antakya', value: 45.8, count: 125247 }, { label: 'Samandağ', value: 14.8, count: 40956 },
      { label: 'İskenderun', value: 10.6, count: 29297 }, { label: 'Reyhanlı', value: 8.7, count: 24057 },
      { label: 'Dörtyol', value: 7.6, count: 21174 }, { label: 'Kırıkhan', value: 5.1, count: 14060 },
      { label: 'Hassa', value: 4.2, count: 11620 }, { label: 'Diğer', value: 3.2, count: 8880 },
    ],
    hourly: [
      [1,1,1,1,2,3,5,7,8,7,4,2], [1,1,1,1,2,4,6,8,9,8,5,2], [1,1,1,1,3,5,7,9,10,8,5,2],
      [1,1,1,1,2,4,7,9,9,7,4,2], [1,1,1,1,3,6,8,10,10,8,6,3], [1,1,1,2,4,6,8,9,8,6,4,2],
      [1,1,1,1,2,3,5,7,7,5,3,2],
    ],
    topContent: [
      { title: 'Habib-i Neccar Camii', views: 45231, change: 24.6 }, { title: 'St. Pierre Kilisesi', views: 34872, change: 18.9 },
      { title: 'Hatay Gastronomi Günleri', views: 28194, change: 31.7 }, { title: 'Hatay Arkeoloji Müzesi', views: 22105, change: 15 },
      { title: 'Uzun Çarşı', views: 19874, change: 13.2 },
    ],
    eventPerformance: [
      { title: 'Hatay Gastronomi Günleri', participants: 5621, views: 28794, change: 31.7 },
      { title: 'Uluslararası Antakya Film Festivali', participants: 3245, views: 19870, change: 20.3 },
      { title: 'Harbiye Şelaleleri Doğa Yürüyüşü', participants: 1842, views: 9112, change: 18.9 },
      { title: 'Yayladağı Aba Güreşi Şenlikleri', participants: 1203, views: 6742, change: 15.1 },
    ],
    reports: [
      { id: 'cbs', title: 'CBS Analiz Raporu', description: 'Mekânsal veriler ve yoğunluk analizleri', format: 'PDF' },
      { id: 'usage', title: 'Kullanım Analizi Raporu', description: 'Kullanıcı davranışları ve etkileşim raporu', format: 'PDF' },
      { id: 'content', title: 'İçerik Performans Raporu', description: 'İçerik görüntüleme ve etkileşim raporu', format: 'PDF' },
    ],
  }
};
