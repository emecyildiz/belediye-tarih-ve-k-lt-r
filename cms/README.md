# TKMBS Payload CMS

Bu klasör Hatay Tarihi ve Kültürel Miras Bilgi Sistemi'nin içerik yönetim uygulamasıdır. Payload CMS 3, Next.js ve geliştirme ortamında SQLite kullanır.

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
npm run seed
npm run dev
```

Yönetim ekranı `http://localhost:3000/admin` adresindedir. İlk çalıştırmada belediyenin gerçek yönetici hesabı arayüzden oluşturulur; seed komutu kullanıcı veya parola üretmez.

## Veri aktarımı

`npm run seed`, kök projedeki örnek 20 eser, 20 rota, 20 etkinlik ve bildirimleri aktarır. Komut tekrar çalıştırılabilir; `legacyId` ile eşleşen kayıtlar güncellenir. Rota durakları Payload relationship alanıdır ve doğrudan tarihi eser kayıtlarına bağlıdır.

## Ortam değişkenleri

- `DATABASE_URL`: geliştirmede `file:./cms.db`
- `PAYLOAD_SECRET`: uzun ve gizli uygulama anahtarı
- `PAYLOAD_PUBLIC_SERVER_URL`: CMS'in dış adresi
- `PORTAL_ORIGIN`: Payload API'sine erişecek portal adresi

`.env`, `cms.db`, yüklenen medya ve derleme çıktıları Git'e alınmaz.

## Üretim veritabanı

Belediyenin PostgreSQL altyapısına geçerken `@payloadcms/db-postgres` kullanılarak yalnızca veritabanı adaptörü ve bağlantı adresi değiştirilir. Koleksiyon adları, ilişkiler ve REST API sözleşmesi aynı bırakılır.
