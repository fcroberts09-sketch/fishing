import { C } from '../utils/theme';

export const BAY_CONFIGS = {
  matagorda: {
    center: [28.70, -95.90],
    zoom: 11,
    // Keep for backward compat with user-created localStorage data (x/y format)
    toLatLng: (pos) => [28.75 - (pos.y / 100) * 0.14, -95.99 + (pos.x / 100) * 0.20],
    fromLatLng: (lat, lng) => ({ x: ((lng + 95.99) / 0.20) * 100, y: ((28.75 - lat) / 0.14) * 100 }),
    // Water bounds for wind/wave placement (lat/lng box over water only)
    waterBounds: { minLat: 28.670, maxLat: 28.735, minLng: -95.990, maxLng: -95.830 },
  },
  galveston: {
    center: [29.30, -94.85],
    zoom: 11,
    toLatLng: (pos) => [29.55 - (pos.y / 100) * 0.50, -95.15 + (pos.x / 100) * 0.70],
    fromLatLng: (lat, lng) => ({ x: ((lng + 95.15) / 0.70) * 100, y: ((29.55 - lat) / 0.50) * 100 }),
    waterBounds: { minLat: 29.100, maxLat: 29.520, minLng: -95.130, maxLng: -94.600 },
  },
};

// Helper: get [lat, lng] from any item format (new GPS or legacy x/y)
export function itemToLatLng(item, bayConfig) {
  // Direct lat/lng on item
  if (item.lat != null && item.lng != null) return [item.lat, item.lng];
  // Nested position with lat/lng
  if (item.position?.lat != null) return [item.position.lat, item.position.lng];
  // Legacy x/y position
  if (item.position?.x != null) return bayConfig.toLatLng(item.position);
  // Legacy x/y directly on item
  if (item.x != null && item.y != null) return bayConfig.toLatLng(item);
  return bayConfig.center;
}

// Helper: get [lat, lng] for zone center (shade zones)
export function zoneToLatLng(zone, bayConfig) {
  if (zone.lat != null && zone.lng != null) return [zone.lat, zone.lng];
  if (zone.cx != null && zone.cy != null) return bayConfig.toLatLng({ x: zone.cx, y: zone.cy });
  return bayConfig.center;
}

export const BAY_HARBORS = {
  matagorda: {
    id: 'mat-harbor', name: 'Park Boat',
    lat: 28.63887, lng: -95.903967,
    desc: 'Boat parking / launch point',
    depth: '3-5 ft', type: 'boat',
  },
  galveston: {
    id: 'gal-harbor', name: 'Galveston Yacht Basin',
    lat: 29.2889, lng: -94.7912,
    desc: 'Full-service marina \u2014 Harborside Dr',
    depth: '6-8 ft', type: 'boat',
  },
};

export const CHANNEL_WAYPOINTS = {
  matagorda: [
    { lat: 28.6847, lng: -95.9654, name: 'Matagorda Harbor', depth: '4-6 ft', warnings: ['No wake zone'] },
    { lat: 28.690, lng: -95.960, name: 'Harbor Channel', depth: '5-7 ft', warnings: [] },
    { lat: 28.695, lng: -95.950, name: 'Channel Marker G7', depth: '6-8 ft', warnings: [] },
    { lat: 28.700, lng: -95.935, name: 'ICW Junction', depth: '12-15 ft', warnings: ['Barge traffic \u2014 stay right'] },
    { lat: 28.705, lng: -95.910, name: 'ICW East', depth: '10-12 ft', warnings: [] },
    { lat: 28.710, lng: -95.885, name: 'East Bay Entry', depth: '5-8 ft', warnings: ['Oyster reefs \u2014 GPS only'] },
    { lat: 28.718, lng: -95.855, name: 'Far East Flats', depth: '3-5 ft', warnings: ['Very shallow at low tide'] },
  ],
  galveston: [
    { lat: 29.2889, lng: -94.7912, name: 'Yacht Basin', depth: '6-8 ft', warnings: ['No wake zone'] },
    { lat: 29.293, lng: -94.800, name: 'Harborside Channel', depth: '6-8 ft', warnings: [] },
    { lat: 29.350, lng: -94.850, name: 'Texas City Channel', depth: '10-14 ft', warnings: ['Ship traffic'] },
    { lat: 29.295, lng: -94.810, name: 'Dollar Reef Area', depth: '4-6 ft', warnings: [] },
    { lat: 29.330, lng: -94.830, name: 'Mid-Bay', depth: '6-8 ft', warnings: [] },
    { lat: 29.400, lng: -94.750, name: 'Trinity Bay Approach', depth: '5-7 ft', warnings: ['Shallow east side'] },
    { lat: 29.220, lng: -94.920, name: 'West Bay Entry', depth: '4-6 ft', warnings: ['Markers shift \u2014 use GPS'] },
  ],
};

export const BAY_DATA = {
  matagorda: {
    id: 'matagorda', name: 'Matagorda Bay Complex', sub: 'East & West Matagorda Bay',
    region: 'Matagorda, TX', cameras: [{ name: 'Harbor' }, { name: 'River Mouth' }],
    reports: [
      { user: 'CaptMike', time: '2h ago', text: 'Solid box of trout on topwater at Shell Island.', likes: 12 },
      { user: 'WadeFisher22', time: '5h ago', text: 'Reds stacked on river mouth. Gold spoon.', likes: 8 },
      { user: 'KayakJen', time: 'Yesterday', text: '4 reds on Gulp in Oyster Lake back.', likes: 15 },
    ],
  },
  galveston: {
    id: 'galveston', name: 'Galveston Bay Complex', sub: 'West Bay, Trinity, East Bay',
    region: 'Galveston, TX', cameras: [{ name: 'Pier Cam' }, { name: 'Dike Cam' }],
    reports: [
      { user: 'BayRat', time: '3h ago', text: 'Sheepshead at dike rocks. Fiddler crabs.', likes: 9 },
      { user: 'TrophyHunter', time: '6h ago', text: 'Big trout on topwater near Dollar Reef sunrise.', likes: 22 },
      { user: 'WadeKing', time: '1d ago', text: 'Slot reds in West Bay grass. Gulp shrimp.', likes: 16 },
    ],
  },
};

// All default data uses real GPS coordinates verified against satellite imagery
// Matagorda anchors: Harbor 28.6847/-95.9654, Chinquapin 28.724/-95.851, Nature Park 28.693/-95.957
// Galveston anchors: Yacht Basin 29.2889/-94.7912, TX City Dike 29.3834/-94.9012

export const DEFAULT_SHADE_ZONES = [];

export const DEFAULT_LAUNCHES = [
  { id: 7, name: 'Park Boat', type: 'boat', lat: 28.63887, lng: -95.903967, notes: 'Boat parking / launch point', bay: 'matagorda' },
];

export const DEFAULT_WADE_LINES = [];

export const DEFAULT_DEPTH_MARKERS = [];

export const DEFAULT_SAND_BARS = [];

export const DEFAULT_SHELL_PADS = [];

export const DEFAULT_PHOTOS = [];


// Route generation using GPS coordinates
export function generateRoute(bayId, targetLat, targetLng, spotName) {
  const harbor = BAY_HARBORS[bayId];
  const channels = CHANNEL_WAYPOINTS[bayId] || [];
  if (!harbor) return [];

  const dist2d = (a, b) => Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2);
  const target = { lat: targetLat, lng: targetLng };

  let bestIdx = 0;
  let bestDist = Infinity;
  channels.forEach((wp, i) => {
    const d = dist2d(wp, target);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  });

  const route = [];
  route.push({
    lat: harbor.lat, lng: harbor.lng,
    title: harbor.name,
    desc: 'Depart harbor, follow channel markers',
    depth: harbor.depth,
    warnings: ['No wake in harbor/marina'],
  });

  for (let i = 1; i <= bestIdx; i++) {
    const wp = channels[i];
    if (dist2d(wp, harbor) < 0.003) continue;
    if (dist2d(wp, target) < 0.003) continue;
    route.push({
      lat: wp.lat, lng: wp.lng,
      title: wp.name,
      desc: `Continue toward ${spotName}`,
      depth: wp.depth,
      warnings: wp.warnings || [],
    });
  }

  route.push({
    lat: targetLat, lng: targetLng,
    title: spotName,
    desc: 'Arrive at fishing spot',
    depth: '3-6 ft',
    warnings: ['Watch depth sounder'],
  });

  return route;
}
