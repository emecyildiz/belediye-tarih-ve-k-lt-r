import { requestGraphHopperRoute } from './graphHopperRoutingProvider.js';
import { requestOsrmRoute } from './osrmRoutingProvider.js';

export function configuredRoutingProvider() {
  return String(process.env.ROUTING_PROVIDER || 'osrm').trim().toLowerCase();
}

export function routingProviderMetadata() {
  const provider = configuredRoutingProvider();
  return provider === 'osrm'
    ? { provider: 'osrm', dataSource: 'OpenStreetMap yol ağı' }
    : { provider: 'graphhopper', dataSource: 'Yerel OpenStreetMap yol ağı' };
}

export function requestConfiguredRoute(options) {
  const drivingOptions = { ...options, travelMode: 'driving' };
  return configuredRoutingProvider() === 'osrm'
    ? requestOsrmRoute(drivingOptions)
    : requestGraphHopperRoute(drivingOptions);
}
