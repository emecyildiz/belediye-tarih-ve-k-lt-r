# ⚡ HIZLI BAŞLANGIC - 5 DAKİKA

Bu dosyayı takip ederek **5 dakika içinde** çalışan bir belediye web portalı elde edeceksin!

---

## 📝 ADIM 1: Tüm Dosyaları İndir

Bu 20 dosyayı kendi dizinine kopyala:

```
├── .gitignore
├── App.css
├── App.jsx
├── Footer.css
├── Footer.jsx
├── Header.css
├── Header.jsx
├── MapPage.css
├── MapPage.jsx
├── NewsSection.css
├── NewsSection.jsx
├── PROJECT_SUMMARY.md
├── README.md
├── SETUP_GUIDE.md
├── backend-server.js
├── index.html
├── main.jsx
├── package.json
└── vite.config.js
```

---

## 📥 ADIM 2: Node.js Kur (İlk Sefer)

Bilgisayarında Node.js var mı kontrol et:

```bash
node --version
npm --version
```

Yoksa: https://nodejs.org/ (LTS versiyonu indir)

---

## 📦 ADIM 3: Bağımlılıkları Yükle

```bash
cd belediye-portal
npm install
```

⏱️ **Bekleme**: 2-3 dakika (ilk sefer daha uzun)

Tamamlandığında `node_modules/` klasörü oluşur.

---

## ▶️ ADIM 4: Sunucuları Başlat

### Seçenek A: İşi Yen Et (En Kolay)
```bash
npm run dev:full
```

Otomatik olarak:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

Tarayıcı kendiliğinden açılacak! ✨

### Seçenek B: Ayrı Ayrı Çalıştır
Terminal 1:
```bash
npm run server
```
→ Backend hazır (port 5000)

Terminal 2:
```bash
npm run dev
```
→ Frontend hazır (port 5173)

---

## 🎉 ADIM 5: Tamamlandı!

Tarayıcıda görmek gereken şeyler:

✅ **Üstte**: Logo + Navigasyon menüsü
✅ **Ortada**: İnteraktif harita (OpenLayers)
✅ **Solda**: Filtreler ve konum detayları
✅ **Altında**: İstatistikler ve footer

---

## 🧪 Test Et

### Harita Test
1. Harita çıktı mı? ✓
2. Filtreleme butonlarına tıkla → pin'ler gözden kaybolsun
3. Haritadaki pin'lere tıkla → detay paneli açılsın
4. Dark mode butonuna (🌙) tıkla → koyu tema

### API Test
Tarayıcı console'unu aç (F12) ve yapıştır:
```javascript
fetch('http://localhost:5000/api/locations')
  .then(r => r.json())
  .then(d => console.log(d))
```
Veri göreceksin! ✓

---

## 🎨 Hızlı Özelleştirmeler

### 1. Logo/Başlık Değiştir
`Header.jsx` dosyasını aç, satır 16'da:
```jsx
<h1>🏛️ Belediye Portalı</h1>  ← Emojisini değiştir
```

### 2. Renk Değiştir
`App.css` dosyasını aç, satırın başında bul:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
`#667eea` ve `#764ba2` yerine kendi renklerini yapıştır.

### 3. Mock Veri Ekle
`backend-server.js` dosyasında, `mockGeocData` içine yeni konum ekle:
```javascript
{
  type: "Feature",
  id: 5,
  properties: {
    name: "Yeni Konum",
    type: "spor",
    description: "Açıklama",
    address: "Adres",
    phone: "0322 123 45 67",
    email: "info@example.com",
    working_hours: "09:00-18:00"
  },
  geometry: {
    type: "Point",
    coordinates: [35.3267, 36.8969]
  }
}
```

Sunucuyu yeniden başlat (Ctrl+C ve `npm run server`)

---

## 🛠️ Sorun Giderim

### Problem: "command not found: npm"
**Çözüm**: Node.js yüklü değil → https://nodejs.org/

### Problem: Port zaten kullanımda
**Çözüm**: 
```bash
# Windows
netstat -ano | findstr :5173

# Mac/Linux
lsof -i :5173
```

### Problem: Harita yüklenmemiş
**Çözüm**: 
1. Backend çalışıyor mu? (Terminal 1'de hata var mı?)
2. http://localhost:5000/api/health kontrol et
3. Tarayıcı console'unda (F12) hata var mı?

### Problem: Stil yüklenmemiş
**Çözüm**: `npm run dev` yapıp Ctrl+R ile sayfayı kuvvetle yenile

### Problem: "Cannot find module"
**Çözüm**: 
```bash
npm install  # Tüm bağımlılıkları yeniden yükle
```

---

## 📚 Daha Fazla Bilgi İçin

| İhtiyacın | Dosya |
|-----------|-------|
| Detaylı kurulum | `SETUP_GUIDE.md` |
| API hakkında | `backend-server.js` |
| Mimarı anlamak | `PROJECT_SUMMARY.md` |
| Tüm dosyaları görmek | `FILES_INDEX.md` |

---

## 🎯 Sonraki Adımlar

### Hemen Şimdi
- [ ] Dosyaları indir
- [ ] `npm install` çalıştır
- [ ] `npm run dev:full` başlat
- [ ] Harita'ya bak ve mutlu ol! 🎉

### Bugün
- [ ] Logo ve renkleri değiştir
- [ ] Mock veri ekle
- [ ] Navigasyon linklerini test et
- [ ] Dark mode çalışıyor mu?

### Bu Hafta
- [ ] Veritabanı araştır (PostgreSQL/MongoDB)
- [ ] Admin panel tasarla
- [ ] User authentication kodu yaz
- [ ] Styling ince ayarları yap

---

## 💡 İpuçları

✨ **En Hızlı Başlama**
```bash
npm install && npm run dev:full
```

✨ **CSS değişikliklerini hemen gör**
- Vite otomatik reload eder
- Sayfayı F5 ile yenileme gereği yok

✨ **Backend değişikliğinde**
- Ctrl+C yapıp `npm run server` tekrar çalıştır
- Frontend otomatik reconnect eder

✨ **Veri eklemede**
- JSON formatı doğru mu? https://jsonlint.com/ ile kontrol et

---

## ✅ Basarı Kontrol

Tüm bu maddeleri kontrol ettiysen, proje hazır! 🚀

- [ ] Frontend çalışıyor (http://localhost:5173)
- [ ] Backend çalışıyor (http://localhost:5000)
- [ ] Harita görünüyor
- [ ] Filtreleme çalışıyor
- [ ] API'ye bağlanıyor
- [ ] Mock veriler yükleniyor
- [ ] Hiç hata yok

---

## 🎓 Staj Sunumu Hazırlık

Hocana gösterebilecek şeyler:

1. **Harita** - Pin'ler ve filtreleme
2. **API** - Curl veya Postman ile test et
3. **Responsive** - Telefonda açıp göster
4. **Dark Mode** - Tema değiştir
5. **Kodlar** - GitHub'a push et (önemli!)

---

## 📱 Telefonda Test

```bash
# Bilgisayarının IP'sini bul
ipconfig getifaddr en0  # Mac
ipconfig                # Windows

# Sonra telefonda aç
http://BİLGİSAYAR_İP:5173
```

Harita mobilde nasıl görünüyor?

---

## 🎉 Bitirdin!

Şu anda elinde:
- ✅ Çalışan belediye web portalı
- ✅ 20 dosyalı profesyonel yapı
- ✅ Mock API
- ✅ Harita ve filtreleme
- ✅ Responsive tasarım
- ✅ Veritabanı bağlama hazırlığı

**Başarılar! 🚀**

---

*Sorularına açığım. Baştan başlamak istersen, bu dosyadan başla!*
