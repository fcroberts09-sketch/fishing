// ─── KAYAK LAUNCHES ───
// Add your own via Settings > Permanent Map Items
export const KAYAK_LAUNCHES = [];

// ─── BOAT RAMPS ───
// Add your own via Settings > Permanent Map Items
export const BOAT_RAMPS = [];

// ─── BAIT SHOPS ───
// Add your own via Settings > Permanent Map Items
export const BAIT_SHOPS = [];

// ─── HARBORS / MARINAS ───
// Add your own via Settings > Permanent Map Items
export const MARINAS = [];

// ─── BAY AREA NAMES / LABELS ───
// Geographic names embedded on the map like Google Maps
export const BAY_AREA_LABELS = [
  // MATAGORDA
  { id: 'al-1', bay: 'matagorda', name: 'East Matagorda Bay', lat: 28.7100, lng: -95.8600, size: 'large', type: 'water' },
  { id: 'al-2', bay: 'matagorda', name: 'West Matagorda Bay', lat: 28.7200, lng: -96.1500, size: 'large', type: 'water' },
  { id: 'al-3', bay: 'matagorda', name: 'Tres Palacios Bay', lat: 28.7350, lng: -96.1800, size: 'medium', type: 'water' },
  { id: 'al-4', bay: 'matagorda', name: 'Oyster Lake', lat: 28.6950, lng: -95.9300, size: 'medium', type: 'water' },
  { id: 'al-5', bay: 'matagorda', name: 'Colorado River', lat: 28.6870, lng: -95.9700, size: 'medium', type: 'water' },
  { id: 'al-6', bay: 'matagorda', name: 'Shell Island', lat: 28.7130, lng: -95.8570, size: 'small', type: 'land' },
  { id: 'al-7', bay: 'matagorda', name: 'Matagorda Peninsula', lat: 28.6550, lng: -95.9200, size: 'medium', type: 'land' },
  { id: 'al-8', bay: 'matagorda', name: 'ICW', lat: 28.7050, lng: -95.9000, size: 'small', type: 'channel' },
  { id: 'al-9', bay: 'matagorda', name: 'Bird Island', lat: 28.7120, lng: -95.8780, size: 'small', type: 'land' },
  { id: 'al-10', bay: 'matagorda', name: 'Matagorda Ship Channel', lat: 28.6700, lng: -95.9850, size: 'small', type: 'channel' },
  { id: 'al-11', bay: 'matagorda', name: 'Army Hole', lat: 28.7000, lng: -95.9080, size: 'small', type: 'water' },
  { id: 'al-12', bay: 'matagorda', name: 'Chinquapin Flats', lat: 28.7240, lng: -95.8510, size: 'small', type: 'water' },
  { id: 'al-13', bay: 'matagorda', name: 'Boggy Bayou', lat: 28.7400, lng: -95.9800, size: 'small', type: 'water' },
  { id: 'al-14', bay: 'matagorda', name: 'Caney Creek', lat: 28.7350, lng: -95.9250, size: 'small', type: 'water' },
  // GALVESTON
  { id: 'al-20', bay: 'galveston', name: 'Galveston Bay', lat: 29.3500, lng: -94.8500, size: 'large', type: 'water' },
  { id: 'al-21', bay: 'galveston', name: 'West Bay', lat: 29.2000, lng: -94.9500, size: 'large', type: 'water' },
  { id: 'al-22', bay: 'galveston', name: 'East Bay', lat: 29.4500, lng: -94.5500, size: 'large', type: 'water' },
  { id: 'al-23', bay: 'galveston', name: 'Trinity Bay', lat: 29.5500, lng: -94.7500, size: 'large', type: 'water' },
  { id: 'al-24', bay: 'galveston', name: 'Clear Lake', lat: 29.5400, lng: -95.0300, size: 'medium', type: 'water' },
  { id: 'al-25', bay: 'galveston', name: 'Dollar Reef', lat: 29.2950, lng: -94.8100, size: 'small', type: 'reef' },
  { id: 'al-26', bay: 'galveston', name: 'Texas City Dike', lat: 29.3840, lng: -94.9000, size: 'small', type: 'land' },
  { id: 'al-27', bay: 'galveston', name: 'San Luis Pass', lat: 29.0830, lng: -95.1200, size: 'medium', type: 'channel' },
  { id: 'al-28', bay: 'galveston', name: 'Galveston Island', lat: 29.2500, lng: -94.8800, size: 'medium', type: 'land' },
  { id: 'al-29', bay: 'galveston', name: 'Bolivar Peninsula', lat: 29.4200, lng: -94.6500, size: 'medium', type: 'land' },
  { id: 'al-30', bay: 'galveston', name: 'Houston Ship Channel', lat: 29.3600, lng: -94.8000, size: 'small', type: 'channel' },
  { id: 'al-31', bay: 'galveston', name: 'Confederate Reef', lat: 29.3460, lng: -94.7230, size: 'small', type: 'reef' },
  { id: 'al-32', bay: 'galveston', name: 'Chocolate Bay', lat: 29.3200, lng: -95.0800, size: 'medium', type: 'water' },
  { id: 'al-33', bay: 'galveston', name: 'Moses Lake', lat: 29.3700, lng: -94.9800, size: 'small', type: 'water' },
  { id: 'al-34', bay: 'galveston', name: 'Jones Bay', lat: 29.2300, lng: -94.9200, size: 'small', type: 'water' },
  { id: 'al-35', bay: 'galveston', name: 'Offatts Bayou', lat: 29.2800, lng: -94.8300, size: 'small', type: 'water' },
  { id: 'al-36', bay: 'galveston', name: 'Kemah', lat: 29.5435, lng: -95.0235, size: 'small', type: 'land' },
  { id: 'al-37', bay: 'galveston', name: 'Seabrook Flats', lat: 29.5200, lng: -94.9600, size: 'small', type: 'water' },
];

// ─── WIND ARROW GRID ───
// Generate wind arrows at GPS positions over water only
export function generateWindArrows(windDir, windSpeed, bayId) {
  const arrows = [];
  if (!windSpeed || windSpeed <= 0) return arrows;

  // Weather API gives direction wind comes FROM - flip 180 for blow direction
  const blowDir = (windDir + 180) % 360;

  // Water-only GPS positions — fewer, well-spaced across all bays
  const waterPositions = bayId === 'galveston' ? [
    // Galveston Bay — spread evenly
    { lat: 29.34, lng: -94.82 },   // central bay
    { lat: 29.40, lng: -94.78 },   // upper bay
    { lat: 29.30, lng: -94.88 },   // lower bay
    // West Bay
    { lat: 29.20, lng: -94.95 },   // west bay center
    // East Bay
    { lat: 29.45, lng: -94.55 },   // east bay
    // Trinity Bay
    { lat: 29.50, lng: -94.76 },   // trinity
  ] : [
    // East Matagorda Bay — well-spaced, water only
    { lat: 28.710, lng: -95.870 },   // east bay center
    { lat: 28.700, lng: -95.910 },   // east bay west side
    { lat: 28.715, lng: -95.840 },   // east bay east side
    // West Matagorda Bay — big open water
    { lat: 28.720, lng: -96.000 },   // west bay east
    { lat: 28.725, lng: -96.100 },   // west bay center
    { lat: 28.720, lng: -96.200 },   // west bay west
  ];

  for (const pos of waterPositions) {
    const jitter = Math.sin(pos.lat * 1000) * 3 + Math.cos(pos.lng * 1000) * 3;
    const localDir = blowDir + jitter;
    const speedVariation = 0.7 + Math.abs(Math.sin(pos.lat * 500 + pos.lng * 500)) * 0.3;
    const localSpeed = windSpeed * speedVariation;

    if (localSpeed > 1) {
      arrows.push({
        lat: pos.lat,
        lng: pos.lng,
        dir: localDir,
        speed: localSpeed,
      });
    }
  }
  return arrows;
}

// ─── WAVE HEIGHT CALCULATION ───
// Simplified SMB (Sverdrup-Munk-Bretschneider) for shallow Texas bays
// Wind speed in mph, fetch in nautical miles -> wave height in feet
function calcWaveHeight(windSpeedMph, fetchNM) {
  if (windSpeedMph <= 0 || fetchNM <= 0) return 0;
  const U = windSpeedMph * 0.44704; // mph to m/s
  const F = fetchNM * 1852; // meters
  const g = 9.81;
  const d = 1.2; // avg Texas bay depth ~4ft = 1.2m
  const a = 0.53 * Math.pow((g * d) / (U * U), 0.75);
  const b = 0.00565 * Math.pow((g * F) / (U * U), 0.5);
  const Hs = 0.283 * (U * U / g) * Math.tanh(a) * Math.tanh(b / Math.tanh(a));
  return Math.round(Hs * 3.281 * 10) / 10; // meters to feet
}

// Fetch distances (NM) per 8 compass directions [N,NE,E,SE,S,SW,W,NW]
const BAY_FETCH = {
  matagorda: [3, 5, 8, 6, 4, 3, 2, 2],
  galveston: [4, 6, 10, 8, 5, 4, 3, 3],
};

function getFetch(bayId, windFromDir) {
  const fetches = BAY_FETCH[bayId] || BAY_FETCH.matagorda;
  const sector = Math.round(((windFromDir % 360) + 360) % 360 / 45) % 8;
  return fetches[sector];
}

// Generate wave height markers at GPS positions over water
export function generateWaveMarkers(windDir, windSpeed, bayId) {
  const markers = [];
  const baseFetch = getFetch(bayId, windDir);

  // Water-only GPS positions with local fetch multipliers
  const positions = bayId === 'galveston' ? [
    { lat: 29.340, lng: -94.850, mult: 1.0 },
    { lat: 29.300, lng: -94.810, mult: 0.9 },
    { lat: 29.380, lng: -94.880, mult: 0.85 },
    { lat: 29.200, lng: -94.950, mult: 0.5 },
    { lat: 29.420, lng: -94.750, mult: 0.9 },
    { lat: 29.360, lng: -94.780, mult: 1.0 },
    { lat: 29.480, lng: -94.800, mult: 0.55 },
    { lat: 29.250, lng: -94.920, mult: 0.6 },
  ] : [
    { lat: 28.710, lng: -95.865, mult: 1.0 },
    { lat: 28.715, lng: -95.845, mult: 0.9 },
    { lat: 28.700, lng: -95.905, mult: 0.85 },
    { lat: 28.698, lng: -95.935, mult: 0.5 },
    { lat: 28.705, lng: -95.885, mult: 0.9 },
    { lat: 28.720, lng: -95.855, mult: 0.8 },
    { lat: 28.692, lng: -95.955, mult: 0.55 },
    { lat: 28.695, lng: -95.920, mult: 0.6 },
  ];

  for (const pos of positions) {
    const localFetch = baseFetch * pos.mult;
    const height = calcWaveHeight(windSpeed, localFetch);

    markers.push({
      lat: pos.lat,
      lng: pos.lng,
      height,
      label: height < 0.3 ? 'Flat' : height.toFixed(1) + "'",
    });
  }

  return markers;
}
