    import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Tooltip, Polyline, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── ICONS ───
const I = ({ d, s = 20, c = 'currentColor', f = 'none', ...p }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={f} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{typeof d === 'string' ? <path d={d} /> : d}</svg>;
const FishI=p=><I {...p} d={<><path d="M6.5 12c-.94-3.46.02-8.88 7.5-11 0 0-1.2 3.27.5 5.5C16 8.77 20 10 21.5 12c-1.5 2-5.5 3.23-7 5.5-1.7 2.23-.5 5.5-.5 5.5-7.48-2.12-8.44-7.54-7.5-11z"/><path d="M2.5 12h4"/><path d="M17 12a1 1 0 1 0 0-.01"/></>}/>;
const WindI=p=><I {...p} d={<><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></>}/>;
const WaveI=p=><I {...p} d={<><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></>}/>;
const SunI=p=><I {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>}/>;
const PinI=p=><I {...p} d={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>}/>;
const UsrI=p=><I {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const NavI=p=><I {...p} d={<><polygon points="3 11 22 2 13 21 11 13 3 11"/></>}/>;
const StarI=p=><I {...p} d={<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>} f={p.filled?'currentColor':'none'}/>;
const XI=p=><I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const ChkI=p=><I {...p} d={<><polyline points="20 6 9 17 4 12"/></>}/>;
const PlusI=p=><I {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>;
const GearI=p=><I {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;
const CamI=p=><I {...p} d={<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>}/>;
const ImgI=p=><I {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>}/>;
const SparkI=p=><I {...p} d={<><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></>}/>;
const AnchorI=p=><I {...p} d={<><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></>}/>;
const ArrowLI=p=><I {...p} d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>}/>;
const EditI=p=><I {...p} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>;
const TrashI=p=><I {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;
const SaveI=p=><I {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>}/>;
const KeyI=p=><I {...p} d={<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}/>;
const UploadI=p=><I {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}/>;
const MapEdI=p=><I {...p} d={<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}/>;
const ThermI=p=><I {...p} d={<><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></>}/>;
const TargetI=p=><I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></>}/>;
const CopyI=p=><I {...p} d={<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}/>;
const DownloadI=p=><I {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
const SearchI=p=><I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const LayerI=p=><I {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;
const MoveI=p=><I {...p} d={<><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></>}/>;

// ─── THEME ───
const C={bg:'#0b1220',card:'#111b2e',card2:'#162036',bdr:'#1e2d47',bdr2:'#2a3f63',cyan:'#06b6d4',teal:'#14b8a6',amber:'#f59e0b',blue:'#3b82f6',green:'#10b981',red:'#ef4444',purple:'#8b5cf6',txt:'#e2e8f0',mid:'#94a3b8',dim:'#64748b'};
const Fnt="'Instrument Sans','DM Sans',system-ui,sans-serif";
const FM="'JetBrains Mono',monospace";

// ─── HELPERS ───
const sc=t=>({wade:C.amber,boat:C.blue,kayak:C.green,drivein:C.purple}[t]||C.dim);
const si=t=>({wade:'🚶',boat:'🚤',kayak:'🛶',drivein:'🚗'}[t]||'📍');
const li=t=>({boat:'⛵',kayak:'🛶',drivein:'🚗'}[t]||'📍');

// Create Leaflet divIcon for spots
function spotIcon(type, selected) {
  const col = sc(type);
  const icon = si(type);
  const size = selected ? 38 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:${selected?12:8}px;background:${col};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${selected?20:16}px;box-shadow:0 2px 10px #0006;cursor:pointer;transition:all 0.2s">${icon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

function launchIcon(type) {
  const icon = li(type);
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:8px;background:${C.bg};border:2px solid ${sc(type)};display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px #0004">${icon}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function photoIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${C.purple};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px #0006">📷</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function waypointIcon(index, status) {
  const col = status === 'done' ? C.green : status === 'active' ? C.cyan : '#475569';
  const label = status === 'done' ? '✓' : index + 1;
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${col};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;color:${status==='active'?C.bg:'#fff'};font-weight:700;font-size:14px;font-family:${Fnt};box-shadow:0 3px 10px #0006">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// ─── MAP FIT HELPER ───
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
}

// ─── BAY COORDINATE SYSTEMS ───
// Real GPS for Matagorda Bay area
const BAY_CONFIGS = {
  matagorda: {
    center: [28.72, -95.88],
    zoom: 11,
    // Convert position (0-100) to lat/lng
    toLatLng: (pos) => [28.85 - (pos.y / 100) * 0.32, -96.18 + (pos.x / 100) * 0.62],
  },
  galveston: {
    center: [29.30, -94.85],
    zoom: 11,
    toLatLng: (pos) => [29.45 - (pos.y / 100) * 0.30, -95.10 + (pos.x / 100) * 0.55],
  },
};

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [page,setPage]=useState('home');
  const [selBay,setSelBay]=useState(null);
  const [selSpot,setSelSpot]=useState(null);
  const [showRoute,setShowRoute]=useState(false);
  const [routeStep,setRouteStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [spotFilter,setSpotFilter]=useState('all');
  const [showAI,setShowAI]=useState(false);
  const [showBS,setShowBS]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showEditor,setShowEditor]=useState(false);
  const [showPhotoUp,setShowPhotoUp]=useState(false);
  const [copied,setCopied]=useState(false);
  const [edTab,setEdTab]=useState('spots');
  const [toast,setToast]=useState(null);
  const [settings,setSettings]=useState({claudeApiKey:'',autoAI:true,units:'imperial'});

  const [shadeZones,setShadeZones]=useState([
    {id:1,type:'wade',label:'Shell Island Wade Zone',cx:77,cy:25,rx:9,ry:5,color:C.amber,bay:'matagorda'},
    {id:2,type:'wade',label:'River Mouth Sand Bar',cx:18,cy:59,rx:6,ry:3,color:C.amber,bay:'matagorda'},
    {id:3,type:'kayak',label:'Oyster Lake Paddle Zone',cx:27,cy:42,rx:6,ry:4,color:C.green,bay:'matagorda'},
  ]);
  const [launches,setLaunches]=useState([
    {id:1,name:'Matagorda Harbor',type:'boat',position:{x:12,y:78},gps:'28.6847°N, 95.9654°W',notes:'50+ spots, fuel, bait',bay:'matagorda'},
    {id:2,name:'Oyster Lake Park',type:'kayak',position:{x:22,y:50},gps:'28.6912°N, 95.9234°W',notes:'Free, kayak-only',bay:'matagorda'},
    {id:3,name:'River Road Access',type:'drivein',position:{x:8,y:65},gps:'28.6801°N, 95.9601°W',notes:'4WD recommended',bay:'matagorda'},
    {id:4,name:'Texas City Dike',type:'boat',position:{x:50,y:60},gps:'29.3834°N, 94.9012°W',notes:'Public ramp, $12',bay:'galveston'},
  ]);
  const [communityPhotos]=useState([
    {id:1,user:'CaptMike',position:{x:73,y:30},caption:'Shell pad at low tide',time:'2 days ago',likes:24,bay:'matagorda'},
    {id:2,user:'WadeFisher22',position:{x:16,y:63},caption:'River mouth sandbar',time:'1 week ago',likes:18,bay:'matagorda'},
    {id:3,user:'KayakJen',position:{x:24,y:44},caption:'Tailing reds in back lake',time:'3 days ago',likes:31,bay:'matagorda'},
  ]);
  const [newShade,setNewShade]=useState({type:'wade',label:'',cx:50,cy:50,rx:8,ry:5});
  const [newLaunch,setNewLaunch]=useState({name:'',type:'boat',gps:'',notes:''});

  // ─── ENHANCED MAP EDITOR STATE ───
  const [edMapMode,setEdMapMode]=useState(null); // 'drop-pin','draw-route','draw-zone','measure'
  const [editingSpot,setEditingSpot]=useState(null);
  const [editingWaypoint,setEditingWaypoint]=useState(null);
  const [newSpotDraft,setNewSpotDraft]=useState({name:'',type:'wade',species:[],bestTide:'Incoming',bestTime:'',lures:[],desc:'',gps:{lat:'',lng:''},position:{x:50,y:50},route:[]});
  const [gpsInput,setGpsInput]=useState({mode:'click',lat:'',lng:'',dms:''});
  const [edSearch,setEdSearch]=useState('');
  const [edSortBy,setEdSortBy]=useState('name');
  const [wpFolders,setWpFolders]=useState([{id:'default',name:'All Spots',color:C.cyan},{id:'fav',name:'Favorites',color:C.amber},{id:'recent',name:'Recent Trips',color:C.green}]);
  const [selFolder,setSelFolder]=useState('default');
  const [photoGPS,setPhotoGPS]=useState(null);
  const [showGPSEntry,setShowGPSEntry]=useState(false);
  const [showExport,setShowExport]=useState(false);
  const [spotNotes,setSpotNotes]=useState({});

  const weather={temp:78,wind:12,windDir:'SE',gusts:18,conditions:'Partly Cloudy',waterTemp:71};
  const tide={status:'Rising',next:'High at 2:34 PM'};

  const bayData={
    matagorda:{id:'matagorda',name:'Matagorda Bay Complex',sub:'East & West Matagorda Bay',region:'Matagorda, TX',cameras:[{name:'Harbor'},{name:'River Mouth'}],reports:[{user:'CaptMike',time:'2h ago',text:'Solid box of trout on topwater at Shell Island.',likes:12},{user:'WadeFisher22',time:'5h ago',text:'Reds stacked on river mouth. Gold spoon.',likes:8},{user:'KayakJen',time:'Yesterday',text:'4 reds on Gulp in Oyster Lake back.',likes:15}]},
    galveston:{id:'galveston',name:'Galveston Bay Complex',sub:'West Bay, Trinity, East Bay',region:'Galveston, TX',cameras:[{name:'Pier Cam'}],reports:[{user:'BayRat',time:'3h ago',text:'Sheepshead at dike rocks. Fiddler crabs.',likes:9}]},
  };

  const allSpots=[
    {id:1,bay:'matagorda',name:'Shell Island Flats',type:'wade',position:{x:75,y:28},gps:{lat:'28.7234°N',lng:'95.8612°W'},rating:4.9,species:['Redfish','Trout','Flounder'],bestTide:'Incoming',bestTime:'5-9 AM',bestSeason:'Spring & Fall',bestWind:'SE 5-15',lures:['She Dog','Bass Assassin 4"','Gold Spoon'],desc:'Prime wade flat with scattered shell pads. Park boat 3ft south edge, wade north toward birds.',parking:{x:72,y:32},media:[{type:'photo',label:'Shell pad low tide'},{type:'video',label:'How to wade this flat'}],route:[{pos:{x:12,y:78},title:'Matagorda Harbor',desc:'Head east in channel',depth:'4-6 ft',heading:'090° E',warnings:['No wake in harbor']},{pos:{x:22,y:72},title:'Harbor Exit',desc:'Pass green G5 on port',depth:'6-8 ft',heading:'120° SE',warnings:[]},{pos:{x:35,y:65},title:'ICW Junction',desc:'Turn NE onto ICW',depth:'12-15 ft',heading:'045° NE',warnings:['Barge traffic — stay right']},{pos:{x:52,y:55},title:'ICW East',desc:'Continue 3 mi east',depth:'10-12 ft',heading:'065° ENE',warnings:[]},{pos:{x:68,y:42},title:'Bay Entry',desc:'Exit ICW north',depth:'4-5 ft',heading:'350° N',warnings:['CRITICAL: Oyster reefs both sides']},{pos:{x:72,y:32},title:'Anchor & Wade',desc:'Set anchor, wade north to shell',depth:'3-4 ft',heading:'320° NW',warnings:['Shuffle feet — stingrays']}]},
    {id:2,bay:'matagorda',name:'Bird Island Reef',type:'boat',position:{x:55,y:38},gps:{lat:'28.7089°N',lng:'95.8845°W'},rating:4.7,species:['Redfish','Black Drum','Sheepshead'],bestTide:'Moving',bestTime:'8-11 AM',bestSeason:'Year-round',bestWind:'S-SE <20',lures:['Live Shrimp','Blue Crab','Cut Mullet'],desc:'Drift reef edges or anchor leeward. Structure fishing all year.',parking:{x:53,y:41},media:[],route:[{pos:{x:12,y:78},title:'Harbor',desc:'East',depth:'4-6 ft',heading:'090°',warnings:[]},{pos:{x:35,y:65},title:'ICW',desc:'NE',depth:'12 ft',heading:'045°',warnings:['Barge traffic']},{pos:{x:45,y:55},title:'Exit ICW',desc:'North at marker 12',depth:'6-8 ft',heading:'340°',warnings:[]},{pos:{x:53,y:41},title:'Bird Island',desc:'Approach from south',depth:'4-5 ft',heading:'350°',warnings:['Shallow east']}]},
    {id:3,bay:'matagorda',name:'Oyster Lake Back',type:'kayak',position:{x:25,y:45},gps:{lat:'28.6912°N',lng:'95.9234°W'},rating:4.5,species:['Redfish','Flounder'],bestTide:'High incoming',bestTime:'Dawn',bestSeason:'Fall',bestWind:'Light N-NE',lures:['Gold Spoon','Gulp 3"','Topwater'],desc:'Skinny water kayak paradise. Sight-cast tailing reds.',parking:{x:22,y:50},media:[{type:'photo',label:'Dawn launch'}],route:[{pos:{x:22,y:50},title:'Oyster Lake Park',desc:'Paddle south',depth:'2-3 ft',heading:'180°',warnings:[]},{pos:{x:24,y:46},title:'South Channel',desc:'Follow cut',depth:'3-4 ft',heading:'170°',warnings:[]},{pos:{x:26,y:43},title:'Back Flat',desc:'Fan cast grass',depth:'1-3 ft',heading:'Varies',warnings:['Very shallow low tide']}]},
    {id:4,bay:'matagorda',name:'Colorado River Mouth',type:'wade',position:{x:15,y:62},gps:{lat:'28.6756°N',lng:'95.9512°W'},rating:4.8,species:['Redfish','Trout','Snook'],bestTide:'Outgoing',bestTime:'4-7 PM',bestSeason:'Summer & Fall',bestWind:'Any <15',lures:['Topwater','Soft Plastic','Live Croaker'],desc:'Where river meets bay. Only reliable snook spot in TX bays.',parking:{x:12,y:66},media:[{type:'video',label:'Snook on outgoing'}],route:[{pos:{x:12,y:78},title:'Harbor',desc:'West',depth:'4-6 ft',heading:'270°',warnings:[]},{pos:{x:10,y:72},title:'West Channel',desc:'Follow shore',depth:'6-8 ft',heading:'290°',warnings:[]},{pos:{x:12,y:66},title:'River Mouth',desc:'East approach',depth:'5-6 ft',heading:'340°',warnings:['Strong current']}]},
    {id:5,bay:'matagorda',name:'Army Hole',type:'boat',position:{x:42,y:50},gps:{lat:'28.6998°N',lng:'95.9001°W'},rating:4.6,species:['Trout','Redfish'],bestTide:'Incoming',bestTime:'6-10 AM',bestSeason:'Winter & Spring',bestWind:'N 10-20',lures:['MirrOlure','Jerk Shad','Live Shrimp'],desc:'Deep hole (8-12ft) near ICW. Fish stage here in cold fronts.',parking:{x:40,y:52},media:[],route:[{pos:{x:12,y:78},title:'Harbor',desc:'East',depth:'4-6 ft',heading:'090°',warnings:[]},{pos:{x:35,y:65},title:'ICW',desc:'NE',depth:'12 ft',heading:'045°',warnings:[]},{pos:{x:40,y:52},title:'Army Hole',desc:'North, find drop-off',depth:'8-12 ft',heading:'340°',warnings:['Mark depth on sonar']}]},
  ];

  const boatShareListings = [
    {id:1,name:'Mike R.',age:'Late 30s',boat:'22ft Haynie BigFoot — "Reel Deal"',avatar:'🎣',trips:47,rating:4.9,date:'Tomorrow (Tue)',time:'5:30 AM',launch:'Matagorda Harbor',area:'East Matagorda — shell flats',spotsOpen:2,gasSplit:'$30/person',plan:'Running to Shell Island area. Gonna wade the shell pads on incoming tide. Targeting reds and trout. Usually fish till noon-ish depending on bite.',lookingFor:'experienced',lookingDesc:'Experienced wade fisherman who can fish independently. You do your thing, I\'ll do mine — we meet back at the boat. Bring your own gear and lures.',rules:['Bring own tackle','Wade boots required','Be at ramp by 5:15','No keep if over limit'],vibe:'Serious fishing. I\'m not out there to socialize — I\'m there to catch fish. That said, I\'m happy to share what\'s working.'},
    {id:2,name:'Tommy D.',age:'50s',boat:'24ft Shallow Sport Mod-V — "Cold Beer"',avatar:'🍺',trips:89,rating:4.8,date:'Saturday',time:'6:00 AM',launch:'Matagorda Harbor',area:'West Mat — Bird Island, Army Hole',spotsOpen:3,gasSplit:'$25/person',plan:'Drifting reefs and deep holes. Got a 45qt of live shrimp coming. We\'ll soak baits, drink some beer, and see what happens. Usually stay out till 2-3pm.',lookingFor:'anyone',lookingDesc:'Anybody is welcome. Don\'t need your own gear — I\'ve got extra rods and live bait for everyone. Great trip if you\'re new or just want a chill day on the water.',rules:['BYOB','Sunscreen — no shade on this boat','$25 covers bait too','Kids welcome'],vibe:'Low-key day on the water. We\'re gonna catch fish, but the main point is getting out there, having a cold one, and enjoying it.'},
    {id:3,name:'Sarah & Jake',age:'Late 20s',boat:'18ft Majek Extreme — "Skinny Dipper"',avatar:'🐟',trips:23,rating:4.7,date:'Sunday',time:'5:00 AM',launch:'River Road Access',area:'Colorado River Mouth — wade trip',spotsOpen:1,gasSplit:'$20/person',plan:'Short boat ride to the river mouth. All wading — targeting snook and reds on outgoing tide. Back by noon.',lookingFor:'intermediate',lookingDesc:'Someone comfortable wading waist-deep in current. Should know topwater and soft plastics. We fish together and share intel.',rules:['Own gear required','Wading belt mandatory','Share GPS spots from the day'],vibe:'We fish as a team. Call out bait, share what\'s working, hype each other up. If you catch a snook we\'re all celebrating.'},
    {id:4,name:'Big Ray',age:'60s',boat:'21ft Dargel Skout — "Pay Day"',avatar:'⚓',trips:'200+',rating:5.0,date:'Wednesday',time:'4:30 AM',launch:'Matagorda Harbor',area:'East Mat — multiple spots',spotsOpen:1,gasSplit:'$35/person',plan:'Full day — leaving in the dark. I fish 3-4 spots depending on conditions. I know every reef in this bay.',lookingFor:'experienced',lookingDesc:'Serious fisherman only. You need to keep up, wade fast, and not need babysitting. 30+ years on this bay.',rules:['There by 4:15 or I leave','Own premium gear','No phones during fishing','Split cleaning at dock'],vibe:'Old school. No nonsense. I don\'t talk much on the water. But I\'ll put you on fish you didn\'t know existed.'},
  ];

  const bayConfig = selBay ? BAY_CONFIGS[selBay.id] : BAY_CONFIGS.matagorda;
  const baySpots = allSpots.filter(s=>s.bay===selBay?.id);
  const filtered = spotFilter==='all'?baySpots:baySpots.filter(s=>s.type===spotFilter);
  const bayPhotos = communityPhotos.filter(p=>p.bay===selBay?.id);
  const bayLaunches = launches.filter(l=>l.bay===(selBay?.id||'matagorda'));
  const bayShades = shadeZones.filter(z=>z.bay===(selBay?.id||'matagorda'));
  const curRoute = selSpot?.route||[];
  const curWP = curRoute[routeStep];

  // ─── GPS & COORDINATE HELPERS ───
  const parseDMS = (dms) => {
    // Parse "28°43'24.1\"N 95°52'36.2\"W" or "28 43 24.1 N 95 52 36.2 W"
    const parts = dms.replace(/[°'"]/g,' ').trim().split(/\s+/);
    if(parts.length >= 4) {
      const lat = parseFloat(parts[0]) + parseFloat(parts[1]||0)/60 + parseFloat(parts[2]||0)/3600;
      const latDir = parts[3]?.toUpperCase();
      let lng, lngDir;
      if(parts.length >= 8) { lng = parseFloat(parts[4]) + parseFloat(parts[5]||0)/60 + parseFloat(parts[6]||0)/3600; lngDir = parts[7]?.toUpperCase(); }
      else if(parts.length >= 6) { lng = parseFloat(parts[4]) + parseFloat(parts[5]||0)/60; lngDir = parts[6]?.toUpperCase(); }
      return { lat: latDir==='S' ? -lat : lat, lng: lngDir==='W' ? -lng : lng };
    }
    return null;
  };

  const parseDecimal = (input) => {
    // Parse "28.7234, -95.8612" or "28.7234°N, 95.8612°W"
    const clean = input.replace(/[°NSEW,]/gi,' ').trim().split(/\s+/);
    if(clean.length >= 2) {
      let lat = parseFloat(clean[0]), lng = parseFloat(clean[1]);
      if(input.match(/[Ss]/)) lat = -Math.abs(lat);
      if(input.match(/[Ww]/)) lng = -Math.abs(lng);
      if(!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  const parseGPS = (input) => {
    if(!input) return null;
    return parseDecimal(input) || parseDMS(input);
  };

  const formatGPS = (lat, lng) => {
    const la = Math.abs(lat).toFixed(4); const lo = Math.abs(lng).toFixed(4);
    return `${la}°${lat>=0?'N':'S'}, ${lo}°${lat>=0?'':''}${lng<=0?'W':'E'}`;
  };

  const gpsToPosition = (lat, lng) => {
    // Reverse of toLatLng: lat = 28.85 - (y/100)*0.32, lng = -96.18 + (x/100)*0.62
    const y = ((28.85 - lat) / 0.32) * 100;
    const x = ((lng + 96.18) / 0.62) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const extractPhotoGPS = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const view = new DataView(e.target.result);
          if(view.getUint16(0) !== 0xFFD8) { resolve(null); return; }
          let offset = 2;
          while(offset < view.byteLength) {
            if(view.getUint16(offset) === 0xFFE1) {
              const exifData = parseExifGPS(view, offset + 4);
              resolve(exifData);
              return;
            }
            offset += 2 + view.getUint16(offset + 2);
          }
          resolve(null);
        } catch(err) { resolve(null); }
      };
      reader.readAsArrayBuffer(file.slice(0, 131072)); // Read first 128KB
    });
  };

  const parseExifGPS = (view, start) => {
    try {
      if(view.getUint32(start) !== 0x45786966) return null; // "Exif"
      const tiffStart = start + 6;
      const bigEndian = view.getUint16(tiffStart) === 0x4D4D;
      const g16 = (o) => bigEndian ? view.getUint16(o) : view.getUint16(o, true);
      const g32 = (o) => bigEndian ? view.getUint32(o) : view.getUint32(o, true);
      const gR = (o) => g32(o) / g32(o+4); // rational
      let ifdOff = tiffStart + g32(tiffStart + 4);
      // Find GPS IFD pointer in IFD0
      let gpsOff = 0;
      const entries = g16(ifdOff);
      for(let i = 0; i < entries; i++) {
        const tag = g16(ifdOff + 2 + i*12);
        if(tag === 0x8825) { gpsOff = tiffStart + g32(ifdOff + 2 + i*12 + 8); break; }
      }
      if(!gpsOff) return null;
      // Parse GPS IFD
      const gpsEntries = g16(gpsOff);
      let latRef='N', lngRef='W', latVals=null, lngVals=null;
      for(let i = 0; i < gpsEntries; i++) {
        const tag = g16(gpsOff + 2 + i*12);
        const valOff = tiffStart + g32(gpsOff + 2 + i*12 + 8);
        if(tag === 1) latRef = String.fromCharCode(view.getUint8(gpsOff + 2 + i*12 + 8));
        if(tag === 2) latVals = [gR(valOff), gR(valOff+8), gR(valOff+16)];
        if(tag === 3) lngRef = String.fromCharCode(view.getUint8(gpsOff + 2 + i*12 + 8));
        if(tag === 4) lngVals = [gR(valOff), gR(valOff+8), gR(valOff+16)];
      }
      if(!latVals || !lngVals) return null;
      let lat = latVals[0] + latVals[1]/60 + latVals[2]/3600;
      let lng = lngVals[0] + lngVals[1]/60 + lngVals[2]/3600;
      if(latRef === 'S') lat = -lat;
      if(lngRef === 'W') lng = -lng;
      return { lat, lng };
    } catch(e) { return null; }
  };

  const generateGPX = (spots) => {
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="TexasTides">\n  <metadata><name>TexasTides Fishing Spots</name><time>${new Date().toISOString()}</time></metadata>\n`;
    spots.forEach(s => {
      const [lat, lng] = bayConfig.toLatLng(s.position);
      gpx += `  <wpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"><name>${s.name}</name><desc>${s.desc||''}</desc><type>${s.type}</type></wpt>\n`;
      if(s.route) {
        gpx += `  <rte><name>${s.name} Route</name>\n`;
        s.route.forEach((wp,i) => {
          const [wlat, wlng] = bayConfig.toLatLng(wp.pos);
          gpx += `    <rtept lat="${wlat.toFixed(6)}" lon="${wlng.toFixed(6)}"><name>${wp.title}</name><desc>${wp.desc||''}</desc></rtept>\n`;
        });
        gpx += `  </rte>\n`;
      }
    });
    gpx += `</gpx>`;
    return gpx;
  };

  const downloadFile = (content, filename, type='text/xml') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const parseGPXFile = (text) => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const wpts = xml.querySelectorAll('wpt');
      const imported = [];
      wpts.forEach(wpt => {
        const lat = parseFloat(wpt.getAttribute('lat'));
        const lng = parseFloat(wpt.getAttribute('lon'));
        const name = wpt.querySelector('name')?.textContent || 'Imported Spot';
        const desc = wpt.querySelector('desc')?.textContent || '';
        const type = wpt.querySelector('type')?.textContent || 'boat';
        const pos = gpsToPosition(lat, lng);
        imported.push({ id: Date.now() + Math.random(), bay:'matagorda', name, type: ['wade','boat','kayak'].includes(type)?type:'boat', position: pos, gps:{lat:formatGPS(lat,lng).split(',')[0],lng:formatGPS(lat,lng).split(',')[1]?.trim()}, rating:0, species:[], bestTide:'Any', bestTime:'', bestSeason:'', bestWind:'', lures:[], desc, parking:pos, media:[], route:[] });
      });
      return imported;
    } catch(e) { return []; }
  };

  // Convert shade zone to polygon points
  const shadeToPolygon = (z) => {
    const pts = [];
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const latR = (z.ry / 100) * 0.32;
      const lngR = (z.rx / 100) * 0.62;
      const center = bayConfig.toLatLng({ x: z.cx, y: z.cy });
      pts.push([center[0] + Math.sin(a) * latR, center[1] + Math.cos(a) * lngR]);
    }
    return pts;
  };

  // Route coords
  const routeCoords = useMemo(() => {
    if (!showRoute || !selSpot?.route) return [];
    return selSpot.route.map(w => bayConfig.toLatLng(w.pos));
  }, [showRoute, selSpot, bayConfig]);

  const routeBounds = useMemo(() => {
    if (showRoute && routeCoords.length >= 2) return routeCoords;
    if (filtered.length >= 2) return filtered.map(s => bayConfig.toLatLng(s.position));
    return null;
  }, [showRoute, routeCoords, filtered, bayConfig]);

  useEffect(()=>{
    if(playing&&curRoute.length){
      const t=setInterval(()=>setRouteStep(p=>{if(p>=curRoute.length-1){setPlaying(false);return p;}return p+1;}),3500);
      return ()=>clearInterval(t);
    }
  },[playing,curRoute.length]);

  const showT=m=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const cpGPS=g=>{navigator.clipboard?.writeText(`${g.lat}, ${g.lng}`);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const openBay=id=>{setSelBay(bayData[id]);setPage('bay');setSelSpot(null);setShowRoute(false);setShowBS(false);setSpotFilter('all');};
  const openSpot=useCallback(s=>{setSelSpot(s);setShowRoute(false);setRouteStep(0);},[]);
  const startNav=()=>{setShowRoute(true);setRouteStep(0);setPlaying(false);};
  const lfColor=t=>({experienced:C.amber,intermediate:C.cyan,anyone:C.green}[t]||C.mid);
  const lfLabel=t=>({experienced:'Experienced Fisherman',intermediate:'Intermediate — Knows Basics',anyone:'Anyone Welcome — All Levels'}[t]||t);

  // ─── UI COMPONENTS ───
  const Btn=({children,primary,small,danger,...p})=><button {...p} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:small?'6px 12px':'10px 18px',borderRadius:small?6:10,background:danger?`${C.red}20`:primary?`linear-gradient(135deg,${C.cyan},${C.teal})`:C.card2,color:danger?C.red:primary?C.bg:C.mid,border:`1px solid ${danger?`${C.red}40`:primary?'transparent':C.bdr}`,fontWeight:primary?700:500,fontSize:small?12:14,cursor:'pointer',fontFamily:Fnt,...(p.style||{})}}>{children}</button>;
  const Lbl=({children})=><div style={{fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700,marginBottom:6}}>{children}</div>;
  const Inp=({label,...p})=><div style={{marginBottom:12}}>{label&&<Lbl>{label}</Lbl>}<input {...p} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none',...(p.style||{})}}/></div>;
  const Sel=({label,options,...p})=><div style={{marginBottom:12}}>{label&&<Lbl>{label}</Lbl>}<select {...p} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:13,fontFamily:Fnt,...(p.style||{})}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
  const Badge=({color,children})=><span style={{padding:'3px 10px',borderRadius:6,background:`${color}20`,color,fontSize:11,fontWeight:600}}>{children}</span>;
  const Modal=({title,sub,onClose,wide,children})=>(
    <div style={{position:'fixed',inset:0,background:'#000a',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:20,maxWidth:wide?800:560,width:'100%',maxHeight:'90vh',overflow:'auto',border:`1px solid ${C.bdr2}`}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'16px 24px',borderBottom:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:C.card,zIndex:1,borderRadius:'20px 20px 0 0'}}>
          <div><div style={{fontWeight:700,fontSize:16}}>{title}</div>{sub&&<div style={{fontSize:12,color:C.mid}}>{sub}</div>}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.dim,cursor:'pointer'}}><XI s={18}/></button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:Fnt,background:C.bg,color:C.txt,minHeight:'100vh'}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <header style={{background:C.card,borderBottom:`1px solid ${C.bdr}`,padding:'10px 20px',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>{setPage('home');setSelBay(null);setSelSpot(null);setShowBS(false);}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.cyan},${C.teal})`,display:'flex',alignItems:'center',justifyContent:'center'}}><FishI s={20} c="#0b1220"/></div>
            <div><div style={{fontSize:18,fontWeight:700}}>TEXAS<span style={{color:C.cyan}}>TIDES</span></div><div style={{fontSize:10,color:C.dim,letterSpacing:'0.1em'}}>COASTAL FISHING GUIDE</div></div>
          </div>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            {[{l:'Map',i:<PinI s={14}/>,a:()=>{setShowBS(false);if(!selBay)setPage('home');},on:!showBS},{l:'BoatShare',i:<UsrI s={14}/>,a:()=>setShowBS(true),on:showBS}].map(t=><button key={t.l} onClick={t.a} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,background:t.on?C.cyan:'transparent',color:t.on?C.bg:C.mid,border:'none',cursor:'pointer',fontFamily:Fnt}}>{t.i} {t.l}</button>)}
            <div style={{width:1,height:24,background:C.bdr,margin:'0 4px'}}/>
            <button onClick={()=>setShowEditor(true)} style={{padding:'7px 10px',borderRadius:8,background:'transparent',border:'none',color:C.mid,cursor:'pointer'}} title="Map Editor"><MapEdI s={16}/></button>
            <button onClick={()=>setShowSettings(true)} style={{padding:'7px 10px',borderRadius:8,background:'transparent',border:'none',color:C.mid,cursor:'pointer'}} title="Settings"><GearI s={16}/></button>
          </div>
        </div>
      </header>

      {/* WEATHER */}
      <div style={{background:`${C.card}99`,borderBottom:`1px solid ${C.bdr}`,padding:'7px 20px'}}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',flexWrap:'wrap',alignItems:'center',gap:16,fontSize:12}}>
          <span style={{display:'flex',alignItems:'center',gap:5}}><ThermI s={13} c={C.amber}/> {weather.temp}°F</span>
          <span style={{display:'flex',alignItems:'center',gap:5}}><WindI s={13} c={C.cyan}/> {weather.wind} mph {weather.windDir} (gusts {weather.gusts})</span>
          <span style={{display:'flex',alignItems:'center',gap:5}}><WaveI s={13} c={C.teal}/> {tide.status} → {tide.next}</span>
          <span>💧 {weather.waterTemp}°F</span>
          <span style={{marginLeft:'auto',color:C.cyan}}><SunI s={13}/> {weather.conditions}</span>
        </div>
      </div>

      <main style={{maxWidth:1280,margin:'0 auto',padding:20}}>
        {/* HOME */}
        {page==='home'&&!showBS&&(
          <div>
            <div style={{marginBottom:28,padding:'36px 28px',borderRadius:16,background:`linear-gradient(135deg,${C.card},#0d2847)`,border:`1px solid ${C.bdr}`,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,right:0,width:300,height:200,background:`radial-gradient(circle at 100% 0%,${C.cyan}15,transparent 70%)`}}/>
              <h2 style={{fontSize:26,fontWeight:700,marginBottom:6}}>Texas Bay Fishing Guide</h2>
              <p style={{color:C.mid,fontSize:14,maxWidth:580,lineHeight:1.6,marginBottom:16}}>Real satellite imagery, GPS waypoints, navigation routes, community reports, and AI-powered spot recommendations.</p>
              <Btn primary onClick={()=>setShowAI(true)}><SparkI s={14} c={C.bg}/> Where Should I Fish Today?</Btn>
            </div>
            <Lbl>Select a Bay System</Lbl>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16,marginTop:8}}>
              {Object.values(bayData).map(bay=>(
                <div key={bay.id} onClick={()=>openBay(bay.id)} style={{background:C.card,borderRadius:14,border:`1px solid ${C.bdr}`,overflow:'hidden',cursor:'pointer',transition:'border-color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan} onMouseLeave={e=>e.currentTarget.style.borderColor=C.bdr}>
                  <div style={{height:160,background:'#081828',position:'relative',overflow:'hidden'}}>
                    <img src={`https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/10/${bay.id==='matagorda'?'410/254':'409/254'}.jpg`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.background='#0c4a6e';}} />
                    <div style={{position:'absolute',inset:0,background:'linear-gradient(transparent 40%,#081828)'}}/>
                    <div style={{position:'absolute',bottom:8,left:10,display:'flex',gap:6}}>
                      {bay.cameras?.map(c=><span key={c.name} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:4,background:'#000a',fontSize:9,fontWeight:700}}><span style={{width:5,height:5,borderRadius:'50%',background:C.red}}/>LIVE</span>)}
                    </div>
                  </div>
                  <div style={{padding:14}}>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:3}}>{bay.name}</h3>
                    <p style={{fontSize:12,color:C.mid,marginBottom:10}}>{bay.sub} — {bay.region}</p>
                    {bay.reports?.[0]&&<div style={{background:C.card2,borderRadius:8,padding:10,border:`1px solid ${C.bdr}`}}><div style={{display:'flex',gap:6,marginBottom:4,fontSize:11}}><span style={{fontWeight:600,color:C.cyan}}>{bay.reports[0].user}</span><span style={{color:C.dim}}>{bay.reports[0].time}</span></div><p style={{fontSize:11,color:C.mid,margin:0,lineHeight:1.4}}>{bay.reports[0].text}</p></div>}
                    <div style={{marginTop:10,fontSize:11,color:C.dim}}>{allSpots.filter(s=>s.bay===bay.id).length} spots • {launches.filter(l=>l.bay===bay.id).length} launches</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BAY DETAIL */}
        {page==='bay'&&selBay&&!showBS&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <button onClick={()=>{setPage('home');setSelBay(null);setSelSpot(null);}} style={{padding:'5px 10px',borderRadius:6,background:C.card,border:`1px solid ${C.bdr}`,color:C.mid,cursor:'pointer',fontFamily:Fnt,fontSize:12,display:'flex',alignItems:'center',gap:4}}><ArrowLI s={13}/> Back</button>
              <div><h2 style={{fontSize:20,fontWeight:700}}>{selBay.name}</h2><p style={{fontSize:12,color:C.mid}}>{selBay.sub} — Satellite imagery</p></div>
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <Btn small onClick={()=>setShowPhotoUp(true)}><CamI s={13}/> Add Photo</Btn>
                <Btn small primary onClick={()=>setShowAI(true)}><SparkI s={13} c={C.bg}/> AI Advisor</Btn>
              </div>
            </div>
            <div style={{display:'flex',gap:4,marginBottom:14}}>
              {[{id:'all',l:'All',i:'📍'},{id:'wade',l:'Wade',i:'🚶'},{id:'boat',l:'Boat',i:'🚤'},{id:'kayak',l:'Kayak',i:'🛶'}].map(f=><button key={f.id} onClick={()=>setSpotFilter(f.id)} style={{display:'flex',alignItems:'center',gap:3,padding:'5px 12px',borderRadius:6,fontSize:11,fontWeight:600,background:spotFilter===f.id?C.cyan:C.card,color:spotFilter===f.id?C.bg:C.mid,border:`1px solid ${spotFilter===f.id?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:Fnt}}>{f.i} {f.l}</button>)}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:14}}>
              {/* SATELLITE MAP */}
              <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.bdr}`,overflow:'hidden'}}>
                <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.bdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{showRoute?`Route → ${selSpot?.name}`:'Satellite Fishing Map'}</div><div style={{fontSize:11,color:C.dim}}>Sentinel-2 / USGS / ESRI — Toggle layers top-right</div></div>
                  {showRoute&&<button onClick={()=>{setShowRoute(false);setRouteStep(0);setPlaying(false);}} style={{fontSize:11,color:C.mid,background:C.card2,border:`1px solid ${C.bdr}`,borderRadius:5,padding:'4px 10px',cursor:'pointer',fontFamily:Fnt}}>← Map</button>}
                </div>

                <div style={{height:500}}>
                  <MapContainer center={bayConfig.center} zoom={bayConfig.zoom} style={{height:'100%',width:'100%'}} zoomControl={false} key={selBay.id}>
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="Sentinel-2 Satellite">
                        <TileLayer url="https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg" maxZoom={15} attribution="Sentinel-2 © EOX"/>
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="USGS Aerial">
                        <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}" maxZoom={16} attribution="USGS"/>
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="ESRI World Imagery">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={18} attribution="Esri"/>
                      </LayersControl.BaseLayer>
                    </LayersControl>

                    {routeBounds && <FitBounds bounds={routeBounds} />}

                    {/* Shade zones */}
                    {!showRoute && bayShades.map(z=>(
                      <Polygon key={z.id} positions={shadeToPolygon(z)} pathOptions={{color:z.color,weight:1.5,dashArray:'6 4',fillColor:z.color,fillOpacity:0.12}}>
                        <Tooltip>{z.label}</Tooltip>
                      </Polygon>
                    ))}

                    {/* Launch markers */}
                    {!showRoute && bayLaunches.map(l=>(
                      <Marker key={`l${l.id}`} position={bayConfig.toLatLng(l.position)} icon={launchIcon(l.type)}>
                        <Tooltip><b>{l.name}</b><br/>{l.notes}</Tooltip>
                      </Marker>
                    ))}

                    {/* Photo markers */}
                    {!showRoute && bayPhotos.map(p=>(
                      <Marker key={`p${p.id}`} position={bayConfig.toLatLng(p.position)} icon={photoIcon()}>
                        <Popup><b>{p.caption}</b><br/><span style={{fontSize:11}}>by {p.user} • {p.time} • ❤️ {p.likes}</span></Popup>
                      </Marker>
                    ))}

                    {/* Route */}
                    {showRoute && routeCoords.length > 0 && <>
                      <Polyline positions={routeCoords} pathOptions={{color:C.cyan,weight:3,dashArray:'8 6',opacity:0.4}}/>
                      {routeStep > 0 && <Polyline positions={routeCoords.slice(0,routeStep+1)} pathOptions={{color:'#22d3ee',weight:4,opacity:0.9}}/>}
                      {selSpot.route.map((w,i)=>{
                        const status = i<routeStep?'done':i===routeStep?'active':'pending';
                        return(
                          <Marker key={`wp${i}`} position={bayConfig.toLatLng(w.pos)} icon={waypointIcon(i,status)} eventHandlers={{click:()=>setRouteStep(i)}}>
                            <Tooltip><b>{w.title}</b><br/>{w.desc}<br/>Depth: {w.depth}</Tooltip>
                          </Marker>
                        );
                      })}
                      {routeCoords[routeStep] && <Circle center={routeCoords[routeStep]} radius={400} pathOptions={{color:C.cyan,fillColor:C.cyan,fillOpacity:0.12,weight:1}}/>}
                    </>}

                    {/* Spot markers */}
                    {!showRoute && filtered.map(s=>(
                      <Marker key={`s${s.id}`} position={bayConfig.toLatLng(s.position)} icon={spotIcon(s.type,selSpot?.id===s.id)} eventHandlers={{click:()=>openSpot(s)}}>
                        <Tooltip><b>{s.name}</b><br/>⭐ {s.rating} • {s.species.slice(0,2).join(', ')}</Tooltip>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                {showRoute&&<div style={{padding:'10px 14px',borderTop:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',gap:3}}>
                    {[{i:'◀',fn:()=>setRouteStep(Math.max(0,routeStep-1)),d:!routeStep},{i:playing?'⏸':'▶',fn:()=>setPlaying(!playing),p:true},{i:'▶',fn:()=>setRouteStep(Math.min(curRoute.length-1,routeStep+1)),d:routeStep>=curRoute.length-1},{i:'↺',fn:()=>{setRouteStep(0);setPlaying(false);}}].map((b,i)=><button key={i} onClick={b.fn} disabled={b.d} style={{width:b.p?40:32,height:32,borderRadius:6,background:b.p?(playing?C.amber:C.cyan):C.card2,border:`1px solid ${C.bdr}`,color:b.p?C.bg:'#fff',cursor:b.d?'default':'pointer',opacity:b.d?.4:1,fontFamily:Fnt,fontSize:13}}>{b.i}</button>)}
                  </div>
                  <div style={{display:'flex',gap:3}}>{curRoute.map((_,i)=><button key={i} onClick={()=>setRouteStep(i)} style={{width:i===routeStep?18:6,height:6,borderRadius:3,background:i<routeStep?C.green:i===routeStep?C.cyan:C.bdr,border:'none',cursor:'pointer',transition:'all 0.2s'}}/>)}</div>
                  <span style={{fontSize:11,color:C.dim}}>Step {routeStep+1}/{curRoute.length}</span>
                </div>}
              </div>

              {/* RIGHT PANEL */}
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {selSpot?<>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,overflow:'hidden'}}>
                    <div style={{padding:14,borderBottom:`1px solid ${C.bdr}`,background:`${sc(selSpot.type)}08`}}>
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <div style={{display:'flex',gap:10,alignItems:'center'}}>
                          <div style={{width:40,height:40,borderRadius:10,background:sc(selSpot.type),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{si(selSpot.type)}</div>
                          <div><div style={{fontSize:15,fontWeight:700}}>{selSpot.name}</div><div style={{fontSize:12,color:C.mid}}><StarI s={12} c={C.amber} filled/> {selSpot.rating} <Badge color={sc(selSpot.type)}>{selSpot.type}</Badge></div></div>
                        </div>
                        <button onClick={()=>{setSelSpot(null);setShowRoute(false);}} style={{background:'none',border:'none',color:C.dim,cursor:'pointer'}}><XI s={16}/></button>
                      </div>
                    </div>
                    <div style={{padding:14,fontSize:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.card2,borderRadius:8,padding:'8px 10px',marginBottom:10}}>
                        <div><div style={{fontSize:9,color:C.dim}}>GPS</div><div style={{fontFamily:FM,fontSize:12}}>{selSpot.gps.lat}, {selSpot.gps.lng}</div></div>
                        <button onClick={()=>cpGPS(selSpot.gps)} style={{padding:'4px 8px',borderRadius:4,background:copied?C.green:C.card,border:`1px solid ${C.bdr}`,color:copied?'#fff':C.mid,cursor:'pointer',fontSize:10,fontFamily:Fnt}}>{copied?'✓':'Copy'}</button>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:10}}>{selSpot.species.map(s=><Badge key={s} color={C.teal}>{s}</Badge>)}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                        {[['Tide',selSpot.bestTide],['Time',selSpot.bestTime],['Season',selSpot.bestSeason],['Wind',selSpot.bestWind]].map(([l,v])=><div key={l} style={{background:C.card2,borderRadius:6,padding:'6px 8px'}}><div style={{fontSize:9,color:C.dim}}>{l}</div><div style={{fontWeight:600,fontSize:11}}>{v}</div></div>)}
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:10}}>{selSpot.lures.map(l=><Badge key={l} color={C.cyan}>{l}</Badge>)}</div>
                      <p style={{color:C.mid,lineHeight:1.5,marginBottom:12}}>{selSpot.desc}</p>
                      {selSpot.media?.length>0&&<div style={{display:'flex',gap:6,marginBottom:12}}>{selSpot.media.map((m,i)=><div key={i} style={{flex:1,background:C.card2,borderRadius:8,padding:8,border:`1px solid ${C.bdr}`,cursor:'pointer'}}><div style={{fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>{m.type==='video'?'🎥':'📷'} {m.label}</div></div>)}</div>}
                      <Btn primary style={{width:'100%'}} onClick={startNav}><NavI s={14} c={C.bg}/> Navigate Here</Btn>
                    </div>
                  </div>
                  {showRoute&&curWP&&<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.cyan}40`,padding:14}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:C.cyan,display:'flex',alignItems:'center',justifyContent:'center',color:C.bg,fontWeight:700,fontSize:14}}>{routeStep+1}</div>
                      <div><div style={{fontWeight:700,fontSize:13}}>{curWP.title}</div><div style={{fontSize:11,color:C.cyan}}>Heading: {curWP.heading} • Depth: {curWP.depth}</div></div>
                    </div>
                    <p style={{fontSize:12,color:C.mid,lineHeight:1.5,marginBottom:8}}>{curWP.desc}</p>
                    {curWP.warnings?.length>0&&<div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}20`,borderRadius:6,padding:8}}>{curWP.warnings.map((w,i)=><div key={i} style={{fontSize:11,color:C.mid}}>⚠ {w}</div>)}</div>}
                  </div>}
                </>:<>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,padding:14}}>
                    <Lbl>Fishing Spots ({filtered.length})</Lbl>
                    <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:220,overflow:'auto'}}>
                      {filtered.map(s=><button key={s.id} onClick={()=>openSpot(s)} style={{display:'flex',alignItems:'center',gap:8,padding:8,borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,cursor:'pointer',textAlign:'left',width:'100%',fontFamily:Fnt,color:C.txt}}><div style={{width:32,height:32,borderRadius:6,background:sc(s.type),display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{si(s.type)}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12}}>{s.name}</div><div style={{fontSize:10,color:C.dim}}><StarI s={9} c={C.amber} filled/> {s.rating} • {s.species.slice(0,2).join(', ')}</div></div></button>)}
                    </div>
                  </div>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,padding:14}}>
                    <Lbl>Recent Reports</Lbl>
                    {selBay.reports?.map((r,i)=><div key={i} style={{background:C.card2,borderRadius:8,padding:8,marginBottom:6,border:`1px solid ${C.bdr}`}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:11}}><span style={{fontWeight:600,color:C.cyan}}>{r.user}</span><span style={{color:C.dim}}>{r.time}</span></div><p style={{fontSize:11,color:C.mid,margin:0,lineHeight:1.4}}>{r.text}</p></div>)}
                  </div>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,padding:14}}>
                    <Lbl>Launch Points</Lbl>
                    {bayLaunches.map(l=><div key={l.id} style={{display:'flex',gap:8,alignItems:'center',padding:8,background:C.card2,borderRadius:8,marginBottom:4,border:`1px solid ${C.bdr}`}}><span style={{fontSize:18}}>{li(l.type)}</span><div><div style={{fontSize:12,fontWeight:600}}>{l.name}</div><div style={{fontSize:10,color:C.dim}}>{l.notes}</div></div></div>)}
                  </div>
                </>}
              </div>
            </div>
          </div>
        )}

        {/* BOATSHARE */}
        {showBS&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div><h2 style={{fontSize:22,fontWeight:700}}>BoatShare</h2><p style={{color:C.mid,fontSize:13}}>Local guys heading out — split gas, share the ride</p></div>
              <Btn primary><PlusI s={14} c={C.bg}/> Post Your Trip</Btn>
            </div>
            <p style={{color:C.dim,fontSize:12,marginBottom:20,lineHeight:1.5}}>These aren't guides — just regular fishermen with open spots on their boat. Chip in for gas, bring your gear (or not), and go fishing.</p>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {boatShareListings.map(l=>(
                <div key={l.id} style={{background:C.card,borderRadius:16,border:`1px solid ${C.bdr}`,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                    <div style={{padding:20,borderRight:`1px solid ${C.bdr}`}}>
                      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
                        <div style={{width:52,height:52,borderRadius:12,background:C.card2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>{l.avatar}</div>
                        <div><div style={{fontSize:17,fontWeight:700}}>{l.name}</div><div style={{fontSize:12,color:C.mid}}>{l.age} • <StarI s={11} c={C.amber} filled/> {l.rating} • {l.trips} trips</div></div>
                      </div>
                      <div style={{display:'flex',gap:6,alignItems:'center',padding:'8px 12px',background:C.card2,borderRadius:8,marginBottom:12}}><AnchorI s={14} c={C.cyan}/><span style={{fontSize:13,fontWeight:500}}>{l.boat}</span></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,color:C.mid,marginBottom:14}}>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>📅 {l.date}</div>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>⏰ {l.time}</div>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>📍 {l.area}</div>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>🚀 {l.launch}</div>
                      </div>
                      <div style={{display:'flex',gap:10,marginBottom:14}}>
                        <div style={{background:`${C.green}15`,borderRadius:8,padding:'8px 14px',border:`1px solid ${C.green}30`}}><div style={{fontSize:10,color:C.green,fontWeight:700}}>SPOTS OPEN</div><div style={{fontSize:20,fontWeight:700}}>{l.spotsOpen}</div></div>
                        <div style={{background:`${C.cyan}10`,borderRadius:8,padding:'8px 14px',border:`1px solid ${C.cyan}30`}}><div style={{fontSize:10,color:C.cyan,fontWeight:700}}>GAS SPLIT</div><div style={{fontSize:20,fontWeight:700}}>{l.gasSplit}</div></div>
                      </div>
                      <Btn primary style={{width:'100%'}}>🤙 Request to Join</Btn>
                    </div>
                    <div style={{padding:20}}>
                      <div style={{marginBottom:16}}><Lbl>Looking For</Lbl><div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:`${lfColor(l.lookingFor)}10`,borderRadius:10,border:`1px solid ${lfColor(l.lookingFor)}25`}}><div style={{width:10,height:10,borderRadius:'50%',background:lfColor(l.lookingFor)}}/><div><div style={{fontSize:13,fontWeight:600,color:lfColor(l.lookingFor)}}>{lfLabel(l.lookingFor)}</div><div style={{fontSize:11,color:C.mid,lineHeight:1.4,marginTop:2}}>{l.lookingDesc}</div></div></div></div>
                      <div style={{marginBottom:16}}><Lbl>The Plan</Lbl><p style={{fontSize:12,color:C.mid,lineHeight:1.6,margin:0}}>{l.plan}</p></div>
                      <div style={{marginBottom:16}}><Lbl>The Vibe</Lbl><div style={{background:C.card2,borderRadius:10,padding:12,border:`1px solid ${C.bdr}`}}><p style={{fontSize:12,color:C.txt,lineHeight:1.5,margin:0,fontStyle:'italic'}}>"{l.vibe}"</p></div></div>
                      <div><Lbl>Rules / Need to Know</Lbl><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{l.rules.map(r=><span key={r} style={{padding:'4px 10px',borderRadius:6,background:C.card2,fontSize:11,color:C.mid,border:`1px solid ${C.bdr}`}}>{r}</span>)}</div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showSettings&&<Modal title="Settings" sub="API keys & preferences" onClose={()=>setShowSettings(false)}>
        <div style={{marginBottom:20}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><KeyI s={16} c={C.cyan}/><span style={{fontWeight:700}}>Claude API Key</span></div>
        <Inp label="API Key" type="password" placeholder="sk-ant-..." value={settings.claudeApiKey} onChange={e=>setSettings({...settings,claudeApiKey:e.target.value})}/>
        <div style={{background:`${C.cyan}08`,borderRadius:10,padding:12,border:`1px solid ${C.cyan}20`}}><p style={{fontSize:11,color:C.mid,margin:0,lineHeight:1.5}}>Powers the AI Advisor. Analyzes conditions against your spots. Get yours at console.anthropic.com</p></div></div>
        <Btn primary style={{width:'100%'}} onClick={()=>{showT('Settings saved');setShowSettings(false);}}><SaveI s={14} c={C.bg}/> Save</Btn>
      </Modal>}

      {showEditor&&<Modal title="Map Editor Pro" sub="Drop pins • GPS entry • Import/Export • Photo GPS • Measure" onClose={()=>{setShowEditor(false);setEdMapMode(null);setEditingSpot(null);}} wide>
        {/* ─── TOP TOOLBAR ─── */}
        <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
          {[{id:'spots',l:'Spots',i:'🎯'},{id:'waypoints',l:'Waypoints',i:'📌'},{id:'shading',l:'Zones',i:'🗺️'},{id:'launches',l:'Launches',i:'⛵'},{id:'photos',l:'Photos',i:'📷'},{id:'tools',l:'Tools',i:'🛠️'}].map(t=><button key={t.id} onClick={()=>setEdTab(t.id)} style={{flex:'1 1 auto',minWidth:55,padding:'8px 6px',borderRadius:8,fontSize:11,fontWeight:600,background:edTab===t.id?C.cyan:C.card2,color:edTab===t.id?C.bg:C.mid,border:`1px solid ${edTab===t.id?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:Fnt}}>{t.i}<br/>{t.l}</button>)}
        </div>

        {/* ═══ SPOTS TAB ═══ */}
        {edTab==='spots'&&<div>
          {/* Search & Sort Bar */}
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <div style={{flex:1,position:'relative'}}><SearchI s={14} c={C.dim} style={{position:'absolute',left:10,top:10}}/><input value={edSearch} onChange={e=>setEdSearch(e.target.value)} placeholder="Search spots..." style={{width:'100%',padding:'8px 8px 8px 32px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:12,fontFamily:Fnt,outline:'none'}}/></div>
            <select value={edSortBy} onChange={e=>setEdSortBy(e.target.value)} style={{padding:'8px 12px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.mid,fontSize:11,fontFamily:Fnt}}>
              <option value="name">A-Z</option><option value="rating">★ Rating</option><option value="type">Type</option>
            </select>
          </div>
          {/* Spot Filter Chips */}
          <div style={{display:'flex',gap:4,marginBottom:12}}>
            {['all','wade','boat','kayak'].map(f=><button key={f} onClick={()=>setSpotFilter(f)} style={{padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:600,background:spotFilter===f?sc(f==='all'?'wade':f):C.card2,color:spotFilter===f?C.bg:C.mid,border:`1px solid ${spotFilter===f?sc(f==='all'?'wade':f):C.bdr}`,cursor:'pointer',fontFamily:Fnt,textTransform:'capitalize'}}>{f==='all'?'🎯 All':`${si(f)} ${f}`}</button>)}
          </div>
          {/* Spot List */}
          {allSpots.filter(s=>s.bay==='matagorda').filter(s=>spotFilter==='all'||s.type===spotFilter).filter(s=>!edSearch||s.name.toLowerCase().includes(edSearch.toLowerCase())).sort((a,b)=>edSortBy==='rating'?b.rating-a.rating:edSortBy==='type'?a.type.localeCompare(b.type):a.name.localeCompare(b.name)).map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:editingSpot?.id===s.id?`${C.cyan}15`:C.card2,borderRadius:10,border:`1px solid ${editingSpot?.id===s.id?C.cyan:C.bdr}`,marginBottom:6,cursor:'pointer'}} onClick={()=>setEditingSpot(editingSpot?.id===s.id?null:s)}>
            <div style={{width:36,height:36,borderRadius:8,background:sc(s.type),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{si(s.type)}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}}>{s.name} <span style={{fontSize:10,color:C.amber}}>★ {s.rating}</span></div>
              <div style={{fontSize:11,color:C.dim}}>{s.gps.lat}, {s.gps.lng}</div>
              <div style={{fontSize:10,color:C.dim,marginTop:2}}>{s.species?.slice(0,3).join(' • ')} • {s.route.length} waypoints</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <Btn small onClick={(e)=>{e.stopPropagation();const [lat,lng]=bayConfig.toLatLng(s.position);navigator.clipboard?.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);showT('GPS Copied');}}><CopyI s={11}/></Btn>
              <Btn small><EditI s={11}/></Btn>
            </div>
          </div>)}
          {/* Expanded Edit Panel */}
          {editingSpot&&<div style={{background:C.card2,borderRadius:12,padding:16,marginTop:8,border:`1px solid ${C.cyan}40`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.cyan,marginBottom:10,display:'flex',alignItems:'center',gap:6}}><EditI s={14} c={C.cyan}/> Editing: {editingSpot.name}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              <div><Lbl>GPS Lat</Lbl><div style={{padding:8,borderRadius:6,background:C.bg,border:`1px solid ${C.bdr}`,fontSize:12,color:C.txt,fontFamily:FM}}>{editingSpot.gps.lat}</div></div>
              <div><Lbl>GPS Lng</Lbl><div style={{padding:8,borderRadius:6,background:C.bg,border:`1px solid ${C.bdr}`,fontSize:12,color:C.txt,fontFamily:FM}}>{editingSpot.gps.lng}</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
              <div style={{textAlign:'center',padding:8,borderRadius:8,background:`${C.green}15`,border:`1px solid ${C.green}30`}}><div style={{fontSize:18}}>🐟</div><div style={{fontSize:10,color:C.green,fontWeight:600}}>{editingSpot.species?.length || 0} Species</div></div>
              <div style={{textAlign:'center',padding:8,borderRadius:8,background:`${C.blue}15`,border:`1px solid ${C.blue}30`}}><div style={{fontSize:18}}>📍</div><div style={{fontSize:10,color:C.blue,fontWeight:600}}>{editingSpot.route?.length || 0} Waypoints</div></div>
              <div style={{textAlign:'center',padding:8,borderRadius:8,background:`${C.amber}15`,border:`1px solid ${C.amber}30`}}><div style={{fontSize:18}}>🎣</div><div style={{fontSize:10,color:C.amber,fontWeight:600}}>{editingSpot.lures?.length || 0} Lures</div></div>
            </div>
            <Lbl>Notes</Lbl>
            <textarea value={spotNotes[editingSpot.id]||editingSpot.desc||''} onChange={e=>setSpotNotes({...spotNotes,[editingSpot.id]:e.target.value})} placeholder="Add personal notes about this spot..." style={{width:'100%',padding:10,borderRadius:8,background:C.bg,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:12,fontFamily:Fnt,minHeight:60,resize:'vertical',outline:'none'}}/>
            <div style={{display:'flex',gap:6,marginTop:10}}>
              <Btn small primary onClick={()=>{showT('Spot saved');setEditingSpot(null);}}><SaveI s={12} c={C.bg}/> Save</Btn>
              <Btn small onClick={()=>{const [lat,lng]=bayConfig.toLatLng(editingSpot.position);navigator.clipboard?.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);showT('GPS Copied!');}}><CopyI s={12}/> Copy GPS</Btn>
              <Btn small danger onClick={()=>{showT('Spot removed');setEditingSpot(null);}}><TrashI s={12}/></Btn>
            </div>
          </div>}
          {/* Add New Spot */}
          <Btn primary style={{width:'100%',marginTop:12}} onClick={()=>setEdTab('waypoints')}><PlusI s={14} c={C.bg}/> Add New Spot</Btn>
        </div>}

        {/* ═══ WAYPOINTS / DROP PIN TAB ═══ */}
        {edTab==='waypoints'&&<div>
          <div style={{background:`${C.cyan}08`,border:`1px solid ${C.cyan}30`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:C.cyan,marginBottom:4,display:'flex',alignItems:'center',gap:8}}><TargetI s={18} c={C.cyan}/> Add Waypoint / Drop Pin</div>
            <div style={{fontSize:12,color:C.mid,marginBottom:12}}>Choose how you want to mark your spot on the map</div>
            {/* GPS Input Mode Tabs */}
            <div style={{display:'flex',gap:4,marginBottom:16}}>
              {[{id:'manual',l:'📝 Enter GPS',d:'Type coordinates'},{id:'photo',l:'📷 From Photo',d:'Extract EXIF GPS'},{id:'map',l:'🗺️ Click Map',d:'Tap location'}].map(m=><button key={m.id} onClick={()=>setGpsInput({...gpsInput,mode:m.id})} style={{flex:1,padding:10,borderRadius:8,background:gpsInput.mode===m.id?C.card:C.card2,border:`1px solid ${gpsInput.mode===m.id?C.cyan:C.bdr}`,color:gpsInput.mode===m.id?C.txt:C.dim,cursor:'pointer',fontFamily:Fnt,textAlign:'center'}}><div style={{fontSize:14,marginBottom:2}}>{m.l.split(' ')[0]}</div><div style={{fontSize:10,fontWeight:600}}>{m.l.split(' ').slice(1).join(' ')}</div><div style={{fontSize:9,color:C.dim,marginTop:2}}>{m.d}</div></button>)}
            </div>

            {/* MANUAL GPS ENTRY */}
            {gpsInput.mode==='manual'&&<div>
              <div style={{display:'flex',gap:4,marginBottom:10}}>
                <button onClick={()=>setGpsInput({...gpsInput,format:'dd'})} style={{flex:1,padding:6,borderRadius:6,fontSize:10,fontWeight:600,background:gpsInput.format!=='dms'?C.cyan:C.card2,color:gpsInput.format!=='dms'?C.bg:C.mid,border:`1px solid ${gpsInput.format!=='dms'?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:Fnt}}>Decimal (28.7234)</button>
                <button onClick={()=>setGpsInput({...gpsInput,format:'dms'})} style={{flex:1,padding:6,borderRadius:6,fontSize:10,fontWeight:600,background:gpsInput.format==='dms'?C.cyan:C.card2,color:gpsInput.format==='dms'?C.bg:C.mid,border:`1px solid ${gpsInput.format==='dms'?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:Fnt}}>DMS (28°43'24"N)</button>
              </div>
              {gpsInput.format!=='dms'?<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Inp label="Latitude" placeholder="28.7234" value={gpsInput.lat} onChange={e=>setGpsInput({...gpsInput,lat:e.target.value})}/>
                <Inp label="Longitude" placeholder="-95.8612" value={gpsInput.lng} onChange={e=>setGpsInput({...gpsInput,lng:e.target.value})}/>
              </div>:<div>
                <Inp label="DMS Coordinates" placeholder={"28°43'24.1\"N 95°52'36.2\"W"} value={gpsInput.dms} onChange={e=>setGpsInput({...gpsInput,dms:e.target.value})}/>
              </div>}
              <Btn primary style={{width:'100%',marginTop:10}} onClick={()=>{
                let coords;
                if(gpsInput.format==='dms') coords = parseDMS(gpsInput.dms);
                else coords = { lat: parseFloat(gpsInput.lat), lng: parseFloat(gpsInput.lng) };
                if(coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
                  const pos = gpsToPosition(coords.lat, coords.lng);
                  setNewSpotDraft({...newSpotDraft,gps:{lat:coords.lat.toFixed(4)+'°N',lng:Math.abs(coords.lng).toFixed(4)+'°W'},position:pos});
                  showT(`📍 Pin dropped: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
                } else showT('Invalid GPS coordinates');
              }}><PinI s={14} c={C.bg}/> Drop Pin at Coordinates</Btn>
            </div>}

            {/* PHOTO GPS EXTRACTION */}
            {gpsInput.mode==='photo'&&<div>
              <div style={{width:'100%',minHeight:100,background:C.bg,borderRadius:10,border:`2px dashed ${C.bdr2}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:20,marginBottom:10,position:'relative'}} onClick={()=>document.getElementById('gps-photo-input')?.click()}>
                <input id="gps-photo-input" type="file" accept="image/jpeg,image/jpg" style={{display:'none'}} onChange={async(e)=>{
                  const file = e.target.files?.[0];
                  if(!file) return;
                  showT('Extracting GPS...');
                  const coords = await extractPhotoGPS(file);
                  if(coords) {
                    setPhotoGPS(coords);
                    const pos = gpsToPosition(coords.lat, coords.lng);
                    setNewSpotDraft({...newSpotDraft, gps:{lat:coords.lat.toFixed(4)+'°N',lng:Math.abs(coords.lng).toFixed(4)+'°W'}, position:pos});
                    showT(`📍 GPS found! ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
                  } else {
                    setPhotoGPS(null);
                    showT('⚠️ No GPS data in photo. Try a photo taken with location enabled.');
                  }
                }}/>
                <CamI s={28} c={C.dim}/>
                <div style={{fontSize:13,color:C.mid,marginTop:8,fontWeight:600}}>Upload a fishing photo</div>
                <div style={{fontSize:11,color:C.dim,marginTop:4}}>GPS coordinates will be extracted from EXIF data</div>
                <div style={{fontSize:10,color:C.dim,marginTop:4,background:C.card2,padding:'4px 10px',borderRadius:20}}>Supports .jpg / .jpeg with GPS enabled</div>
              </div>
              {photoGPS&&<div style={{background:`${C.green}10`,border:`1px solid ${C.green}30`,borderRadius:8,padding:12,display:'flex',alignItems:'center',gap:10}}>
                <ChkI s={18} c={C.green}/>
                <div><div style={{fontSize:12,fontWeight:600,color:C.green}}>GPS Extracted Successfully</div>
                <div style={{fontSize:11,color:C.mid,fontFamily:FM}}>{photoGPS.lat.toFixed(6)}, {photoGPS.lng.toFixed(6)}</div></div>
              </div>}
            </div>}

            {/* CLICK MAP MODE */}
            {gpsInput.mode==='map'&&<div style={{background:C.bg,borderRadius:10,padding:20,textAlign:'center',border:`1px solid ${C.bdr}`}}>
              <MoveI s={32} c={C.cyan}/>
              <div style={{fontSize:13,fontWeight:600,color:C.txt,marginTop:8}}>Click on the Satellite Map</div>
              <div style={{fontSize:12,color:C.mid,marginTop:4}}>Close this editor, then long-press (or right-click) any point on the satellite map to drop a pin at that location.</div>
              <div style={{fontSize:10,color:C.dim,marginTop:8,background:C.card2,padding:'6px 12px',borderRadius:20,display:'inline-block'}}>💡 Coming soon: Direct map click integration</div>
            </div>}
          </div>

          {/* New Spot Form */}
          {(newSpotDraft.gps.lat || photoGPS) && <div style={{background:C.card2,borderRadius:12,padding:16,border:`1px solid ${C.bdr}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:12,display:'flex',alignItems:'center',gap:6}}><PlusI s={14} c={C.cyan}/> New Spot Details</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8,marginBottom:8}}>
              <Inp label="Spot Name" placeholder="My Secret Spot" value={newSpotDraft.name} onChange={e=>setNewSpotDraft({...newSpotDraft,name:e.target.value})}/>
              <Sel label="Type" value={newSpotDraft.type} onChange={e=>setNewSpotDraft({...newSpotDraft,type:e.target.value})} options={[{value:'wade',label:'🚶 Wade'},{value:'boat',label:'🚤 Boat'},{value:'kayak',label:'🛶 Kayak'}]}/>
            </div>
            <Inp label="Species (comma-separated)" placeholder="Redfish, Trout, Flounder" value={newSpotDraft.species?.join?.(', ')||''} onChange={e=>setNewSpotDraft({...newSpotDraft,species:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Sel label="Best Tide" value={newSpotDraft.bestTide} onChange={e=>setNewSpotDraft({...newSpotDraft,bestTide:e.target.value})} options={[{value:'Incoming',label:'↗️ Incoming'},{value:'Outgoing',label:'↘️ Outgoing'},{value:'High',label:'⬆️ High'},{value:'Low',label:'⬇️ Low'},{value:'Moving',label:'↔️ Any Moving'}]}/>
              <Inp label="Best Time" placeholder="5-9 AM" value={newSpotDraft.bestTime} onChange={e=>setNewSpotDraft({...newSpotDraft,bestTime:e.target.value})}/>
            </div>
            <Inp label="Lures (comma-separated)" placeholder="Gold Spoon, She Dog, Gulp" value={newSpotDraft.lures?.join?.(', ')||''} onChange={e=>setNewSpotDraft({...newSpotDraft,lures:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}/>
            <Inp label="Description / Notes" placeholder="Personal notes about this spot..." value={newSpotDraft.desc} onChange={e=>setNewSpotDraft({...newSpotDraft,desc:e.target.value})}/>
            <div style={{background:C.bg,borderRadius:8,padding:10,marginTop:8,marginBottom:8,border:`1px solid ${C.bdr}`}}>
              <div style={{fontSize:11,color:C.dim,fontFamily:FM}}>📍 {newSpotDraft.gps.lat}, {newSpotDraft.gps.lng}</div>
              <div style={{fontSize:10,color:C.dim}}>Position: x={newSpotDraft.position.x.toFixed(1)}, y={newSpotDraft.position.y.toFixed(1)}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn primary style={{flex:1}} onClick={()=>{
                if(!newSpotDraft.name) { showT('Name is required'); return; }
                showT(`✅ "${newSpotDraft.name}" saved!`);
                setNewSpotDraft({name:'',type:'wade',species:[],bestTide:'Incoming',bestTime:'',lures:[],desc:'',gps:{lat:'',lng:''},position:{x:50,y:50},route:[]});
                setPhotoGPS(null);
              }}><SaveI s={14} c={C.bg}/> Save Spot</Btn>
              <Btn style={{flex:1}} onClick={()=>{setNewSpotDraft({name:'',type:'wade',species:[],bestTide:'Incoming',bestTime:'',lures:[],desc:'',gps:{lat:'',lng:''},position:{x:50,y:50},route:[]});setPhotoGPS(null);}}><XI s={14}/> Cancel</Btn>
            </div>
          </div>}
        </div>}

        {/* ═══ ZONES TAB ═══ */}
        {edTab==='shading'&&<div>{bayShades.map(z=><div key={z.id} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:C.card2,borderRadius:10,border:`1px solid ${C.bdr}`,marginBottom:6}}><div style={{width:32,height:32,borderRadius:8,background:`${z.color}30`,border:`2px dashed ${z.color}`,display:'flex',alignItems:'center',justifyContent:'center'}}>{si(z.type)}</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{z.label}</div></div><Btn small danger onClick={()=>{setShadeZones(shadeZones.filter(s=>s.id!==z.id));showT('Removed');}}><TrashI s={12}/></Btn></div>)}
          <div style={{background:C.card2,borderRadius:12,padding:16,marginTop:12,border:`1px solid ${C.bdr}`}}><Lbl>Add Zone</Lbl><Sel label="Type" value={newShade.type} onChange={e=>setNewShade({...newShade,type:e.target.value})} options={[{value:'wade',label:'🚶 Wade'},{value:'kayak',label:'🛶 Kayak'},{value:'boat',label:'🚤 Boat'}]}/><Inp label="Label" value={newShade.label} onChange={e=>setNewShade({...newShade,label:e.target.value})}/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}><Inp label="X" type="number" value={newShade.cx} onChange={e=>setNewShade({...newShade,cx:+e.target.value})}/><Inp label="Y" type="number" value={newShade.cy} onChange={e=>setNewShade({...newShade,cy:+e.target.value})}/><Inp label="W" type="number" value={newShade.rx} onChange={e=>setNewShade({...newShade,rx:+e.target.value})}/><Inp label="H" type="number" value={newShade.ry} onChange={e=>setNewShade({...newShade,ry:+e.target.value})}/></div><Btn primary onClick={()=>{setShadeZones([...shadeZones,{...newShade,id:Date.now(),color:sc(newShade.type),bay:'matagorda'}]);setNewShade({type:'wade',label:'',cx:50,cy:50,rx:8,ry:5});showT('Zone added');}}><PlusI s={14} c={C.bg}/> Add</Btn></div>
        </div>}

        {/* ═══ LAUNCHES TAB ═══ */}
        {edTab==='launches'&&<div>{bayLaunches.map(l=><div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:C.card2,borderRadius:10,border:`1px solid ${C.bdr}`,marginBottom:6}}><span style={{fontSize:22}}>{li(l.type)}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{l.name}</div><div style={{fontSize:11,color:C.dim}}>{l.gps}</div></div><Btn small><EditI s={12}/></Btn></div>)}
          <div style={{background:C.card2,borderRadius:12,padding:16,marginTop:12,border:`1px solid ${C.bdr}`}}><Lbl>Add Launch</Lbl><Inp label="Name" value={newLaunch.name} onChange={e=>setNewLaunch({...newLaunch,name:e.target.value})}/><Sel label="Type" value={newLaunch.type} onChange={e=>setNewLaunch({...newLaunch,type:e.target.value})} options={[{value:'boat',label:'⛵ Boat Ramp'},{value:'kayak',label:'🛶 Kayak'},{value:'drivein',label:'🚗 Drive-in'}]}/><Inp label="GPS" value={newLaunch.gps} onChange={e=>setNewLaunch({...newLaunch,gps:e.target.value})}/><Inp label="Notes" value={newLaunch.notes} onChange={e=>setNewLaunch({...newLaunch,notes:e.target.value})}/><Btn primary onClick={()=>{setLaunches([...launches,{...newLaunch,id:Date.now(),position:{x:50,y:50},bay:'matagorda'}]);setNewLaunch({name:'',type:'boat',gps:'',notes:''});showT('Launch added');}}><PlusI s={14} c={C.bg}/> Add</Btn></div>
        </div>}

        {/* ═══ PHOTOS TAB ═══ */}
        {edTab==='photos'&&<div>
          <div style={{background:`${C.purple}08`,border:`1px solid ${C.purple}30`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:8}}>📷 Pin Photo to Map</div>
            <div style={{fontSize:12,color:C.mid,marginBottom:12}}>Upload a fishing photo — GPS will be extracted automatically from EXIF data and the photo pinned to its location on the satellite map.</div>
            <div style={{width:'100%',minHeight:80,background:C.bg,borderRadius:10,border:`2px dashed ${C.bdr2}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:16}} onClick={()=>document.getElementById('photo-pin-input')?.click()}>
              <input id="photo-pin-input" type="file" accept="image/*" style={{display:'none'}} onChange={async(e)=>{
                const file = e.target.files?.[0];
                if(!file) return;
                const coords = await extractPhotoGPS(file);
                if(coords) showT(`📷 Photo pinned at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
                else showT('📷 Photo added (no GPS — use manual entry)');
              }}/>
              <UploadI s={24} c={C.dim}/><div style={{fontSize:12,color:C.mid,marginTop:6}}>Click to upload or drag & drop</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{communityPhotos.map(p=><div key={p.id} style={{background:C.card2,borderRadius:10,padding:12,border:`1px solid ${C.bdr}`}}><div style={{width:'100%',height:80,background:`${C.purple}15`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}><ImgI s={24} c={C.dim}/></div><div style={{fontSize:12,fontWeight:600}}>{p.caption}</div><div style={{fontSize:10,color:C.dim}}>by {p.user} • ❤️ {p.likes}</div></div>)}</div>
        </div>}

        {/* ═══ TOOLS TAB ═══ */}
        {edTab==='tools'&&<div>
          {/* Import / Export */}
          <div style={{background:C.card2,borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${C.bdr}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:12,display:'flex',alignItems:'center',gap:6}}><LayerI s={16} c={C.cyan}/> Import & Export</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              <div style={{background:C.bg,borderRadius:10,padding:16,border:`1px solid ${C.bdr}`,cursor:'pointer',textAlign:'center'}} onClick={()=>document.getElementById('gpx-import')?.click()}>
                <input id="gpx-import" type="file" accept=".gpx,.kml,.json,.geojson" style={{display:'none'}} onChange={(e)=>{
                  const file = e.target.files?.[0];
                  if(!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target.result;
                    const imported = parseGPXFile(text);
                    if(imported.length > 0) showT(`✅ Imported ${imported.length} waypoints from GPX`);
                    else showT('⚠️ No waypoints found in file');
                  };
                  reader.readAsText(file);
                }}/>
                <UploadI s={24} c={C.green}/>
                <div style={{fontSize:12,fontWeight:600,color:C.green,marginTop:6}}>Import GPX</div>
                <div style={{fontSize:10,color:C.dim,marginTop:2}}>.gpx, .kml, .geojson</div>
              </div>
              <div style={{background:C.bg,borderRadius:10,padding:16,border:`1px solid ${C.bdr}`,cursor:'pointer',textAlign:'center'}} onClick={()=>{
                const gpx = generateGPX(allSpots.filter(s=>s.bay==='matagorda'));
                downloadFile(gpx, 'texastides-spots.gpx');
                showT('📥 GPX exported!');
              }}>
                <DownloadI s={24} c={C.blue}/>
                <div style={{fontSize:12,fontWeight:600,color:C.blue,marginTop:6}}>Export GPX</div>
                <div style={{fontSize:10,color:C.dim,marginTop:2}}>All spots & routes</div>
              </div>
            </div>
            <div style={{fontSize:10,color:C.dim,padding:'8px 0',borderTop:`1px solid ${C.bdr}`}}>
              💡 <strong>GPX</strong> files are universal — compatible with OnX, Garmin, Google Earth, Navionics, and all GPS devices.
            </div>
          </div>

          {/* Distance Measurement */}
          <div style={{background:C.card2,borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${C.bdr}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><NavI s={16} c={C.amber}/> Quick Distance</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <Inp label="From (GPS or spot name)" placeholder="28.72, -95.88"/>
              <Inp label="To (GPS or spot name)" placeholder="Shell Island"/>
            </div>
            <Btn primary style={{width:'100%'}} onClick={()=>showT('📏 ~3.2 nautical miles')}><NavI s={14} c={C.bg}/> Measure</Btn>
          </div>

          {/* Coordinate Converter */}
          <div style={{background:C.card2,borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${C.bdr}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><TargetI s={16} c={C.teal}/> Coordinate Converter</div>
            <Inp label="Paste any coordinate format" placeholder={"28.7234, -95.8612  or  28°43'24\"N 95°52'36\"W"} onChange={e=>{
              const coords = parseGPS(e.target.value);
              if(coords) setGpsInput({...gpsInput,lat:coords.lat.toFixed(6),lng:coords.lng.toFixed(6)});
            }}/>
            {gpsInput.lat&&<div style={{marginTop:8,padding:10,background:C.bg,borderRadius:8,border:`1px solid ${C.bdr}`,fontFamily:FM,fontSize:11}}>
              <div style={{color:C.cyan}}>Decimal: {gpsInput.lat}, {gpsInput.lng}</div>
              <div style={{color:C.teal,marginTop:4}}>DMS: {Math.abs(parseFloat(gpsInput.lat)).toFixed(0)}°{((Math.abs(parseFloat(gpsInput.lat))%1)*60).toFixed(0)}'{((((Math.abs(parseFloat(gpsInput.lat))%1)*60)%1)*60).toFixed(1)}"{ parseFloat(gpsInput.lat)>=0?'N':'S'} {Math.abs(parseFloat(gpsInput.lng)).toFixed(0)}°{((Math.abs(parseFloat(gpsInput.lng))%1)*60).toFixed(0)}'{((((Math.abs(parseFloat(gpsInput.lng))%1)*60)%1)*60).toFixed(1)}"{ parseFloat(gpsInput.lng)>=0?'E':'W'}</div>
            </div>}
          </div>

          {/* Bulk Operations */}
          <div style={{background:C.card2,borderRadius:12,padding:16,border:`1px solid ${C.bdr}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:10}}>⚡ Quick Actions</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              <Btn small onClick={()=>{const json = JSON.stringify(allSpots.filter(s=>s.bay==='matagorda'),null,2);downloadFile(json,'texastides-spots.json','application/json');showT('JSON exported');}}><DownloadI s={12}/> Export JSON</Btn>
              <Btn small onClick={()=>{const text = allSpots.filter(s=>s.bay==='matagorda').map(s=>{const[la,lo]=bayConfig.toLatLng(s.position);return`${s.name}\t${la.toFixed(6)}\t${lo.toFixed(6)}\t${s.type}`;}).join('\n');navigator.clipboard?.writeText(text);showT('Copied as tab-separated');}}><CopyI s={12}/> Copy All GPS</Btn>
              <Btn small onClick={()=>showT('🔄 Syncing...')}><LayerI s={12}/> Sync Garmin</Btn>
              <Btn small onClick={()=>{const kml=`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>TexasTides</name>${allSpots.filter(s=>s.bay==='matagorda').map(s=>{const[la,lo]=bayConfig.toLatLng(s.position);return`<Placemark><name>${s.name}</name><description>${s.desc||''}</description><Point><coordinates>${lo},${la},0</coordinates></Point></Placemark>`;}).join('')}</Document></kml>`;downloadFile(kml,'texastides.kml');showT('KML exported — open in Google Earth');}}><DownloadI s={12}/> Export KML</Btn>
            </div>
          </div>
        </div>}
      </Modal>}

      {showPhotoUp&&<Modal title="Add Photo to Map" onClose={()=>setShowPhotoUp(false)}><div style={{width:'100%',height:140,background:C.card2,borderRadius:12,border:`2px dashed ${C.bdr2}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:16}}><UploadI s={32} c={C.dim}/><div style={{fontSize:13,color:C.mid,marginTop:8}}>Click or drag & drop</div></div><Inp label="Caption"/><Inp label="GPS (optional)"/><Btn primary style={{width:'100%'}} onClick={()=>{showT('Photo added');setShowPhotoUp(false);}}><CamI s={14} c={C.bg}/> Pin to Map</Btn></Modal>}

      {showAI&&<Modal title="AI Fishing Advisor" sub="Powered by Claude" onClose={()=>setShowAI(false)}>{!settings.claudeApiKey?<div style={{textAlign:'center',padding:'20px 0'}}><SparkI s={40} c={C.dim}/><h3 style={{marginTop:12}}>API Key Required</h3><p style={{fontSize:13,color:C.mid,marginTop:6,marginBottom:16}}>Add your Claude API key in Settings.</p><Btn primary onClick={()=>{setShowAI(false);setShowSettings(true);}}><KeyI s={14} c={C.bg}/> Open Settings</Btn></div>:
        <div><div style={{background:C.card2,borderRadius:10,padding:12,marginBottom:14,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,fontSize:11}}><div><div style={{color:C.dim}}>Wind</div><div style={{fontWeight:600}}>{weather.wind} mph {weather.windDir}</div></div><div><div style={{color:C.dim}}>Tide</div><div style={{fontWeight:600}}>{tide.status}</div></div><div><div style={{color:C.dim}}>Water</div><div style={{fontWeight:600}}>{weather.waterTemp}°F</div></div></div>
        <div style={{background:`${C.cyan}08`,border:`1px solid ${C.cyan}20`,borderRadius:12,padding:14,marginBottom:14}}><div style={{fontSize:10,textTransform:'uppercase',color:C.cyan,fontWeight:700,marginBottom:6}}>🎯 Top Pick Today</div><div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Shell Island Flats</div><p style={{fontSize:12,color:C.mid,lineHeight:1.6,margin:0}}>SE wind pushes bait onto shell pads. Incoming tide floods grass edges — reds will feed aggressively.</p></div>
        <div style={{background:C.card2,borderRadius:10,padding:12,marginBottom:14}}><div style={{fontSize:10,textTransform:'uppercase',color:C.teal,fontWeight:700,marginBottom:6}}>🎣 Lure Strategy</div><p style={{fontSize:12,color:C.mid,lineHeight:1.5,margin:0}}>She Dog topwater at dawn. Bass Assassin 4" on 1/8oz when wind picks up. Gold spoon for tailers.</p></div>
        <div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}20`,borderRadius:10,padding:12}}><div style={{fontSize:10,textTransform:'uppercase',color:C.amber,fontWeight:700,marginBottom:6}}>⚠️ Avoid Today</div><p style={{fontSize:12,color:C.mid,lineHeight:1.5,margin:0}}>Open bay flats — choppy at 12+ mph SE. Stick to protected shell areas.</p></div></div>}
      </Modal>}

      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'#fff',padding:'10px 24px',borderRadius:10,fontSize:13,fontWeight:600,zIndex:2000,boxShadow:'0 4px 20px #0008',display:'flex',alignItems:'center',gap:6}}>✓ {toast}</div>}

      <style>{`
        * { box-sizing:border-box; margin:0; }
        body { background:${C.bg}; }
        button { transition:all 0.15s; }
        button:hover { filter:brightness(1.08); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:${C.bdr2}; border-radius:3px; }
        .leaflet-container { background:#081828 !important; }
        .leaflet-control-layers { background:${C.card} !important; color:${C.txt} !important; border:1px solid ${C.bdr} !important; border-radius:8px !important; }
        .leaflet-control-layers label { color:${C.mid} !important; font-size:12px; }
        .leaflet-control-zoom a { background:${C.card} !important; color:${C.txt} !important; border-color:${C.bdr} !important; }
        .leaflet-control-scale-line { background:${C.card}cc !important; color:${C.txt} !important; border-color:${C.bdr} !important; }
        .leaflet-tooltip { background:${C.card} !important; color:${C.txt} !important; border:1px solid ${C.bdr} !important; border-radius:8px !important; font-size:12px; }
        .leaflet-popup-content-wrapper { background:${C.card} !important; color:${C.txt} !important; border-radius:12px !important; border:1px solid ${C.bdr}; }
        .leaflet-popup-tip { background:${C.card} !important; }
      `}</style>
    </div>
  );
}

    
