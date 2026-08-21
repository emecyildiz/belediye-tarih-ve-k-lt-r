# CBS sağlayıcı sözleşmesi

Uygulama şu anda `mockCbsProvider` ile çalışır. Bu sağlayıcı durak koordinatlarını
birleştirir, yaklaşık mesafe/süre hesaplar ve OpenLayers için GeoJSON üretir.

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

Mock çizgi gerçek yol ağını takip etmez. Bu durum cevap içindeki
`cbs.followsRoadNetwork: false` alanıyla açıkça belirtilir.
