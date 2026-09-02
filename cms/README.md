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

Yönetim ekranı `http://localhost:3000/admin` adresindedir. İlk kullanıcıyı arayüzden sahipsiz biçimde oluşturma kapalıdır. Güvenilir ilk kurulumda `AUTH_SEED_DEMO_USERS=true` ve en az 12 karakterli `DEMO_USER_PASSWORD` tanımlanarak seed çalıştırılır; yönetici giriş yaptıktan ve parolayı değiştirdikten sonra seed ayarı tekrar `false` yapılır.

## Veri aktarımı

`npm run seed`, kök projedeki örnek 20 eser, 20 rota, 20 etkinlik ve bildirimleri aktarır. Komut tekrar çalıştırılabilir; `legacyId` ile eşleşen kayıtlar güncellenir. Rota durakları Payload relationship alanıdır ve doğrudan tarihi eser kayıtlarına bağlıdır.

Eski URL alanlarındaki yerel örnek görselleri Payload Medya koleksiyonuna taşımak için:

```powershell
npm run migrate:media
```

Bu komut kullanıcı hesaplarına veya içerik metinlerine dokunmaz. Aynı dosyayı yeniden yüklemez; yalnızca ana görsel ve galeri ilişkilerini tamamlar. Yeni içeriklerde görseller doğrudan Medya seçicisinden yüklenir. Eski URL alanları geçiş süresince gizli yedek olarak korunur.

## Ortam değişkenleri

- `DATABASE_URL`: PostgreSQL bağlantı adresi
- `PAYLOAD_SECRET`: uzun ve gizli uygulama anahtarı
- `TWO_FACTOR_SECRET`: portal backend ile aynı, uzun ve rastgele 2FA imza/şifreleme anahtarı
- `PAYLOAD_PUBLIC_SERVER_URL`: CMS'in dış adresi
- `PORTAL_ORIGIN`: Payload API'sine erişecek portal adresi

`.env`, yüklenen medya ve derleme çıktıları Git'e alınmaz. Medya dosyasının kendisi geliştirmede `cms/media`, açıklama, kaynak, lisans ve içerik ilişkileri PostgreSQL içinde tutulur. Belediye ortamında bu klasör kalıcı disk/nesne depolama ile yedeklenmelidir. Örnek Docker parolası yalnızca yerel geliştirme içindir; belediye ortamında güçlü bir parola ve kurumun bağlantı adresi kullanılmalıdır.

## İki adımlı doğrulama

Yönetici ve editörler `http://localhost:5173/giris` sayfasından giriş yapar. İlk girişte Google Authenticator kurulum QR kodu gösterilir. Sonraki girişlerde 6 haneli TOTP kodu doğrulanmadan portal tokenı ve Payload oturumu açılmaz. Payload'ın doğrudan `/admin/login` isteği kısa ömürlü, imzalı 2FA kanıtı olmadan reddedilir.

Kurulum sonunda sekiz tek kullanımlık kurtarma kodu yalnızca bir kez gösterilir. Beş hatalı doğrulama hesabı beş dakika kilitler. Payload menüsündeki **Portal Kullanıcıları** ekranından hesap durumu ve 2FA bilgisi izlenebilir; yönetici 2FA'yı sıfırladığında portal ve Payload oturumları da iptal edilir.

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
