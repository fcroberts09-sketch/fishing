// Navigation routing engine for Matagorda Bay
// Uses real GPX boat routes as anchor paths — all navigation follows these channels
// then peels off at the nearest point to reach the destination.
// Includes land avoidance: routes never cross major marsh/land areas.

import { haversineNM } from '../utils/geo';

// ─── ANCHOR ROUTES ───
// These are your actual GPS tracks from Matagorda Harbor.
// Every navigation route follows one of these, then peels off to the destination.

const HARBOR = { lat: 28.694112, lng: -95.957777, name: 'Matagorda Harbor' };

// Route to East Matagorda Bay (wl-12 from GPX)
// All East Bay destinations must route through the entrance (index 5)
const EAST_BAY_ROUTE = [
  { lat: 28.693098, lng: -95.956347 },   // 0: channel exit
  { lat: 28.691257, lng: -95.954186 },   // 1
  { lat: 28.701561, lng: -95.93255 },    // 2: heading NE
  { lat: 28.709718, lng: -95.912993 },   // 3
  { lat: 28.716362, lng: -95.88851 },    // 4: approaching entrance
  { lat: 28.715285, lng: -95.886751 },   // 5: EAST BAY ENTRANCE (GPS marker)
  { lat: 28.712395, lng: -95.886679 },   // 6: inside East Bay
  { lat: 28.707911, lng: -95.884541 },   // 7
  { lat: 28.6861, lng: -95.879623 },     // 8: deep East Bay
];
const EAST_BAY_ENTRANCE_IDX = 5;

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

// Route south from harbor into open East Matagorda Bay
// Follows East Bay channel briefly then turns south through verified open water.
// Water coordinates verified from GPX drift line wl-8 and known fishing spots.
const SOUTH_BAY_ROUTE = [
  { lat: 28.693098, lng: -95.956347 },  // channel exit
  { lat: 28.691257, lng: -95.954186 },  // heading east through channel
  { lat: 28.701561, lng: -95.932550 },  // East Bay channel (verified open water)
  { lat: 28.688872, lng: -95.928976 },  // turning south (wl-8 drift line)
  { lat: 28.674439, lng: -95.926751 },  // open water south (wl-8 drift line)
  { lat: 28.660467, lng: -95.933015 },  // open water (wl-8 drift line)
  { lat: 28.646207, lng: -95.922664 },  // Deep Scatter Shell area
  { lat: 28.634135, lng: -95.925605 },  // Fishing Drains area
];

// ─── BAY BOUNDARIES ───
// Used to determine which bay a destination is in for route enforcement.

// East Matagorda Bay — separated from main bay, accessed through narrow entrance
const EAST_BAY_BOUNDS = {
  west: -95.890,   // entrance longitude
  east: -95.780,
  north: 28.760,
  south: 28.580,
};

// West Matagorda Bay — accessed via ICW or Matagorda Island Cut
const WEST_BAY_BOUNDS = {
  west: -96.400,
  east: -95.935,
  north: 28.700,
  south: 28.420,
};

function isInEastBay(lat, lng) {
  return lng > EAST_BAY_BOUNDS.west && lng < EAST_BAY_BOUNDS.east &&
         lat > EAST_BAY_BOUNDS.south && lat < EAST_BAY_BOUNDS.north;
}

// ─── LAND AVOIDANCE ───
// Simplified land polygons for major marsh/land areas in Matagorda Bay.
// Routes that cross these polygons are rerouted through safe water waypoints.
// Add more polygons as needed for other areas.

const LAND_POLYGONS = [
  // Main marsh peninsula between ICW channel and open East Matagorda Bay.
  // The ICW runs SW from the harbor along the west side of this marsh.
  // Open bay water is to the east/south. The Colorado River cuts through.
  // Bounded conservatively: all known water points (routes, spots, wade lines)
  // have been verified to be outside this polygon.
  [
    { lat: 28.680, lng: -95.965 },
    { lat: 28.680, lng: -95.938 },
    { lat: 28.625, lng: -95.938 },
    { lat: 28.625, lng: -95.965 },
  ],
];

// ─── GEOMETRY UTILITIES ───

// Ray-casting point-in-polygon test
function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].lat, xi = polygon[i].lng;
    const yj = polygon[j].lat, xj = polygon[j].lng;
    if (((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Cross product for segment orientation
function cross(o, a, b) {
  return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
}

// Check if two line segments intersect (proper intersection only)
function segmentsIntersect(a1, a2, b1, b2) {
  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

// Check if a line segment from p1 to p2 crosses any land polygon
function segmentCrossesLand(p1, p2) {
  for (const polygon of LAND_POLYGONS) {
    if (pointInPolygon(p1.lat, p1.lng, polygon)) return true;
    if (pointInPolygon(p2.lat, p2.lng, polygon)) return true;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (segmentsIntersect(p1, p2, polygon[i], polygon[j])) return true;
    }
  }
  return false;
}

// Collected safe water waypoints from all anchor routes (for intermediate routing)
const SAFE_WATER_POINTS = [
  ...EAST_BAY_ROUTE,
  ...WEST_BAY_ICW_ROUTE,
  ...WEST_BAY_CUT_ROUTE,
  ...SOUTH_BAY_ROUTE,
];

// Find intermediate waypoints to route around land between two points
function findSafeIntermediates(p1, p2) {
  if (!segmentCrossesLand(p1, p2)) return [];

  // Try single intermediate waypoint (shortest total distance)
  let best = null;
  let bestDist = Infinity;
  for (const wp of SAFE_WATER_POINTS) {
    const d1 = haversineNM(p1.lat, p1.lng, wp.lat, wp.lng);
    const d2 = haversineNM(wp.lat, wp.lng, p2.lat, p2.lng);
    if (d1 < 0.05 || d2 < 0.05) continue;
    if (!segmentCrossesLand(p1, wp) && !segmentCrossesLand(wp, p2)) {
      const total = d1 + d2;
      if (total < bestDist) {
        bestDist = total;
        best = wp;
      }
    }
  }
  if (best) return [best];

  // Try two intermediates if single didn't work
  const reachable = SAFE_WATER_POINTS.filter(wp => {
    const d = haversineNM(p1.lat, p1.lng, wp.lat, wp.lng);
    return d > 0.05 && d < 10 && !segmentCrossesLand(p1, wp);
  });
  for (const wp1 of reachable) {
    for (const wp2 of SAFE_WATER_POINTS) {
      const d2 = haversineNM(wp2.lat, wp2.lng, p2.lat, p2.lng);
      if (d2 < 0.05) continue;
      if (haversineNM(wp1.lat, wp1.lng, wp2.lat, wp2.lng) < 0.05) continue;
      if (!segmentCrossesLand(wp1, wp2) && !segmentCrossesLand(wp2, p2)) {
        return [wp1, wp2];
      }
    }
  }

  return []; // No safe path found — fallback to direct
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
// Enforces: East Bay destinations must go through the East Bay Entrance.
// preferredWestRoute: 'icw' | 'cut' — user-selected route for West Bay
function pickRoute(destLat, destLng, preferredWestRoute) {
  // East Bay destinations MUST use the East Bay route through the entrance
  if (isInEastBay(destLat, destLng)) {
    const { index } = findClosestPointOnRoute(EAST_BAY_ROUTE, destLat, destLng);
    const enforced = Math.max(index, EAST_BAY_ENTRANCE_IDX);
    const pt = EAST_BAY_ROUTE[enforced];
    const dist = haversineNM(pt.lat, pt.lng, destLat, destLng);
    const crossesLand = segmentCrossesLand(pt, { lat: destLat, lng: destLng });
    return { route: EAST_BAY_ROUTE, name: 'East Bay', index: enforced, dist, crossesLand };
  }

  // West Bay: honor user's route preference if destination is in West Bay
  if (preferredWestRoute && isWestBayDestination(destLat, destLng)) {
    const chosen = preferredWestRoute === 'cut' ? WEST_BAY_CUT_ROUTE : WEST_BAY_ICW_ROUTE;
    const chosenName = preferredWestRoute === 'cut' ? 'Mad Island Cut' : 'ICW Channel';
    const { index, dist } = findClosestPointOnRoute(chosen, destLat, destLng);
    const crossesLand = segmentCrossesLand(chosen[index], { lat: destLat, lng: destLng });
    return { route: chosen, name: chosenName, index, dist, crossesLand };
  }

  const routes = [
    { route: EAST_BAY_ROUTE, name: 'East Bay' },
    { route: WEST_BAY_ICW_ROUTE, name: 'ICW Channel' },
    { route: WEST_BAY_CUT_ROUTE, name: 'Mad Island Cut' },
    { route: SOUTH_BAY_ROUTE, name: 'South Bay' },
  ];

  const candidates = [];
  for (const r of routes) {
    const { index, dist } = findClosestPointOnRoute(r.route, destLat, destLng);
    const crossesLand = segmentCrossesLand(
      r.route[index],
      { lat: destLat, lng: destLng }
    );
    candidates.push({ route: r.route, name: r.name, index, dist, crossesLand });
  }

  // Prefer no land crossing, then shortest peel-off distance
  candidates.sort((a, b) => {
    if (a.crossesLand !== b.crossesLand) return a.crossesLand ? 1 : -1;
    return a.dist - b.dist;
  });

  return candidates[0];
}

// ─── PUBLIC API ───

// Check if a destination requires a West Bay route choice
export function isWestBayDestination(destLat, destLng) {
  return destLng < WEST_BAY_BOUNDS.east && destLng > WEST_BAY_BOUNDS.west &&
         destLat < WEST_BAY_BOUNDS.north && destLat > WEST_BAY_BOUNDS.south &&
         !isInEastBay(destLat, destLng);
}

// Compute a water route from harbor to destination.
// Follows the best anchor route, peels off to the fishing spot,
// and avoids crossing land/marsh areas.
// preferredWestRoute: 'icw' | 'cut' — user preference for West Bay destinations
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

  // Handle peel-off to destination
  const lastWp = waypoints[waypoints.length - 1];
  const distToLast = haversineNM(lastWp.lat, lastWp.lng, destLat, destLng);

  if (distToLast > 0.05) {
    // If peel-off still crosses land (rare after pickRoute optimization),
    // insert safe intermediate waypoints to route around
    if (best.crossesLand) {
      const intermediates = findSafeIntermediates(
        { lat: lastWp.lat, lng: lastWp.lng },
        { lat: destLat, lng: destLng }
      );
      for (const wp of intermediates) {
        waypoints.push({
          lat: wp.lat, lng: wp.lng,
          title: 'Water route', desc: 'Routing around land',
          depth: '', warnings: [],
        });
      }
    }

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

// Find nearest harbor (compatibility with existing code)
export function findNearestHarbor(lat, lng) {
  return { id: 'matagorda_harbor', lat: HARBOR.lat, lng: HARBOR.lng, name: HARBOR.name };
}

export function findNearestNode(lat, lng) {
  return { id: 'dest', lat, lng, dist: 0 };
}

export function isOnLand(lat, lng) {
  for (const polygon of LAND_POLYGONS) {
    if (pointInPolygon(lat, lng, polygon)) return true;
  }
  return false;
}
