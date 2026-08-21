const routeSeeds = [
  {
    id: 1,
    title: "Antakya Tarihi Merkez Rotası",
    slug: "antakya-tarihi-merkez-rotasi",
    category: "tarihi",
    categoryLabel: "Tarihi Rota",
    district: "Antakya",
    description: "Antakya'nın tarihi merkezindeki en önemli eserleri kapsayan yürüyüş rotası.",
    duration: "3-4 Saat",
    distance: "4.2 km",
    difficulty: "kolay",
    difficultyLabel: "Kolay",
    stops: 7,
    image: "/assets/monuments/habib-neccar-main.jpg",
    color: "#7c3aed",
    monumentIds: [1, 5, 9, 11, 16, 17, 4]
  },
  {
    id: 2,
    title: "İnanç ve Medeniyet Rotası",
    slug: "inanc-ve-medeniyet-rotasi",
    category: "inanc",
    categoryLabel: "İnanç Rotası",
    district: "Antakya",
    description: "Farklı inançların bir arada yaşadığı Antakya'nın manevi mirasını keşfedin.",
    duration: "2-3 Saat",
    distance: "3.5 km",
    difficulty: "kolay",
    difficultyLabel: "Kolay",
    stops: 5,
    image: "/assets/monuments/st-pierre-main.jpg",
    color: "#2563eb",
    monumentIds: [1, 2, 9, 11, 17]
  },
  {
    id: 3,
    title: "Hatay Lezzet Rotası",
    slug: "hatay-lezzet-rotasi",
    category: "gastronomi",
    categoryLabel: "Gastronomi Rotası",
    district: "Antakya",
    description: "Hatay mutfağının eşsiz lezzetlerini tadabileceğiniz gastronomi rotası.",
    duration: "4-5 Saat",
    distance: "5.8 km",
    difficulty: "orta",
    difficultyLabel: "Orta",
    stops: 8,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
    color: "#ea580c",
    monumentIds: [5, 16, 20]
  },
  {
    id: 4,
    title: "Harbiye Doğa Rotası",
    slug: "harbiye-doga-rotasi",
    category: "doga",
    categoryLabel: "Doğa Rotası",
    district: "Defne",
    description: "Harbiye şelaleleri ve doğal güzellikleri keşfedin.",
    duration: "5-6 Saat",
    distance: "8.5 km",
    difficulty: "orta",
    difficultyLabel: "Orta",
    stops: 6,
    image: "/assets/monuments/harbiye-selaleleri.jpg",
    color: "#16a34a",
    monumentIds: [6, 12, 14]
  },
  {
    id: 5,
    title: "Arkeoloji Rotası",
    slug: "arkeoloji-rotasi",
    category: "tarihi",
    categoryLabel: "Tarihi Rota",
    district: "Samandağ",
    description: "Roma dönemi arkeolojik alanları ve müzeleri kapsayan rota.",
    duration: "1 Gün",
    distance: "25 km",
    difficulty: "zor",
    difficultyLabel: "Zor",
    stops: 4,
    image: "/assets/monuments/titus-tuneli-main.jpg",
    color: "#7c3aed",
    monumentIds: [3, 10, 15, 18, 4]
  },
  {
    id: 6,
    title: "Kale ve Savunma Rotası",
    slug: "kale-ve-savunma-rotasi",
    category: "tarihi",
    categoryLabel: "Tarihi Rota",
    district: "Payas",
    description: "Osmanlı dönemi kaleleri ve savunma yapılarını keşfedin.",
    duration: "1 Gün",
    distance: "50 km",
    difficulty: "orta",
    difficultyLabel: "Orta",
    stops: 3,
    image: "/assets/monuments/payas-kalesi-main.jpg",
    color: "#7c3aed",
    monumentIds: [7, 8, 19]
  },
  { id: 7, title: "Samandağ Sahil Rotası", slug: "samandag-sahil-rotasi", category: "doga", categoryLabel: "Doğa Rotası", district: "Samandağ", description: "Sahil şeridi boyunca tarihi kalıntıları kapsayan gezi rotası.", duration: "1 Gün", distance: "11 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "/assets/monuments/titus-tuneli-main.jpg", color: "#16a34a", monumentIds: [3, 10, 15, 18] },
  { id: 8, title: "Altınözü Yaylaları", slug: "altinozu-yaylalari", category: "doga", categoryLabel: "Doğa Rotası", district: "Altınözü", description: "Yaylalar ve zeytin bahçeleri arasındaki doğa yürüyüşü.", duration: "1 Gün", distance: "6 km", difficulty: "orta", difficultyLabel: "Orta", image: "/assets/monuments/harbiye-selaleleri.jpg", color: "#16a34a", monumentIds: [12, 14] },
  { id: 9, title: "Erzin Kıyı Rotası", slug: "erzin-kiyi-rotasi", category: "doga", categoryLabel: "Doğa Rotası", district: "Erzin", description: "Deniz manzaralı kısa sahil yürüyüşü ve plajlar.", duration: "Yarım Gün", distance: "5 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "", color: "#16a34a", monumentIds: [14, 12] },
  { id: 10, title: "Kültürel Miras Köyleri", slug: "kulturel-miras-koyleri", category: "tarihi", categoryLabel: "Tarihi Rota", district: "Reyhanlı", description: "Geleneksel yaşamı koruyan kültürel köyleri ziyaret edin.", duration: "1 Gün", distance: "14 km", difficulty: "orta", difficultyLabel: "Orta", image: "/assets/monuments/habib-neccar-main.jpg", color: "#7c3aed", monumentIds: [9, 11, 17] },
  { id: 11, title: "Antakya Çarşıları", slug: "antakya-carsilari", category: "tarihi", categoryLabel: "Kültür Rotası", district: "Antakya", description: "Uzun Çarşı ve çevresindeki zanaatkârlar bölgesi.", duration: "3 Saat", distance: "2 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "", color: "#2563eb", monumentIds: [5, 16, 20, 9] },
  { id: 12, title: "Roma Su Yolları", slug: "roma-su-yollari", category: "tarihi", categoryLabel: "Tarihi Rota", district: "Defne", description: "Antik su yolları ve köprüler.", duration: "Yarım Gün", distance: "8 km", difficulty: "orta", difficultyLabel: "Orta", image: "/assets/monuments/harbiye-selaleleri.jpg", color: "#7c3aed", monumentIds: [6, 12, 3] },
  { id: 13, title: "İskenderun Sahil Kordonu", slug: "iskenderun-sahil-kordonu", category: "doga", categoryLabel: "Doğa Rotası", district: "İskenderun", description: "Palmiye ağaçları eşliğinde körfez yürüyüşü.", duration: "2 Saat", distance: "4 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "", color: "#16a34a", monumentIds: [14, 12] },
  { id: 14, title: "Hatay Sokak Lezzetleri", slug: "hatay-sokak-lezzetleri", category: "gastronomi", categoryLabel: "Gastronomi Rotası", district: "Antakya", description: "Hatay'ın meşhur sokak tatları ve künefeciler.", duration: "3 Saat", distance: "2.5 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop", color: "#ea580c", monumentIds: [5, 16, 20] },
  { id: 15, title: "Dağ Yürüyüşü", slug: "dag-yuruyusu", category: "doga", categoryLabel: "Doğa Rotası", district: "Belen", description: "Amanos dağlarının eteklerinde doğa yürüyüşü.", duration: "6 Saat", distance: "12 km", difficulty: "zor", difficultyLabel: "Zor", image: "/assets/monuments/harbiye-selaleleri.jpg", color: "#16a34a", monumentIds: [12, 14] },
  { id: 16, title: "Tarihi Konaklar", slug: "tarihi-konaklar", category: "tarihi", categoryLabel: "Tarihi Rota", district: "Antakya", description: "Eski Antakya evleri ve restore edilmiş konaklar.", duration: "2 Saat", distance: "1.8 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "/assets/monuments/habib-neccar-main.jpg", color: "#7c3aed", monumentIds: [9, 11, 17, 1] },
  { id: 17, title: "Mozaik Yolu", slug: "mozaik-yolu", category: "tarihi", categoryLabel: "Kültür Rotası", district: "Antakya", description: "Müzeden başlayarak antik mozaik kalıntılarına uzanan rota.", duration: "4 Saat", distance: "5 km", difficulty: "orta", difficultyLabel: "Orta", image: "/assets/monuments/hatay-arkeoloji-muzesi.jpg", color: "#2563eb", monumentIds: [4, 10, 20, 18] },
  { id: 18, title: "Göçmen Kuşlar Rotası", slug: "gocmen-kuslar", category: "doga", categoryLabel: "Doğa Rotası", district: "Samandağ", description: "Kuş gözlem noktaları ve sulak alanlar.", duration: "Yarım Gün", distance: "6 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "/assets/monuments/harbiye-selaleleri.jpg", color: "#16a34a", monumentIds: [3, 12, 14] },
  { id: 19, title: "Hıristiyanlık Mirası", slug: "hiristiyanlik-mirasi", category: "inanc", categoryLabel: "İnanç Rotası", district: "Antakya", description: "St. Pierre Kilisesi'nden başlayan Hıristiyanlık tarihi rotası.", duration: "3 Saat", distance: "4 km", difficulty: "orta", difficultyLabel: "Orta", image: "/assets/monuments/st-pierre-main.jpg", color: "#2563eb", monumentIds: [2, 1, 9, 11] },
  { id: 20, title: "Müzeler ve Sergiler", slug: "muzeler-ve-sergiler", category: "tarihi", categoryLabel: "Kültür Rotası", district: "Antakya", description: "Şehir merkezindeki müze ve kültür duraklarını kapsar.", duration: "1 Gün", distance: "7 km", difficulty: "kolay", difficultyLabel: "Kolay", image: "/assets/monuments/hatay-arkeoloji-muzesi.jpg", color: "#2563eb", monumentIds: [4, 10, 20, 5] }
];

export const culturalRoutes = routeSeeds.map((route) => ({
  ...route,
  stops: route.monumentIds.length,
}));

export function routeToGeoJSON(route, monuments) {
  const points = route.monumentIds
    .map((id) => monuments.find((m) => m.id === id))
    .filter(Boolean);

  const features = [];

  // GeoJSON LineString must contain at least two coordinates.
  if (points.length >= 2) {
    features.push({
      type: "Feature",
      properties: { type: "route-line", routeId: route.id, title: route.title },
      geometry: {
        type: "LineString",
        coordinates: points.map((p) => [p.coordinates[1], p.coordinates[0]])
      }
    });
  }

  features.push(
    ...points.map((p, i) => ({
      type: "Feature",
      properties: {
        type: "route-stop",
        stopNumber: i + 1,
        name: p.name,
        routeId: route.id
      },
      geometry: {
        type: "Point",
        coordinates: [p.coordinates[1], p.coordinates[0]]
      }
    }))
  );

  return {
    type: "FeatureCollection",
    features
  };
}
