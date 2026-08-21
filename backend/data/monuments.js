/**
 * Mock veri - Gerçek DB geldiğinde bu dosya repository/service katmanı ile değiştirilecek.
 */

export const monuments = [
  {
    id: 1,
    name: "Habib-i Neccar Camii",
    slug: "habib-i-neccar-camii",
    type: "yapi",
    category: "camii",
    period: "İslam Dönemi",
    century: "7. Yüzyıl",
    district: "Antakya",
    address: "Kurtuluş Mah. Habib-i Neccar Cad. No:1, Antakya/Hatay",
    route: "İnanç ve Medeniyet Rotası",
    description: "Antakya'nın en önemli ibadet yapılarından biri olan Habib-i Neccar Camii, şehrin manevi merkezlerinden biridir.",
    longDescription: "Habib-i Neccar Camii, Antakya'nın en eski ve en önemli ibadet yapılarından biridir. Şehrin çok kültürlü geçmişini yansıtan cami, farklı dönemlerde restorasyon görmüştür.",
    protectionStatus: "Korunuyor",
    registrationNo: "TS-001234",
    registrationStatus: "Tescilli",
    workingHours: "05:30 - 22:00",
    entryFee: "Ücretsiz",
    rating: 4.8,
    reviewCount: 1260,
    distance: "0.3 km",
    image: "/assets/monuments/habib-neccar-main.jpg",
    images: [
      "/assets/monuments/habib-neccar-main.jpg",
      "/assets/monuments/habib-neccar-courtyard.jpg"
    ],
    coordinates: [36.2065, 36.1578],
    highlights: [
      "7. yüzyıla dayanan tarihi",
      "Antakya'nın sembol yapılarından",
      "İnanç ve Medeniyet Rotası'nın merkez noktası"
    ],
    timeline: [
      { year: "7. Yüzyıl", text: "İlk yapının inşa edildiği dönem." },
      { year: "13. Yüzyıl", text: "Selçuklu döneminde genişletme çalışmaları." },
      { year: "18. Yüzyıl", text: "Osmanlı döneminde restorasyon." },
      { year: "Günümüz", text: "Koruma altında ziyarete açık ibadet yapısı." }
    ]
  },
  {
    id: 2,
    name: "St. Pierre Kilisesi",
    slug: "st-pierre-kilisesi",
    type: "yapi",
    category: "kilise",
    period: "Hristiyanlık Dönemi",
    century: "1. Yüzyıl",
    district: "Antakya",
    address: "St. Pierre Mah., Antakya/Hatay",
    route: "İnanç ve Medeniyet Rotası",
    description: "Hristiyanlık tarihinin en eski ibadethanelerinden biri olan St. Pierre Kilisesi, mağara kilisesi olarak inşa edilmiştir.",
    protectionStatus: "Korunuyor",
    registrationNo: "TS-001235",
    registrationStatus: "Tescilli",
    workingHours: "09:00 - 18:00",
    entryFee: "Ücretli",
    rating: 4.9,
    reviewCount: 980,
    distance: "0.5 km",
    image: "/assets/monuments/st-pierre-main.jpg",
    images: [
      "/assets/monuments/st-pierre-main.jpg"
    ],
    coordinates: [36.2088, 36.1595],
    highlights: ["UNESCO aday listesinde", "Mağara kilisesi mimarisi"]
  },
  {
    id: 3,
    name: "Titus Tüneli",
    slug: "titus-tuneli",
    type: "anit",
    category: "diger",
    period: "Roma Dönemi",
    century: "1. Yüzyıl",
    district: "Samandağ",
    address: "Samandağ/Hatay",
    route: "Arkeoloji Rotası",
    description: "Roma döneminde inşa edilen devasa su tüneli, mühendislik harikası olarak kabul edilir.",
    protectionStatus: "Korunuyor",
    registrationNo: "TS-001236",
    registrationStatus: "Tescilli",
    workingHours: "08:00 - 17:00",
    entryFee: "Ücretli",
    rating: 4.7,
    reviewCount: 650,
    distance: "12.4 km",
    image: "/assets/monuments/titus-tuneli-main.jpg",
    images: ["/assets/monuments/titus-tuneli-main.jpg"],
    coordinates: [36.1667, 36.0833],
    highlights: ["Roma mühendisliği", "1380 metre uzunluğunda"]
  },
  {
    id: 4,
    name: "Hatay Arkeoloji Müzesi",
    slug: "hatay-arkeoloji-muzesi",
    type: "yapi",
    category: "muze",
    period: "Modern Dönem",
    century: "20. Yüzyıl",
    district: "Antakya",
    address: "Gündüz Cad. No:1, Antakya/Hatay",
    route: "Arkeoloji Rotası",
    description: "Dünyanın en zengin mozaik koleksiyonlarından birine ev sahipliği yapan müze.",
    protectionStatus: "Korunuyor",
    registrationNo: "TS-001237",
    registrationStatus: "Tescilli",
    workingHours: "09:00 - 18:00",
    entryFee: "Ücretli",
    rating: 4.9,
    reviewCount: 2100,
    distance: "1.2 km",
    image: "/assets/monuments/hatay-arkeoloji-muzesi.jpg",
    images: ["/assets/monuments/hatay-arkeoloji-muzesi.jpg"],
    coordinates: [36.2045, 36.1612],
    highlights: ["Dünyanın en büyük mozaik koleksiyonu"]
  },
  {
    id: 5,
    name: "Uzun Çarşı",
    slug: "uzun-carsi",
    type: "yapi",
    category: "han",
    period: "Osmanlı Dönemi",
    century: "19. Yüzyıl",
    district: "Antakya",
    address: "Uzun Çarşı, Antakya/Hatay",
    route: "Hatay Lezzet Rotası",
    description: "Antakya'nın geleneksel çarşısı, baharat ve el sanatları ile ünlüdür.",
    protectionStatus: "Kısmen Korunuyor",
    registrationNo: "TS-001238",
    registrationStatus: "Tescilli",
    workingHours: "08:00 - 20:00",
    entryFee: "Ücretsiz",
    rating: 4.6,
    reviewCount: 890,
    distance: "0.8 km",
    image: "",
    coordinates: [36.2055, 36.1588],
    highlights: ["Geleneksel çarşı kültürü", "Baharat ve el sanatları"]
  },
  {
    id: 6,
    name: "Harbiye (Roma) Köprüsü",
    slug: "harbiye-roma-koprusu",
    type: "yapi",
    category: "kopru",
    period: "Roma Dönemi",
    century: "2. Yüzyıl",
    district: "Defne",
    address: "Harbiye/Defne, Hatay",
    route: "Harbiye Doğa Rotası",
    description: "Asi Nehri üzerindeki Roma dönemi taş köprü.",
    protectionStatus: "Korunuyor",
    registrationNo: "TS-001239",
    registrationStatus: "Tescilli",
    workingHours: "7/24",
    entryFee: "Ücretsiz",
    rating: 4.5,
    reviewCount: 420,
    distance: "8.2 km",
    image: "",
    coordinates: [36.1289, 36.1456],
    highlights: ["Roma dönemi taş köprü"]
  },
  {
    id: 7,
    name: "Sokullu Mehmet Paşa Külliyesi",
    slug: "sokullu-mehmet-pasa-kulliyesi",
    type: "yapi",
    category: "camii",
    period: "Osmanlı Dönemi",
    century: "16. Yüzyıl",
    district: "Payas",
    address: "Payas, Dörtyol/Hatay",
    route: "Kale ve Savunma Rotası",
    description: "Mimar Sinan'ın eserlerinden Sokullu Mehmet Paşa Külliyesi.",
    protectionStatus: "Korunuyor",
    registrationNo: "TS-001240",
    registrationStatus: "Tescilli",
    workingHours: "09:00 - 17:00",
    entryFee: "Ücretsiz",
    rating: 4.8,
    reviewCount: 560,
    distance: "45 km",
    image: "/assets/monuments/payas-kalesi-complex.jpg",
    images: ["/assets/monuments/payas-kalesi-complex.jpg", "/assets/monuments/payas-kalesi-main.jpg"],
    coordinates: [36.7545, 36.2212],
    highlights: ["Mimar Sinan eseri"]
  },
  {
    id: 8,
    name: "Payas Kalesi",
    slug: "payas-kalesi",
    type: "yapi",
    category: "kale",
    period: "Osmanlı Dönemi",
    century: "16. Yüzyıl",
    district: "Payas",
    address: "Payas, Dörtyol/Hatay",
    route: "Kale ve Savunma Rotası",
    description: "Akdeniz kıyısındaki tarihi Osmanlı kalesi.",
    protectionStatus: "Korunuyor",
    registrationNo: "TS-001241",
    registrationStatus: "Tescilli",
    workingHours: "09:00 - 18:00",
    entryFee: "Ücretli",
    rating: 4.6,
    reviewCount: 380,
    distance: "46 km",
    image: "/assets/monuments/payas-kalesi-main.jpg",
    images: ["/assets/monuments/payas-kalesi-main.jpg", "/assets/monuments/payas-kalesi-complex.jpg"],
    coordinates: [36.7567, 36.2234],
    highlights: ["Akdeniz kıyısı kale"]
  },
  {
    id: 9, name: "Tarihi Antakya Evleri", slug: "tarihi-antakya-evleri", type: "yapi", category: "diger",
    district: "Antakya", route: "Tarihi Antakya Rotası", distance: "0.8 km",
    image: "", coordinates: [36.2010, 36.1550]
  },
  {
    id: 10, name: "Samandağ Mozaikleri", slug: "samandag-mozaikleri", type: "yapi", category: "muze",
    district: "Samandağ", route: "Kale Rotası", distance: "1.2 km",
    image: "", coordinates: [36.0830, 35.9770]
  },
  {
    id: 11, name: "Darphane-i Amire", slug: "darphane-i-amire", type: "yapi", category: "diger",
    district: "Antakya", route: "Kale ve Savunma Rotası", distance: "1.2 km",
    image: "", coordinates: [36.2040, 36.1590]
  },
  {
    id: 12, name: "Harbiye Şelaleleri", slug: "harbiye-selaleleri", type: "doga", category: "doga",
    district: "Antakya", route: "Doğa Rotası", distance: "0.5 km",
    image: "/assets/monuments/harbiye-selaleleri.jpg", images: ["/assets/monuments/harbiye-selaleleri.jpg"], coordinates: [36.1320, 36.1470]
  },
  {
    id: 13, name: "Antakya Kalesi Surları", slug: "antakya-kalesi", type: "yapi", category: "kale",
    district: "Antakya", route: "Kale Rotası", distance: "1.5 km",
    image: "", coordinates: [36.2170, 36.1720]
  },
  {
    id: 14, name: "Arsuz Plajı ve Deniz Feneri", slug: "arsuz-deniz-feneri", type: "doga", category: "doga",
    district: "Arsuz", route: "Harbiye Doğa Rotası", distance: "15 km",
    image: "", coordinates: [36.4110, 35.8900]
  },
  {
    id: 15, name: "Vespasianus Anıtı", slug: "vespasianus-aniti", type: "anit", category: "diger",
    district: "Samandağ", route: "Arkeoloji Rotası", distance: "12 km",
    image: "", coordinates: [36.1680, 36.0810]
  },
  {
    id: 16, name: "Antakya Kurşunlu Han", slug: "antakya-kursunlu-han", type: "yapi", category: "han",
    district: "Antakya", route: "Hatay Lezzet Rotası", distance: "0.9 km",
    image: "", coordinates: [36.2070, 36.1530]
  },
  {
    id: 17, name: "Eski Belediye Binası", slug: "eski-belediye-binasi", type: "yapi", category: "diger",
    district: "Antakya", route: "Tarihi Antakya Rotası", distance: "0.3 km",
    image: "", coordinates: [36.2000, 36.1600]
  },
  {
    id: 18, name: "Dor Mabedi Kalıntıları", slug: "dor-mabedi", type: "yapi", category: "diger",
    district: "Samandağ", route: "Arkeoloji Rotası", distance: "13 km",
    image: "", coordinates: [36.3090, 36.0310]
  },
  {
    id: 19, name: "Cin Kulesi", slug: "cin-kulesi", type: "yapi", category: "kale",
    district: "Payas", route: "Kale ve Savunma Rotası", distance: "45 km",
    image: "", coordinates: [36.7550, 36.2160]
  },
  {
    id: 20, name: "Hatay Mutfak Müzesi", slug: "mutfak-muzesi", type: "yapi", category: "muze",
    district: "Antakya", route: "Hatay Lezzet Rotası", distance: "1.1 km",
    image: "", coordinates: [36.2030, 36.1640]
  }
];

export const categoryCounts = monuments.reduce((counts, monument) => {
  counts.tumu += 1;
  counts[monument.category] = (counts[monument.category] || 0) + 1;
  return counts;
}, { tumu: 0 });

export function monumentsToGeoJSON(items = monuments) {
  return {
    type: "FeatureCollection",
    features: items.map((m) => ({
      type: "Feature",
      id: m.id,
      properties: {
        id: m.id,
        name: m.name,
        slug: m.slug,
        type: m.type,
        category: m.category,
        district: m.district,
        route: m.route,
        image: m.image,
        distance: m.distance,
        description: m.description
      },
      geometry: {
        type: "Point",
        coordinates: [m.coordinates[1], m.coordinates[0]]
      }
    }))
  };
}
