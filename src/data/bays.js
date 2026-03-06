import { C } from '../utils/theme';

export const BAY_CONFIGS = {
  matagorda: {
    center: [28.70, -95.90],
    zoom: 11,
    toLatLng: (pos) => [28.75 - (pos.y / 100) * 0.14, -95.99 + (pos.x / 100) * 0.20],
    fromLatLng: (lat, lng) => ({ x: ((lng + 95.99) / 0.20) * 100, y: ((28.75 - lat) / 0.14) * 100 }),
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

export const DEFAULT_SHADE_ZONES = [];

export const DEFAULT_LAUNCHES = [
  { id: 7, name: 'Park Boat', type: 'boat', lat: 28.63887, lng: -95.903967, notes: 'Anchor/park boat here before wading to fishing spots', bay: 'matagorda' },
  { id: 8, name: 'Matagorda Harbor', type: 'boat', lat: 28.694112, lng: -95.957777, notes: '189 CR 213, Matagorda TX 77457 — Main harbor with fuel, bait, ice, boat ramp', bay: 'matagorda' },
];

export const DEFAULT_WADE_LINES = [];
export const DEFAULT_DEPTH_MARKERS = [];
export const DEFAULT_SAND_BARS = [];
export const DEFAULT_SHELL_PADS = [];
export const DEFAULT_PHOTOS = [];

// Water-only route generation using channel graph + Dijkstra
import { computeWaterRoute } from './channelGraph';

export function generateRoute(startLat, startLng, startName, targetLat, targetLng, spotName) {
  const waterRoute = computeWaterRoute(startLat, startLng, startName, targetLat, targetLng, spotName);
  if (waterRoute && waterRoute.length >= 2) return waterRoute;
  // Fallback: direct 2-point route if graph routing fails
  return [
    { lat: startLat, lng: startLng, title: startName, desc: 'Starting point', depth: '', warnings: [] },
    { lat: targetLat, lng: targetLng, title: spotName, desc: 'Destination', depth: '', warnings: [] },
  ];
}
