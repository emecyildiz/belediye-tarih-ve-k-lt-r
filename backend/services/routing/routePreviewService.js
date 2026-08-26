import { buildRoutePreview } from '../cbs/mockCbsProvider.js';
import { requestOsrmRoute } from './osrmRoutingProvider.js';

function pointFeatures(stops, routeId) {
  return stops.map((item) => ({
    type: 'Feature',
    id: `route-stop-${item.monumentId}`,
    properties: {
      type: 'route-stop', routeId, monumentId: item.monumentId, stopNumber: item.order,
      name: item.name, slug: item.slug, category: item.category, district: item.district, image: item.image,
    },
    geometry: { type: 'Point', coordinates: [item.coordinates[1], item.coordinates[0]] },
  }));
}

export async function buildRoadRoutePreview(options, dependencies = {}) {
  const base = buildRoutePreview(options);
  const { stops, routeId, title, travelMode } = base;
  const visitMinutes = Number(options.visitMinutes) || 25;

  if (stops.length < 2) {
    return {
      ...base,
      distanceKm: 0,
      travelMinutes: 0,
      durationMinutes: stops.length * visitMinutes,
      geometry: null,
      geojson: { type: 'FeatureCollection', features: pointFeatures(stops, routeId) },
      cbs: {
        provider: 'osrm', dataSource: 'OpenStreetMap yol ağı', followsRoadNetwork: false,
        routingStatus: 'waiting-for-stops', coordinateSystem: 'EPSG:4326', replaceable: true,
      },
    };
  }

  try {
    const roadRoute = await (dependencies.routeProvider || requestOsrmRoute)({ stops, travelMode });
    const lineFeature = {
      type: 'Feature',
      properties: {
        type: 'route-line', routeId, title, travelMode, estimated: false,
        followsRoadNetwork: true,
      },
      geometry: roadRoute.geometry,
    };
    return {
      ...base,
      distanceKm: roadRoute.distanceKm,
      travelMinutes: roadRoute.travelMinutes,
      durationMinutes: roadRoute.travelMinutes + stops.length * visitMinutes,
      geometry: roadRoute.geometry,
      legs: roadRoute.legs,
      snappedWaypoints: roadRoute.snappedWaypoints,
      geojson: { type: 'FeatureCollection', features: [lineFeature, ...pointFeatures(stops, routeId)] },
      cbs: {
        provider: roadRoute.provider,
        dataSource: roadRoute.dataSource,
        routingProfile: roadRoute.routingProfile,
        requestedTravelMode: roadRoute.requestedTravelMode,
        durationMethod: roadRoute.durationMethod,
        routingStatus: 'ready',
        followsRoadNetwork: true,
        coordinateSystem: 'EPSG:4326',
        cached: roadRoute.cached,
        replaceable: true,
      },
    };
  } catch (error) {
    console.warn('Yol ağı güzergâhı oluşturulamadı:', error.message);
    return {
      ...base,
      distanceKm: null,
      travelMinutes: null,
      durationMinutes: stops.length * visitMinutes,
      geometry: null,
      geojson: { type: 'FeatureCollection', features: pointFeatures(stops, routeId) },
      cbs: {
        provider: 'osrm', dataSource: 'OpenStreetMap yol ağı', followsRoadNetwork: false,
        routingStatus: 'unavailable', coordinateSystem: 'EPSG:4326', replaceable: true,
      },
      routingMessage: 'Yol güzergâhı şu anda alınamadı. Duraklar kuş uçuşu çizgiyle birleştirilmedi.',
    };
  }
}
