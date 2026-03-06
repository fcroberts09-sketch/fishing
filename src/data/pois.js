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
  // WEST MATAGORDA BAY
  { id: 'al-20', bay: 'west_matagorda', name: 'West Matagorda Bay', lat: 28.6800, lng: -96.1000, size: 'large', type: 'water' },
  { id: 'al-21', bay: 'west_matagorda', name: 'Tres Palacios Bay', lat: 28.7350, lng: -96.1800, size: 'medium', type: 'water' },
  { id: 'al-22', bay: 'west_matagorda', name: 'Turtle Bay', lat: 28.6600, lng: -96.2000, size: 'medium', type: 'water' },
  { id: 'al-23', bay: 'west_matagorda', name: 'Matagorda Ship Channel', lat: 28.6700, lng: -96.0500, size: 'small', type: 'channel' },
  { id: 'al-24', bay: 'west_matagorda', name: 'Matagorda Island', lat: 28.6000, lng: -96.1500, size: 'medium', type: 'land' },
  { id: 'al-25', bay: 'west_matagorda', name: 'Palacios Point', lat: 28.7300, lng: -96.2200, size: 'small', type: 'land' },
  // SAN ANTONIO BAY
  { id: 'al-30', bay: 'san_antonio', name: 'San Antonio Bay', lat: 28.3200, lng: -96.6000, size: 'large', type: 'water' },
  { id: 'al-31', bay: 'san_antonio', name: 'Guadalupe Delta', lat: 28.4000, lng: -96.6800, size: 'medium', type: 'water' },
  { id: 'al-32', bay: 'san_antonio', name: 'Hynes Bay', lat: 28.3500, lng: -96.5500, size: 'medium', type: 'water' },
  { id: 'al-33', bay: 'san_antonio', name: 'Espiritu Santo Bay', lat: 28.2800, lng: -96.5200, size: 'medium', type: 'water' },
  { id: 'al-34', bay: 'san_antonio', name: 'Pringle Lake', lat: 28.3600, lng: -96.6200, size: 'small', type: 'water' },
  { id: 'al-35', bay: 'san_antonio', name: 'Seadrift', lat: 28.4100, lng: -96.7100, size: 'small', type: 'land' },
  { id: 'al-36', bay: 'san_antonio', name: 'Pass Cavallo', lat: 28.3900, lng: -96.4200, size: 'small', type: 'channel' },
];

// ─── WIND ARROW GRID ───
// Generate wind arrows at GPS positions over water only
export function generateWindArrows(windDir, windSpeed, bayId) {
  const arrows = [];
  if (!windSpeed || windSpeed <= 0) return arrows;

  // Weather API gives direction wind comes FROM - flip 180 for blow direction
  const blowDir = (windDir + 180) % 360;

  // Water-only GPS positions — fewer, well-spaced across all bays
  const waterPositions = bayId === 'west_matagorda' ? [
    { lat: 28.700, lng: -96.050 },
    { lat: 28.690, lng: -96.120 },
    { lat: 28.680, lng: -96.200 },
    { lat: 28.720, lng: -96.100 },
    { lat: 28.710, lng: -96.180 },
  ] : bayId === 'san_antonio' ? [
    { lat: 28.330, lng: -96.580 },
    { lat: 28.350, lng: -96.620 },
    { lat: 28.300, lng: -96.550 },
    { lat: 28.370, lng: -96.660 },
    { lat: 28.280, lng: -96.520 },
  ] : [
    // East Matagorda Bay — well-spaced, water only
    { lat: 28.710, lng: -95.870 },
    { lat: 28.700, lng: -95.910 },
    { lat: 28.715, lng: -95.840 },
    // West Matagorda Bay — big open water
    { lat: 28.720, lng: -96.000 },
    { lat: 28.725, lng: -96.100 },
    { lat: 28.720, lng: -96.200 },
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
  west_matagorda: [4, 6, 9, 7, 5, 3, 2, 3],
  san_antonio: [5, 7, 10, 8, 6, 4, 3, 4],
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
  const positions = bayId === 'west_matagorda' ? [
    { lat: 28.700, lng: -96.050, mult: 0.9 },
    { lat: 28.690, lng: -96.120, mult: 1.0 },
    { lat: 28.680, lng: -96.200, mult: 0.85 },
    { lat: 28.720, lng: -96.100, mult: 0.8 },
    { lat: 28.710, lng: -96.180, mult: 0.7 },
  ] : bayId === 'san_antonio' ? [
    { lat: 28.330, lng: -96.580, mult: 1.0 },
    { lat: 28.350, lng: -96.620, mult: 0.9 },
    { lat: 28.300, lng: -96.550, mult: 0.85 },
    { lat: 28.370, lng: -96.660, mult: 0.7 },
    { lat: 28.280, lng: -96.520, mult: 0.6 },
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
