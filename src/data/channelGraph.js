// Navigation routing engine for Matagorda Bay
// Uses real GPX boat routes as anchor paths — all navigation follows these channels
// then peels off at the nearest point to reach the destination.
//
// VERIFIED WATER: All route waypoints are from GPS tracks (boat routes) or from
// confirmed fishing spots / wade lines. The area between the harbor channel and
// the fishing spots (wl-8 drift line) is navigable shallow water / grass flats.

import { haversineNM } from '../utils/geo';

// ─── ANCHOR ROUTES ───
// These are actual GPS tracks from Matagorda Harbor.
// Every navigation route follows one of these, then peels off to the destination.

const HARBOR = { lat: 28.694112, lng: -95.957777, name: 'Matagorda Harbor' };

// Route to East Matagorda Bay
// All East Bay destinations must route through the entrance (index 5)
const EAST_BAY_ROUTE = [
  { lat: 28.693098, lng: -95.956347 },   // 0: channel exit
  { lat: 28.691257, lng: -95.954186 },   // 1
  { lat: 28.701561, lng: -95.93255 },    // 2: heading NE
  { lat: 28.709718, lng: -95.912993 },   // 3
  { lat: 28.716362, lng: -95.88851 },    // 4: approaching entrance
  { lat: 28.715285, lng: -95.886751 },   // 5: EAST BAY ENTRANCE
  { lat: 28.712395, lng: -95.886679 },   // 6: inside East Bay
  { lat: 28.707911, lng: -95.884541 },   // 7
  { lat: 28.6861, lng: -95.879623 },     // 8: deep East Bay
];
const EAST_BAY_ENTRANCE_IDX = 5;

// Route south from harbor into the main bay (south of channel)
// Uses GPS-verified waypoints: harbor channel points + wl-8 drift line + fishing spots
// wl-8 is a verified boat drift line proving this water is navigable
const SOUTH_BAY_ROUTE = [
  { lat: 28.693098, lng: -95.956347 },   // 0: channel exit (shared with East Bay)
  { lat: 28.691257, lng: -95.954186 },   // 1: heading east (shared)
  { lat: 28.701561, lng: -95.93255 },    // 2: harbor channel (shared)
  { lat: 28.688872, lng: -95.928976 },   // 3: wl-8 drift line (GPS verified water)
  { lat: 28.674439, lng: -95.926751 },   // 4: wl-8 drift line (GPS verified water)
  { lat: 28.660467, lng: -95.933015 },   // 5: wl-8 drift line (GPS verified water)
  { lat: 28.646207, lng: -95.922664 },   // 6: Deep Scatter Shell fishing spot
  { lat: 28.639819, lng: -95.912042 },   // 7: wl-3 wade line (GPS verified water)
  { lat: 28.634135, lng: -95.925605 },   // 8: Fishing Drains fishing spot
];

// Route to West Matagorda Bay via ICW
const WEST_BAY_ICW_ROUTE = [
  { lat: 28.694128, lng: -95.956334 },
  { lat: 28.691599, lng: -95.954872 },
  { lat: 28.686554, lng: -95.966149 },
  { lat: 28.68334, lng: -95.969352 },
  { lat: 28.680178, lng: -95.973377 },
  { lat: 28.676823, lng: -95.972816 },
  { lat: 28.676261, lng: -95.974758 },
  { lat: 28.67533, lng: -95.977101 },
  { lat: 28.672916, lng: -95.977379 },
  { lat: 28.667909, lng: -95.977652 },
  { lat: 28.660931, lng: -95.980598 },
  { lat: 28.658219, lng: -95.982126 },
  { lat: 28.65382, lng: -95.985891 },
  { lat: 28.649648, lng: -95.989274 },
  { lat: 28.641627, lng: -95.995222 },
  { lat: 28.639132, lng: -95.994395 },
  { lat: 28.637558, lng: -95.994878 },
  { lat: 28.634575, lng: -95.995324 },
  { lat: 28.631572, lng: -95.994906 },
  { lat: 28.629094, lng: -95.993848 },
  { lat: 28.62673, lng: -95.992191 },
  { lat: 28.623968, lng: -95.993681 },
  { lat: 28.62269, lng: -95.995479 },
  { lat: 28.62008, lng: -95.998247 },
  { lat: 28.61531, lng: -96.003549 },
  { lat: 28.604154, lng: -96.014175 },
];

// Route to far West Bay via Mad Island Cut
const WEST_BAY_CUT_ROUTE = [
  { lat: 28.693676, lng: -95.956971 },
  { lat: 28.691358, lng: -95.955023 },
  { lat: 28.684849, lng: -95.967574 },
  { lat: 28.681699, lng: -95.972254 },
  { lat: 28.6782, lng: -95.974051 },
  { lat: 28.676781, lng: -95.972649 },
  { lat: 28.67563, lng: -95.976117 },
  { lat: 28.677348, lng: -95.977141 },
  { lat: 28.68058, lng: -95.976207 },
  { lat: 28.681526, lng: -95.977285 },
  { lat: 28.677222, lng: -95.985929 },
  { lat: 28.665156, lng: -96.01326 },
  { lat: 28.661706, lng: -96.020873 },
  { lat: 28.65957, lng: -96.038953 },
  { lat: 28.657907, lng: -96.046151 },
  { lat: 28.648993, lng: -96.061713 },
  { lat: 28.640526, lng: -96.07023 },
  { lat: 28.636478, lng: -96.074898 },
  { lat: 28.633324, lng: -96.087489 },
  { lat: 28.629182, lng: -96.094689 },
  { lat: 28.626376, lng: -96.099866 },
  { lat: 28.623495, lng: -96.098682 },
  { lat: 28.615842, lng: -96.092414 },
  { lat: 28.606724, lng: -96.086251 },
];

// ─── BAY BOUNDARIES ───

const EAST_BAY_BOUNDS = {
  west: -95.890,
  east: -95.780,
  north: 28.760,
  south: 28.580,
};

const WEST_BAY_BOUNDS = {
  west: -96.400,
  east: -95.965,
  north: 28.700,
  south: 28.420,
};

// South Bay zone: the main bay area south of the harbor channel,
// between the ICW (west) and the East Bay entrance (east).
// Spots here must route via the South Bay route (through the channel
// then south through the drift area), NOT via ICW peel-off which
// would cross the marsh.
const SOUTH_BAY_BOUNDS = {
  west: -95.965,
  east: -95.865,
  north: 28.690,
  south: 28.580,
};

function isInEastBay(lat, lng) {
  return lng > EAST_BAY_BOUNDS.west && lng < EAST_BAY_BOUNDS.east &&
         lat > EAST_BAY_BOUNDS.south && lat < EAST_BAY_BOUNDS.north;
}

function isInSouthBay(lat, lng) {
  return lng > SOUTH_BAY_BOUNDS.west && lng < SOUTH_BAY_BOUNDS.east &&
         lat > SOUTH_BAY_BOUNDS.south && lat < SOUTH_BAY_BOUNDS.north &&
         !isInEastBay(lat, lng);
}

// ─── ROUTING LOGIC ───

function findClosestPointOnRoute(route, destLat, destLng) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = haversineNM(route[i].lat, route[i].lng, destLat, destLng);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return { index: bestIdx, dist: bestDist };
}

// Pick the best anchor route and peel-off point for a destination.
// Zone-based enforcement ensures correct routing:
// - East Bay → must go through entrance
// - South Bay → must use South Bay route (channel east then south via drift line)
// - West Bay → ICW or Mad Island Cut (user choice)
// - Other → closest route wins
function pickRoute(destLat, destLng, preferredWestRoute) {
  // East Bay destinations MUST use the East Bay route through the entrance
  if (isInEastBay(destLat, destLng)) {
    const { index } = findClosestPointOnRoute(EAST_BAY_ROUTE, destLat, destLng);
    const enforced = Math.max(index, EAST_BAY_ENTRANCE_IDX);
    const pt = EAST_BAY_ROUTE[enforced];
    const dist = haversineNM(pt.lat, pt.lng, destLat, destLng);
    return { route: EAST_BAY_ROUTE, name: 'East Bay', index: enforced, dist };
  }

  // South Bay destinations MUST use the South Bay route
  // (harbor channel east → south via wl-8 drift line → fishing area)
  if (isInSouthBay(destLat, destLng)) {
    const { index, dist } = findClosestPointOnRoute(SOUTH_BAY_ROUTE, destLat, destLng);
    return { route: SOUTH_BAY_ROUTE, name: 'South Bay', index, dist };
  }

  // West Bay: honor user's route preference
  if (preferredWestRoute && isWestBayDestination(destLat, destLng)) {
    const chosen = preferredWestRoute === 'cut' ? WEST_BAY_CUT_ROUTE : WEST_BAY_ICW_ROUTE;
    const chosenName = preferredWestRoute === 'cut' ? 'Mad Island Cut' : 'ICW Channel';
    const { index, dist } = findClosestPointOnRoute(chosen, destLat, destLng);
    return { route: chosen, name: chosenName, index, dist };
  }

  // General: try all routes, pick closest peel-off
  const routes = [
    { route: EAST_BAY_ROUTE, name: 'East Bay' },
    { route: SOUTH_BAY_ROUTE, name: 'South Bay' },
    { route: WEST_BAY_ICW_ROUTE, name: 'ICW Channel' },
    { route: WEST_BAY_CUT_ROUTE, name: 'Mad Island Cut' },
  ];

  let best = null;
  for (const r of routes) {
    const { index, dist } = findClosestPointOnRoute(r.route, destLat, destLng);
    if (!best || dist < best.dist) {
      best = { route: r.route, name: r.name, index, dist };
    }
  }
  return best;
}

// ─── PUBLIC API ───

export function isWestBayDestination(destLat, destLng) {
  return destLng < WEST_BAY_BOUNDS.east && destLng > WEST_BAY_BOUNDS.west &&
         destLat < WEST_BAY_BOUNDS.north && destLat > WEST_BAY_BOUNDS.south &&
         !isInEastBay(destLat, destLng);
}

// Compute a water route from harbor to destination.
export function computeWaterRoute(startLat, startLng, startName, destLat, destLng, destName, preferredWestRoute) {
  // If destination is very close to harbor, go direct
  const directDist = haversineNM(HARBOR.lat, HARBOR.lng, destLat, destLng);
  if (directDist < 0.5) {
    return [
      { lat: HARBOR.lat, lng: HARBOR.lng, title: startName || HARBOR.name, desc: 'Starting point', depth: '', warnings: [] },
      { lat: destLat, lng: destLng, title: destName || 'Destination', desc: 'Destination', depth: '', warnings: [] },
    ];
  }

  const best = pickRoute(destLat, destLng, preferredWestRoute);

  // Build waypoints: Harbor -> follow anchor route to peel-off -> destination
  const waypoints = [];

  waypoints.push({
    lat: HARBOR.lat, lng: HARBOR.lng,
    title: startName || HARBOR.name,
    desc: 'Starting point', depth: '', warnings: [],
  });

  for (let i = 0; i <= best.index; i++) {
    const pt = best.route[i];
    if (haversineNM(pt.lat, pt.lng, HARBOR.lat, HARBOR.lng) < 0.1) continue;
    waypoints.push({
      lat: pt.lat, lng: pt.lng,
      title: i === 0 ? 'Channel entrance' : `Channel pt ${i}`,
      desc: `${best.name} route`, depth: '', warnings: [],
    });
  }

  // Add destination if not already at the last waypoint
  const lastWp = waypoints[waypoints.length - 1];
  const distToLast = haversineNM(lastWp.lat, lastWp.lng, destLat, destLng);

  if (distToLast > 0.05) {
    waypoints.push({
      lat: destLat, lng: destLng,
      title: destName || 'Destination', desc: 'Destination',
      depth: '', warnings: [],
    });
  } else {
    lastWp.title = destName || 'Destination';
    lastWp.desc = 'Destination';
  }

  return waypoints;
}

export function findNearestHarbor(lat, lng) {
  return { id: 'matagorda_harbor', lat: HARBOR.lat, lng: HARBOR.lng, name: HARBOR.name };
}

export function findNearestNode(lat, lng) {
  return { id: 'dest', lat, lng, dist: 0 };
}

export function isOnLand() {
  return false;
}
