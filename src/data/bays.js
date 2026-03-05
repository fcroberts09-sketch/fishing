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
    id: 'mat-harbor', name: 'Matagorda Harbor',
    lat: 28.6847, lng: -95.9654,
    desc: 'Main harbor \u2014 fuel, bait, ice available',
    depth: '4-6 ft', type: 'boat',
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

export const DEFAULT_SHADE_ZONES = [
  { id: 1, type: 'wade', label: 'Shell Island Wade Zone', lat: 28.718, lng: -95.852, radiusLat: 0.008, radiusLng: 0.015, color: C.amber, bay: 'matagorda' },
  { id: 2, type: 'wade', label: 'River Mouth Sand Bar', lat: 28.688, lng: -95.968, radiusLat: 0.005, radiusLng: 0.010, color: C.amber, bay: 'matagorda' },
  { id: 3, type: 'kayak', label: 'Oyster Lake Paddle Zone', lat: 28.696, lng: -95.933, radiusLat: 0.006, radiusLng: 0.012, color: C.green, bay: 'matagorda' },
  { id: 4, type: 'wade', label: 'Dollar Reef Flat', lat: 29.295, lng: -94.810, radiusLat: 0.007, radiusLng: 0.012, color: C.amber, bay: 'galveston' },
  { id: 5, type: 'boat', label: 'Ship Channel Drift', lat: 29.355, lng: -94.830, radiusLat: 0.008, radiusLng: 0.018, color: C.blue, bay: 'galveston' },
];

export const DEFAULT_LAUNCHES = [
  { id: 1, name: 'Matagorda Harbor', type: 'boat', lat: 28.6847, lng: -95.9654, notes: '50+ spots, fuel, bait, ice', bay: 'matagorda', isHarbor: true },
  { id: 2, name: 'Oyster Lake Park', type: 'kayak', lat: 28.6930, lng: -95.9570, notes: 'Free, kayak-only', bay: 'matagorda' },
  { id: 3, name: 'River Road Access', type: 'drivein', lat: 28.6890, lng: -95.9740, notes: '4WD recommended', bay: 'matagorda' },
  { id: 4, name: 'Galveston Yacht Basin', type: 'boat', lat: 29.2889, lng: -94.7912, notes: 'Full service marina', bay: 'galveston', isHarbor: true },
  { id: 5, name: 'Texas City Dike', type: 'boat', lat: 29.3834, lng: -94.9012, notes: 'Public ramp, $12', bay: 'galveston' },
  { id: 6, name: 'Eagle Point Marina', type: 'boat', lat: 29.4825, lng: -94.9190, notes: 'Protected launch, $15', bay: 'galveston' },
  { id: 7, name: 'Park Boat', type: 'boat', lat: 28.63887, lng: -95.903967, notes: 'Boat parking / launch point', bay: 'matagorda' },
];

export const DEFAULT_WADE_LINES = [
  { id: 1, bay: 'matagorda', label: 'Shell Island Wade', points: [{ lat: 28.708, lng: -95.863 }, { lat: 28.714, lng: -95.856 }, { lat: 28.720, lng: -95.849 }], color: C.amber, castRange: 40, direction: 'N', bottomType: 'shell', notes: 'Wade north along shell pad edge. Best on incoming.' },
  { id: 2, bay: 'matagorda', label: 'River Mouth Wade', points: [{ lat: 28.684, lng: -95.973 }, { lat: 28.687, lng: -95.969 }, { lat: 28.690, lng: -95.965 }], color: C.amber, castRange: 40, direction: 'N', bottomType: 'sand', notes: 'Follow the sand bar north. Watch current on outgoing.' },
  { id: 3, bay: 'galveston', label: 'Dike Rocks Wade', points: [{ lat: 29.380, lng: -94.906 }, { lat: 29.384, lng: -94.901 }, { lat: 29.387, lng: -94.897 }], color: C.amber, castRange: 40, direction: 'NE', bottomType: 'reef', notes: 'Rock line wade. Watch footing near jetty.' },
];

export const DEFAULT_DEPTH_MARKERS = [
  { id: 1, bay: 'matagorda', lat: 28.714, lng: -95.856, depth: 2, bottomType: 'shell', note: 'Shell pad edge' },
  { id: 2, bay: 'matagorda', lat: 28.719, lng: -95.850, depth: 1.5, bottomType: 'sand', note: 'Sand bar top' },
  { id: 3, bay: 'matagorda', lat: 28.706, lng: -95.866, depth: 4, bottomType: 'mud', note: 'Gut between bars' },
  { id: 4, bay: 'matagorda', lat: 28.686, lng: -95.970, depth: 3, bottomType: 'sand', note: 'River mouth channel edge' },
  { id: 5, bay: 'matagorda', lat: 28.689, lng: -95.966, depth: 1, bottomType: 'sand', note: 'Exposed at low tide' },
  { id: 6, bay: 'matagorda', lat: 28.697, lng: -95.933, depth: 5, bottomType: 'mud', note: 'Deep hole' },
  { id: 7, bay: 'galveston', lat: 29.293, lng: -94.813, depth: 3.5, bottomType: 'reef', note: 'Dike rocks dropoff' },
  { id: 8, bay: 'galveston', lat: 29.310, lng: -94.808, depth: 6, bottomType: 'mud', note: 'Channel depth' },
  { id: 9, bay: 'galveston', lat: 29.383, lng: -94.901, depth: 2, bottomType: 'sand', note: 'Dike flat' },
];

export const DEFAULT_SAND_BARS = [
  { id: 1, bay: 'matagorda', label: 'Shell Island Bar', points: [{ lat: 28.706, lng: -95.866 }, { lat: 28.712, lng: -95.858 }, { lat: 28.720, lng: -95.848 }, { lat: 28.722, lng: -95.852 }, { lat: 28.716, lng: -95.862 }, { lat: 28.709, lng: -95.869 }], depth: '1-2', note: 'Exposed at low tide. Prime wade area.' },
  { id: 2, bay: 'matagorda', label: 'River Mouth Sand Bar', points: [{ lat: 28.683, lng: -95.974 }, { lat: 28.686, lng: -95.970 }, { lat: 28.690, lng: -95.965 }, { lat: 28.692, lng: -95.968 }, { lat: 28.688, lng: -95.974 }, { lat: 28.684, lng: -95.977 }], depth: '0.5-2', note: 'Shifts with current. Check before wading.' },
  { id: 3, bay: 'galveston', label: 'Dollar Reef Flat', points: [{ lat: 29.292, lng: -94.816 }, { lat: 29.296, lng: -94.810 }, { lat: 29.300, lng: -94.806 }, { lat: 29.298, lng: -94.803 }, { lat: 29.294, lng: -94.808 }], depth: '2-3', note: 'Oyster reef edges. Wade boots required.' },
];

export const DEFAULT_SHELL_PADS = [
  { id: 1, bay: 'matagorda', lat: 28.718, lng: -95.852, shellType: 'heavy', radius: 5, label: 'Shell Island Main Pad', note: 'Dense shell. Reds stack here on incoming.' },
  { id: 2, bay: 'matagorda', lat: 28.708, lng: -95.864, shellType: 'scattered', radius: 8, label: 'South Scatter Shell', note: 'Scattered shell over sand. Good for trout.' },
  { id: 3, bay: 'matagorda', lat: 28.687, lng: -95.970, shellType: 'scattered', radius: 4, label: 'River Mouth Shell', note: 'Light scatter near sand bar edge.' },
  { id: 4, bay: 'galveston', lat: 29.295, lng: -94.810, shellType: 'reef', radius: 6, label: 'Dollar Reef Oysters', note: 'Live oyster reef. Watch your feet.' },
  { id: 5, bay: 'galveston', lat: 29.383, lng: -94.903, shellType: 'scattered', radius: 3, label: 'Dike Scatter', note: 'Light shell near jetty rocks.' },
];

export const DEFAULT_PHOTOS = [
  { id: 1, user: 'CaptMike', lat: 28.714, lng: -95.857, caption: 'Shell pad at low tide', time: '2 days ago', likes: 24, bay: 'matagorda' },
  { id: 2, user: 'WadeFisher22', lat: 28.687, lng: -95.970, caption: 'River mouth sandbar', time: '1 week ago', likes: 18, bay: 'matagorda' },
  { id: 3, user: 'KayakJen', lat: 28.696, lng: -95.933, caption: 'Tailing reds in back lake', time: '3 days ago', likes: 31, bay: 'matagorda' },
  { id: 4, user: 'BayRat42', lat: 29.383, lng: -94.901, caption: 'Sheepshead on fiddler crabs', time: '1 day ago', likes: 14, bay: 'galveston' },
];


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
