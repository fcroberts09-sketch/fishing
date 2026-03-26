import { C } from '../utils/theme';
import { computeWaterRoute } from './channelGraph';

export const BAY_CONFIGS = {
  matagorda: {
    center: [28.70, -95.90],
    zoom: 11,
    toLatLng: (pos) => [28.75 - (pos.y / 100) * 0.14, -95.99 + (pos.x / 100) * 0.20],
    fromLatLng: (lat, lng) => ({ x: ((lng + 95.99) / 0.20) * 100, y: ((28.75 - lat) / 0.14) * 100 }),
    waterBounds: { minLat: 28.670, maxLat: 28.735, minLng: -95.990, maxLng: -95.830 },
  },
  west_matagorda: {
    center: [28.68, -96.10],
    zoom: 11,
    toLatLng: (pos) => [28.78 - (pos.y / 100) * 0.20, -96.30 + (pos.x / 100) * 0.40],
    fromLatLng: (lat, lng) => ({ x: ((lng + 96.30) / 0.40) * 100, y: ((28.78 - lat) / 0.20) * 100 }),
    waterBounds: { minLat: 28.580, maxLat: 28.750, minLng: -96.300, maxLng: -95.950 },
  },
  san_antonio: {
    center: [28.30, -96.60],
    zoom: 11,
    toLatLng: (pos) => [28.45 - (pos.y / 100) * 0.30, -96.80 + (pos.x / 100) * 0.40],
    fromLatLng: (lat, lng) => ({ x: ((lng + 96.80) / 0.40) * 100, y: ((28.45 - lat) / 0.30) * 100 }),
    waterBounds: { minLat: 28.200, maxLat: 28.420, minLng: -96.800, maxLng: -96.400 },
  },
};

// Helper: get [lat, lng] from any item format (new GPS or legacy x/y)
export function itemToLatLng(item, bayConfig) {
  if (item.lat != null && item.lng != null) return [item.lat, item.lng];
  if (item.position?.lat != null) return [item.position.lat, item.position.lng];
  if (item.position?.x != null) return bayConfig.toLatLng(item.position);
  if (item.x != null && item.y != null) return bayConfig.toLatLng(item);
  return bayConfig.center;
}

// Helper: get [lat, lng] for zone center (shade zones)
export function zoneToLatLng(zone, bayConfig) {
  if (zone.lat != null && zone.lng != null) return [zone.lat, zone.lng];
  if (zone.cx != null && zone.cy != null) return bayConfig.toLatLng({ x: zone.cx, y: zone.cy });
  return bayConfig.center;
}

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
  west_matagorda: {
    id: 'west_matagorda', name: 'West Matagorda Bay', sub: 'West Bay, Tres Palacios, Turtle Bay',
    region: 'Matagorda, TX', cameras: [{ name: 'Harbor' }],
    reports: [
      { user: 'CaptMike', time: '4h ago', text: 'Reds on shell reef west side. Gold spoon.', likes: 10 },
      { user: 'WadeFisher22', time: '1d ago', text: 'Trout in the cuts on topwater at dawn.', likes: 7 },
    ],
  },
  san_antonio: {
    id: 'san_antonio', name: 'San Antonio Bay', sub: 'Guadalupe Delta, Hynes Bay, Espiritu Santo',
    region: 'Seadrift, TX', cameras: [{ name: 'Seadrift Cam' }],
    reports: [
      { user: 'DeltaDrifter', time: '2h ago', text: 'Slot reds on popping cork in the delta.', likes: 14 },
      { user: 'WadeKing', time: '6h ago', text: 'Trout on soft plastics near Pringle Lake.', likes: 11 },
    ],
  },
};

export const DEFAULT_SHADE_ZONES = [];

export const DEFAULT_LAUNCHES = [
  { id: 7, name: 'Park Boat', type: 'boat', lat: 28.63887, lng: -95.903967, notes: 'Anchor/park boat here before wading to fishing spots', bay: 'matagorda' },
  { id: 8, name: 'Matagorda Harbor', type: 'boat', lat: 28.694112, lng: -95.957777, notes: '189 CR 213, Matagorda TX 77457 — Main harbor with fuel, bait, ice, boat ramp', bay: 'matagorda' },
];

export const DEFAULT_WADE_LINES = [
  {
    id: 'wl-1', bay: 'matagorda', label: 'Sargent Shoreline',
    color: '#f59e0b', castRange: 40, bottomType: 'sand/shell', direction: 'S',
    points: [
      { lat: 28.840602, lng: -95.85271 }, { lat: 28.830123, lng: -95.835744 },
      { lat: 28.838373, lng: -95.829296 }, { lat: 28.830792, lng: -95.819795 },
      { lat: 28.827151, lng: -95.826412 }, { lat: 28.823658, lng: -95.820389 },
      { lat: 28.819124, lng: -95.824122 }, { lat: 28.812028, lng: -95.819758 },
    ],
  },
  {
    id: 'wl-2', bay: 'matagorda', label: 'Wade Line - Fishing Drains',
    color: '#f59e0b', castRange: 40, bottomType: 'shell', direction: 'S',
    points: [
      { lat: 28.634583, lng: -95.924858 }, { lat: 28.633989, lng: -95.924644 },
      { lat: 28.633396, lng: -95.924804 }, { lat: 28.633083, lng: -95.924858 },
    ],
  },
  {
    id: 'wl-3', bay: 'matagorda', label: 'Great wading high tide. Low tide at drains',
    color: '#f59e0b', castRange: 40, bottomType: 'shell/mud', direction: 'E',
    points: [
      { lat: 28.637339, lng: -95.921446 }, { lat: 28.639819, lng: -95.912042 },
    ],
  },
  {
    id: 'wl-4', bay: 'matagorda', label: 'Wade Line - Park Boat Area',
    color: '#f59e0b', castRange: 40, bottomType: 'sand', direction: 'N',
    points: [
      { lat: 28.637976, lng: -95.903896 }, { lat: 28.640204, lng: -95.90509 },
    ],
  },
  {
    id: 'wl-5', bay: 'matagorda', label: 'Drive in from beach to 4 Mile - 4x4 needed',
    color: '#ef4444', castRange: 40, bottomType: 'sand', direction: 'N',
    points: [
      { lat: 28.626599, lng: -95.904007 }, { lat: 28.63738, lng: -95.909495 },
    ],
  },
  {
    id: 'wl-6', bay: 'matagorda', label: 'Wade Line - East Flat',
    color: '#f59e0b', castRange: 40, bottomType: 'sand/shell', direction: 'N',
    points: [
      { lat: 28.650124, lng: -95.868585 }, { lat: 28.652536, lng: -95.871688 },
    ],
  },
  {
    id: 'wl-7', bay: 'matagorda', label: 'Muddy but good fishing from boat on high tide',
    color: '#3b82f6', castRange: 40, bottomType: 'mud', direction: 'S',
    points: [
      { lat: 28.632104, lng: -95.921085 }, { lat: 28.631764, lng: -95.919998 },
      { lat: 28.632578, lng: -95.918842 }, { lat: 28.634245, lng: -95.919268 },
    ],
  },
  {
    id: 'wl-8', bay: 'matagorda', label: 'Great drift on light W or N winds',
    color: '#3b82f6', castRange: 40, bottomType: 'shell', direction: 'N',
    points: [
      { lat: 28.660467, lng: -95.933015 }, { lat: 28.674439, lng: -95.926751 },
      { lat: 28.688872, lng: -95.928976 },
    ],
  },
  {
    id: 'wl-9', bay: 'matagorda', label: 'Drifting and fishing this shoreline is great',
    color: '#3b82f6', castRange: 40, bottomType: 'sand/shell', direction: 'N',
    points: [
      { lat: 28.74529, lng: -95.831772 }, { lat: 28.747143, lng: -95.831858 },
      { lat: 28.749821, lng: -95.833468 }, { lat: 28.751114, lng: -95.833892 },
    ],
  },
  {
    id: 'wl-10', bay: 'matagorda', label: 'Can be good wading depending on wind and pressure',
    color: '#f59e0b', castRange: 40, bottomType: 'shell/mud', direction: 'S',
    points: [
      { lat: 28.66242, lng: -95.851393 }, { lat: 28.661887, lng: -95.85138 },
      { lat: 28.661872, lng: -95.852298 }, { lat: 28.661246, lng: -95.853377 },
    ],
  },
  {
    id: 'wl-11', bay: 'matagorda', label: 'Good wade fishing area - East Bay',
    color: '#f59e0b', castRange: 40, bottomType: 'sand/shell', direction: 'E',
    points: [
      { lat: 28.689085, lng: -95.808145 }, { lat: 28.690287, lng: -95.803154 },
      { lat: 28.687463, lng: -95.807485 }, { lat: 28.688223, lng: -95.802275 },
    ],
  },
  {
    id: 'wl-15', bay: 'matagorda', label: 'Deep gut - fish from boat even on low tide, redfish',
    color: '#3b82f6', castRange: 40, bottomType: 'mud', direction: 'S',
    points: [
      { lat: 28.597197, lng: -96.014685 }, { lat: 28.594207, lng: -96.014237 },
      { lat: 28.591314, lng: -96.015949 },
    ],
  },
  {
    id: 'wl-16', bay: 'matagorda', label: 'Good for redfish and trout on high tide, easy wade',
    color: '#f59e0b', castRange: 40, bottomType: 'shell/mud', direction: 'S',
    points: [
      { lat: 28.593069, lng: -96.02335 }, { lat: 28.59006, lng: -96.020878 },
    ],
  },
  {
    id: 'wl-17', bay: 'matagorda', label: 'Good fishing on high tide',
    color: '#f59e0b', castRange: 40, bottomType: 'sand/shell', direction: 'S',
    points: [
      { lat: 28.582562, lng: -96.039683 }, { lat: 28.58019, lng: -96.038574 },
    ],
  },
  {
    id: 'wl-18', bay: 'matagorda', label: 'Flounder and redfish on higher tide',
    color: '#10b981', castRange: 40, bottomType: 'mud/shell', direction: 'W',
    points: [
      { lat: 28.569411, lng: -96.070631 }, { lat: 28.569703, lng: -96.070132 },
      { lat: 28.570524, lng: -96.069879 },
    ],
  },
  {
    id: 'wl-19', bay: 'matagorda', label: 'Wade or boat - fish both shorelines, redfish and trout',
    color: '#f59e0b', castRange: 40, bottomType: 'shell', direction: 'W',
    points: [
      { lat: 28.566806, lng: -96.077578 }, { lat: 28.565345, lng: -96.076465 },
      { lat: 28.566067, lng: -96.075459 }, { lat: 28.567495, lng: -96.07692 },
    ],
  },
];
export const DEFAULT_DEPTH_MARKERS = [];
export const DEFAULT_SAND_BARS = [];
export const DEFAULT_SHELL_PADS = [];
export const DEFAULT_PHOTOS = [];

// Water-only route generation using channel graph + Dijkstra
export function generateRoute(startLat, startLng, startName, targetLat, targetLng, spotName, preferredRouteId) {
  const waterRoute = computeWaterRoute(startLat, startLng, startName, targetLat, targetLng, spotName, preferredRouteId);
  if (waterRoute && waterRoute.length >= 2) return waterRoute;
  // Fallback: direct 2-point route if graph routing fails
  return [
    { lat: startLat, lng: startLng, title: startName, desc: 'Starting point', depth: '', warnings: [] },
    { lat: targetLat, lng: targetLng, title: spotName, desc: 'Destination', depth: '', warnings: [] },
  ];
}
