// Route Zone Configuration
// ────────────────────────
// All navigation routes are defined here as pure data.
// To add a new route: add GPS waypoints to an existing zone's routes[],
// or create a new zone entry. No code changes needed.
//
// If a zone has 2+ routes, the user gets a choice modal.
// If a zone has 1 route, it's used automatically.

export const HARBOR = { lat: 28.694112, lng: -95.957777, name: 'Matagorda Harbor' };

export const ROUTE_ZONES = [
  {
    id: 'east_bay',
    name: 'East Bay',
    bounds: { west: -95.890, east: -95.780, north: 28.760, south: 28.580 },
    priority: 10,
    routes: [
      {
        id: 'east_bay_main',
        name: 'East Bay',
        desc: 'Through East Bay entrance',
        minPeelOffIndex: 5, // enforce routing through entrance
        waypoints: [
          { lat: 28.693098, lng: -95.956347 },   // 0: channel exit
          { lat: 28.691257, lng: -95.954186 },   // 1
          { lat: 28.701561, lng: -95.93255 },    // 2: heading NE
          { lat: 28.709718, lng: -95.912993 },   // 3
          { lat: 28.716362, lng: -95.88851 },    // 4: approaching entrance
          { lat: 28.715285, lng: -95.886751 },   // 5: EAST BAY ENTRANCE
          { lat: 28.712395, lng: -95.886679 },   // 6: inside East Bay
          { lat: 28.707911, lng: -95.884541 },   // 7
          { lat: 28.6861, lng: -95.879623 },     // 8: deep East Bay
        ],
      },
    ],
  },
  {
    id: 'south_bay',
    name: 'South Bay',
    bounds: { west: -95.965, east: -95.865, north: 28.690, south: 28.580 },
    priority: 5,
    excludeZones: ['east_bay'],
    routes: [
      {
        id: 'south_bay_main',
        name: 'South Bay',
        desc: 'Harbor channel east, then south via drift line',
        waypoints: [
          { lat: 28.693098, lng: -95.956347 },   // 0: channel exit (shared with East Bay)
          { lat: 28.691257, lng: -95.954186 },   // 1: heading east (shared)
          { lat: 28.701561, lng: -95.93255 },    // 2: harbor channel (shared)
          { lat: 28.688872, lng: -95.928976 },   // 3: wl-8 drift line (GPS verified water)
          { lat: 28.674439, lng: -95.926751 },   // 4: wl-8 drift line (GPS verified water)
          { lat: 28.660467, lng: -95.933015 },   // 5: wl-8 drift line (GPS verified water)
          { lat: 28.646207, lng: -95.922664 },   // 6: Deep Scatter Shell fishing spot
          { lat: 28.639819, lng: -95.912042 },   // 7: wl-3 wade line (GPS verified water)
          { lat: 28.634135, lng: -95.925605 },   // 8: Fishing Drains fishing spot
        ],
      },
    ],
  },
  {
    id: 'west_bay',
    name: 'West Bay',
    bounds: { west: -96.400, east: -95.965, north: 28.700, south: 28.420 },
    priority: 5,
    excludeZones: ['east_bay'],
    routes: [
      {
        id: 'west_bay_icw',
        name: 'ICW Channel',
        desc: 'Intracoastal Waterway — protected, calmer water',
        waypoints: [
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
        ],
      },
      {
        id: 'west_bay_cut',
        name: 'Mad Island Cut',
        desc: 'Shorter but open water — recommended on low tide',
        warning: 'Best on low tide \u2022 Can be rough with strong S winds',
        waypoints: [
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
        ],
      },
    ],
  },
];
