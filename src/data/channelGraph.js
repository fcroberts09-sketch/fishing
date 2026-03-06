// Navigation routing engine for Matagorda Bay
// Uses real GPX boat routes as anchor paths — all navigation follows these channels
// then peels off at the nearest point to reach the destination.

import { haversineNM } from '../utils/geo';

// ─── ANCHOR ROUTES ───
// These are your actual GPS tracks from Matagorda Harbor.
// Every navigation route follows one of these, then peels off to the destination.

const HARBOR = { lat: 28.694112, lng: -95.957777, name: 'Matagorda Harbor' };

// Route to East Matagorda Bay (wl-12 from GPX)
const EAST_BAY_ROUTE = [
  { lat: 28.693098, lng: -95.956347 },
  { lat: 28.691257, lng: -95.954186 },
  { lat: 28.701561, lng: -95.93255 },
  { lat: 28.709718, lng: -95.912993 },
  { lat: 28.716362, lng: -95.88851 },
  { lat: 28.71711, lng: -95.886648 },
  { lat: 28.712395, lng: -95.886679 },
  { lat: 28.707911, lng: -95.884541 },
  { lat: 28.6861, lng: -95.879623 },
];

// Route to West Matagorda Bay via ICW (wl-13 from GPX)
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

// Route to far West Bay via Matagorda Island Cut (wl-14 from GPX)
// Use for destinations past ~-96.04 longitude (deep into west bay)
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

// ─── ROUTING LOGIC ───

// Find the closest point on a route to a destination, returns { index, dist }
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

// Pick the best anchor route for a destination
function pickRoute(destLat, destLng) {
  // East Bay: destination is east of harbor (lng > -95.94 roughly, or lat > 28.70 + east)
  // West Bay ICW: destination is southwest, closer to the ICW path
  // West Bay Cut: destination is far west/south, past -96.04 lng

  const eastResult = findClosestPointOnRoute(EAST_BAY_ROUTE, destLat, destLng);
  const icwResult = findClosestPointOnRoute(WEST_BAY_ICW_ROUTE, destLat, destLng);
  const cutResult = findClosestPointOnRoute(WEST_BAY_CUT_ROUTE, destLat, destLng);

  // Pick whichever route gets closest to the destination
  const candidates = [
    { route: EAST_BAY_ROUTE, name: 'East Bay', ...eastResult },
    { route: WEST_BAY_ICW_ROUTE, name: 'West Bay ICW', ...icwResult },
    { route: WEST_BAY_CUT_ROUTE, name: 'West Bay Cut', ...cutResult },
  ];

  candidates.sort((a, b) => a.dist - b.dist);
  return candidates[0];
}

// ─── PUBLIC API ───

// Compute a water route from harbor to destination
// Follows the real GPX anchor route, then peels off to the fishing spot
export function computeWaterRoute(startLat, startLng, startName, destLat, destLng, destName) {
  // If destination is very close to harbor (< 0.5 NM), just go direct
  const directDist = haversineNM(HARBOR.lat, HARBOR.lng, destLat, destLng);
  if (directDist < 0.5) {
    return [
      { lat: HARBOR.lat, lng: HARBOR.lng, title: startName || HARBOR.name, desc: 'Starting point', depth: '', warnings: [] },
      { lat: destLat, lng: destLng, title: destName || 'Destination', desc: 'Destination', depth: '', warnings: [] },
    ];
  }

  const best = pickRoute(destLat, destLng);

  // Build waypoints: Harbor -> follow anchor route up to peel-off point -> destination
  const waypoints = [];

  // Start at harbor
  waypoints.push({
    lat: HARBOR.lat, lng: HARBOR.lng,
    title: startName || HARBOR.name,
    desc: 'Starting point',
    depth: '', warnings: [],
  });

  // Follow the anchor route up to and including the peel-off index
  for (let i = 0; i <= best.index; i++) {
    const pt = best.route[i];
    // Skip if this point is very close to harbor (< 0.1 NM) to avoid duplication
    if (haversineNM(pt.lat, pt.lng, HARBOR.lat, HARBOR.lng) < 0.1) continue;
    waypoints.push({
      lat: pt.lat, lng: pt.lng,
      title: i === 0 ? 'Channel entrance' : `Channel pt ${i}`,
      desc: `${best.name} route`,
      depth: '', warnings: [],
    });
  }

  // Add destination if it's not already the last point
  const lastWp = waypoints[waypoints.length - 1];
  const distToLast = haversineNM(lastWp.lat, lastWp.lng, destLat, destLng);
  if (distToLast > 0.05) {
    waypoints.push({
      lat: destLat, lng: destLng,
      title: destName || 'Destination',
      desc: 'Destination',
      depth: '', warnings: [],
    });
  } else {
    // Destination is basically on the route — just rename the last point
    lastWp.title = destName || 'Destination';
    lastWp.desc = 'Destination';
  }

  return waypoints;
}

// Find nearest harbor (for compatibility with existing code)
export function findNearestHarbor(lat, lng) {
  return { id: 'matagorda_harbor', lat: HARBOR.lat, lng: HARBOR.lng, name: HARBOR.name };
}

export function findNearestNode(lat, lng) {
  return { id: 'dest', lat, lng, dist: 0 };
}

export function isOnLand() {
  return false;
}
