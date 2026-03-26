// Navigation routing engine for Matagorda Bay
// Uses data-driven route zones from routeConfig.js — all navigation follows
// configured channel lines then peels off at the nearest point to reach the destination.
//
// To add new routes or zones, edit routeConfig.js. No changes needed here.

import { haversineNM } from '../utils/geo';
import { HARBOR, ROUTE_ZONES } from './routeConfig';

// ─── ZONE DETECTION ───

// Sorted zones by priority (highest first) for matching
const sortedZones = [...ROUTE_ZONES].sort((a, b) => (b.priority || 0) - (a.priority || 0));

function isInZoneBounds(zone, lat, lng) {
  const b = zone.bounds;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

function isInZone(zone, lat, lng) {
  if (!isInZoneBounds(zone, lat, lng)) return false;
  if (zone.excludeZones) {
    for (const exId of zone.excludeZones) {
      const exZone = ROUTE_ZONES.find((z) => z.id === exId);
      if (exZone && isInZoneBounds(exZone, lat, lng)) return false;
    }
  }
  return true;
}

function findZone(lat, lng) {
  return sortedZones.find((z) => isInZone(z, lat, lng)) || null;
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

function pickRoute(destLat, destLng, preferredRouteId) {
  const zone = findZone(destLat, destLng);

  if (zone) {
    // Pick the preferred route or default to first
    let chosen = zone.routes[0];
    if (preferredRouteId) {
      const preferred = zone.routes.find((r) => r.id === preferredRouteId);
      if (preferred) chosen = preferred;
    }

    const { index, dist } = findClosestPointOnRoute(chosen.waypoints, destLat, destLng);
    const enforced = chosen.minPeelOffIndex ? Math.max(index, chosen.minPeelOffIndex) : index;
    const pt = chosen.waypoints[enforced];
    const enforcedDist = haversineNM(pt.lat, pt.lng, destLat, destLng);

    return { route: chosen.waypoints, name: chosen.name, index: enforced, dist: enforcedDist };
  }

  // Fallback: try all routes across all zones, pick closest peel-off
  let best = null;
  for (const z of ROUTE_ZONES) {
    for (const r of z.routes) {
      const { index, dist } = findClosestPointOnRoute(r.waypoints, destLat, destLng);
      if (!best || dist < best.dist) {
        best = { route: r.waypoints, name: r.name, index, dist };
      }
    }
  }
  return best;
}

// ─── PUBLIC API ───

// Returns route choices if the destination zone has multiple route options.
// Returns { zoneName, routes[] } or null.
export function getRouteChoices(destLat, destLng) {
  const zone = findZone(destLat, destLng);
  if (zone && zone.routes.length > 1) {
    return {
      zoneName: zone.name,
      routes: zone.routes.map((r) => ({
        id: r.id,
        name: r.name,
        desc: r.desc,
        warning: r.warning || null,
      })),
    };
  }
  return null;
}

// Kept for backwards compatibility — returns true if destination is in a zone with multiple routes
export function isWestBayDestination(destLat, destLng) {
  const zone = findZone(destLat, destLng);
  if (!zone) return false;
  return zone.id === 'west_bay';
}

// Compute a water route from harbor to destination.
export function computeWaterRoute(startLat, startLng, startName, destLat, destLng, destName, preferredRouteId) {
  // If destination is very close to harbor, go direct
  const directDist = haversineNM(HARBOR.lat, HARBOR.lng, destLat, destLng);
  if (directDist < 0.5) {
    return [
      { lat: HARBOR.lat, lng: HARBOR.lng, title: startName || HARBOR.name, desc: 'Starting point', depth: '', warnings: [] },
      { lat: destLat, lng: destLng, title: destName || 'Destination', desc: 'Destination', depth: '', warnings: [] },
    ];
  }

  const best = pickRoute(destLat, destLng, preferredRouteId);

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
