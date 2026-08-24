const travelSpeeds = {
  walking: 4.5,
  cycling: 14,
  driving: 35,
};

function distanceInKm(first, second) {
  const toRadians = (value) => value * Math.PI / 180;
  const [lat1, lon1] = first;
  const [lat2, lon2] = second;
  const latDelta = toRadians(lat2 - lat1);
  const lonDelta = toRadians(lon2 - lon1);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function buildRoutePreview({ monuments, stopIds = [], travelMode = 'walking', visitMinutes = 25, routeId = 'preview', title = 'Rota Önizlemesi' }) {
  const index = new Map(monuments.map((item) => [Number(item.id), item]));
  const stops = stopIds
    .map((id) => index.get(Number(id)))
    .filter((item) => item && Array.isArray(item.coordinates))
    .map((item, position) => ({
      id: item.id,
      monumentId: item.id,
      order: position + 1,
      name: item.name,
      slug: item.slug,
      category: item.category,
      district: item.district,
      image: item.image,
      coordinates: item.coordinates,
      visitMinutes,
    }));

  const distanceKm = stops.slice(1).reduce((total, stop, indexValue) => (
    total + distanceInKm(stops[indexValue].coordinates, stop.coordinates)
  ), 0);
  const speed = travelSpeeds[travelMode] || travelSpeeds.walking;
  const travelMinutes = distanceKm > 0 ? Math.round((distanceKm / speed) * 60) : 0;
  const durationMinutes = travelMinutes + stops.length * visitMinutes;
  const lineCoordinates = stops.map((item) => [item.coordinates[1], item.coordinates[0]]);

  const features = [];
  if (lineCoordinates.length >= 2) {
    features.push({
      type: 'Feature',
      properties: { type: 'route-line', routeId, title, travelMode, estimated: true },
      geometry: { type: 'LineString', coordinates: lineCoordinates },
    });
  }
  features.push(...stops.map((item) => ({
    type: 'Feature',
    id: `route-stop-${item.monumentId}`,
    properties: {
      type: 'route-stop',
      routeId,
      monumentId: item.monumentId,
      stopNumber: item.order,
      name: item.name,
      slug: item.slug,
      category: item.category,
      district: item.district,
      image: item.image,
    },
    geometry: { type: 'Point', coordinates: [item.coordinates[1], item.coordinates[0]] },
  })));

  return {
    routeId,
    title,
    travelMode,
    distanceKm: Number(distanceKm.toFixed(2)),
    travelMinutes,
    durationMinutes,
    stops,
    geometry: lineCoordinates.length >= 2 ? { type: 'LineString', coordinates: lineCoordinates } : null,
    geojson: { type: 'FeatureCollection', features },
    cbs: {
      provider: 'mock-cbs',
      coordinateSystem: 'EPSG:4326',
      distanceMethod: 'great-circle-estimate',
      followsRoadNetwork: false,
      replaceable: true,
    },
  };
}
