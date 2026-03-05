import { C } from '../utils/theme';

export const BAY_CONFIGS = {
  matagorda: {
    center: [28.72, -95.88],
    zoom: 11,
    toLatLng: (pos) => [28.85 - (pos.y / 100) * 0.32, -96.18 + (pos.x / 100) * 0.62],
    fromLatLng: (lat, lng) => ({ x: ((lng + 96.18) / 0.62) * 100, y: ((28.85 - lat) / 0.32) * 100 }),
  },
  galveston: {
    center: [29.30, -94.85],
    zoom: 11,
    toLatLng: (pos) => [29.45 - (pos.y / 100) * 0.30, -95.10 + (pos.x / 100) * 0.55],
    fromLatLng: (lat, lng) => ({ x: ((lng + 95.10) / 0.55) * 100, y: ((29.45 - lat) / 0.30) * 100 }),
  },
};

export const BAY_HARBORS = {
  matagorda: {
    id: 'mat-harbor', name: 'Matagorda Harbor',
    position: { x: 12, y: 78 },
    desc: 'Main harbor \u2014 fuel, bait, ice available',
    depth: '4-6 ft', type: 'boat',
  },
  galveston: {
    id: 'gal-harbor', name: 'Galveston Yacht Basin',
    position: { x: 42, y: 45 },
    desc: 'Full-service marina \u2014 Harborside Dr',
    depth: '6-8 ft', type: 'boat',
  },
};

export const CHANNEL_WAYPOINTS = {
  matagorda: [
    { pos: { x: 12, y: 78 }, name: 'Matagorda Harbor', depth: '4-6 ft', warnings: ['No wake zone'] },
    { pos: { x: 18, y: 74 }, name: 'Harbor Channel', depth: '5-7 ft', warnings: [] },
    { pos: { x: 25, y: 70 }, name: 'Channel Marker G7', depth: '6-8 ft', warnings: [] },
    { pos: { x: 35, y: 65 }, name: 'ICW Junction', depth: '12-15 ft', warnings: ['Barge traffic \u2014 stay right'] },
    { pos: { x: 50, y: 58 }, name: 'ICW East', depth: '10-12 ft', warnings: [] },
    { pos: { x: 65, y: 50 }, name: 'East Bay Entry', depth: '5-8 ft', warnings: ['Oyster reefs \u2014 GPS only'] },
    { pos: { x: 80, y: 40 }, name: 'Far East Flats', depth: '3-5 ft', warnings: ['Very shallow at low tide'] },
  ],
  galveston: [
    { pos: { x: 42, y: 45 }, name: 'Yacht Basin', depth: '6-8 ft', warnings: ['No wake zone'] },
    { pos: { x: 45, y: 50 }, name: 'Harborside Channel', depth: '6-8 ft', warnings: [] },
    { pos: { x: 50, y: 55 }, name: 'Texas City Channel', depth: '10-14 ft', warnings: ['Ship traffic'] },
    { pos: { x: 55, y: 48 }, name: 'Dollar Reef Area', depth: '4-6 ft', warnings: [] },
    { pos: { x: 60, y: 40 }, name: 'Mid-Bay', depth: '6-8 ft', warnings: [] },
    { pos: { x: 70, y: 35 }, name: 'Trinity Bay Approach', depth: '5-7 ft', warnings: ['Shallow east side'] },
    { pos: { x: 40, y: 65 }, name: 'West Bay Entry', depth: '4-6 ft', warnings: ['Markers shift \u2014 use GPS'] },
  ],
};

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

export const DEFAULT_SHADE_ZONES = [
  { id: 1, type: 'wade', label: 'Shell Island Wade Zone', cx: 77, cy: 25, rx: 9, ry: 5, color: C.amber, bay: 'matagorda' },
  { id: 2, type: 'wade', label: 'River Mouth Sand Bar', cx: 18, cy: 59, rx: 6, ry: 3, color: C.amber, bay: 'matagorda' },
  { id: 3, type: 'kayak', label: 'Oyster Lake Paddle Zone', cx: 27, cy: 42, rx: 6, ry: 4, color: C.green, bay: 'matagorda' },
  { id: 4, type: 'wade', label: 'Dollar Reef Flat', cx: 55, cy: 52, rx: 7, ry: 4, color: C.amber, bay: 'galveston' },
  { id: 5, type: 'boat', label: 'Ship Channel Drift', cx: 50, cy: 40, rx: 5, ry: 8, color: C.blue, bay: 'galveston' },
];

export const DEFAULT_LAUNCHES = [
  { id: 1, name: 'Matagorda Harbor', type: 'boat', position: { x: 12, y: 78 }, gps: '28.6847\u00B0N, 95.9654\u00B0W', notes: '50+ spots, fuel, bait, ice', bay: 'matagorda', isHarbor: true },
  { id: 2, name: 'Oyster Lake Park', type: 'kayak', position: { x: 22, y: 50 }, gps: '28.6912\u00B0N, 95.9234\u00B0W', notes: 'Free, kayak-only', bay: 'matagorda' },
  { id: 3, name: 'River Road Access', type: 'drivein', position: { x: 8, y: 65 }, gps: '28.6801\u00B0N, 95.9601\u00B0W', notes: '4WD recommended', bay: 'matagorda' },
  { id: 4, name: 'Galveston Yacht Basin', type: 'boat', position: { x: 42, y: 45 }, gps: '29.2889\u00B0N, 94.7912\u00B0W', notes: 'Full service marina', bay: 'galveston', isHarbor: true },
  { id: 5, name: 'Texas City Dike', type: 'boat', position: { x: 50, y: 60 }, gps: '29.3834\u00B0N, 94.9012\u00B0W', notes: 'Public ramp, $12', bay: 'galveston' },
  { id: 6, name: 'Eagle Point Marina', type: 'boat', position: { x: 35, y: 38 }, gps: '29.3456\u00B0N, 94.8234\u00B0W', notes: 'Protected launch, $15', bay: 'galveston' },
];

export const DEFAULT_WADE_LINES = [
  { id: 1, bay: 'matagorda', label: 'Shell Island Wade', points: [{ x: 72, y: 32 }, { x: 75, y: 26 }, { x: 78, y: 22 }], color: C.amber, castRange: 40 },
  { id: 2, bay: 'matagorda', label: 'River Mouth Wade', points: [{ x: 13, y: 64 }, { x: 16, y: 60 }, { x: 19, y: 57 }], color: C.amber, castRange: 40 },
  { id: 3, bay: 'galveston', label: 'Dike Rocks Wade', points: [{ x: 48, y: 62 }, { x: 52, y: 58 }, { x: 55, y: 55 }], color: C.amber, castRange: 40 },
];

export const DEFAULT_PHOTOS = [
  { id: 1, user: 'CaptMike', position: { x: 73, y: 30 }, caption: 'Shell pad at low tide', time: '2 days ago', likes: 24, bay: 'matagorda' },
  { id: 2, user: 'WadeFisher22', position: { x: 16, y: 63 }, caption: 'River mouth sandbar', time: '1 week ago', likes: 18, bay: 'matagorda' },
  { id: 3, user: 'KayakJen', position: { x: 24, y: 44 }, caption: 'Tailing reds in back lake', time: '3 days ago', likes: 31, bay: 'matagorda' },
  { id: 4, user: 'BayRat42', position: { x: 52, y: 58 }, caption: 'Sheepshead on fiddler crabs', time: '1 day ago', likes: 14, bay: 'galveston' },
];

export const BOATSHARE_LISTINGS = [
  {
    id: 1, name: 'Mike R.', age: 'Late 30s', boat: '22ft Haynie BigFoot \u2014 "Reel Deal"',
    avatar: '\u{1F3A3}', trips: 47, rating: 4.9, date: 'Tomorrow (Tue)', time: '5:30 AM',
    launch: 'Matagorda Harbor', area: 'East Matagorda \u2014 shell flats', spotsOpen: 2,
    gasSplit: '$30/person',
    plan: 'Running to Shell Island area. Gonna wade the shell pads on incoming tide. Targeting reds and trout.',
    lookingFor: 'experienced',
    lookingDesc: 'Experienced wade fisherman who can fish independently.',
    rules: ['Bring own tackle', 'Wade boots required', 'Be at ramp by 5:15', 'No keep if over limit'],
    vibe: 'Serious fishing.',
  },
  {
    id: 2, name: 'Tommy D.', age: '50s', boat: '24ft Shallow Sport Mod-V \u2014 "Cold Beer"',
    avatar: '\u{1F37A}', trips: 89, rating: 4.8, date: 'Saturday', time: '6:00 AM',
    launch: 'Matagorda Harbor', area: 'West Mat \u2014 Bird Island, Army Hole', spotsOpen: 3,
    gasSplit: '$25/person',
    plan: 'Drifting reefs and deep holes. Got a 45qt of live shrimp coming.',
    lookingFor: 'anyone',
    lookingDesc: "Anybody is welcome. Don't need your own gear.",
    rules: ['BYOB', 'Sunscreen', '$25 covers bait too', 'Kids welcome'],
    vibe: 'Low-key day on the water.',
  },
  {
    id: 3, name: 'Sarah & Jake', age: 'Late 20s', boat: '18ft Majek Extreme \u2014 "Skinny Dipper"',
    avatar: '\u{1F41F}', trips: 23, rating: 4.7, date: 'Sunday', time: '5:00 AM',
    launch: 'River Road Access', area: 'Colorado River Mouth \u2014 wade trip', spotsOpen: 1,
    gasSplit: '$20/person',
    plan: 'Short boat ride to the river mouth. All wading.',
    lookingFor: 'intermediate',
    lookingDesc: 'Someone comfortable wading waist-deep in current.',
    rules: ['Own gear required', 'Wading belt mandatory', 'Share GPS spots from the day'],
    vibe: 'We fish as a team.',
  },
  {
    id: 4, name: 'Big Ray', age: '60s', boat: '21ft Dargel Skout \u2014 "Pay Day"',
    avatar: '\u2693', trips: '200+', rating: 5.0, date: 'Wednesday', time: '4:30 AM',
    launch: 'Matagorda Harbor', area: 'East Mat \u2014 multiple spots', spotsOpen: 1,
    gasSplit: '$35/person',
    plan: 'Full day \u2014 leaving in the dark. I fish 3-4 spots depending on conditions.',
    lookingFor: 'experienced',
    lookingDesc: 'Serious fisherman only. 30+ years on this bay.',
    rules: ['There by 4:15 or I leave', 'Own premium gear', 'No phones during fishing', 'Split cleaning at dock'],
    vibe: 'Old school. No nonsense.',
  },
];

// Route generation
export function generateRoute(bayId, targetPos, spotName) {
  const harbor = BAY_HARBORS[bayId];
  const channels = CHANNEL_WAYPOINTS[bayId] || [];
  if (!harbor) return [];

  const dist2d = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  let bestIdx = 0;
  let bestDist = Infinity;
  channels.forEach((wp, i) => {
    const d = dist2d(wp.pos, targetPos);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  });

  const route = [];
  route.push({
    pos: harbor.position,
    title: harbor.name,
    desc: 'Depart harbor, follow channel markers',
    depth: harbor.depth,
    warnings: ['No wake in harbor/marina'],
  });

  const startCh = channels[0] && dist2d(channels[0].pos, harbor.position) < 5 ? 1 : 0;
  for (let i = startCh; i <= bestIdx; i++) {
    const wp = channels[i];
    if (dist2d(wp.pos, harbor.position) < 5) continue;
    if (dist2d(wp.pos, targetPos) < 5) continue;
    route.push({
      pos: wp.pos,
      title: wp.name,
      desc: `Continue toward ${spotName}`,
      depth: wp.depth,
      warnings: wp.warnings || [],
    });
  }

  route.push({
    pos: targetPos,
    title: spotName,
    desc: 'Arrive at fishing spot',
    depth: '3-6 ft',
    warnings: ['Watch depth sounder'],
  });

  return route;
}
