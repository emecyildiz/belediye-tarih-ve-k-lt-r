const baseEvents = [
  {
    id: 1,
    title: "Payas Kalesi Rehberli Tur",
    category: "gezi",
    categoryLabel: "Gezi / Tur",
    description: "Payas Kalesi'nde rehber eşliğinde tarihi keşif turu.",
    location: "Payas Kalesi, Dörtyol",
    district: "Payas",
    venue: "Payas Kalesi",
    date: "2026-08-23",
    time: "10:00",
    image: "https://images.unsplash.com/photo-1516483638269-4a936d323403?w=600&h=400&fit=crop",
    featured: true
  },
  {
    id: 2,
    title: "Hatay Mozaik Atölyesi",
    category: "atolye",
    categoryLabel: "Atölye",
    description: "Geleneksel mozaik sanatını öğrenmek için interaktif atölye.",
    location: "Hatay Arkeoloji Müzesi",
    district: "Antakya",
    venue: "Hatay Arkeoloji Müzesi",
    date: "2026-08-27",
    time: "14:00",
    image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3a7?w=600&h=400&fit=crop"
  },
  {
    id: 3,
    title: "Antakya Kültür Festivali",
    category: "festival",
    categoryLabel: "Festival",
    description: "Hatay'ın zengin kültürel mirasını kutlayan yıllık festival.",
    location: "Antakya Merkez",
    district: "Antakya",
    venue: "Habib-i Neccar Meydanı",
    date: "2026-08-29",
    time: "18:00",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop"
  },
  {
    id: 4,
    title: "St. Pierre Kilisesi Konseri",
    category: "sanat",
    categoryLabel: "Sanat Etkinliği",
    description: "Tarihi kilise atmosferinde klasik müzik konseri.",
    location: "St. Pierre Kilisesi",
    district: "Antakya",
    venue: "St. Pierre Kilisesi",
    date: "2026-09-03",
    time: "20:00",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop"
  },
  {
    id: 5,
    title: "Hatay Mutfağı Tanıtım Günü",
    category: "kultur",
    categoryLabel: "Kültürel Etkinlik",
    description: "Hatay'ın eşsiz mutfağını tanıtan gastronomi etkinliği.",
    location: "Uzun Çarşı",
    district: "Antakya",
    venue: "Uzun Çarşı",
    date: "2026-08-16",
    time: "11:00",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop"
  },
  {
    id: 6,
    title: "Arkeoloji Konferansı",
    category: "konferans",
    categoryLabel: "Konferans / Panel",
    description: "Hatay arkeolojisi üzerine uzman konferansı.",
    location: "Hatay Arkeoloji Müzesi",
    district: "Antakya",
    venue: "Konferans Salonu",
    date: "2026-08-19",
    time: "15:00",
    image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3a7?w=600&h=400&fit=crop"
  }
];

const eventTemplates = [
  ['sergi', 'Sergi', 'Tarihi Antakya Fotoğrafları Sergisi', 'Hatay Kültür Merkezi', 'Antakya'],
  ['kultur', 'Kültürel Etkinlik', 'Uzun Çarşı Zanaatkâr Buluşması', 'Uzun Çarşı', 'Antakya'],
  ['gezi', 'Gezi / Tur', 'Titus Tüneli Doğa ve Tarih Yürüyüşü', 'Titus Tüneli', 'Samandağ'],
  ['atolye', 'Atölye', 'Geleneksel Seramik Atölyesi', 'Kültür Evi', 'Defne'],
  ['sanat', 'Sanat Etkinliği', 'Antakya Medeniyetler Korosu Konseri', 'Expo Alanı', 'Antakya'],
  ['festival', 'Festival', 'Arsuz Deniz ve Kültür Festivali', 'Karaağaç Sahili', 'Arsuz'],
  ['konferans', 'Konferans / Panel', 'Kültürel Mirası Koruma Paneli', 'Belediye Konferans Salonu', 'Antakya'],
  ['kultur', 'Kültürel Etkinlik', 'Künefe ve Kültür Günleri', 'Atatürk Caddesi', 'Antakya'],
  ['gezi', 'Gezi / Tur', 'Payas Tarihi Yapılar Gezisi', 'Payas Sokullu Külliyesi', 'Payas'],
  ['sergi', 'Sergi', 'Mozaiklerin İzinde Yeni Bulgular', 'Arkeoloji Müzesi', 'Antakya'],
  ['atolye', 'Atölye', 'Çocuklar İçin Arkeoloji Atölyesi', 'Arkeoloji Müzesi', 'Antakya'],
  ['sanat', 'Sanat Etkinliği', 'Harbiye Açık Hava Konseri', 'Harbiye Şelaleleri', 'Defne'],
  ['kultur', 'Kültürel Etkinlik', 'Reyhanlı Yerel Lezzetler Buluşması', 'Kent Meydanı', 'Reyhanlı'],
  ['gezi', 'Gezi / Tur', 'İskenderun Sahil Kültür Turu', 'İskenderun Sahili', 'İskenderun'],
];

const generatedEvents = eventTemplates.map(([category, categoryLabel, title, venue, district], index) => {
  const day = 13 + index;
  return {
    id: 7 + index,
    title,
    category,
    categoryLabel,
    description: `${title}, Hatay'ın kültürel yaşamını tanıtan örnek etkinlik kaydıdır.`,
    location: venue,
    district,
    venue,
    date: `2026-09-${String(day).padStart(2, '0')}`,
    time: `${String(10 + (index % 9)).padStart(2, '0')}:00`,
    image: index % 5 === 0 ? '' : baseEvents[index % baseEvents.length].image,
    featured: index < 3,
  };
});

function formatEventDate(date) {
  const value = new Date(`${date}T12:00:00+03:00`);
  return {
    dateLabel: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(value),
    day: new Intl.DateTimeFormat('tr-TR', { weekday: 'long', timeZone: 'Europe/Istanbul' }).format(value),
  };
}

const venueCoordinates = {
  'Payas Kalesi': [36.7567, 36.2234],
  'Hatay Arkeoloji Müzesi': [36.2045, 36.1612],
  'Arkeoloji Müzesi': [36.2045, 36.1612],
  'Konferans Salonu': [36.2045, 36.1612],
  'Habib-i Neccar Meydanı': [36.2065, 36.1578],
  'St. Pierre Kilisesi': [36.2088, 36.1595],
  'Uzun Çarşı': [36.2055, 36.1588],
  'Hatay Kültür Merkezi': [36.2021, 36.1605],
  'Titus Tüneli': [36.1667, 36.0833],
  'Kültür Evi': [36.1735, 36.1386],
  'Expo Alanı': [36.165, 36.136],
  'Karaağaç Sahili': [36.413, 35.8903],
  'Belediye Konferans Salonu': [36.2, 36.16],
  'Atatürk Caddesi': [36.2028, 36.157],
  'Payas Sokullu Külliyesi': [36.7545, 36.2212],
  'Harbiye Şelaleleri': [36.132, 36.147],
  'Kent Meydanı': [36.2692, 36.5672],
  'İskenderun Sahili': [36.5872, 36.1735],
};

const districtCoordinates = {
  Antakya: [36.2021, 36.1605], Payas: [36.7563, 36.2146], Samandağ: [36.0847, 35.9771],
  Defne: [36.1735, 36.1386], Arsuz: [36.413, 35.8903], Reyhanlı: [36.2692, 36.5672], İskenderun: [36.5872, 36.1735],
};

export const events = [...baseEvents, ...generatedEvents].map((event) => ({
  ...event,
  coordinates: event.coordinates || venueCoordinates[event.venue] || districtCoordinates[event.district] || districtCoordinates.Antakya,
  ...formatEventDate(event.date),
}));

export const eventCategoryCounts = events.reduce(
  (acc, event) => {
    acc.tumu += 1;
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  },
  { tumu: 0 }
);
