# TKMBS Payload CMS

Bu klasör Hatay Tarihi ve Kültürel Miras Bilgi Sistemi'nin içerik yönetim uygulamasıdır. Payload CMS 3, Next.js ve PostgreSQL kullanır.

## Yönetilen içerikler

- Tarihi eserler ve GeoJSON için enlem/boylam
- Kültürel rotalar ve eserlerle ilişkili sıralı duraklar
- Etkinlikler
- Bildirimler
- Medya dosyaları
- Portal ayarları
- Yönetici ve içerik editörü hesapları

## İlk kurulum

```powershell
npm install
Copy-Item .env.example .env
npm run db:start
npm run seed
npm run dev
```

Yönetim ekranı `http://localhost:3000/admin` adresindedir. İlk çalıştırmada belediyenin gerçek yönetici hesabı arayüzden oluşturulur; seed komutu kullanıcı veya parola üretmez.

## Veri aktarımı

`npm run seed`, kök projedeki örnek 20 eser, 20 rota, 20 etkinlik ve bildirimleri aktarır. Komut tekrar çalıştırılabilir; `legacyId` ile eşleşen kayıtlar güncellenir. Rota durakları Payload relationship alanıdır ve doğrudan tarihi eser kayıtlarına bağlıdır.

## Ortam değişkenleri

- `DATABASE_URL`: PostgreSQL bağlantı adresi
- `PAYLOAD_SECRET`: uzun ve gizli uygulama anahtarı
- `PAYLOAD_PUBLIC_SERVER_URL`: CMS'in dış adresi
- `PORTAL_ORIGIN`: Payload API'sine erişecek portal adresi

`.env`, yüklenen medya ve derleme çıktıları Git'e alınmaz. Örnek Docker parolası yalnızca yerel geliştirme içindir; belediye ortamında güçlü bir parola ve kurumun bağlantı adresi kullanılmalıdır.

## Üretim veritabanı

Sistem doğrudan resmi `@payloadcms/db-postgres` adaptörünü kullanır. Belediye sunucusuna geçerken kod değiştirilmez; yalnızca `DATABASE_URL` kurumun PostgreSQL adresiyle değiştirilir. Şema değişiklikleri üretimde migration komutlarıyla uygulanmalıdır.

```powershell
npm run migrate:create
npm run migrate
```

## Yönetim sorumlulukları

- Payload: içerik ekleme, düzenleme, silme, medya, kullanıcı ve yetkilendirme
- TKMBS özel yönetim paneli: harita, özet göstergeler, istatistikler ve raporlama
- Halk portalı: Payload REST API üzerinden yayımlanan onaylı içerikleri gösterir
