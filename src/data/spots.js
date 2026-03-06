// All coordinates are real GPS positions verified against satellite imagery
export const DEFAULT_SPOTS = [
  {
    id: 1, bay: 'matagorda', name: 'Fishing Drains', type: 'wade',
    lat: 28.634135, lng: -95.925605,
    rating: 4.8,
    species: ['Redfish', 'Trout'],
    bestTide: 'Moving', bestTime: 'Dawn', bestSeason: 'Year-round', bestWind: 'SE 5-15',
    lures: ['Gold Spoon', 'Topwater', 'Soft Plastic'],
    desc: 'Productive drain system. Fish the moving water on tide changes.',
    media: [],
  },
  {
    id: 2, bay: 'matagorda', name: 'Deep Scatter Shell', type: 'wade',
    lat: 28.646207, lng: -95.922664,
    rating: 4.7,
    species: ['Redfish', 'Trout'],
    bestTide: 'Incoming', bestTime: '6-10 AM', bestSeason: 'Spring & Fall', bestWind: 'S-SE 10-15',
    lures: ['She Dog', 'Bass Assassin 4\u2033', 'Gold Spoon'],
    desc: 'Scattered shell bottom with good depth. Wade the edges on incoming tide.',
    media: [],
  },
  {
    id: 3, bay: 'matagorda', name: 'Park Boat', type: 'launch',
    lat: 28.63887, lng: -95.903967,
    rating: 4.5,
    species: [],
    bestTide: 'Any', bestTime: 'Any', bestSeason: 'Year-round', bestWind: 'Any',
    lures: [],
    desc: 'Anchor/park your boat here before wading out to fish. Not a harbor — this is where fishermen leave their boat and wade to nearby spots.',
    media: [],
  },
];
