# CBS sağlayıcı sözleşmesi

Uygulamanın gerçek API akışı belediye CBS yol ağına bağlı değildir. Varsayılan
sağlayıcı, Hatay OpenStreetMap verisiyle yerelde çalışan GraphHopper servisidir.
`mockCbsProvider` yalnızca izole testler ve yol servisi sözleşmesini hazırlamak
için korunur.

Rota sağlayıcısı değiştirildiğinde aynı cevap şekli korunmalıdır:

- `distanceKm`
- `travelMinutes`
- `durationMinutes`
- `stops[]`
- `geometry` (`GeoJSON LineString`)
- `geojson` (`GeoJSON FeatureCollection`)
- `cbs.provider` ve `cbs.coordinateSystem`

React ve OpenLayers bileşenleri rota motorundan bağımsızdır; yalnızca
`/api/routes/preview` servisinin kullandığı sağlayıcı değiştirilir.

Gerçek rota önizlemeleri `backend/services/routing` katmanında GraphHopper
üzerinden OpenStreetMap yol geometrisiyle oluşturulur ve
`cbs.followsRoadNetwork: true`
olarak işaretlenir. Servis erişilemezse yanıltıcı bir kuş uçuşu çizgi üretilmez;
yalnızca duraklar gösterilir ve `cbs.routingStatus: unavailable` döner.

GraphHopper `car`, `bike` ve `foot` profillerini ayrı çalıştırır. Bu nedenle
yaya yolları, bisiklet yolları ve araç erişim kısıtları OSM etiketlerine göre
farklı güzergâhlar üretebilir. Eski OSRM sağlayıcısı yalnızca kontrollü geçiş
ve geriye uyumluluk için `ROUTING_PROVIDER=osrm` seçeneğiyle korunur. Hatay PBF
dosyası kurulana kadar ortam değişkeni yoksa geliştirme sistemi OSRM ile açılır;
teslim yapılandırmasında `ROUTING_PROVIDER=graphhopper` açıkça kullanılır.
