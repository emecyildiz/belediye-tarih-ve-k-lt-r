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
- PostgreSQL tabanlı anonim ziyaret ve içerik performansı raporları

## İlk kurulum

```powershell
npm install
Copy-Item .env.example .env
npm run db:start
npm run seed
npm run dev
```

Yönetim ekranı `http://localhost:3000/admin` adresindedir. Belediye ortamında ilk gerçek yönetici hesabı arayüzden oluşturulur. Yerel örnek hesaplar yalnızca `AUTH_SEED_DEMO_USERS=true` olduğunda seed tarafından hazırlanır.

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

## Raporlama

Payload ana ekranındaki **Raporlama ve Analitik** bölümü sabit sayaç kullanmaz. Portalın anonim sayfa görüntüleme olaylarını `tkmbs_analytics_events`, kullanıcıları `tkmbs_portal_users`, favorileri `tkmbs_user_favorites` ve içerik sayılarını Payload koleksiyonlarından okur.

Ziyaret kaydında IP adresi veya kesin konum saklanmaz. Tarayıcı tarafından üretilen rastgele ziyaretçi ve oturum kimlikleri kullanılır. Aynı oturumun kısa süreli yinelenen istekleri veritabanında tekilleştirilir.

## Yönetim sorumlulukları

- Payload: içerik ekleme, düzenleme, silme, medya, kullanıcı, yetkilendirme ve raporlama
- TKMBS eski özel yönetim paneli: kaynak kodu korunur ancak aktif yönetim akışında kullanılmaz
- Halk portalı: Payload REST API üzerinden yayımlanan onaylı içerikleri gösterir
