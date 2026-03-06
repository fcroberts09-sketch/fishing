// Channel graph for water-only routing in Matagorda Bay Complex
// All nodes are in navigable water, verified against NOAA charts and satellite imagery

import { haversineNM } from '../utils/geo';

// ─── GRAPH NODES ───
// Each node is a navigable water waypoint [lng, lat]
const NODES = {
  // Harbors & Ramps
  'palacios_harbor':          [-96.2133, 28.7068],
  'matagorda_harbor':         [-95.9578, 28.6941],
  'sargent_ramp':             [-95.6261, 28.7711],

  // GIWW (Gulf Intracoastal Waterway) spine — main routing channel
  'giww_west_junction':       [-96.2050, 28.6690],
  'giww_tres_palacios':       [-96.1500, 28.6900],
  'giww_mid_west':            [-96.1000, 28.6850],
  'giww_colorado_crossing':   [-95.9800, 28.6800],
  'giww_east_junction':       [-95.9200, 28.6750],
  'giww_caney_creek':         [-95.8700, 28.6800],
  'giww_east_end':            [-95.8200, 28.6700],
  'giww_sargent_approach':    [-95.7200, 28.7200],

  // Matagorda Ship Channel
  'ship_channel_mouth':       [-95.9783, 28.5847],
  'ship_channel_mid':         [-95.9700, 28.6200],
  'ship_channel_inner':       [-95.9650, 28.6500],

  // Key fishing areas & water nodes
  'deep_scatter_shell':       [-96.1850, 28.5980],
  'colorado_river_delta':     [-95.9840, 28.6350],
  'pass_cavallo_jetty':       [-96.3980, 28.4350],
  'mitchell_cut':             [-96.0800, 28.5980],
  'brown_cedar_cut':          [-96.2700, 28.5090],
  'east_bay_center':          [-95.8400, 28.6140],
  'matagorda_island_surf':    [-96.1800, 28.4320],
  'tres_palacios_grass':      [-96.0800, 28.7320],

  // Additional navigable water nodes for coverage
  'west_bay_open':            [-96.1500, 28.6200],
  'west_bay_south':           [-96.1500, 28.5500],
  'west_bay_sw':              [-96.2500, 28.5600],
  'mid_bay_north':            [-96.0200, 28.6600],
  'mid_bay_south':            [-96.0200, 28.6100],
  'east_bay_north':           [-95.8700, 28.6400],
  'east_bay_south':           [-95.8400, 28.5900],
  'pass_cavallo_approach':    [-96.3500, 28.4800],
  'west_bay_channel':         [-96.2000, 28.5800],
  'palacios_channel':         [-96.2100, 28.6900],
  'tres_palacios_bay_center': [-96.1200, 28.7100],
  'matagorda_harbor_channel': [-95.9600, 28.6700],
  'spoil_island_east':        [-95.8500, 28.6300],
  'east_bay_deep':            [-95.8000, 28.6300],
};

// ─── EDGES ───
// Connect adjacent nodes. Edges are bidirectional. Prefer GIWW as spine.
const EDGES = [
  // GIWW spine (main channel — preferred routing)
  ['palacios_harbor', 'palacios_channel'],
  ['palacios_channel', 'giww_west_junction'],
  ['giww_west_junction', 'giww_tres_palacios'],
  ['giww_tres_palacios', 'giww_mid_west'],
  ['giww_mid_west', 'giww_colorado_crossing'],
  ['giww_colorado_crossing', 'giww_east_junction'],
  ['giww_east_junction', 'giww_caney_creek'],
  ['giww_caney_creek', 'giww_east_end'],
  ['giww_east_end', 'giww_sargent_approach'],
  ['giww_sargent_approach', 'sargent_ramp'],

  // Matagorda Harbor connections
  ['matagorda_harbor', 'matagorda_harbor_channel'],
  ['matagorda_harbor_channel', 'giww_colorado_crossing'],
  ['matagorda_harbor_channel', 'ship_channel_inner'],

  // Matagorda Ship Channel
  ['ship_channel_mouth', 'ship_channel_mid'],
  ['ship_channel_mid', 'ship_channel_inner'],
  ['ship_channel_inner', 'giww_colorado_crossing'],

  // Tres Palacios area
  ['giww_tres_palacios', 'tres_palacios_bay_center'],
  ['tres_palacios_bay_center', 'tres_palacios_grass'],

  // West bay connections
  ['giww_west_junction', 'west_bay_open'],
  ['west_bay_open', 'west_bay_south'],
  ['west_bay_open', 'deep_scatter_shell'],
  ['west_bay_south', 'west_bay_sw'],
  ['west_bay_south', 'west_bay_channel'],
  ['west_bay_channel', 'deep_scatter_shell'],
  ['west_bay_sw', 'brown_cedar_cut'],
  ['west_bay_sw', 'pass_cavallo_approach'],
  ['pass_cavallo_approach', 'pass_cavallo_jetty'],
  ['pass_cavallo_approach', 'brown_cedar_cut'],
  ['deep_scatter_shell', 'matagorda_island_surf'],

  // Mid bay connections
  ['giww_colorado_crossing', 'mid_bay_north'],
  ['mid_bay_north', 'mid_bay_south'],
  ['mid_bay_south', 'mitchell_cut'],
  ['mid_bay_south', 'ship_channel_mid'],
  ['colorado_river_delta', 'mid_bay_north'],
  ['colorado_river_delta', 'ship_channel_inner'],
  ['colorado_river_delta', 'giww_colorado_crossing'],

  // East bay connections
  ['giww_east_junction', 'east_bay_north'],
  ['giww_caney_creek', 'east_bay_north'],
  ['east_bay_north', 'east_bay_center'],
  ['east_bay_north', 'spoil_island_east'],
  ['east_bay_center', 'east_bay_south'],
  ['east_bay_center', 'spoil_island_east'],
  ['spoil_island_east', 'east_bay_deep'],
  ['east_bay_deep', 'giww_east_end'],
  ['east_bay_south', 'east_bay_deep'],

  // Cross-bay connections
  ['mitchell_cut', 'west_bay_south'],
  ['mitchell_cut', 'mid_bay_south'],
  ['west_bay_open', 'giww_mid_west'],
];

// ─── LAND BOUNDARY POLYGON ───
// Simplified polygon of land masses around Matagorda Bay
// Points inside this polygon are considered "land" — used for tap validation
const LAND_POLYGONS = [
  // Northern shoreline (mainland)
  [
    [-96.45, 28.78], [-96.40, 28.76], [-96.30, 28.75], [-96.20, 28.74],
    [-96.15, 28.76], [-96.10, 28.75], [-96.05, 28.76], [-96.00, 28.75],
    [-95.97, 28.74], [-95.94, 28.73], [-95.90, 28.74], [-95.85, 28.73],
    [-95.80, 28.74], [-95.75, 28.76], [-95.70, 28.78], [-95.60, 28.80],
    [-95.55, 28.82], [-95.55, 28.90], [-96.45, 28.90], [-96.45, 28.78],
  ],
  // Matagorda Peninsula / Island (southern barrier)
  [
    [-96.45, 28.46], [-96.35, 28.44], [-96.25, 28.43], [-96.15, 28.42],
    [-96.05, 28.44], [-95.95, 28.45], [-95.85, 28.48], [-95.75, 28.52],
    [-95.65, 28.55], [-95.55, 28.56], [-95.55, 28.38], [-96.45, 28.38],
    [-96.45, 28.46],
  ],
];

// ─── DIJKSTRA'S ALGORITHM ───
function buildAdjacency() {
  const adj = {};
  for (const id of Object.keys(NODES)) {
    adj[id] = [];
  }
  for (const [a, b] of EDGES) {
    const [lngA, latA] = NODES[a];
    const [lngB, latB] = NODES[b];
    const dist = haversineNM(latA, lngA, latB, lngB);
    adj[a].push({ node: b, dist });
    adj[b].push({ node: a, dist });
  }
  return adj;
}

const adjacency = buildAdjacency();

function dijkstra(startId, endId) {
  const dist = {};
  const prev = {};
  const visited = new Set();

  for (const id of Object.keys(NODES)) {
    dist[id] = Infinity;
  }
  dist[startId] = 0;

  while (true) {
    // Find unvisited node with smallest distance
    let current = null;
    let minDist = Infinity;
    for (const id of Object.keys(NODES)) {
      if (!visited.has(id) && dist[id] < minDist) {
        minDist = dist[id];
        current = id;
      }
    }
    if (current === null || current === endId) break;
    visited.add(current);

    for (const edge of adjacency[current]) {
      const newDist = dist[current] + edge.dist;
      if (newDist < dist[edge.node]) {
        dist[edge.node] = newDist;
        prev[edge.node] = current;
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  // Reconstruct path
  const path = [];
  let cur = endId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return path;
}

// ─── PUBLIC API ───

// Find nearest graph node to a [lat, lng] coordinate
export function findNearestNode(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const [id, [nodeLng, nodeLat]] of Object.entries(NODES)) {
    const d = haversineNM(lat, lng, nodeLat, nodeLng);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return { id: best, lat: NODES[best][1], lng: NODES[best][0], dist: bestDist };
}

// Find nearest harbor node (for route start)
const HARBOR_NODES = ['palacios_harbor', 'matagorda_harbor', 'sargent_ramp'];
export function findNearestHarbor(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const id of HARBOR_NODES) {
    const [nodeLng, nodeLat] = NODES[id];
    const d = haversineNM(lat, lng, nodeLat, nodeLng);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return { id: best, lat: NODES[best][1], lng: NODES[best][0], name: best.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
}

// Check if a point is on land (inside any land polygon)
function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]; // [lng, lat]
    const [xj, yj] = polygon[j];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function isOnLand(lat, lng) {
  for (const poly of LAND_POLYGONS) {
    if (pointInPolygon(lat, lng, poly)) return true;
  }
  return false;
}

// Compute a water-only route between two points
// Returns array of {lat, lng, title} waypoints, or null if no path
export function computeWaterRoute(startLat, startLng, startName, destLat, destLng, destName) {
  const origin = findNearestHarbor(startLat, startLng);
  const dest = findNearestNode(destLat, destLng);

  if (!origin.id || !dest.id) return null;

  const pathIds = dijkstra(origin.id, dest.id);
  if (!pathIds) return null;

  // Convert node IDs to waypoint objects
  const waypoints = pathIds.map((id, idx) => {
    const [lng, lat] = NODES[id];
    const label = id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      lat,
      lng,
      title: idx === 0 ? (startName || label) : idx === pathIds.length - 1 ? (destName || label) : label,
      desc: idx === 0 ? 'Starting point' : idx === pathIds.length - 1 ? 'Destination' : 'Channel waypoint',
      depth: '',
      warnings: [],
    };
  });

  return waypoints;
}

// Get all graph nodes (for debugging/display)
export function getGraphNodes() {
  return Object.entries(NODES).map(([id, [lng, lat]]) => ({ id, lat, lng }));
}

// Get all graph edges as coordinate pairs (for debugging/display)
export function getGraphEdges() {
  return EDGES.map(([a, b]) => {
    const [lngA, latA] = NODES[a];
    const [lngB, latB] = NODES[b];
    return [[latA, lngA], [latB, lngB]];
  });
}
