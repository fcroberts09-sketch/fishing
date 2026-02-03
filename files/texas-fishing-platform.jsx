import React, { useState, useEffect, useCallback } from 'react';

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
const LayerI=p=><I {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;
const MapEdI=p=><I {...p} d={<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}/>;
const ThermI=p=><I {...p} d={<><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></>}/>;

const C={bg:'#0b1220',card:'#111b2e',card2:'#162036',bdr:'#1e2d47',bdr2:'#2a3f63',cyan:'#06b6d4',teal:'#14b8a6',amber:'#f59e0b',blue:'#3b82f6',green:'#10b981',red:'#ef4444',purple:'#8b5cf6',txt:'#e2e8f0',mid:'#94a3b8',dim:'#64748b'};
const F="'Instrument Sans','DM Sans',system-ui,sans-serif";
const FM="'JetBrains Mono',monospace";

export default function TexasTides(){
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
  const [zoom,setZoom]=useState(1);
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
    {id:3,name:'River Road Access',type:'drivein',position:{x:8,y:65},gps:'28.6801°N, 95.9601°W',notes:'4WD recommended, wade only',bay:'matagorda'},
    {id:4,name:'Texas City Dike',type:'boat',position:{x:50,y:60},gps:'29.3834°N, 94.9012°W',notes:'Public ramp, $12',bay:'galveston'},
  ]);
  const [photos]=useState([
    {id:1,user:'CaptMike',position:{x:73,y:30},caption:'Shell pad at low tide',time:'2 days ago',likes:24,bay:'matagorda'},
    {id:2,user:'WadeFisher22',position:{x:16,y:63},caption:'River mouth sandbar',time:'1 week ago',likes:18,bay:'matagorda'},
    {id:3,user:'KayakJen',position:{x:24,y:44},caption:'Tailing reds in back lake',time:'3 days ago',likes:31,bay:'matagorda'},
  ]);
  const [newShade,setNewShade]=useState({type:'wade',label:'',cx:50,cy:50,rx:8,ry:5});
  const [newLaunch,setNewLaunch]=useState({name:'',type:'boat',gps:'',notes:''});

  const weather={temp:78,wind:12,windDir:'SE',gusts:18,conditions:'Partly Cloudy',waterTemp:71};
  const tide={status:'Rising',next:'High at 2:34 PM'};

  const bayData={
    matagorda:{id:'matagorda',name:'Matagorda Bay Complex',sub:'East & West Matagorda Bay',region:'Matagorda, TX',cameras:[{name:'Harbor'},{name:'River Mouth'}],reports:[{user:'CaptMike',time:'2h ago',text:'Solid box of trout on topwater at Shell Island.',likes:12},{user:'WadeFisher22',time:'5h ago',text:'Reds stacked on river mouth. Gold spoon.',likes:8},{user:'KayakJen',time:'Yesterday',text:'4 reds on Gulp in Oyster Lake back.',likes:15}]},
    galveston:{id:'galveston',name:'Galveston Bay Complex',sub:'West Bay, Trinity, East Bay',region:'Galveston, TX',cameras:[{name:'Pier Cam'}],reports:[{user:'BayRat',time:'3h ago',text:'Sheepshead at dike rocks. Fiddler crabs.',likes:9}]},
  };

  const spots=[
    {id:1,bay:'matagorda',name:'Shell Island Flats',type:'wade',position:{x:75,y:28},gps:{lat:'28.7234°N',lng:'95.8612°W'},rating:4.9,species:['Redfish','Trout','Flounder'],bestTide:'Incoming',bestTime:'5-9 AM',bestSeason:'Spring & Fall',bestWind:'SE 5-15',lures:['She Dog','Bass Assassin 4"','Gold Spoon'],desc:'Prime wade flat with scattered shell pads. Park boat 3ft south edge, wade north toward birds.',parking:{x:72,y:32},media:[{type:'photo',label:'Shell pad low tide'},{type:'video',label:'How to wade this flat'}],route:[{pos:{x:12,y:78},title:'Matagorda Harbor',desc:'Head east in channel',depth:'4-6 ft',heading:'090° E',warnings:['No wake in harbor']},{pos:{x:22,y:72},title:'Harbor Exit',desc:'Pass green G5 on port',depth:'6-8 ft',heading:'120° SE',warnings:[]},{pos:{x:35,y:65},title:'ICW Junction',desc:'Turn NE onto ICW',depth:'12-15 ft',heading:'045° NE',warnings:['Barge traffic — stay right']},{pos:{x:52,y:55},title:'ICW East',desc:'Continue 3 mi east in channel',depth:'10-12 ft',heading:'065° ENE',warnings:[]},{pos:{x:68,y:42},title:'Bay Entry',desc:'Exit ICW north — follow markers',depth:'4-5 ft',heading:'350° N',warnings:['CRITICAL: Oyster reefs both sides']},{pos:{x:72,y:32},title:'Anchor & Wade',desc:'Set anchor in sand, wade north to shell',depth:'3-4 ft',heading:'320° NW',warnings:['Shuffle feet — stingrays']}]},
    {id:2,bay:'matagorda',name:'Bird Island Reef',type:'boat',position:{x:55,y:38},gps:{lat:'28.7089°N',lng:'95.8845°W'},rating:4.7,species:['Redfish','Black Drum','Sheepshead'],bestTide:'Moving',bestTime:'8-11 AM',bestSeason:'Year-round',bestWind:'S-SE <20',lures:['Live Shrimp','Blue Crab','Cut Mullet'],desc:'Drift reef edges or anchor leeward. Great structure fishing all year.',parking:{x:53,y:41},media:[],route:[{pos:{x:12,y:78},title:'Harbor',desc:'East through channel',depth:'4-6 ft',heading:'090°',warnings:[]},{pos:{x:35,y:65},title:'ICW',desc:'Enter ICW northeast',depth:'12 ft',heading:'045°',warnings:['Barge traffic']},{pos:{x:45,y:55},title:'Exit ICW',desc:'North at marker 12',depth:'6-8 ft',heading:'340°',warnings:[]},{pos:{x:53,y:41},title:'Bird Island',desc:'Approach from south side',depth:'4-5 ft',heading:'350°',warnings:['Shallow east side']}]},
    {id:3,bay:'matagorda',name:'Oyster Lake Back',type:'kayak',position:{x:25,y:45},gps:{lat:'28.6912°N',lng:'95.9234°W'},rating:4.5,species:['Redfish','Flounder'],bestTide:'High incoming',bestTime:'Dawn',bestSeason:'Fall',bestWind:'Light N-NE',lures:['Gold Spoon','Gulp 3"','Topwater'],desc:'Skinny water kayak paradise. Stay stealthy — sight-cast tailing reds.',parking:{x:22,y:50},media:[{type:'photo',label:'Dawn kayak launch'}],route:[{pos:{x:22,y:50},title:'Oyster Lake Park',desc:'Kayak launch, paddle south',depth:'2-3 ft',heading:'180° S',warnings:['Check tide before going']},{pos:{x:24,y:46},title:'South Channel',desc:'Follow deeper cut south',depth:'3-4 ft',heading:'170°',warnings:[]},{pos:{x:26,y:43},title:'Back Flat',desc:'Fan cast grass edges',depth:'1-3 ft',heading:'Varies',warnings:['Very shallow on low tide']}]},
    {id:4,bay:'matagorda',name:'Colorado River Mouth',type:'wade',position:{x:15,y:62},gps:{lat:'28.6756°N',lng:'95.9512°W'},rating:4.8,species:['Redfish','Trout','Snook'],bestTide:'Outgoing',bestTime:'4-7 PM',bestSeason:'Summer & Fall',bestWind:'Any <15',lures:['Topwater','Soft Plastic','Live Croaker'],desc:'Where river meets bay. Fish current seams. Only reliable snook spot in TX bays.',parking:{x:12,y:66},media:[{type:'video',label:'Snook on outgoing'}],route:[{pos:{x:12,y:78},title:'Harbor',desc:'Head west',depth:'4-6 ft',heading:'270° W',warnings:[]},{pos:{x:10,y:72},title:'West Channel',desc:'Follow west shore',depth:'6-8 ft',heading:'290°',warnings:[]},{pos:{x:12,y:66},title:'River Mouth',desc:'East side approach',depth:'5-6 ft',heading:'340°',warnings:['Strong current on outgoing']}]},
    {id:5,bay:'matagorda',name:'Army Hole',type:'boat',position:{x:42,y:50},gps:{lat:'28.6998°N',lng:'95.9001°W'},rating:4.6,species:['Trout','Redfish'],bestTide:'Incoming',bestTime:'6-10 AM',bestSeason:'Winter & Spring',bestWind:'N 10-20',lures:['MirrOlure','Soft Jerk Shad','Live Shrimp'],desc:'Deep hole (8-12ft) near ICW. Fish stage here in cold fronts.',parking:{x:40,y:52},media:[],route:[{pos:{x:12,y:78},title:'Harbor',desc:'East',depth:'4-6 ft',heading:'090°',warnings:[]},{pos:{x:35,y:65},title:'ICW',desc:'Enter ICW',depth:'12 ft',heading:'045°',warnings:[]},{pos:{x:40,y:52},title:'Army Hole',desc:'Exit north, find the drop-off',depth:'8-12 ft',heading:'340°',warnings:['Mark depth on sonar']}]},
  ];

  // ─── BOATSHARE LISTINGS ───
  const boatShareListings = [
    { id:1, name:'Mike R.', age:'Late 30s', boat:'22ft Haynie BigFoot — "Reel Deal"', avatar:'🎣', trips:47, rating:4.9, date:'Tomorrow (Tue)', time:'5:30 AM', launch:'Matagorda Harbor', area:'East Matagorda — shell flats', spotsOpen:2, gasSplit:'$30/person', plan:'Running to Shell Island area. Gonna wade the shell pads on incoming tide. Targeting reds and trout. Usually fish till noon-ish depending on bite.', lookingFor:'experienced', lookingDesc:'Experienced wade fisherman who can fish independently. You do your thing, I\'ll do mine — we meet back at the boat. Bring your own gear and lures.', rules:['Bring own tackle','Wade boots required','Be at ramp by 5:15','No keep if over limit'],  vibe:'Serious fishing. I\'m not out there to socialize — I\'m there to catch fish. That said, I\'m happy to share what\'s working.' },
    { id:2, name:'Tommy D.', age:'50s', boat:'24ft Shallow Sport Mod-V — "Cold Beer"', avatar:'🍺', trips:89, rating:4.8, date:'Saturday', time:'6:00 AM', launch:'Matagorda Harbor', area:'West Mat — Bird Island, Army Hole', spotsOpen:3, gasSplit:'$25/person', plan:'Drifting reefs and deep holes. Got a 45qt of live shrimp coming. We\'ll soak baits, drink some beer, and see what happens. Usually stay out till 2-3pm.', lookingFor:'anyone', lookingDesc:'Anybody is welcome. Don\'t need your own gear — I\'ve got extra rods and live bait for everyone. Great trip if you\'re new or just want a chill day on the water.', rules:['BYOB','Sunscreen — no shade on this boat','$25 gas split covers bait too','Kids welcome if they can sit still'], vibe:'Low-key day on the water. We\'re gonna catch fish, but the main point is getting out there, having a cold one, and enjoying it.' },
    { id:3, name:'Sarah & Jake', age:'Late 20s', boat:'18ft Majek Extreme — "Skinny Dipper"', avatar:'🐟', trips:23, rating:4.7, date:'Sunday', time:'5:00 AM', launch:'River Road Access', area:'Colorado River Mouth — wade trip', spotsOpen:1, gasSplit:'$20/person', plan:'Short boat ride to the river mouth. All wading — targeting snook and reds on outgoing tide. We fish topwater and soft plastics. Back by noon.', lookingFor:'intermediate', lookingDesc:'Someone comfortable wading waist-deep in current. Should know how to work topwater and soft plastics. We fish together and share intel — not a solo mission.', rules:['Own gear required','Wading belt mandatory','Know your limits','Share GPS spots from the day'], vibe:'We fish as a team. Call out bait, share what\'s working, hype each other up. If you catch a snook we\'re all celebrating.' },
    { id:4, name:'Big Ray', age:'60s', boat:'21ft Dargel Skout — "Pay Day"', avatar:'⚓', trips:200+' ', rating:5.0, date:'Wednesday', time:'4:30 AM', launch:'Matagorda Harbor', area:'East Mat — multiple spots', spotsOpen:1, gasSplit:'$35/person', plan:'Full day — leaving in the dark. I fish 3-4 spots depending on conditions. Start with topwater, switch to plastics, finish with live bait if needed. I know every reef in this bay.', lookingFor:'experienced', lookingDesc:'Serious fisherman only. You need to keep up, wade fast, and not need babysitting. I\'ve been fishing this bay 30+ years. If you can hang, you\'ll learn more in one trip than a year of YouTube.', rules:['There by 4:15 or I leave','Own premium gear','No phones during fishing','Split cleaning fish at dock'], vibe:'Old school. No nonsense. I don\'t talk much on the water. But I\'ll put you on fish you didn\'t know existed.' },
  ];

  const baySpots=spots.filter(s=>s.bay===selBay?.id);
  const filtered=spotFilter==='all'?baySpots:baySpots.filter(s=>s.type===spotFilter);
  const bayPhotos=photos.filter(p=>p.bay===selBay?.id);
  const bayLaunches=launches.filter(l=>l.bay===(selBay?.id||'matagorda'));
  const bayShades=shadeZones.filter(z=>z.bay===(selBay?.id||'matagorda'));
  const curRoute=selSpot?.route||[];
  const curWP=curRoute[routeStep];

  useEffect(()=>{
    if(playing&&curRoute.length){
      const t=setInterval(()=>setRouteStep(p=>{if(p>=curRoute.length-1){setPlaying(false);return p;}return p+1;}),3500);
      return ()=>clearInterval(t);
    }
  },[playing,curRoute.length]);

  const showT=m=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const cpGPS=g=>{navigator.clipboard?.writeText(`${g.lat}, ${g.lng}`);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const sc=t=>({wade:C.amber,boat:C.blue,kayak:C.green,drivein:C.purple}[t]||C.dim);
  const si=t=>({wade:'🚶',boat:'🚤',kayak:'🛶',drivein:'🚗'}[t]||'📍');
  const li=t=>({boat:'⛵',kayak:'🛶',drivein:'🚗'}[t]||'📍');
  const openBay=id=>{setSelBay(bayData[id]);setPage('bay');setSelSpot(null);setShowRoute(false);setShowBS(false);};
  const openSpot=s=>{setSelSpot(s);setShowRoute(false);setRouteStep(0);};
  const startNav=()=>{setShowRoute(true);setRouteStep(0);setPlaying(false);};
  const lfColor=t=>({experienced:C.amber,intermediate:C.cyan,anyone:C.green}[t]||C.mid);
  const lfLabel=t=>({experienced:'Experienced Fisherman',intermediate:'Intermediate — Knows Basics',anyone:'Anyone Welcome — All Levels'}[t]||t);

  const Btn=({children,primary,small,danger,...p})=><button {...p} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:small?'6px 12px':'10px 18px',borderRadius:small?6:10,background:danger?`${C.red}20`:primary?`linear-gradient(135deg,${C.cyan},${C.teal})`:C.card2,color:danger?C.red:primary?C.bg:C.mid,border:`1px solid ${danger?`${C.red}40`:primary?'transparent':C.bdr}`,fontWeight:primary?700:500,fontSize:small?12:14,cursor:'pointer',fontFamily:F,...(p.style||{})}}>{children}</button>;
  const Label=({children})=><div style={{fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700,marginBottom:6}}>{children}</div>;
  const Input=({label,...p})=><div style={{marginBottom:12}}>{label&&<Label>{label}</Label>}<input {...p} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:13,fontFamily:F,outline:'none',...(p.style||{})}} /></div>;
  const Select=({label,options,...p})=><div style={{marginBottom:12}}>{label&&<Label>{label}</Label>}<select {...p} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:13,fontFamily:F,...(p.style||{})}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
  const Badge=({color,children})=><span style={{padding:'3px 10px',borderRadius:6,background:`${color}20`,color,fontSize:11,fontWeight:600}}>{children}</span>;
  const Modal=({title,sub,onClose,wide,children})=>(
    <div style={{position:'fixed',inset:0,background:'#000a',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}}>
      <div style={{background:C.card,borderRadius:20,maxWidth:wide?800:560,width:'100%',maxHeight:'90vh',overflow:'auto',border:`1px solid ${C.bdr2}`}}>
        <div style={{padding:'16px 24px',borderBottom:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:C.card,zIndex:1,borderRadius:'20px 20px 0 0'}}>
          <div><div style={{fontWeight:700,fontSize:16}}>{title}</div>{sub&&<div style={{fontSize:12,color:C.mid}}>{sub}</div>}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.dim,cursor:'pointer'}}><XI s={18}/></button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );

  // ─── SVG MAP ───
  const MapSVG=()=>(
    <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',transform:`scale(${zoom})`,transformOrigin:'center',transition:'transform 0.3s'}}>
      <defs>
        <linearGradient id="wg" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0c4a6e"/><stop offset="30%" stopColor="#155e75"/><stop offset="100%" stopColor="#1e7490"/></linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4a5d23"/><stop offset="100%" stopColor="#2d3a16"/></linearGradient>
        <linearGradient id="mg2"><stop offset="0%" stopColor="#3d5a3d"/><stop offset="100%" stopColor="#2d4a2d"/></linearGradient>
        <pattern id="gp" patternUnits="userSpaceOnUse" width="2" height="2"><rect width="2" height="2" fill="#1a6a7a"/><line x1="0" y1="2" x2="1" y2="0" stroke="#2a7a8a" strokeWidth="0.3"/></pattern>
        <pattern id="rp" patternUnits="userSpaceOnUse" width="3" height="3"><rect width="3" height="3" fill="#5a6a5a"/><circle cx="1.5" cy="1.5" r="0.8" fill="#4a5a4a"/></pattern>
        <filter id="gl"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="100" height="100" fill="url(#wg)"/>
      {/* ICW channel */}
      <path d="M0,82 Q15,78 30,72 Q50,62 70,55 Q85,50 100,48" fill="none" stroke="#0a4a6a" strokeWidth="5" opacity="0.7"/>
      <path d="M0,82 Q15,78 30,72 Q50,62 70,55 Q85,50 100,48" fill="none" stroke="#0e5580" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
      {/* Grass flats */}
      <ellipse cx="75" cy="28" rx="18" ry="14" fill="url(#gp)" opacity="0.5"/>
      <ellipse cx="55" cy="35" rx="14" ry="10" fill="url(#gp)" opacity="0.4"/>
      <ellipse cx="25" cy="44" rx="10" ry="7" fill="url(#gp)" opacity="0.4"/>
      <ellipse cx="15" cy="60" rx="7" ry="5" fill="url(#gp)" opacity="0.35"/>
      {/* Oyster reefs */}
      <ellipse cx="62" cy="48" rx="4" ry="2.5" fill="url(#rp)" opacity="0.6"/><ellipse cx="45" cy="42" rx="3" ry="2" fill="url(#rp)" opacity="0.6"/><ellipse cx="68" cy="38" rx="2.5" ry="1.5" fill="url(#rp)" opacity="0.5"/>
      {/* Land mass — south */}
      <path d="M0,88 Q8,85 15,88 Q22,92 30,88 Q38,84 45,88 L45,100 L0,100Z" fill="url(#lg2)"/>
      {/* Land mass — north */}
      <path d="M55,4 Q70,2 85,5 Q95,8 100,6 L100,0 L55,0Z" fill="url(#lg2)"/>
      <path d="M0,0 L0,6 Q5,4 10,6 Q15,9 20,6 Q25,4 30,5 L30,0Z" fill="url(#lg2)" opacity="0.7"/>
      {/* Harbor */}
      <path d="M5,75 L5,86 Q9,87 13,85 L15,75 Q12,73 7,74Z" fill="#2d3d2d" stroke="#4d5d4d" strokeWidth="0.3"/>
      <rect x="7" y="78" width="5" height="1" fill="#5a6a7a" rx="0.2"/>
      <rect x="8" y="80" width="3" height="0.6" fill="#5a6a7a" rx="0.2"/>
      <text x="10" y="89" fontSize="1.8" fill={C.mid} opacity="0.6" textAnchor="middle" fontWeight="600">HARBOR</text>
      {/* Spoil islands */}
      <ellipse cx="38" cy="68" rx="4" ry="2" fill="url(#mg2)"/><ellipse cx="48" cy="61" rx="5" ry="2.5" fill="url(#mg2)"/><ellipse cx="58" cy="55" rx="3.5" ry="1.8" fill="url(#mg2)"/><ellipse cx="70" cy="24" rx="3" ry="1.5" fill="url(#mg2)" opacity="0.8"/>
      {/* Channel markers */}
      {[[18,75],[28,70],[42,63],[56,54]].map(([x,y],i)=><circle key={`r${i}`} cx={x} cy={y} r="0.7" fill="#dc2626" stroke="#fff" strokeWidth="0.2"/>)}
      {[[15,78],[25,73],[38,66],[52,57]].map(([x,y],i)=><circle key={`g${i}`} cx={x} cy={y} r="0.7" fill="#16a34a" stroke="#fff" strokeWidth="0.2"/>)}
      {/* Labels */}
      <text x="65" y="14" fontSize="2.2" fill="#fff" opacity="0.2" textAnchor="middle" fontWeight="700">EAST MATAGORDA BAY</text>
      <text x="55" y="72" fontSize="1.5" fill={C.mid} opacity="0.35" textAnchor="middle">ICW</text>
      <text x="62" y="51" fontSize="1.2" fill={C.mid} opacity="0.3" textAnchor="middle">REEF</text>
      <text x="25" y="48" fontSize="1.2" fill={C.mid} opacity="0.3" textAnchor="middle">OYSTER LAKE</text>

      {/* Shade zones */}
      {!showRoute && bayShades.map(z=><ellipse key={z.id} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill={z.color} opacity="0.12" stroke={z.color} strokeWidth="0.4" strokeDasharray="1.5 1"/>)}

      {/* Launch points */}
      {!showRoute && bayLaunches.map(l=>(
        <g key={l.id}><rect x={l.position.x-2.5} y={l.position.y-2} width="5" height="4" rx="1" fill={C.bg} stroke={sc(l.type)} strokeWidth="0.4" opacity="0.9"/><text x={l.position.x} y={l.position.y+0.8} textAnchor="middle" fontSize="2.5">{li(l.type)}</text></g>
      ))}

      {/* Community photos */}
      {!showRoute && bayPhotos.map(p=>(
        <g key={p.id}><circle cx={p.position.x} cy={p.position.y} r="1.8" fill={C.purple} stroke="#fff" strokeWidth="0.3" opacity="0.8"/><text x={p.position.x} y={p.position.y+0.6} textAnchor="middle" fontSize="1.8">📷</text></g>
      ))}

      {/* Route overlay */}
      {showRoute && selSpot?.route && <>
        <path d={`M ${selSpot.route.map(w=>`${w.pos.x},${w.pos.y}`).join(' L ')}`} fill="none" stroke={C.cyan} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.4"/>
        <path d={`M ${selSpot.route.slice(0,routeStep+1).map(w=>`${w.pos.x},${w.pos.y}`).join(' L ')}`} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" filter="url(#gl)"/>
        {selSpot.route.map((w,i)=>(
          <g key={i} onClick={()=>setRouteStep(i)} style={{cursor:'pointer'}}>
            {i===routeStep&&<circle cx={w.pos.x} cy={w.pos.y} r="4" fill={C.cyan} opacity="0.3"><animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite"/></circle>}
            <circle cx={w.pos.x} cy={w.pos.y} r="2.5" fill={i<routeStep?C.green:i===routeStep?C.cyan:'#475569'} stroke="#fff" strokeWidth="0.4"/>
            <text x={w.pos.x} y={w.pos.y+0.8} textAnchor="middle" fontSize="2" fontWeight="bold" fill={i===routeStep?'#0f172a':'#fff'}>{i<routeStep?'✓':i+1}</text>
          </g>
        ))}
      </>}

      {/* Spot markers */}
      {!showRoute && filtered.map(s=>{
        const sel=selSpot?.id===s.id;
        return(
          <g key={s.id} onClick={()=>openSpot(s)} style={{cursor:'pointer'}}>
            {sel&&<circle cx={s.position.x} cy={s.position.y} r="5" fill={sc(s.type)} opacity="0.3"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/></circle>}
            {s.parking&&!sel&&<circle cx={s.parking.x} cy={s.parking.y} r="1" fill="#475569" stroke="#94a3b8" strokeWidth="0.2"/>}
            <circle cx={s.position.x} cy={s.position.y} r={sel?"3.5":"3"} fill={sc(s.type)} stroke="#fff" strokeWidth="0.5"/>
            <text x={s.position.x} y={s.position.y+1} textAnchor="middle" fontSize="2.8">{si(s.type)}</text>
          </g>
        );
      })}

      <g transform="translate(5,95)"><rect width="12" height="0.4" fill="#fff" opacity="0.6"/><text x="6" y="2.5" textAnchor="middle" fontSize="1.5" fill="#fff" opacity="0.5">1 mi</text></g>
      <g transform="translate(93,7)"><circle r="3.5" fill={C.bg} opacity="0.9" stroke={C.bdr} strokeWidth="0.3"/><text y="-0.8" textAnchor="middle" fontSize="2.2" fill={C.cyan} fontWeight="bold">N</text><path d="M0,0 L0.6,1.8 L0,1.2 L-0.6,1.8Z" fill={C.cyan}/></g>
    </svg>
  );

  return(
    <div style={{fontFamily:F,background:C.bg,color:C.txt,minHeight:'100vh'}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <header style={{background:C.card,borderBottom:`1px solid ${C.bdr}`,padding:'10px 20px',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>{setPage('home');setSelBay(null);setSelSpot(null);setShowBS(false);}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.cyan},${C.teal})`,display:'flex',alignItems:'center',justifyContent:'center'}}><FishI s={20} c="#0b1220"/></div>
            <div><div style={{fontSize:18,fontWeight:700}}>TEXAS<span style={{color:C.cyan}}>TIDES</span></div><div style={{fontSize:10,color:C.dim,letterSpacing:'0.1em'}}>COASTAL FISHING GUIDE</div></div>
          </div>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            {[{l:'Map',i:<PinI s={14}/>,a:()=>{setShowBS(false);if(!selBay)setPage('home');},on:!showBS},{l:'BoatShare',i:<UsrI s={14}/>,a:()=>setShowBS(true),on:showBS}].map(t=><button key={t.l} onClick={t.a} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,background:t.on?C.cyan:'transparent',color:t.on?C.bg:C.mid,border:'none',cursor:'pointer',fontFamily:F}}>{t.i} {t.l}</button>)}
            <div style={{width:1,height:24,background:C.bdr,margin:'0 4px'}}/>
            <button onClick={()=>setShowEditor(true)} style={{padding:'7px 10px',borderRadius:8,background:'transparent',border:'none',color:C.mid,cursor:'pointer'}} title="Map Editor"><MapEdI s={16}/></button>
            <button onClick={()=>setShowSettings(true)} style={{padding:'7px 10px',borderRadius:8,background:'transparent',border:'none',color:C.mid,cursor:'pointer'}} title="Settings"><GearI s={16}/></button>
          </div>
        </div>
      </header>

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

        {/* ═══ HOME ═══ */}
        {page==='home'&&!showBS&&(
          <div>
            <div style={{marginBottom:28,padding:'36px 28px',borderRadius:16,background:`linear-gradient(135deg,${C.card},#0d2847)`,border:`1px solid ${C.bdr}`,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,right:0,width:300,height:200,background:`radial-gradient(circle at 100% 0%,${C.cyan}15,transparent 70%)`}}/>
              <h2 style={{fontSize:26,fontWeight:700,marginBottom:6}}>Texas Bay Fishing Guide</h2>
              <p style={{color:C.mid,fontSize:14,maxWidth:580,lineHeight:1.6,marginBottom:16}}>Real-time conditions, GPS waypoints, navigation routes, community reports, and AI-powered spot recommendations.</p>
              <Btn primary onClick={()=>setShowAI(true)}><SparkI s={14} c={C.bg}/> Where Should I Fish Today?</Btn>
            </div>
            <Label>Select a Bay System</Label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16,marginTop:8}}>
              {Object.values(bayData).map(bay=>(
                <div key={bay.id} onClick={()=>openBay(bay.id)} style={{background:C.card,borderRadius:14,border:`1px solid ${C.bdr}`,overflow:'hidden',cursor:'pointer',transition:'border-color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan} onMouseLeave={e=>e.currentTarget.style.borderColor=C.bdr}>
                  <div style={{height:140,background:'#081828',position:'relative'}}>
                    <svg viewBox="0 0 100 50" style={{width:'100%',height:'100%'}}><defs><linearGradient id={`hw${bay.id}`} x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0c4a6e"/><stop offset="100%" stopColor="#1e7490"/></linearGradient></defs><rect width="100" height="50" fill={`url(#hw${bay.id})`}/><path d="M0,38 Q15,35 30,38 Q45,42 60,38L60,50L0,50Z" fill="#3d4f1f" opacity="0.7"/><path d="M60,40 Q80,37 100,39L100,50L60,50Z" fill="#3d4f1f" opacity="0.6"/>{spots.filter(s=>s.bay===bay.id).map(s=><circle key={s.id} cx={s.position.x*0.9+5} cy={s.position.y*0.45+3} r="2" fill={sc(s.type)} opacity="0.9"/>)}</svg>
                    <div style={{position:'absolute',bottom:8,left:10,display:'flex',gap:6}}>
                      {bay.cameras?.map(c=><span key={c.name} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:4,background:'#000a',fontSize:9,fontWeight:700}}><span style={{width:5,height:5,borderRadius:'50%',background:C.red}}/>LIVE</span>)}
                    </div>
                  </div>
                  <div style={{padding:14}}>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:3}}>{bay.name}</h3>
                    <p style={{fontSize:12,color:C.mid,marginBottom:10}}>{bay.sub} — {bay.region}</p>
                    {bay.reports?.[0]&&<div style={{background:C.card2,borderRadius:8,padding:10,border:`1px solid ${C.bdr}`}}><div style={{display:'flex',gap:6,marginBottom:4,fontSize:11}}><span style={{fontWeight:600,color:C.cyan}}>{bay.reports[0].user}</span><span style={{color:C.dim}}>{bay.reports[0].time}</span></div><p style={{fontSize:11,color:C.mid,margin:0,lineHeight:1.4}}>{bay.reports[0].text}</p></div>}
                    <div style={{marginTop:10,fontSize:11,color:C.dim}}>{spots.filter(s=>s.bay===bay.id).length} spots • {launches.filter(l=>l.bay===bay.id).length} launches</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ BAY DETAIL ═══ */}
        {page==='bay'&&selBay&&!showBS&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <button onClick={()=>{setPage('home');setSelBay(null);setSelSpot(null);}} style={{padding:'5px 10px',borderRadius:6,background:C.card,border:`1px solid ${C.bdr}`,color:C.mid,cursor:'pointer',fontFamily:F,fontSize:12,display:'flex',alignItems:'center',gap:4}}><ArrowLI s={13}/> Back</button>
              <div><h2 style={{fontSize:20,fontWeight:700}}>{selBay.name}</h2><p style={{fontSize:12,color:C.mid}}>{selBay.sub}</p></div>
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <Btn small onClick={()=>setShowPhotoUp(true)}><CamI s={13}/> Add Photo</Btn>
                <Btn small primary onClick={()=>setShowAI(true)}><SparkI s={13} c={C.bg}/> AI Advisor</Btn>
              </div>
            </div>
            <div style={{display:'flex',gap:4,marginBottom:14}}>
              {[{id:'all',l:'All',i:'📍'},{id:'wade',l:'Wade',i:'🚶'},{id:'boat',l:'Boat',i:'🚤'},{id:'kayak',l:'Kayak',i:'🛶'}].map(f=><button key={f.id} onClick={()=>setSpotFilter(f.id)} style={{display:'flex',alignItems:'center',gap:3,padding:'5px 12px',borderRadius:6,fontSize:11,fontWeight:600,background:spotFilter===f.id?C.cyan:C.card,color:spotFilter===f.id?C.bg:C.mid,border:`1px solid ${spotFilter===f.id?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:F}}>{f.i} {f.l}</button>)}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:14}}>
              {/* MAP */}
              <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.bdr}`,overflow:'hidden'}}>
                <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.bdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:13,fontWeight:600}}>{showRoute?`Route → ${selSpot?.name}`:'Interactive Fishing Map'}</div>
                  {showRoute&&<button onClick={()=>{setShowRoute(false);setRouteStep(0);setPlaying(false);}} style={{fontSize:11,color:C.mid,background:C.card2,border:`1px solid ${C.bdr}`,borderRadius:5,padding:'4px 10px',cursor:'pointer',fontFamily:F}}>← Map</button>}
                </div>
                <div style={{height:480,position:'relative',background:'#081828',overflow:'hidden'}}>
                  <MapSVG/>
                  <div style={{position:'absolute',bottom:10,left:10,background:`${C.bg}ee`,borderRadius:8,padding:'8px 12px',fontSize:10,border:`1px solid ${C.bdr}`}}>
                    {[['🚶 Wade',C.amber],['🚤 Boat',C.blue],['🛶 Kayak',C.green],['📷 Photo',C.purple],['⛵ Launch',C.mid]].map(([l,c])=><div key={l} style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}><div style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}</div>)}
                  </div>
                  <div style={{position:'absolute',top:10,right:10,display:'flex',flexDirection:'column',gap:3}}>
                    <button onClick={()=>setZoom(Math.min(zoom+0.2,2))} style={{width:32,height:32,borderRadius:6,background:`${C.card}dd`,border:`1px solid ${C.bdr}`,color:'#fff',cursor:'pointer',fontSize:16}}>+</button>
                    <button onClick={()=>setZoom(Math.max(zoom-0.2,0.8))} style={{width:32,height:32,borderRadius:6,background:`${C.card}dd`,border:`1px solid ${C.bdr}`,color:'#fff',cursor:'pointer',fontSize:16}}>−</button>
                  </div>
                </div>
                {showRoute&&<div style={{padding:'10px 14px',borderTop:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',gap:3}}>
                    {[{i:'◀',fn:()=>setRouteStep(Math.max(0,routeStep-1)),d:!routeStep},{i:playing?'⏸':'▶',fn:()=>setPlaying(!playing),p:true},{i:'▶',fn:()=>setRouteStep(Math.min(curRoute.length-1,routeStep+1)),d:routeStep>=curRoute.length-1},{i:'↺',fn:()=>{setRouteStep(0);setPlaying(false);}}].map((b,i)=><button key={i} onClick={b.fn} disabled={b.d} style={{width:b.p?40:32,height:32,borderRadius:6,background:b.p?(playing?C.amber:C.cyan):C.card2,border:`1px solid ${C.bdr}`,color:b.p?C.bg:'#fff',cursor:b.d?'default':'pointer',opacity:b.d?.4:1,fontFamily:F,fontSize:13}}>{b.i}</button>)}
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
                        <button onClick={()=>cpGPS(selSpot.gps)} style={{padding:'4px 8px',borderRadius:4,background:copied?C.green:C.card,border:`1px solid ${C.bdr}`,color:copied?'#fff':C.mid,cursor:'pointer',fontSize:10,fontFamily:F}}>{copied?'✓':'Copy'}</button>
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
                    {curWP.warnings?.length>0&&<div style={{marginTop:6,background:`${C.amber}08`,border:`1px solid ${C.amber}20`,borderRadius:6,padding:8}}>{curWP.warnings.map((w,i)=><div key={i} style={{fontSize:11,color:C.mid}}>⚠ {w}</div>)}</div>}
                  </div>}
                </>:<>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,padding:14}}>
                    <Label>Fishing Spots ({filtered.length})</Label>
                    <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:220,overflow:'auto'}}>
                      {filtered.map(s=><button key={s.id} onClick={()=>openSpot(s)} style={{display:'flex',alignItems:'center',gap:8,padding:8,borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,cursor:'pointer',textAlign:'left',width:'100%',fontFamily:F,color:C.txt}}><div style={{width:32,height:32,borderRadius:6,background:sc(s.type),display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{si(s.type)}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div><div style={{fontSize:10,color:C.dim}}><StarI s={9} c={C.amber} filled/> {s.rating} • {s.species.slice(0,2).join(', ')}</div></div></button>)}
                    </div>
                  </div>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,padding:14}}>
                    <Label>Recent Reports</Label>
                    {selBay.reports?.map((r,i)=><div key={i} style={{background:C.card2,borderRadius:8,padding:8,marginBottom:6,border:`1px solid ${C.bdr}`}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:11}}><span style={{fontWeight:600,color:C.cyan}}>{r.user}</span><span style={{color:C.dim}}>{r.time}</span></div><p style={{fontSize:11,color:C.mid,margin:0,lineHeight:1.4}}>{r.text}</p></div>)}
                  </div>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,padding:14}}>
                    <Label>Launch Points</Label>
                    {bayLaunches.map(l=><div key={l.id} style={{display:'flex',gap:8,alignItems:'center',padding:8,background:C.card2,borderRadius:8,marginBottom:4,border:`1px solid ${C.bdr}`}}><span style={{fontSize:18}}>{li(l.type)}</span><div><div style={{fontSize:12,fontWeight:600}}>{l.name}</div><div style={{fontSize:10,color:C.dim}}>{l.notes}</div></div></div>)}
                  </div>
                </>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ BOATSHARE ═══ */}
        {showBS&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div><h2 style={{fontSize:22,fontWeight:700}}>BoatShare</h2><p style={{color:C.mid,fontSize:13}}>Local guys heading out — split gas, share the ride</p></div>
              <Btn primary><PlusI s={14} c={C.bg}/> Post Your Trip</Btn>
            </div>
            <p style={{color:C.dim,fontSize:12,marginBottom:20,lineHeight:1.5}}>These aren't guides — just regular fishermen with open spots on their boat. Chip in for gas, bring your gear (or not), and go fishing. Every captain has been rated by past riders.</p>
            
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {boatShareListings.map(l=>(
                <div key={l.id} style={{background:C.card,borderRadius:16,border:`1px solid ${C.bdr}`,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:0}}>
                    {/* LEFT — who & what */}
                    <div style={{padding:20,borderRight:`1px solid ${C.bdr}`}}>
                      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
                        <div style={{width:52,height:52,borderRadius:12,background:C.card2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>{l.avatar}</div>
                        <div>
                          <div style={{fontSize:17,fontWeight:700}}>{l.name}</div>
                          <div style={{fontSize:12,color:C.mid}}>{l.age} • <StarI s={11} c={C.amber} filled/> {l.rating} • {l.trips} trips</div>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:6,alignItems:'center',padding:'8px 12px',background:C.card2,borderRadius:8,marginBottom:12}}>
                        <AnchorI s={14} c={C.cyan}/><span style={{fontSize:13,fontWeight:500}}>{l.boat}</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,color:C.mid,marginBottom:14}}>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>📅 {l.date}</div>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>⏰ {l.time}</div>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>📍 {l.area}</div>
                        <div style={{background:C.card2,borderRadius:6,padding:'6px 10px'}}>🚀 From: {l.launch}</div>
                      </div>
                      <div style={{display:'flex',gap:10,marginBottom:14}}>
                        <div style={{background:`${C.green}15`,borderRadius:8,padding:'8px 14px',border:`1px solid ${C.green}30`}}>
                          <div style={{fontSize:10,color:C.green,fontWeight:700}}>SPOTS OPEN</div>
                          <div style={{fontSize:20,fontWeight:700}}>{l.spotsOpen}</div>
                        </div>
                        <div style={{background:`${C.cyan}10`,borderRadius:8,padding:'8px 14px',border:`1px solid ${C.cyan}30`}}>
                          <div style={{fontSize:10,color:C.cyan,fontWeight:700}}>GAS SPLIT</div>
                          <div style={{fontSize:20,fontWeight:700}}>{l.gasSplit}</div>
                        </div>
                      </div>
                      <Btn primary style={{width:'100%'}}>🤙 Request to Join</Btn>
                    </div>

                    {/* RIGHT — details & vibe */}
                    <div style={{padding:20}}>
                      {/* Looking for */}
                      <div style={{marginBottom:16}}>
                        <Label>Looking For</Label>
                        <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:`${lfColor(l.lookingFor)}10`,borderRadius:10,border:`1px solid ${lfColor(l.lookingFor)}25`}}>
                          <div style={{width:10,height:10,borderRadius:'50%',background:lfColor(l.lookingFor)}}/>
                          <div><div style={{fontSize:13,fontWeight:600,color:lfColor(l.lookingFor)}}>{lfLabel(l.lookingFor)}</div><div style={{fontSize:11,color:C.mid,lineHeight:1.4,marginTop:2}}>{l.lookingDesc}</div></div>
                        </div>
                      </div>

                      {/* The plan */}
                      <div style={{marginBottom:16}}>
                        <Label>The Plan</Label>
                        <p style={{fontSize:12,color:C.mid,lineHeight:1.6,margin:0}}>{l.plan}</p>
                      </div>

                      {/* The vibe */}
                      <div style={{marginBottom:16}}>
                        <Label>The Vibe</Label>
                        <div style={{background:C.card2,borderRadius:10,padding:12,border:`1px solid ${C.bdr}`}}>
                          <p style={{fontSize:12,color:C.txt,lineHeight:1.5,margin:0,fontStyle:'italic'}}>"{l.vibe}"</p>
                        </div>
                      </div>

                      {/* Rules */}
                      <div>
                        <Label>Rules / Need to Know</Label>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                          {l.rules.map(r=><span key={r} style={{padding:'4px 10px',borderRadius:6,background:C.card2,fontSize:11,color:C.mid,border:`1px solid ${C.bdr}`}}>{r}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ═══ SETTINGS ═══ */}
      {showSettings&&<Modal title="Settings" sub="API keys & preferences" onClose={()=>setShowSettings(false)}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><KeyI s={16} c={C.cyan}/><span style={{fontWeight:700,fontSize:14}}>Claude API Key</span></div>
          <Input label="API Key" type="password" placeholder="sk-ant-..." value={settings.claudeApiKey} onChange={e=>setSettings({...settings,claudeApiKey:e.target.value})}/>
          <div style={{background:`${C.cyan}08`,borderRadius:10,padding:12,border:`1px solid ${C.cyan}20`}}>
            <p style={{fontSize:11,color:C.mid,lineHeight:1.5,margin:0}}>Powers the AI Fishing Advisor. Analyzes wind, tide, season against your spots database. Get yours at console.anthropic.com</p>
          </div>
        </div>
        <div style={{height:1,background:C.bdr,margin:'20px 0'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',marginBottom:12}}>
          <div><div style={{fontSize:13,fontWeight:500}}>Auto AI Recommendations</div><div style={{fontSize:11,color:C.dim}}>Show suggestions when opening a bay</div></div>
          <button onClick={()=>setSettings({...settings,autoAI:!settings.autoAI})} style={{width:44,height:24,borderRadius:12,background:settings.autoAI?C.cyan:C.card2,border:`1px solid ${settings.autoAI?C.cyan:C.bdr}`,cursor:'pointer',position:'relative'}}><div style={{width:18,height:18,borderRadius:9,background:'#fff',position:'absolute',top:2,left:settings.autoAI?23:2,transition:'left 0.2s'}}/></button>
        </div>
        <Select label="Units" value={settings.units} onChange={e=>setSettings({...settings,units:e.target.value})} options={[{value:'imperial',label:'Imperial (°F, mph, ft)'},{value:'metric',label:'Metric (°C, km/h, m)'}]}/>
        <Btn primary style={{width:'100%',marginTop:12}} onClick={()=>{showT('Settings saved');setShowSettings(false);}}><SaveI s={14} c={C.bg}/> Save</Btn>
      </Modal>}

      {/* ═══ MAP EDITOR ═══ */}
      {showEditor&&<Modal title="Map Editor" sub="Manage spots, zones, and launches" onClose={()=>setShowEditor(false)} wide>
        <div style={{display:'flex',gap:4,marginBottom:20}}>
          {[{id:'spots',l:'Spots',i:'🎯'},{id:'shading',l:'Zones',i:'🗺️'},{id:'launches',l:'Launches',i:'⛵'},{id:'photos',l:'Photos',i:'📷'}].map(t=><button key={t.id} onClick={()=>setEdTab(t.id)} style={{flex:1,padding:'10px',borderRadius:8,fontSize:12,fontWeight:600,background:edTab===t.id?C.cyan:C.card2,color:edTab===t.id?C.bg:C.mid,border:`1px solid ${edTab===t.id?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:F}}>{t.i} {t.l}</button>)}
        </div>
        {edTab==='spots'&&<div>{spots.filter(s=>s.bay==='matagorda').map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:C.card2,borderRadius:10,border:`1px solid ${C.bdr}`,marginBottom:6}}><div style={{width:36,height:36,borderRadius:8,background:sc(s.type),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{si(s.type)}</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{s.name}</div><div style={{fontSize:11,color:C.dim}}>{s.gps.lat}, {s.gps.lng} • {s.route.length} waypoints</div></div><Btn small><EditI s={12}/> Edit</Btn></div>)}<Btn primary style={{width:'100%',marginTop:12}}><PlusI s={14} c={C.bg}/> Add Spot</Btn></div>}
        {edTab==='shading'&&<div>{bayShades.map(z=><div key={z.id} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:C.card2,borderRadius:10,border:`1px solid ${C.bdr}`,marginBottom:6}}><div style={{width:32,height:32,borderRadius:8,background:`${z.color}30`,border:`2px dashed ${z.color}`,display:'flex',alignItems:'center',justifyContent:'center'}}>{si(z.type)}</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{z.label}</div><div style={{fontSize:11,color:C.dim}}>({z.cx},{z.cy}) {z.rx}×{z.ry}</div></div><Btn small danger onClick={()=>{setShadeZones(shadeZones.filter(s=>s.id!==z.id));showT('Removed');}}><TrashI s={12}/></Btn></div>)}
          <div style={{background:C.card2,borderRadius:12,padding:16,marginTop:12,border:`1px solid ${C.bdr}`}}>
            <Label>Add Zone</Label>
            <Select label="Type" value={newShade.type} onChange={e=>setNewShade({...newShade,type:e.target.value})} options={[{value:'wade',label:'🚶 Wade Zone'},{value:'kayak',label:'🛶 Kayak Zone'},{value:'boat',label:'🚤 Boat Area'}]}/>
            <Input label="Label" placeholder="e.g. North Shell Ridge" value={newShade.label} onChange={e=>setNewShade({...newShade,label:e.target.value})}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}>
              <Input label="Ctr X" type="number" value={newShade.cx} onChange={e=>setNewShade({...newShade,cx:+e.target.value})}/>
              <Input label="Ctr Y" type="number" value={newShade.cy} onChange={e=>setNewShade({...newShade,cy:+e.target.value})}/>
              <Input label="W" type="number" value={newShade.rx} onChange={e=>setNewShade({...newShade,rx:+e.target.value})}/>
              <Input label="H" type="number" value={newShade.ry} onChange={e=>setNewShade({...newShade,ry:+e.target.value})}/>
            </div>
            <Btn primary onClick={()=>{setShadeZones([...shadeZones,{...newShade,id:Date.now(),color:sc(newShade.type),bay:'matagorda'}]);setNewShade({type:'wade',label:'',cx:50,cy:50,rx:8,ry:5});showT('Zone added');}}><PlusI s={14} c={C.bg}/> Add</Btn>
          </div>
        </div>}
        {edTab==='launches'&&<div>{bayLaunches.map(l=><div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:C.card2,borderRadius:10,border:`1px solid ${C.bdr}`,marginBottom:6}}><span style={{fontSize:22}}>{li(l.type)}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{l.name}</div><div style={{fontSize:11,color:C.dim}}>{l.gps} • {l.type}</div></div><Btn small><EditI s={12}/></Btn></div>)}
          <div style={{background:C.card2,borderRadius:12,padding:16,marginTop:12,border:`1px solid ${C.bdr}`}}>
            <Label>Add Launch</Label>
            <Input label="Name" placeholder="South Jetty Ramp" value={newLaunch.name} onChange={e=>setNewLaunch({...newLaunch,name:e.target.value})}/>
            <Select label="Type" value={newLaunch.type} onChange={e=>setNewLaunch({...newLaunch,type:e.target.value})} options={[{value:'boat',label:'⛵ Boat Ramp'},{value:'kayak',label:'🛶 Kayak Launch'},{value:'drivein',label:'🚗 Drive-in Access'}]}/>
            <Input label="GPS" placeholder="28.6847°N, 95.9654°W" value={newLaunch.gps} onChange={e=>setNewLaunch({...newLaunch,gps:e.target.value})}/>
            <Input label="Notes" placeholder="Parking, hours, fees" value={newLaunch.notes} onChange={e=>setNewLaunch({...newLaunch,notes:e.target.value})}/>
            <Btn primary onClick={()=>{setLaunches([...launches,{...newLaunch,id:Date.now(),position:{x:50,y:50},bay:'matagorda'}]);setNewLaunch({name:'',type:'boat',gps:'',notes:''});showT('Launch added');}}><PlusI s={14} c={C.bg}/> Add</Btn>
          </div>
        </div>}
        {edTab==='photos'&&<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{photos.map(p=><div key={p.id} style={{background:C.card2,borderRadius:10,padding:12,border:`1px solid ${C.bdr}`}}><div style={{width:'100%',height:80,background:`${C.purple}15`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}><ImgI s={24} c={C.dim}/></div><div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{p.caption}</div><div style={{fontSize:10,color:C.dim}}>by {p.user} • ❤️ {p.likes}</div></div>)}</div></div>}
      </Modal>}

      {showPhotoUp&&<Modal title="Add Photo to Map" onClose={()=>setShowPhotoUp(false)}>
        <div style={{width:'100%',height:140,background:C.card2,borderRadius:12,border:`2px dashed ${C.bdr2}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:16}}><UploadI s={32} c={C.dim}/><div style={{fontSize:13,color:C.mid,marginTop:8}}>Click or drag & drop</div></div>
        <Input label="Caption" placeholder="What does this show?"/>
        <Input label="GPS (optional)" placeholder="28.7234°N, 95.8612°W"/>
        <Btn primary style={{width:'100%'}} onClick={()=>{showT('Photo added');setShowPhotoUp(false);}}><CamI s={14} c={C.bg}/> Pin to Map</Btn>
      </Modal>}

      {showAI&&<Modal title="AI Fishing Advisor" sub="Powered by Claude" onClose={()=>setShowAI(false)}>
        {!settings.claudeApiKey?<div style={{textAlign:'center',padding:'20px 0'}}><SparkI s={40} c={C.dim}/><h3 style={{marginTop:12}}>API Key Required</h3><p style={{fontSize:13,color:C.mid,marginTop:6,marginBottom:16}}>Add your Claude API key in Settings.</p><Btn primary onClick={()=>{setShowAI(false);setShowSettings(true);}}><KeyI s={14} c={C.bg}/> Open Settings</Btn></div>:
        <div>
          <div style={{background:C.card2,borderRadius:10,padding:12,marginBottom:14,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,fontSize:11}}>
            <div><div style={{color:C.dim}}>Wind</div><div style={{fontWeight:600}}>{weather.wind} mph {weather.windDir}</div></div>
            <div><div style={{color:C.dim}}>Tide</div><div style={{fontWeight:600}}>{tide.status}</div></div>
            <div><div style={{color:C.dim}}>Water</div><div style={{fontWeight:600}}>{weather.waterTemp}°F</div></div>
          </div>
          <div style={{background:`${C.cyan}08`,border:`1px solid ${C.cyan}20`,borderRadius:12,padding:14,marginBottom:14}}>
            <div style={{fontSize:10,textTransform:'uppercase',color:C.cyan,fontWeight:700,marginBottom:6}}>🎯 Top Pick Today</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Shell Island Flats</div>
            <p style={{fontSize:12,color:C.mid,lineHeight:1.6,margin:0}}>SE wind at {weather.wind} mph pushes bait onto shell pads. Incoming tide flooding grass edges — redfish will feed aggressively. Start early with topwater.</p>
          </div>
          <div style={{background:C.card2,borderRadius:10,padding:12,marginBottom:14}}>
            <div style={{fontSize:10,textTransform:'uppercase',color:C.teal,fontWeight:700,marginBottom:6}}>🎣 Lure Strategy</div>
            <p style={{fontSize:12,color:C.mid,lineHeight:1.5,margin:0}}>She Dog topwater at dawn. Switch to Bass Assassin 4" on 1/8oz jig when wind picks up. Gold spoon if you see tailing reds on the flat.</p>
          </div>
          <div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}20`,borderRadius:10,padding:12}}>
            <div style={{fontSize:10,textTransform:'uppercase',color:C.amber,fontWeight:700,marginBottom:6}}>⚠️ Avoid Today</div>
            <p style={{fontSize:12,color:C.mid,lineHeight:1.5,margin:0}}>Open bay flats — choppy at 12+ mph SE. Army Hole will be stirred up. Stick to protected shell areas with wind at your back.</p>
          </div>
        </div>}
      </Modal>}

      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'#fff',padding:'10px 24px',borderRadius:10,fontSize:13,fontWeight:600,zIndex:200,boxShadow:'0 4px 20px #0008',display:'flex',alignItems:'center',gap:6}}>✓ {toast}</div>}

      <style>{`*{box-sizing:border-box;margin:0}button{transition:all 0.15s}button:hover{filter:brightness(1.08)}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.bdr2};border-radius:3px}`}</style>
    </div>
  );
}
