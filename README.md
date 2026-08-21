# 🏛️ Belediye Portalı - GeoJSON Harita Sistemi

Modern bir belediye web portalı projesi, **React**, **Node.js**, **OpenLayers** ve **GeoJSON** kullanılarak geliştirilmiştir. Staj projesi olarak, mock veri ile başlar ve sonradan gerçek veritabanı entegrasyonu yapılabilir.

## 🎯 Proje Özellikleri

### Frontend (React + OpenLayers)
- ✅ **İnteraktif Harita** - OpenLayers ile GeoJSON desteği
- ✅ **Kategoriye Göre Filtreleme** - Kültür, yeşil alan, eğitim, spor vb.
- ✅ **Konum Detayları** - Tıkla ve görüntüle
- ✅ **İstatistikler** - Şehir bilgileri dashboard
- ✅ **Haberler** - Son duyurular ve güncellemeler
- ✅ **Responsive Design** - Mobil uyumlu arayüz
- ✅ **Dark Mode** - Koyu tema desteği

### Backend (Node.js + Express)
- ✅ **RESTful API** - Tüm veri erişimi
- ✅ **GeoJSON Support** - Coğrafi veri formatı
- ✅ **Mock Data** - Hızlı başlangıç
- ✅ **CORS Enabled** - Cross-origin istekleri destekler
- ✅ **Modüler Yapı** - Veritabanı entegrasyonu kolay

## 📦 Teknoloji Stack

```
Frontend:
├── React 18.2          # UI Framework
├── OpenLayers 9.0      # Harita kütüphanesi
├── Vite 5.0            # Build tool (hızlı geliştirme)
└── CSS3                # Styling

Backend:
├── Node.js 16+         # Runtime
├── Express 4.18        # Web framework
├── CORS 2.8            # Cross-origin middleware
└── JSON                # Data format

Veri:
└── GeoJSON Format      # Coğrafi veri standartı
```

## 🚀 Hızlı Başlangıç

### 1. Yükle ve Kur
```bash
npm install
```

### 2. Geliştirme Sunucusu Başlat
```bash
# Backend + Frontend beraber
npm run dev:full

# Veya ayrı ayrı:
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

### 3. Tarayıcıda Aç
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/locations

## 📁 Proje Yapısı

```
belediye-portal/
├── 📄 backend-server.js      # Express API server (Mock veri)
├── 📄 App.jsx               # Ana React component
├── 📄 App.css               # Global stiller
├── 📄 main.jsx              # React entry point
├── 📄 index.html            # HTML şablonu
├── 📄 package.json          # Bağımlılıklar
├── 📄 vite.config.js        # Vite yapılandırması
│
├── 📁 src/components/
│   ├── MapPage.jsx          # Harita bileşeni
│   ├── MapPage.css          # Harita stilleri
│   ├── Header.jsx           # Üst navigasyon
│   ├── Header.css
│   ├── NewsSection.jsx      # Haberler bölümü
│   ├── NewsSection.css
│   ├── Footer.jsx           # Alt bilgi
│   └── Footer.css
│
├── 📄 SETUP_GUIDE.md        # Detaylı kurulum rehberi
└── 📄 README.md             # Bu dosya
```

## 🗺️ Harita İşlevleri

### OpenLayers Entegrasyonu
```javascript
// Harita başlatma
const map = new Map({
  target: 'map',
  layers: [tileLayer, vectorLayer],
  view: new View({
    center: [longitude, latitude],
    zoom: 13
  })
});
```

### GeoJSON Yükleme
```javascript
// API'den GeoJSON çek
fetch('/api/locations')
  .then(res => res.json())
  .then(data => {
    const features = new GeoJSON()
      .readFeatures(data);
    vectorSource.addFeatures(features);
  });
```

### Filtreleme
```javascript
// Türe göre filtrele
const filtered = features.filter(f => 
  f.getProperties().type === 'park'
);
```

## 🔗 API Endpoints

### Harita Verileri
```
GET /api/locations              # Tüm konumlar (GeoJSON)
GET /api/locations/:id          # Belirli konum detayı
GET /api/locations/type/:type   # Tipe göre filtreleme
```

### Diğer Veriler
```
GET /api/statistics             # Şehir istatistikleri
GET /api/news                   # Haber listesi
GET /api/health                 # API sağlık kontrolü
```

### Yönetim Endpoints (İleri)
```
POST   /api/locations           # Yeni konum ekle
PUT    /api/locations/:id       # Konumu güncelle
DELETE /api/locations/:id       # Konumu sil
POST   /api/news                # Haber ekle
```

## 📊 GeoJSON Veri Formatı

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
        "description": "Kısa açıklama",
        "address": "Sokak ve No",
        "phone": "Telefon",
        "email": "email@example.com",
        "working_hours": "09:00-18:00",
        "image": "https://example.com/image.jpg"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [35.3267, 36.8969]
      }
    }
  ]
}
```

## 💻 Geliştirme Talimatları

### Yeni Konum Ekle

1. **Backend'de mock veri güncelle** (`backend-server.js`):
```javascript
{
  type: "Feature",
  id: 5,
  properties: {
    name: "Yeni Konum",
    type: "spor",
    // ... diğer özellikler
  },
  geometry: {
    type: "Point",
    coordinates: [longitude, latitude]
  }
}
```

2. **Sunucuyu yeniden başlat** - Veriler otomatik yüklenir

### Stil Değiştir

**Harita pin renkleri** (`MapPage.jsx`):
```javascript
const colorMap = {
  kültür: '#FF6B6B',
  yeşil_alan: '#51CF66',
  eğitim: '#4C6EF5',
  spor: '#FFD43B'
};
```

**Tema renkleri** (`App.css`):
```css
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --success: #51CF66;
  --danger: #FF6B6B;
}
```

### Yeni Sayfa Ekle

1. `src/components/` içinde yeni component oluştur
2. `App.jsx`'e import et
3. Route ekle ve navigation'ı güncelle

## 🔄 Veritabanı Entegrasyonu

### MongoDB Örneği

```javascript
// backend-server.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: String,
  type: String,
  coordinates: [Number],
  properties: Object
});

const Location = mongoose.model('Location', locationSchema);

app.get('/api/locations', async (req, res) => {
  const locations = await Location.find();
  res.json({ success: true, data: locations });
});
```

### PostgreSQL Örneği

```javascript
const pool = require('./db-connection');

app.get('/api/locations', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM locations'
  );
  res.json({ success: true, data: result.rows });
});
```

## 📱 Responsive Tasarım

Proje mobil uyumlu:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobil**: < 768px

Test et:
```bash
npm run dev  # Tarayıcıda F12 aç, responsive mode aç
```

## 🎨 Özelleştirme

### Logo ve Başlık
`Header.jsx`:
```jsx
<h1>🏛️ Belediye Portalı</h1>
```

### Harita Koordinatları
`MapPage.jsx`:
```javascript
center: [3925255, 4405524],  // Web Mercator
zoom: 13
```

### Renkler
`Header.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 🧪 Test Etme

### Harita Testi
1. http://localhost:5173 aç
2. Harita yüklendiğini kontrol et
3. Filtre butonlarını tıkla
4. Konumlara tıkla

### API Testi
```bash
curl http://localhost:5000/api/locations
curl http://localhost:5000/api/statistics
curl http://localhost:5000/api/news
```

### Dark Mode Testi
Sağ üstteki 🌙 butonuna tıkla

## 🚢 Production'a Alma

```bash
# Build
npm run build

# Build'i test et
npm run preview

# Production'da çalıştır
NODE_ENV=production node backend-server.js
```

## 📝 Checklist

Proje sunumuna hazırlanırken:

- [ ] Tüm mock veriler güncellendi
- [ ] Logo ve başlık özelleştirildi
- [ ] Harita koordinatları doğru
- [ ] Tüm linkler çalışıyor
- [ ] Dark mode test edildi
- [ ] Mobil uyum test edildi
- [ ] API endpoint'leri çalışıyor
- [ ] Hata mesajları kontrol edildi

## 🐛 Yaygın Sorunlar

### Problem: Harita yüklenmiyorsa
**Çözüm**: Backend'in çalışıp çalışmadığını kontrol et
```bash
curl http://localhost:5000/api/health
```

### Problem: CORS hatası alıyorsam
**Çözüm**: `backend-server.js`'de `app.use(cors());` var mı kontrol et

### Problem: Stil yüklenmiyorsa
**Çözüm**: CSS import'larını kontrol et
```javascript
import './MapPage.css';
```

### Problem: Port zaten kullanımda
**Çözüm**: Port değiştir
```bash
# Backend
PORT=5001 npm run server

# Frontend (vite.config.js)
server: { port: 5174 }
```

## 📚 Kaynaklar

- [OpenLayers Belgeleri](https://openlayers.org/)
- [React Belgeleri](https://react.dev/)
- [Express.js Rehberi](https://expressjs.com/)
- [GeoJSON Spesifikasyonu](https://geojson.org/)
- [Vite Belgeleri](https://vitejs.dev/)

## 👥 İlişkili Dosyalar

- `SETUP_GUIDE.md` - Detaylı kurulum talimatları
- `backend-server.js` - API sunucusu
- `MapPage.jsx` - Harita bileşeni
- `App.jsx` - Ana uygulama

## 📧 İletişim ve Destek

Sorular veya sorunlar için:
1. Hata mesajını oku
2. Tarayıcı console'unu kontrol et (F12)
3. Network tab'ında istekleri kontrol et
4. Backend log'unu kontrol et

---

**Başarılar! 🎉 Projenin başarısını diliyoruz.**

*Son güncelleme: 2024*
