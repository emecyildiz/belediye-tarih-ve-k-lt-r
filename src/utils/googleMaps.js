const modeMap = {
  walking: 'walking',
  cycling: 'bicycling',
  driving: 'driving',
};

function coordinateOf(stop) {
  const values = stop?.coordinates;
  if (!Array.isArray(values) || values.length < 2) return null;
  const latitude = Number(values[0]);
  const longitude = Number(values[1]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? `${latitude},${longitude}` : null;
}

export function buildGoogleMapsDirectionsUrl(stops = [], travelMode = 'walking') {
  const coordinates = stops.map(coordinateOf).filter(Boolean);
  if (coordinates.length < 2) return '';
  const params = new URLSearchParams({
    api: '1',
    origin: coordinates[0],
    destination: coordinates.at(-1),
    travelmode: modeMap[travelMode] || modeMap.walking,
  });
  const waypoints = coordinates.slice(1, -1);
  if (waypoints.length) params.set('waypoints', waypoints.join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}
