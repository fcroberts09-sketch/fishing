// ─── KAYAK LAUNCHES ───
// Real kayak launch locations for Matagorda and Galveston bay systems
export const KAYAK_LAUNCHES = [
  // MATAGORDA
  { id: 'kl-1', bay: 'matagorda', name: 'Matagorda Bay Nature Park', type: 'kayak', lat: 28.6930, lng: -95.9570, notes: 'Free launch, sand beach, good for Oyster Lake access', amenities: ['parking', 'restrooms'] },
  { id: 'kl-2', bay: 'matagorda', name: 'FM 2031 Beach Access', type: 'kayak', lat: 28.6385, lng: -95.9887, notes: 'Surf launch to jetties and nearshore', amenities: ['parking'] },
  { id: 'kl-3', bay: 'matagorda', name: 'Colorado River Bridge Launch', type: 'kayak', lat: 28.6890, lng: -95.9740, notes: 'River access, paddle to river mouth flats', amenities: ['parking'] },
  { id: 'kl-4', bay: 'matagorda', name: 'Chinquapin Rd Ramp', type: 'kayak', lat: 28.7240, lng: -95.8510, notes: 'East bay access, shallow draft only', amenities: ['parking'] },
  { id: 'kl-5', bay: 'matagorda', name: 'Palacios City Ramp', type: 'kayak', lat: 28.7095, lng: -96.2150, notes: 'West Matagorda Bay, sheltered launch', amenities: ['parking', 'restrooms'] },
  // GALVESTON
  { id: 'kl-6', bay: 'galveston', name: 'Galveston Island State Park', type: 'kayak', lat: 29.1994, lng: -94.9675, notes: 'Best kayak launch in West Bay, protected water', amenities: ['parking', 'restrooms', 'camping'] },
  { id: 'kl-7', bay: 'galveston', name: 'Jamaica Beach Pocket Park', type: 'kayak', lat: 29.1784, lng: -94.9805, notes: 'Small launch into West Bay, free', amenities: ['parking'] },
  { id: 'kl-8', bay: 'galveston', name: 'San Luis Pass County Park', type: 'kayak', lat: 29.0825, lng: -95.1198, notes: 'Launch into pass, STRONG currents, experienced only', amenities: ['parking'] },
  { id: 'kl-9', bay: 'galveston', name: 'Seawall Kayak Launch (61st St)', type: 'kayak', lat: 29.2850, lng: -94.8250, notes: 'Bay side launch near yacht basin', amenities: ['parking'] },
  { id: 'kl-10', bay: 'galveston', name: 'Texas City Dike Kayak', type: 'kayak', lat: 29.3810, lng: -94.9050, notes: 'Launch off dike, access to flats and channel', amenities: ['parking'] },
  { id: 'kl-11', bay: 'galveston', name: 'Eagle Point Kayak', type: 'kayak', lat: 29.4820, lng: -94.9180, notes: 'North bay access, sheltered in most winds', amenities: ['parking', 'restrooms'] },
  { id: 'kl-12', bay: 'galveston', name: 'Kemah Boardwalk Ramp Area', type: 'kayak', lat: 29.5435, lng: -95.0235, notes: 'Clear Lake channel access, kayak-friendly', amenities: ['parking', 'restrooms'] },
];

// ─── BOAT RAMPS ───
export const BOAT_RAMPS = [
  // MATAGORDA
  { id: 'br-1', bay: 'matagorda', name: 'Matagorda Harbor Ramp', type: 'boat', lat: 28.6847, lng: -95.9654, notes: '6 lane ramp, fuel, bait, ice', amenities: ['fuel', 'bait', 'ice', 'restrooms', 'parking'], fee: 'Free' },
  { id: 'br-2', bay: 'matagorda', name: 'River Bend Park Ramp', type: 'boat', lat: 28.6910, lng: -95.9690, notes: '2 lane ramp on Colorado River', amenities: ['parking', 'restrooms'], fee: 'Free' },
  { id: 'br-3', bay: 'matagorda', name: 'Chinquapin Boat Ramp', type: 'boat', lat: 28.7245, lng: -95.8520, notes: 'East Matagorda access, concrete ramp', amenities: ['parking'], fee: 'Free' },
  // GALVESTON
  { id: 'br-4', bay: 'galveston', name: 'Galveston Yacht Basin', type: 'boat', lat: 29.2889, lng: -94.7912, notes: 'Full service, 4 lane ramp', amenities: ['fuel', 'bait', 'ice', 'restrooms', 'parking'], fee: '$10' },
  { id: 'br-5', bay: 'galveston', name: 'Texas City Dike Ramp', type: 'boat', lat: 29.3834, lng: -94.9012, notes: 'Public 2 lane ramp', amenities: ['parking', 'restrooms'], fee: '$12' },
  { id: 'br-6', bay: 'galveston', name: 'Eagle Point Marina', type: 'boat', lat: 29.4825, lng: -94.9190, notes: 'Protected, 3 lane ramp', amenities: ['fuel', 'bait', 'parking', 'restrooms'], fee: '$15' },
  { id: 'br-7', bay: 'galveston', name: 'Bayou Vista Boat Ramp', type: 'boat', lat: 29.3345, lng: -94.9480, notes: 'West Bay access, 2 lane', amenities: ['parking'], fee: 'Free' },
  { id: 'br-8', bay: 'galveston', name: 'Kemah/Clear Lake Ramp', type: 'boat', lat: 29.5440, lng: -95.0230, notes: 'Clear Lake access to upper Galveston Bay', amenities: ['fuel', 'bait', 'parking', 'restrooms'], fee: '$10' },
];

// ─── BAIT SHOPS ───
export const BAIT_SHOPS = [
  // MATAGORDA
  { id: 'bs-1', bay: 'matagorda', name: 'Matagorda Bait & Tackle', lat: 28.6905, lng: -95.9645, notes: 'Live shrimp, croaker, mullet. Full tackle shop.', hours: '4 AM - 8 PM', phone: '(979) 863-7775' },
  { id: 'bs-2', bay: 'matagorda', name: 'Captain Chuck\'s Bait Camp', lat: 28.6860, lng: -95.9670, notes: 'Live bait, ice, snacks. At the harbor.', hours: '4:30 AM - 7 PM' },
  { id: 'bs-3', bay: 'matagorda', name: 'Coastal Tackle Outfitters', lat: 28.6952, lng: -95.9592, notes: 'Premium tackle, rods, lures. Guide booking.', hours: '6 AM - 6 PM' },
  // GALVESTON
  { id: 'bs-4', bay: 'galveston', name: 'FishHead\'s Bait & Tackle', lat: 29.2920, lng: -94.7885, notes: 'Full bait shop at yacht basin. Live & frozen bait.', hours: '4 AM - 9 PM' },
  { id: 'bs-5', bay: 'galveston', name: 'Texas City Dike Bait Stand', lat: 29.3850, lng: -94.9035, notes: 'Live shrimp, fiddler crabs, frozen bait.', hours: '5 AM - 7 PM' },
  { id: 'bs-6', bay: 'galveston', name: 'Galveston Island Bait & Tackle', lat: 29.2750, lng: -94.8320, notes: 'Largest tackle selection on the island.', hours: '5 AM - 8 PM', phone: '(409) 765-5561' },
  { id: 'bs-7', bay: 'galveston', name: 'West End Bait Camp', lat: 29.2015, lng: -94.9610, notes: 'Near state park. Live shrimp, Gulp, leader rigs.', hours: '5 AM - 7 PM' },
  { id: 'bs-8', bay: 'galveston', name: 'Kemah Bait & Tackle', lat: 29.5420, lng: -95.0210, notes: 'Live bait, tackle, ice. Near Kemah ramp.', hours: '4:30 AM - 8 PM' },
];

// ─── HARBORS / MARINAS ───
export const MARINAS = [
  { id: 'ma-1', bay: 'matagorda', name: 'Matagorda Harbor', lat: 28.6847, lng: -95.9654, notes: 'Main harbor with fuel dock, cleaning station, ice house', slips: 50 },
  { id: 'ma-2', bay: 'matagorda', name: 'Matagorda Mooring Basin', lat: 28.6870, lng: -95.9680, notes: 'Covered slips, protected from SE winds', slips: 30 },
  { id: 'ma-3', bay: 'galveston', name: 'Galveston Yacht Basin', lat: 29.2889, lng: -94.7912, notes: 'Full service marina, fuel, pump-out, cleaning', slips: 120 },
  { id: 'ma-4', bay: 'galveston', name: 'Eagle Point Marina', lat: 29.4825, lng: -94.9190, notes: 'Protected marina, north shore', slips: 80 },
  { id: 'ma-5', bay: 'galveston', name: 'Waterford Harbor Marina', lat: 29.5305, lng: -95.0350, notes: 'Clear Lake area, covered slips', slips: 200 },
  { id: 'ma-6', bay: 'galveston', name: 'Kemah Boardwalk Marina', lat: 29.5435, lng: -95.0235, notes: 'Restaurants nearby, transient slips available', slips: 60 },
];

// ─── BAY AREA NAMES / LABELS ───
// Geographic names embedded on the map like Google Maps
export const BAY_AREA_LABELS = [
  // MATAGORDA
  { id: 'al-1', bay: 'matagorda', name: 'East Matagorda Bay', lat: 28.7100, lng: -95.8400, size: 'large', type: 'water' },
  { id: 'al-2', bay: 'matagorda', name: 'West Matagorda Bay', lat: 28.7200, lng: -96.1500, size: 'large', type: 'water' },
  { id: 'al-3', bay: 'matagorda', name: 'Tres Palacios Bay', lat: 28.7350, lng: -96.1800, size: 'medium', type: 'water' },
  { id: 'al-4', bay: 'matagorda', name: 'Oyster Lake', lat: 28.6950, lng: -95.9300, size: 'medium', type: 'water' },
  { id: 'al-5', bay: 'matagorda', name: 'Colorado River', lat: 28.6750, lng: -95.9550, size: 'medium', type: 'water' },
  { id: 'al-6', bay: 'matagorda', name: 'Shell Island', lat: 28.7250, lng: -95.8600, size: 'small', type: 'land' },
  { id: 'al-7', bay: 'matagorda', name: 'Matagorda Peninsula', lat: 28.6500, lng: -95.9200, size: 'medium', type: 'land' },
  { id: 'al-8', bay: 'matagorda', name: 'ICW', lat: 28.7000, lng: -95.9000, size: 'small', type: 'channel' },
  { id: 'al-9', bay: 'matagorda', name: 'Bird Island', lat: 28.7100, lng: -95.8850, size: 'small', type: 'land' },
  { id: 'al-10', bay: 'matagorda', name: 'Matagorda Ship Channel', lat: 28.6700, lng: -95.9850, size: 'small', type: 'channel' },
  { id: 'al-11', bay: 'matagorda', name: 'Army Hole', lat: 28.7000, lng: -95.9000, size: 'small', type: 'water' },
  { id: 'al-12', bay: 'matagorda', name: 'Chinquapin Flats', lat: 28.7250, lng: -95.8500, size: 'small', type: 'water' },
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
// Wind arrows show direction wind is BLOWING TO (not coming from)
export function generateWindArrows(windDir, windSpeed, bayId) {
  const arrows = [];
  // Weather API gives direction wind comes FROM — flip 180° for blow direction
  const blowDir = (windDir + 180) % 360;
  // Sparser grid to reduce clutter
  for (let gx = 12; gx <= 88; gx += 11) {
    for (let gy = 18; gy <= 82; gy += 11) {
      const localDir = blowDir + (Math.sin(gx * 0.1) * 4) + (Math.cos(gy * 0.1) * 4);
      const edgeFactor = Math.min(gx, 100 - gx, gy, 100 - gy) / 20;
      const localSpeed = windSpeed * Math.min(1, Math.max(0.3, edgeFactor));
      if (localSpeed > 3) {
        arrows.push({
          x: gx + (Math.sin(gx + gy) * 1.2),
          y: gy + (Math.cos(gx + gy) * 1.2),
          dir: localDir,
          speed: localSpeed,
        });
      }
    }
  }
  return arrows;
}

// ─── WAVE HEIGHT CALCULATION ───
// Simplified SMB (Sverdrup-Munk-Bretschneider) for shallow Texas bays
// Wind speed in knots, fetch in nautical miles → wave height in feet
function calcWaveHeight(windSpeedKnots, fetchNM) {
  if (windSpeedKnots <= 0 || fetchNM <= 0) return 0;
  const U = windSpeedKnots * 0.5144; // m/s
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

// Generate wave height numbers to display on the bay
export function generateWaveMarkers(windDir, windSpeed, bayId) {
  const markers = [];
  const baseFetch = getFetch(bayId, windDir);

  // Key positions across the bay with local fetch multipliers
  const positions = [
    { x: 30, y: 35, mult: 1.0 },
    { x: 50, y: 50, mult: 0.9 },
    { x: 70, y: 40, mult: 1.0 },
    { x: 25, y: 60, mult: 0.5 },
    { x: 55, y: 28, mult: 0.85 },
    { x: 75, y: 62, mult: 0.55 },
    { x: 42, y: 42, mult: 0.8 },
    { x: 62, y: 58, mult: 0.5 },
  ];

  for (const pos of positions) {
    const edgeFactor = Math.min(pos.x, 100 - pos.x, pos.y, 100 - pos.y) / 25;
    const localFetch = baseFetch * pos.mult * Math.min(1, Math.max(0.3, edgeFactor));
    const height = calcWaveHeight(windSpeed, localFetch);

    markers.push({
      x: pos.x,
      y: pos.y,
      height,
      label: height < 0.3 ? 'Flat' : height.toFixed(1) + "'",
    });
  }

  return markers;
}
