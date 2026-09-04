# TKMBS — Tarihi ve Kültürel Miras Bilgi Sistemi

Hatay Büyükşehir Belediyesi için geliştirilen TKMBS; tarihi eserleri, kültürel rotaları, etkinlikleri ve konum tabanlı bilgileri halk arayüzünde sunan; içerik yönetimini Payload CMS üzerinden gerçekleştiren bir web uygulamasıdır.

> Projenin mimarisi, bütün klasörleri, API uçları, veri modeli, roller, güvenlik, harita/rota sistemi, canlı kurulum ve teslim adımları için [Ayrıntılı Proje ve Devir-Teslim Raporu](./DETAYLI_PROJE_RAPORU.md) esas alınmalıdır.

## İçindekiler

- [Temel bileşenler](#temel-bilesenler)
- [GitHub deposunda bulunmayan dosyalar](#github-deposunda-bulunmayan-dosyalar)
- [Gereksinimler](#gereksinimler)
- [İlk kurulum](#ilk-kurulum)
- [Projeyi çalıştırma](#projeyi-calistirma)
- [Projeyi kapatma](#projeyi-kapatma)
- [Uygulama adresleri](#uygulama-adresleri)
- [Veri hazırlama](#veri-hazirlama)
- [Test ve derleme](#test-ve-derleme)
- [Güvenlik notları](#guvenlik-notlari)
- [Teslim kontrol listesi](#teslim-kontrol-listesi)

<a id="temel-bilesenler"></a>
## Temel bileşenler

| Katman | Teknoloji | Görev |
|---|---|---|
| Halk portalı | React 18 + Vite | Eser, rota, etkinlik, harita, profil ve kullanıcı ekranları |
| Harita | OpenLayers 9 + GeoJSON | Harita katmanları, semboller, kümeler, koordinatlar ve rota geometrileri |
| Portal API | Node.js + Express | DTO, kimlik doğrulama, favori, bildirim, kişisel rota ve içerik API'leri |
| İçerik yönetimi | Payload CMS 3 + Next.js | Tarihi eser, kültürel rota, etkinlik, medya, bildirim, kullanıcı ve rapor yönetimi |
| Veritabanı | PostgreSQL 16 | CMS içeriği, kullanıcılar, oturumlar, favoriler, bildirim durumları ve analitik |
| Rota motoru | GraphHopper 11 | Yerel OpenStreetMap verisi üzerinde araç yolu hesaplama |
| Hava durumu | Open-Meteo | Antakya için güncel hava bilgisi |

Yerel geliştirmede kullanılan varsayılan servisler:

| Servis | Adres/port |
|---|---|
| React portalı | `http://localhost:5173` |
| Express API | `http://localhost:5000` |
| Payload yönetimi | `http://localhost:3000/admin` |
| PostgreSQL | `127.0.0.1:5432` |
| GraphHopper | `127.0.0.1:8989` |

<a id="github-deposunda-bulunmayan-dosyalar"></a>
## GitHub deposunda bulunmayan dosyalar

GitHub deposunun tamamı indirilmelidir; ancak aşağıdaki güvenlik, boyut veya çalışma zamanı verileri bilerek Git'e eklenmez:

| Dosya/veri | Neden Git'te değil? | Teslim/kurulum yöntemi |
|---|---|---|
| Kök `.env` | Parola ve gizli anahtar içerir | `.env.example` kopyalanır ve kuruma özel değerlerle doldurulur |
| `cms/.env` | Payload ve PostgreSQL sırlarını içerir | `cms/.env.example` kopyalanır ve doldurulur |
| `routing/data/hatay.osm.pbf` | Büyük OpenStreetMap yol verisidir | Ayrı dosya olarak bu konuma yerleştirilir |
| `cms/media/` | Payload'a yüklenen görsellerdir | Medya yedeğinden veya kalıcı nesne depolamasından geri yüklenir |
| PostgreSQL içeriği | Çalışma zamanı ve kurum verisidir | SQL/özel-format yedekten geri yüklenir veya seed/migration çalıştırılır |
| `node_modules/` | Yeniden kurulabilir bağımlılıklardır | `npm install` komutlarıyla oluşturulur |
| `dist/`, `cms/.next/` | Yeniden üretilebilir derleme çıktılarıdır | Build sırasında otomatik oluşturulur |
| `routing/graph-cache/` | PBF'den üretilen rota grafiğidir | GraphHopper ilk açılışında yeniden oluşturur |

Bu ek dosyalar olmadan beklenen davranış:

- `.env` dosyaları olmadan güvenli kimlik ve servis bağlantıları kurulamaz.
- PostgreSQL olmadan Payload ve kalıcı portal kullanıcı işlemleri çalışmaz.
- Hatay PBF/GraphHopper olmadan yol ağı rotası hesaplanamaz; portal yanıltıcı kuş uçuşu rota çizmez.
- `cms/media` olmadan veritabanındaki medya kayıtları bulunsa bile yerel görseller eksik görünebilir.
- İnternet olmadan mevcut OSM/Esri temel harita karoları ve Open-Meteo hava verisi alınamaz. PBF dosyası yalnızca çevrimdışı rota hesabı sağlar; çevrimdışı temel harita sağlamaz.

<a id="gereksinimler"></a>
## Gereksinimler

- Git
- Node.js 20 veya üzeri
- npm
- Docker Desktop ve Docker Compose
- PBF ve GraphHopper önbelleği için yeterli disk alanı
- İlk bağımlılık kurulumu, çevrimiçi harita ve hava durumu için internet bağlantısı

Windows'ta Docker kullanan servislerden önce Docker Desktop tamamen açılmış olmalıdır.

<a id="ilk-kurulum"></a>
## İlk kurulum

### 1. Depoyu indirin

```powershell
git clone https://github.com/emecyildiz/belediye-tarih-ve-k-lt-r.git
cd belediye-tarih-ve-k-lt-r
```

Private depo kullanılıyorsa teslim alan kişinin GitHub hesabına erişim yetkisi verilmelidir.

### 2. Bağımlılıkları kurun

Bu komutların ikisi de proje kökünde çalıştırılır:

```powershell
npm install
npm --prefix cms install
```

### 3. Ortam dosyalarını hazırlayın

```powershell
Copy-Item .env.example .env
Copy-Item cms/.env.example cms/.env
```

Kopyalanan dosyalardaki örnek değerler production parolası değildir. En az şu değerler kuruma özel hazırlanmalıdır:

- PostgreSQL kullanıcı adı, parola ve bağlantı adresi
- `PAYLOAD_SECRET`
- `AUTH_ACCESS_SECRET`
- `TWO_FACTOR_SECRET`
- İzin verilen portal/CMS origin adresleri

`PAYLOAD_SECRET`, `AUTH_ACCESS_SECRET` ve `TWO_FACTOR_SECRET` birbirinden farklı, rastgele ve en az 32 karakter olmalıdır. Refresh token ayrıca imzalanan bir JWT değildir; rastgele üretilir ve veritabanında yalnız özeti saklanır. Gerçek değerleri Git'e göndermeyin.

### 4. Hatay rota verisini ekleyin

GraphHopper'ın beklediği dosya:

```text
routing/data/hatay.osm.pbf
```

Dosya adı veya yolu değiştirilirse `routing/config.yml` ve ilgili ortam ayarı birlikte güncellenmelidir. İlk GraphHopper açılışı yol grafiğini oluşturduğu için normalden uzun sürebilir.

<a id="projeyi-calistirma"></a>
## Projeyi çalıştırma

Bütün komutlar, aksi özellikle belirtilmedikçe, depo kökünde çalıştırılır.

### Önerilen başlatma sırası

#### Terminal 1 — PostgreSQL

```powershell
npm run cms:db:start
```

#### Terminal 2 — GraphHopper

```powershell
npm run routing:start
```

İlk açılışta `routing:logs` ile grafiğin hazır olduğu kontrol edilebilir:

```powershell
npm run routing:logs
```

#### Terminal 3 — Payload CMS

```powershell
npm run cms:dev
```

Terminalde `Ready` mesajı görülmeden sonraki servise geçilmemesi önerilir.

#### Terminal 4 — Express API

```powershell
npm run server
```

Sağlık kontrolü:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

#### Terminal 5 — React portalı

```powershell
npm run dev
```

### Birleşik geliştirme komutu

PostgreSQL ve GraphHopper hazır olduktan sonra portal, API ve CMS birlikte de başlatılabilir:

```powershell
npm run dev:cms
```

Ayrı terminaller hata kaynağını ve servis loglarını takip etmeyi kolaylaştırdığı için teslim/test sırasında önerilen yöntemdir.

<a id="projeyi-kapatma"></a>
## Projeyi kapatma

Önce `npm run dev`, `npm run server` ve `npm run cms:dev` çalışan terminallerin her birinde `Ctrl+C` kullanın. Ardından proje kökünde:

```powershell
npm run routing:stop
npm run cms:db:stop
```

<a id="uygulama-adresleri"></a>
## Uygulama adresleri

- Halk portalı: [http://localhost:5173](http://localhost:5173)
- Payload yönetim paneli: [http://localhost:3000/admin](http://localhost:3000/admin)
- Payload REST API: [http://localhost:3000/api](http://localhost:3000/api)
- Express sağlık kontrolü: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- GraphHopper bilgi uç noktası: [http://localhost:8989/info](http://localhost:8989/info)

Yönetici ve editör hesapları portalın `/giris` ekranında parola ve Google Authenticator doğrulamasını tamamladıktan sonra Payload'a yönlendirilir. Vatandaş hesapları Payload'a erişemez.

<a id="veri-hazirlama"></a>
## Veri hazırlama

### Migration

PostgreSQL başladıktan sonra:

```powershell
npm run cms:migrate
```

### Örnek içerik

Yalnız geliştirme veya kontrollü sunum ortamında `.env` ayarları hazırlandıktan sonra:

```powershell
npm run cms:seed
```

Demo kullanıcı ve parola ayarları production ortamında kapatılmalı ve örnek hesaplar kaldırılmalıdır.

### Eski görselleri Payload medyasına aktarma

```powershell
npm run cms:media:migrate
```

Gerçek belediye verileri geldiğinde eser, rota, etkinlik, bildirim ve portal içerikleri Payload koleksiyonlarına aktarılmalıdır. Portalın beklediği alanlar ve GeoJSON sözleşmesi [ayrıntılı raporda](./DETAYLI_PROJE_RAPORU.md) açıklanmıştır.

<a id="test-ve-derleme"></a>
## Test ve derleme

### Portal ve backend

```powershell
npm run test:data
npm run test:routing
npm run lint
npm run build
```

### Payload CMS

PostgreSQL açıkken:

```powershell
npm --prefix cms run lint
npm --prefix cms run test:int
npm --prefix cms run build
```

CMS geliştirme ve üretim derleme komutları, OneDrive'ın Turbopack persistence veritabanını bozmasını önlemek için Webpack kullanır. Webpack disk önbelleği de kapalıdır; böylece bozuk cache veritabanı ve snapshot dosyası kullanılmaz. Buna rağmen `Bulut dosya sağlayıcısı çalışmıyor` hatası görülürse projeyi OneDrive dışındaki yerel bir geliştirme dizinine taşımak en güvenli çözümdür. `cms/.next` yalnızca yeniden üretilebilir çıktıdır; servisler kapalıyken temizlenip yeniden oluşturulabilir.

<a id="guvenlik-notlari"></a>
## Güvenlik notları

- `.env`, `cms/.env`, veritabanı yedeği, recovery kodları ve gerçek kullanıcı verileri Git'e gönderilmez.
- Access token süresi 2 dakika; döndürülen refresh oturumu süresi 14 gündür.
- Refresh token `HttpOnly` çerezde tutulur ve veritabanına açık biçimde kaydedilmez.
- Yönetici ve editör için Google Authenticator uyumlu TOTP iki adımlı doğrulama zorunludur.
- Payload rol/yetki kuralları içerik silme ve yönetim işlemlerini sınırlar.
- Veritabanı yoksa backend sessizce bellek içi demo veritabanına düşmez.
- Production'da HTTPS, reverse proxy, güvenli çerezler, merkezi log, yedekleme ve kurumun parola politikasına uygun secret yönetimi kurulmalıdır.
- Private GitHub deposu secret saklama alanı değildir.

<a id="teslim-kontrol-listesi"></a>
## Teslim kontrol listesi

- [ ] GitHub deposuna erişim teslim alan kişiye verildi.
- [ ] Depo klonlandı ve iki bağımlılık kurulumu tamamlandı.
- [ ] Kök `.env` güvenli kanaldan hazırlandı.
- [ ] `cms/.env` güvenli kanaldan hazırlandı.
- [ ] PostgreSQL veritabanı/backup teslim edildi veya migration ve seed planlandı.
- [ ] `cms/media` yedeği veya production medya depolaması teslim edildi.
- [ ] `routing/data/hatay.osm.pbf` ayrıca teslim edildi.
- [ ] PostgreSQL, GraphHopper, Payload, Express ve React servisleri sırayla doğrulandı.
- [ ] Yönetici 2FA kurulumu ve recovery kodu teslim prosedürü tamamlandı.
- [ ] Portal ve CMS test/build komutları çalıştırıldı.
- [ ] Alan adı, HTTPS, reverse proxy, yedekleme ve log planı kurum tarafından belirlendi.
- [ ] [Ayrıntılı Proje ve Devir-Teslim Raporu](./DETAYLI_PROJE_RAPORU.md) teslim alan teknik kişi tarafından incelendi.

## Ana teknik belge

Bu README hızlı kurulum ve teslim özeti sağlar. Aşağıdaki konuların ayrıntıları için ana belgeyi kullanın:

- Tüm klasör ve önemli dosyaların görevleri
- Sayfalar ve React route yapısı
- Express ve Payload API uç noktaları
- Payload koleksiyonları ve PostgreSQL tabloları
- Token, refresh, rol ve iki adımlı doğrulama akışları
- OpenLayers, GeoJSON, koordinat sistemi ve harita sembolleri
- GraphHopper, OSM/PBF ve Google Haritalar aktarımı
- Raporlama ve analitik veri bütünlüğü
- Ortam değişkenlerinin tam listesi
- Canlı kurulum, yedekleme, sorun giderme ve bilinen sınırlamalar

➡️ [DETAYLI_PROJE_RAPORU.md dosyasını aç](./DETAYLI_PROJE_RAPORU.md)
