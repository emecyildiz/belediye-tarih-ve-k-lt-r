# 🏛️ Belediye Portalı - Kurulum Rehberi

Bu rehber, **React + Node.js + OpenLayers + GeoJSON** kullanan belediye web portalı projesini kurmak ve çalıştırmak için adım adım talimatlar sağlar.

## 📋 Sistem Gereksinimleri

- **Node.js**: v16.0.0 veya daha yüksek
- **npm**: v8.0.0 veya daha yüksek
- **Modern Browser**: Chrome, Firefox, Safari, Edge

## 🚀 Kurulum Adımları

### 1. Projeyi Klonla veya Yükle

```bash
# Proje dosyasını kendi dizinine kopyala
cd belediye-portal
```

### 2. Bağımlılıkları Yükle

```bash
# Tüm npm paketlerini yükle
npm install
```

Kurulum sırasında aşağıdakiler indirilecektir:
- ✅ **React** - UI framework
- ✅ **OpenLayers** - Harita kütüphanesi
- ✅ **Express** - Backend server
- ✅ **Vite** - Build tool
- ✅ **CORS** - Cross-Origin istekleri için

### 3. Proje Yapısını Anla

```
belediye-portal/
├── backend-server.js          # Node.js/Express API server
├── src/
│   ├── components/
│   │   ├── MapPage.jsx         # Harita sayfası
│   │   ├── MapPage.css         # Harita stilleri
│   │   ├── Header.jsx          # Üst navigasyon
│   │   ├── Header.css
│   │   ├── NewsSection.jsx     # Haberler sayfası
│   │   ├── NewsSection.css
│   │   ├── Footer.jsx          # Alt bilgi
│   │   └── Footer.css
│   ├── App.jsx                 # Ana sayfa
│   ├── App.css
│   ├── main.jsx               # React giriş noktası
│   └── index.html
├── package.json               # Bağımlılıklar ve scriptler
├── vite.config.js            # Vite yapılandırması
└── SETUP_GUIDE.md            # Bu dosya
```

## ▶️ Projeyi Çalıştır

### Seçenek 1: Backend ve Frontend Beraber (Önerilen)

```bash
# Her iki server'ı aynı anda çalıştır
npm run dev:full
```

Bu komut:
- **Backend**: http://localhost:5000 üzerinde Express server başlatır
- **Frontend**: http://localhost:5173 üzerinde React app başlatır

### Seçenek 2: Ayrı Ayrı Çalıştır

Terminal 1 - Backend:
```bash
npm run server
# Çıktı: 🚀 Backend server çalışıyor: http://localhost:5000
```

Terminal 2 - Frontend:
```bash
npm run dev
# Çıktı: VITE ... ready in XXX ms
```

Tarayıcıda açın: **http://localhost:5173**

## 🗺️ Harita Kullanımı

### Harita Özellikleri
- ✅ OpenLayers ile interaktif harita
- ✅ GeoJSON format destek
- ✅ Kategoriye göre filtreleme
- ✅ Konum detaylarını görüntüle
- ✅ OSM (OpenStreetMap) temel harita

### Mock Verisi Nedir?

Şu anda backend **mock (sahte) veri** kullanıyor:
- 4 örnek konum (kültür, park, kütüphane, spor)
- 3 örnek haber
- İstatistik bilgileri

## 🔗 API Endpoints

Backend aşağıdaki endpoint'leri sağlar:

### Harita Verileri
```
GET /api/locations              # Tüm konumlar (GeoJSON)
GET /api/locations/:id          # Belirli konum
GET /api/locations/type/:type   # Tipe göre filtrele
```

### Diğer Veriler
```
GET /api/statistics             # Şehir istatistikleri
GET /api/news                   # Haberler listesi
GET /api/health                 # Sağlık kontrolü
```

### Örnek İstek
```javascript
// JavaScript fetch
fetch('http://localhost:5000/api/locations')
  .then(res => res.json())
  .then(data => console.log(data))
```

## 🗂️ Kodu Organize Etme

Yapı özelleştirme:
```
src/
├── components/
│   ├── Map/
│   │   ├── MapPage.jsx
│   │   └── MapPage.css
│   ├── Navigation/
│   │   ├── Header.jsx
│   │   └── Header.css
│   ├── News/
│   │   ├── NewsSection.jsx
│   │   └── NewsSection.css
│   └── Common/
│       ├── Footer.jsx
│       └── Footer.css
├── pages/
├── utils/
├── api/
│   └── client.js
└── hooks/
```

## 🔄 Veritabanı Entegrasyonu (İleri)

### Veritabanı bağlanması için:

1. **Backend'i güncelle** (`backend-server.js`)
```javascript
// Mock veri yerine DB'den çek
const mockGeocData = await db.query('SELECT * FROM locations');
```

2. **API Endpoints güncelle**
```javascript
// Örnek: MongoDB ile
app.get('/api/locations', async (req, res) => {
  const locations = await Location.find();
  res.json({ success: true, data: locations });
});
```

3. **POST/PUT/DELETE endpoints aktif et**
```javascript
// Yeni konum ekle
app.post('/api/locations', async (req, res) => {
  const newLocation = new Location(req.body);
  await newLocation.save();
  res.json({ success: true });
});
```

## 📝 GeoJSON Formatı

API'den beklenen format:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "name": "Konum Adı",
        "type": "kültür",
        "description": "Açıklama",
        "address": "Adres",
        "phone": "Telefon",
        "email": "Email",
        "working_hours": "Çalışma Saatleri",
        "image": "https://..."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]  // WGS84 format
      }
    }
  ]
}
```

## 🎨 Kustomizasyon

### Harita Koordinatlarını Değiştir
`MapPage.jsx` içinde:
```javascript
view: new View({
  center: [3925255, 4405524], // Web Mercator koordinatları
  zoom: 13
})
```

### Renkleri Değiştir
`MapPage.jsx` içinde `colorMap` bölümü:
```javascript
const colorMap = {
  kültür: '#FF6B6B',     // Değiştir
  yeşil_alan: '#51CF66',
  eğitim: '#4C6EF5',
  spor: '#FFD43B'
};
```

### Logo/İkon Değiştir
`Header.jsx` içindeki emoji'leri değiştir veya SVG ekle:
```javascript
<h1>🏛️ Belediye Portalı</h1>  // Emoji değiştir
```

## 🐛 Sorun Çözme

### Port Zaten Kullanımda
```bash
# Port değiştir (vite.config.js)
export default {
  server: {
    port: 5174  // Yeni port
  }
}
```

### CORS Hatası
Eğer "CORS policy" hatası alırsan, `backend-server.js`'de kontrol et:
```javascript
app.use(cors()); // Bu satır gerekli
```

### Veri Yüklenmiyorsa
1. Backend çalışıyor mu? → `npm run server`
2. API ulaşılıyor mu? → `http://localhost:5000/api/health`
3. Tarayıcı console'unda hata var mı? → F12 aç

## 📚 Öğrenme Kaynakları

- [OpenLayers Docs](https://openlayers.org/)
- [React Docs](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [GeoJSON Spec](https://geojson.org/)

## 🎯 İleri Özellikler (Roadmap)

- [ ] Kullanıcı authentication
- [ ] Admin paneli
- [ ] Konum arama
- [ ] Yol tarifi entegrasyonu
- [ ] Bildirim sistemi
- [ ] Gerçek zamanlı güncelleme (WebSocket)
- [ ] Mobil app (React Native)

## 💾 Production'a Dağıt

```bash
# Frontend build
npm run build

# Backend node production'da çalıştır
NODE_ENV=production node backend-server.js
```

## 📧 Destek

Herhangi bir sorunla karşılaşırsan:
1. Backend log'unu kontrol et
2. Tarayıcı console'unu kontrol et
3. Network isteklerini (Network tab) kontrol et

---

**Başarılar! 🚀 Projenin başarısını diliyoruz!**
