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
  ]
};
