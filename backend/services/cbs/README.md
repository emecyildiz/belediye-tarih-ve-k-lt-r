# CBS sağlayıcı sözleşmesi

Uygulamanın gerçek API akışı OSRM sağlayıcısıyla çalışır. `mockCbsProvider`
yalnızca izole testler ve yol servisi sözleşmesini hazırlamak için korunur.

Gerçek belediye CBS entegrasyonunda aynı cevap şekli korunmalıdır:

- `distanceKm`
- `travelMinutes`
- `durationMinutes`
- `stops[]`
- `geometry` (`GeoJSON LineString`)
- `geojson` (`GeoJSON FeatureCollection`)
- `cbs.provider` ve `cbs.coordinateSystem`

Belediye altyapısına göre yeni sağlayıcı WFS, WMS, REST, PostGIS veya pgRouting
üzerinden uygulanabilir. React ve OpenLayers bileşenleri değiştirilmemelidir;
yalnızca `/api/routes/preview` servisinin kullandığı sağlayıcı değiştirilir.

Gerçek rota önizlemeleri `backend/services/routing` katmanında OSRM üzerinden
OpenStreetMap yol geometrisiyle oluşturulur ve `cbs.followsRoadNetwork: true`
olarak işaretlenir. Servis erişilemezse yanıltıcı bir kuş uçuşu çizgi üretilmez;
yalnızca duraklar gösterilir ve `cbs.routingStatus: unavailable` döner.

Yerel geliştirmede herkese açık OSRM örnek sunucusu kullanılabilir. Bu sunucu
araç profiliyle hazırlandığı için yaya ve bisiklet süreleri yol mesafesinden
tahmin edilir. Belediye tesliminde `OSRM_BASE_URL` ile kurumun kendi OSRM
sunucusu, profil değişkenleriyle de gerçek yaya/bisiklet profilleri seçilebilir.
