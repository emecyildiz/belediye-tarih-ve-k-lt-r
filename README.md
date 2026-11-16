<div align="center">

# TKMBS

### Historical and Cultural Heritage Information System

[![Deploy public demo to GitHub Pages](https://github.com/emecyildiz/belediye-tarih-ve-k-lt-r/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/emecyildiz/belediye-tarih-ve-k-lt-r/actions/workflows/deploy-pages.yml)

[Canlı Demo / Live Demo](https://emecyildiz.github.io/belediye-tarih-ve-k-lt-r/) · [Türkçe](#turkce) · [English](#english)

</div>

---

<a id="turkce"></a>

## Türkçe

### Proje hakkında

TKMBS, **2026 yaz stajı** kapsamında Hatay'ın tarihi eserlerini, kültürel rotalarını, etkinliklerini ve konum tabanlı kültür verilerini tek bir arayüzde sunmak amacıyla geliştirilmiş bir web uygulaması prototipidir.

Proje; halkın kültürel mirası harita üzerinden keşfedebilmesi, tarihi eser ve etkinlik ayrıntılarını inceleyebilmesi, gezi rotaları oluşturabilmesi ve içerik yöneticilerinin verileri merkezi bir panelden yönetebilmesi düşüncesiyle hazırlanmıştır.

> **Portföy bildirimi:** Bu depo güncel ve resmî bir Hatay Büyükşehir Belediyesi hizmeti değildir. Yaz stajında hazırlanan bağımsız bir eğitim/portföy çalışmasıdır. GitHub Pages sürümündeki içerikler örnek veridir; resmî envanter veya güncel ziyaret/yol bilgisi olarak kullanılmamalıdır.

### Canlı demo

**[GitHub Pages üzerinde demoyu aç](https://emecyildiz.github.io/belediye-tarih-ve-k-lt-r/)**

GitHub Pages yalnızca statik dosya barındırdığı için canlı demo, uygulamanın **örnek verili tanıtım sürümüdür**:

- Tarihi eser, rota, etkinlik, harita, arama ve hakkında sayfaları çalışır.
- OpenLayers haritası ve çevrimiçi temel harita karoları kullanılabilir.
- Hava durumu, servis erişilebildiğinde Open-Meteo üzerinden alınır.
- PostgreSQL, Express, Payload CMS ve GraphHopper GitHub Pages üzerinde çalışmaz.
- Giriş, kayıt, kalıcı favoriler, bildirim durumu, yönetim paneli ve sunucu tabanlı rota hesabı devre dışıdır.
- Tam sistem yerel veya sunucu kurulumunda aşağıdaki servislerle çalıştırılabilir.

### Öne çıkan özellikler

- Tarihi eser, kültürel rota ve etkinlik listeleri
- Ayrıntı sayfaları, galeri ve yakın içerik önerileri
- OpenLayers tabanlı katmanlı ve filtrelenebilir harita
- GeoJSON nokta ve rota geometrileri
- Harita üzerinde koordinat gösterimi ve içerik kartları
- Kültürel rota görüntüleme ve kişisel rota taslağı oluşturma
- Google Haritalar'a yol tarifi aktarımı
- Arama, filtreleme, sayfalama ve mobil uyum
- Vatandaş hesabı, favoriler, bildirimler ve kaydedilen rotalar
- Payload CMS içerik yönetimi, kullanıcı yönetimi ve raporlama
- Kısa ömürlü access token, yenilenen refresh oturumu, roller ve TOTP 2FA
- PostgreSQL kalıcılığı ve GraphHopper araç rotası

### Kullanılan teknolojiler

| Katman | Teknoloji | Görev |
|---|---|---|
| Halk portalı | React 18, Vite, React Router | Kullanıcı arayüzü ve sayfa yönlendirmeleri |
| Harita | OpenLayers 9, GeoJSON | Harita katmanları, işaretçiler, kümeler ve rota geometrisi |
| Portal API | Node.js, Express | DTO, kimlik doğrulama, kullanıcı işlemleri ve servis birleştirme |
| İçerik yönetimi | Payload CMS 3, Next.js | Eser, rota, etkinlik, medya, kullanıcı ve rapor yönetimi |
| Veritabanı | PostgreSQL 16 | İçerik, kullanıcı, oturum, favori, bildirim ve analitik kayıtları |
| Rota motoru | GraphHopper 11 | Yerel OpenStreetMap verisiyle araç yolu hesaplama |
| Hava durumu | Open-Meteo | Antakya için güncel hava bilgisi |
| Yayın | GitHub Actions, GitHub Pages | Statik portföy demosunun otomatik dağıtımı |

### Mimari

```text
React/Vite portalı
      |
      | /api
      v
Express portal API'si
      |----------------> Payload REST API ----------> PostgreSQL
      |----------------> Auth/veri repository ------> PostgreSQL
      |----------------> GraphHopper ---------------> Hatay OSM/PBF
      `----------------> Open-Meteo

Yönetici / editör
      `----------------> Payload yönetim paneli
```

Temel sorumluluklar:

- React doğrudan veritabanına bağlanmaz.
- Express, Payload içeriğini portalın kullandığı DTO biçimine dönüştürür.
- Payload içerik ve yönetim işlemlerini üstlenir.
- PostgreSQL kalıcı kullanıcı ve içerik verilerini saklar.
- OpenLayers haritayı gösterir; yol hesabını GraphHopper yapar.
- Hazır kültürel rota durakları CMS verisidir; GraphHopper yalnız duraklar arasındaki araç yolunu hesaplar.

### Klasör yapısı

```text
belediye-portal/
├── .github/workflows/          GitHub Pages dağıtım iş akışı
├── src/                        React halk portalı
│   ├── auth/                   Oturum ve korumalı sayfalar
│   ├── components/             Ortak, harita ve yerleşim bileşenleri
│   ├── config/                 Çalışma modu ve statik asset yardımcıları
│   ├── hooks/                  Favori ve sürükleyerek kaydırma hook'ları
│   ├── pages/                  Portal sayfaları
│   └── services/               API ve auth istemcileri
├── backend/                    Auth, veri, CMS, CBS ve rota servisleri
├── backend-server.js           Express giriş noktası
├── cms/                        Payload CMS / Next.js uygulaması
├── routing/                    GraphHopper Docker yapılandırması
├── public/                     Görseller ve statik dosyalar
└── DETAYLI_PROJE_RAPORU.md     Ayrıntılı teknik devir belgesi
```

### Yerel tam sistemi çalıştırma

#### Gereksinimler

- Node.js 20.19+ veya 22.12+ güncel LTS
- npm
- PostgreSQL 16 veya Docker Desktop
- Docker Compose
- GraphHopper için `routing/data/hatay.osm.pbf`

#### Kurulum

```powershell
git clone https://github.com/emecyildiz/belediye-tarih-ve-k-lt-r.git
cd belediye-tarih-ve-k-lt-r
npm ci
npm --prefix cms ci
Copy-Item .env.example .env
Copy-Item cms/.env.example cms/.env
```

Örnek `.env` değerleri production parolası değildir. Gerçek secret, parola, kullanıcı verisi ve veritabanı yedeği Git'e gönderilmemelidir.

#### Başlatma sırası

Her komutu proje kökünde, ayrı terminalde çalıştırın:

```powershell
# 1. PostgreSQL
npm run cms:db:start

# İlk kurulumda migration
npm run cms:migrate

# 2. GraphHopper
npm run routing:start

# 3. Payload CMS
npm run cms:dev

# 4. Express API
npm run server

# 5. React portalı
npm run dev
```

Yerel adresler:

| Servis | Adres |
|---|---|
| React portalı | `http://localhost:5173` |
| Express API | `http://localhost:5000` |
| Payload yönetimi | `http://localhost:3000/admin` |
| PostgreSQL | `127.0.0.1:5432` |
| GraphHopper | `127.0.0.1:8989` |

Kapatmak için Node terminallerinde `Ctrl+C`, ardından:

```powershell
npm run routing:stop
npm run cms:db:stop
```

### Test ve derleme

```powershell
npm run test:data
npm run test:routing
npm run lint
npm run build

npm --prefix cms run lint
npm --prefix cms run test:int
npm --prefix cms run build
```

GitHub Pages ile aynı statik demoyu yerelde üretmek için:

```powershell
$env:VITE_STATIC_DEMO='true'
$env:VITE_BASE_PATH='/belediye-tarih-ve-k-lt-r/'
npm run build
Remove-Item Env:VITE_STATIC_DEMO
Remove-Item Env:VITE_BASE_PATH
```

### GitHub Pages dağıtımı

`.github/workflows/deploy-pages.yml` iş akışı her `main` push'unda:

1. Node.js ortamını hazırlar.
2. `npm ci` çalıştırır.
3. Portalı statik demo modunda ve doğru depo alt yoluyla derler.
4. `dist/` çıktısını Pages artifact'i olarak yükler.
5. Artifact'i `github-pages` ortamına dağıtır.

Repo ayarlarında yalnızca **Settings → Pages → Build and deployment → Source → GitHub Actions** seçilmelidir. İlk başarılı dağıtımın ardından site `https://emecyildiz.github.io/belediye-tarih-ve-k-lt-r/` adresinde açılır.

### Güvenlik ve veri notları

- `.env`, `cms/.env`, gerçek parolalar, tokenlar ve kullanıcı verileri repoya eklenmez.
- Public demo gerçek backend veya yönetici hesabı içermez.
- Demo kayıtları resmî belediye/CBS verisi değildir.
- Belediye LDAP/Active Directory entegrasyonu uygulanmamıştır.
- LDAP entegrasyonu için kurum ağı, test hesabı, AD grup-rol eşlemesi ve güvenilir sertifika zinciri gerekir.
- Production ortamında HTTPS, güvenli çerez, ağ kısıtı, yedekleme ve merkezi log kurulmalıdır.

### Ayrıntılı dokümantasyon

- [Ayrıntılı Proje ve Devir-Teslim Raporu](./DETAYLI_PROJE_RAPORU.md)
- [Payload CMS rehberi](./cms/README.md)
- [GraphHopper rehberi](./routing/README.md)
- [CBS sağlayıcı sözleşmesi](./backend/services/cbs/README.md)
- [Görsel kaynakları](./public/assets/monuments/SOURCES.txt)

[Başa dön](#tkmbs) · [English](#english)

---

<a id="english"></a>

## English

### About the project

TKMBS is a web application prototype created during a **2026 summer internship** to present Hatay's historical monuments, cultural routes, events, and location-based heritage information in a single interface.

The project was designed to let visitors explore cultural heritage on a map, inspect detailed monument and event pages, create trip drafts, and allow authorized editors to manage content from a central administration interface.

> **Portfolio notice:** This repository is not a current or official Hatay Metropolitan Municipality service. It is an independent educational and portfolio project developed during a summer internship. The GitHub Pages deployment uses sample data and must not be treated as an official inventory or as current visitor/road information.

### Live demo

**[Open the GitHub Pages demo](https://emecyildiz.github.io/belediye-tarih-ve-k-lt-r/)**

GitHub Pages hosts static files only, so the public deployment is a **sample-data showcase**:

- Monument, route, event, map, search, and about pages are available.
- The OpenLayers map and online base-map tiles can be viewed.
- Weather data is fetched from Open-Meteo when the service is reachable.
- PostgreSQL, Express, Payload CMS, and GraphHopper do not run on GitHub Pages.
- Authentication, registration, persistent favorites, notification state, administration, and server-side routing are disabled.
- The complete system can still be run locally or deployed to an application server.

### Highlights

- Historical monument, cultural route, and event catalogs
- Detail pages, galleries, and nearby-content suggestions
- Layered and filterable OpenLayers map
- GeoJSON point and route geometries
- Coordinate display and contextual map cards
- Cultural route display and custom trip drafting
- Google Maps directions export
- Search, filters, pagination, responsive layouts, and drag scrolling
- Citizen accounts, favorites, notifications, and saved routes
- Payload CMS content management, user administration, and reporting
- Short-lived access tokens, rotating refresh sessions, roles, and TOTP 2FA
- PostgreSQL persistence and GraphHopper road routing

### Technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Public portal | React 18, Vite, React Router | User interface and client-side navigation |
| Mapping | OpenLayers 9, GeoJSON | Layers, markers, clusters, coordinates, and route geometry |
| Portal API | Node.js, Express | DTOs, authentication, user operations, and service orchestration |
| Content management | Payload CMS 3, Next.js | Monument, route, event, media, user, and report management |
| Database | PostgreSQL 16 | Content, users, sessions, favorites, notifications, and analytics |
| Routing engine | GraphHopper 11 | Driving routes calculated from local OpenStreetMap data |
| Weather | Open-Meteo | Current weather for Antakya |
| Publishing | GitHub Actions, GitHub Pages | Automated deployment of the static portfolio demo |

### Architecture

```text
React/Vite portal
      |
      | /api
      v
Express portal API
      |----------------> Payload REST API ----------> PostgreSQL
      |----------------> Auth/data repository ------> PostgreSQL
      |----------------> GraphHopper ---------------> Hatay OSM/PBF
      `----------------> Open-Meteo

Administrator / editor
      `----------------> Payload Admin Panel
```

Key boundaries:

- React never connects directly to PostgreSQL.
- Express converts Payload records into portal-specific DTOs.
- Payload owns content authoring and administration.
- PostgreSQL stores persistent content and user state.
- OpenLayers renders maps; GraphHopper calculates road routes.
- Curated cultural-route stops are CMS content, while GraphHopper calculates only the driving geometry between stops.

### Repository structure

```text
belediye-portal/
├── .github/workflows/          GitHub Pages deployment workflow
├── src/                        React public portal
│   ├── auth/                   Session state and protected routes
│   ├── components/             Shared, map, and layout components
│   ├── config/                 Runtime mode and public asset helpers
│   ├── hooks/                  Favorites and drag-scroll hooks
│   ├── pages/                  Portal pages
│   └── services/               API and authentication clients
├── backend/                    Auth, data, CMS, GIS, and routing services
├── backend-server.js           Express entry point
├── cms/                        Payload CMS / Next.js application
├── routing/                    GraphHopper Docker configuration
├── public/                     Images and static assets
└── DETAYLI_PROJE_RAPORU.md     Detailed Turkish handover document
```

### Running the complete system locally

#### Requirements

- Node.js 20.19+ or a current LTS release at least 22.12
- npm
- PostgreSQL 16 or Docker Desktop
- Docker Compose
- `routing/data/hatay.osm.pbf` for GraphHopper

#### Installation

```powershell
git clone https://github.com/emecyildiz/belediye-tarih-ve-k-lt-r.git
cd belediye-tarih-ve-k-lt-r
npm ci
npm --prefix cms ci
Copy-Item .env.example .env
Copy-Item cms/.env.example cms/.env
```

The example environment values are not production credentials. Never commit real secrets, passwords, user data, or database backups.

#### Startup order

Run each command from the repository root in a separate terminal:

```powershell
# 1. PostgreSQL
npm run cms:db:start

# First installation only
npm run cms:migrate

# 2. GraphHopper
npm run routing:start

# 3. Payload CMS
npm run cms:dev

# 4. Express API
npm run server

# 5. React portal
npm run dev
```

Local endpoints:

| Service | URL |
|---|---|
| React portal | `http://localhost:5173` |
| Express API | `http://localhost:5000` |
| Payload Admin | `http://localhost:3000/admin` |
| PostgreSQL | `127.0.0.1:5432` |
| GraphHopper | `127.0.0.1:8989` |

Stop the Node processes with `Ctrl+C`, then run:

```powershell
npm run routing:stop
npm run cms:db:stop
```

### Tests and builds

```powershell
npm run test:data
npm run test:routing
npm run lint
npm run build

npm --prefix cms run lint
npm --prefix cms run test:int
npm --prefix cms run build
```

### GitHub Pages deployment

The `.github/workflows/deploy-pages.yml` workflow runs for every push to `main`. It installs the frontend dependencies, builds the application in static showcase mode with the correct repository base path, uploads `dist/` as a Pages artifact, and deploys it to the `github-pages` environment.

In the repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**. After the first successful run, the demo is available at `https://emecyildiz.github.io/belediye-tarih-ve-k-lt-r/`.

### Security and data notes

- `.env`, `cms/.env`, real passwords, tokens, user records, and backups are excluded from Git.
- The public demo contains no live backend or administrator account.
- Sample records are not official municipal or GIS data.
- The planned municipal LDAP/Active Directory integration has not been implemented.
- A real LDAP rollout requires municipal network access, a test account, AD group-to-role mapping, and a trusted certificate chain.
- A production deployment requires HTTPS, secure cookies, network restrictions, backups, and centralized logging.

### Further documentation

- [Detailed project and handover report — Turkish](./DETAYLI_PROJE_RAPORU.md)
- [Payload CMS guide — Turkish](./cms/README.md)
- [GraphHopper guide — Turkish](./routing/README.md)
- [GIS provider contract — Turkish](./backend/services/cbs/README.md)
- [Image sources](./public/assets/monuments/SOURCES.txt)

[Back to top](#tkmbs) · [Türkçe](#turkce)
