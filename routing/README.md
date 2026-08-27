# TKMBS yerel rota motoru

Bu servis belediyenin CBS yol ağına bağlı değildir. Hatay için hazırlanmış
OpenStreetMap PBF dosyasını bir kez içe aktarır ve araç, bisiklet ve yaya
güzergâhlarını ayrı GraphHopper profilleriyle hesaplar.

## Veri dosyası

`routing/data/hatay.osm.pbf` dosyasını oluşturun veya temin edin. Dosya Git'e
eklenmez; teslim paketinde ayrıca taşınır. Kaynak güncellendiğinde PBF dosyasını
değiştirip `graphhopper-cache` volume'ünü yeniden oluşturmak gerekir.

Veri OpenStreetMap katkıcılarının ODbL lisansına tabidir. İndirme tarihi,
kaynak adresi ve SHA-256 özeti teslim tutanağında kaydedilmelidir.

## Çalıştırma

Proje kökünden:

```powershell
npm run routing:build
npm run routing:start
```

İlk çalıştırmada OSM yol grafiği hazırlandığı için normalden uzun sürebilir.
Sonraki açılışlarda `graphhopper-cache` volume'ü kullanılır.

Hazır olma kontrolü:

```text
http://localhost:8989/health
```

Portal backend'i `.env` içindeki `ROUTING_PROVIDER=graphhopper` ve
`GRAPHHOPPER_BASE_URL=http://localhost:8989` ayarlarıyla bu servise bağlanır.
GraphHopper kapalıysa portal kuş uçuşu çizgi üretmez; kullanıcıya yol
güzergâhının alınamadığını bildirir.
