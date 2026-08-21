export const culturalRoutes = [
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
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    color: "#7c3aed",
    monumentIds: [1, 2, 4, 5]
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
    image: "https://images.unsplash.com/photo-1584556819299-a81a4f97a806?w=600&h=400&fit=crop",
    color: "#2563eb",
    monumentIds: [1, 2]
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
    monumentIds: [5]
  },
  {
    id: 4,
    title: "Harbiye Doğa Rotası",
    slug: "harbiye-doga-rotasi",
    category: "doga",
    categoryLabel: "Doğa Rota",
    district: "Defne",
    description: "Harbiye şelaleleri ve doğal güzellikleri keşfedin.",
    duration: "5-6 Saat",
    distance: "8.5 km",
    difficulty: "orta",
    difficultyLabel: "Orta",
    stops: 6,
    image: "https://images.unsplash.com/photo-1516483638269-4a936d323403?w=600&h=400&fit=crop",
    color: "#16a34a",
    monumentIds: [6]
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
    image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3a7?w=600&h=400&fit=crop",
    color: "#7c3aed",
    monumentIds: [3, 4]
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
    image: "https://images.unsplash.com/photo-1516483638269-4a936d323403?w=600&h=400&fit=crop",
    color: "#7c3aed",
    monumentIds: [7, 8]
  },
  { id: 7, title: "Samandağ Sahil Rotası", slug: "samandag-sahil-rotasi", category: "doga", categoryLabel: "Doğa Rota", district: "Samandağ", description: "Sahil şeridi boyunca tarihi kalıntıları kapsayan gezi rotası.", duration: "1 Gün", distance: "11 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 11, image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&h=400&fit=crop", color: "#16a34a", monumentIds: [3] },
  { id: 8, title: "Altınözü Yaylaları", slug: "altinozu-yaylalari", category: "doga", categoryLabel: "Doğa Rota", district: "Altınözü", description: "Yaylalar ve zeytin bahçeleri arasındaki doğa yürüyüşü.", duration: "1 Gün", distance: "6 km", difficulty: "orta", difficultyLabel: "Orta", stops: 6, image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&h=400&fit=crop", color: "#16a34a", monumentIds: [] },
  { id: 9, title: "Erzin Kıyı Rotası", slug: "erzin-kiyi-rotasi", category: "doga", categoryLabel: "Doğa Rota", district: "Erzin", description: "Deniz manzaralı kısa sahil yürüyüşü ve plajlar.", duration: "Yarım Gün", distance: "5 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 5, image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop", color: "#16a34a", monumentIds: [] },
  { id: 10, title: "Kültürel Miras Köyleri", slug: "kulturel-miras-koyleri", category: "tarihi", categoryLabel: "Tarihi Rota", district: "Reyhanlı", description: "Geleneksel yaşamı koruyan kültürel köyleri ziyaret edin.", duration: "1 Gün", distance: "14 km", difficulty: "orta", difficultyLabel: "Orta", stops: 7, image: "https://images.unsplash.com/photo-1596395819057-e37f55a8516b?w=600&h=400&fit=crop", color: "#7c3aed", monumentIds: [1] },
  { id: 11, title: "Antakya Çarşıları", slug: "antakya-carsilari", category: "tarihi", categoryLabel: "Kültür Rota", district: "Antakya", description: "Uzun Çarşı ve çevresindeki zanaatkarlar bölgesi.", duration: "3 Saat", distance: "2 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 12, image: "https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600&h=400&fit=crop", color: "#2563eb", monumentIds: [5] },
  { id: 12, title: "Roma Su Yolları", slug: "roma-su-yollari", category: "tarihi", categoryLabel: "Tarihi Rota", district: "Defne", description: "Antik su yolları ve köprüler.", duration: "Yarım Gün", distance: "8 km", difficulty: "orta", difficultyLabel: "Orta", stops: 4, image: "https://images.unsplash.com/photo-1564769625905-50d9c1d8e8c8?w=600&h=400&fit=crop", color: "#7c3aed", monumentIds: [6] },
  { id: 13, title: "İskenderun Sahil Kordonu", slug: "iskenderun-sahil-kordonu", category: "doga", categoryLabel: "Doğa Rota", district: "İskenderun", description: "Palmiye ağaçları eşliğinde körfez yürüyüşü.", duration: "2 Saat", distance: "4 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 3, image: "https://images.unsplash.com/photo-1548661710-7f540c9c56d6?w=600&h=400&fit=crop", color: "#16a34a", monumentIds: [] },
  { id: 14, title: "Hatay Sokak Lezzetleri", slug: "hatay-sokak-lezzetleri", category: "gastronomi", categoryLabel: "Gastronomi Rotası", district: "Antakya", description: "Hatay'ın meşhur sokak tatları ve künefeciler.", duration: "3 Saat", distance: "2.5 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 8, image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3a7?w=600&h=400&fit=crop", color: "#ea580c", monumentIds: [] },
  { id: 15, title: "Dağ Yürüyüşü", slug: "dag-yuruyusu", category: "doga", categoryLabel: "Doğa Rota", district: "Belen", description: "Amanos dağlarının eteklerinde doğa yürüyüşü.", duration: "6 Saat", distance: "12 km", difficulty: "zor", difficultyLabel: "Zor", stops: 2, image: "https://images.unsplash.com/photo-1516483638269-4a936d323403?w=600&h=400&fit=crop", color: "#16a34a", monumentIds: [] },
  { id: 16, title: "Tarihi Konaklar", slug: "tarihi-konaklar", category: "tarihi", categoryLabel: "Tarihi Rota", district: "Antakya", description: "Eski Antakya evleri ve restore edilmiş konaklar.", duration: "2 Saat", distance: "1.8 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 6, image: "https://images.unsplash.com/photo-1596395819057-e37f55a8516b?w=600&h=400&fit=crop", color: "#7c3aed", monumentIds: [1,2] },
  { id: 17, title: "Mozaik Yolu", slug: "mozaik-yolu", category: "tarihi", categoryLabel: "Kültür Rota", district: "Antakya", description: "Müzeden başlayarak antik mozaik kalıntılarına uzanan rota.", duration: "4 Saat", distance: "5 km", difficulty: "orta", difficultyLabel: "Orta", stops: 4, image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3a7?w=600&h=400&fit=crop", color: "#2563eb", monumentIds: [2] },
  { id: 18, title: "Göçmen Kuşlar Rotası", slug: "gocmen-kuslar", category: "doga", categoryLabel: "Doğa Rota", district: "Samandağ", description: "Kuş gözlem noktaları ve sulak alanlar.", duration: "Yarım Gün", distance: "6 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 3, image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&h=400&fit=crop", color: "#16a34a", monumentIds: [] },
  { id: 19, title: "Hıristiyanlık Mirası", slug: "hiristiyanlik-mirasi", category: "inanc", categoryLabel: "İnanç Rotası", district: "Antakya", description: "St. Pierre Kilisesi'nden başlayan Hıristiyanlık tarihi rotası.", duration: "3 Saat", distance: "4 km", difficulty: "orta", difficultyLabel: "Orta", stops: 5, image: "https://images.unsplash.com/photo-1584556819299-a81a4f97a806?w=600&h=400&fit=crop", color: "#2563eb", monumentIds: [4] },
  { id: 20, title: "Müzeler ve Sergiler", slug: "muzeler-ve-sergiler", category: "tarihi", categoryLabel: "Kültür Rota", district: "Antakya", description: "Şehir merkezindeki tüm müze ve sanat galerilerini kapsar.", duration: "1 Gün", distance: "7 km", difficulty: "kolay", difficultyLabel: "Kolay", stops: 9, image: "https://images.unsplash.com/photo-1564769625905-50d9c1d8e8c8?w=600&h=400&fit=crop", color: "#2563eb", monumentIds: [2,5] }
];

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
