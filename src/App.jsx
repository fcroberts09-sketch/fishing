import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Tooltip, Polyline, Circle, Polygon, useMap, useMapEvents } from 'react-leaflet';
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
const UndoI=p=><I {...p} d={<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>}/>;
const ClockI=p=><I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;

// ─── HAVERSINE DISTANCE (nautical miles) ───
function haversineNM(lat1,lng1,lat2,lng2) {
  const R = 3440.065;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function calcBearing(lat1,lng1,lat2,lng2) {
  const toRad = d => d * Math.PI / 180;
  const y = Math.sin(toRad(lng2-lng1))*Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1))*Math.sin(toRad(lat2)) - Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(toRad(lng2-lng1));
  return ((Math.atan2(y,x)*180/Math.PI)+360) % 360;
}
function bearingLabel(deg) {
  const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg/22.5) % 16];
}

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
function harborIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${C.green};border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 12px #0006">\u2693</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
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

function MapClickHandler({ onRightClick, onLeftClick, editMode, isMobile }) {
  const pressTimer = useRef(null);
  const pressPos = useRef(null);
  const map = useMap();
  
  useEffect(() => {
    if (!isMobile || !editMode) return;
    const container = map.getContainer();
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      pressPos.current = { x: touch.clientX, y: touch.clientY };
      pressTimer.current = setTimeout(() => {
        // Convert touch position to latlng
        const rect = container.getBoundingClientRect();
        const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
        const latlng = map.containerPointToLatLng(point);
        onRightClick({ originalEvent: { preventDefault: () => {} }, latlng, containerPoint: point });
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate(50);
      }, 600);
    };
    const onTouchMove = (e) => {
      if (pressTimer.current && pressPos.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - pressPos.current.x;
        const dy = touch.clientY - pressPos.current.y;
        if (Math.sqrt(dx*dx + dy*dy) > 10) { clearTimeout(pressTimer.current); pressTimer.current = null; }
      }
    };
    const onTouchEnd = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd);
    return () => { container.removeEventListener('touchstart', onTouchStart); container.removeEventListener('touchmove', onTouchMove); container.removeEventListener('touchend', onTouchEnd); };
  }, [isMobile, editMode, map, onRightClick]);

  useMapEvents({
    contextmenu: (e) => { if (editMode) onRightClick(e); },
    click: () => { onLeftClick(); },
  });
  return null;
}

// ─── BAY CONFIGS ───
const BAY_CONFIGS = {
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

// ─── HARBOR/MARINA DATA (Navigation always starts here) ───
const BAY_HARBORS = {
  matagorda: { 
    id: 'mat-harbor', name: 'Matagorda Harbor', 
    position: {x:12, y:78}, 
    desc: 'Main harbor — fuel, bait, ice available',
    depth: '4-6 ft', type: 'boat'
  },
  galveston: {
    id: 'gal-harbor', name: 'Galveston Yacht Basin',
    position: {x:42, y:45},
    desc: 'Full-service marina — Harborside Dr',
    depth: '6-8 ft', type: 'boat'
  },
};

// ─── CHANNEL / ICW WAYPOINTS for route generation ───
const CHANNEL_WAYPOINTS = {
  matagorda: [
    { pos:{x:12,y:78}, name:'Matagorda Harbor', depth:'4-6 ft', warnings:['No wake zone'] },
    { pos:{x:18,y:74}, name:'Harbor Channel', depth:'5-7 ft', warnings:[] },
    { pos:{x:25,y:70}, name:'Channel Marker G7', depth:'6-8 ft', warnings:[] },
    { pos:{x:35,y:65}, name:'ICW Junction', depth:'12-15 ft', warnings:['Barge traffic — stay right'] },
    { pos:{x:50,y:58}, name:'ICW East', depth:'10-12 ft', warnings:[] },
    { pos:{x:65,y:50}, name:'East Bay Entry', depth:'5-8 ft', warnings:['Oyster reefs — GPS only'] },
    { pos:{x:80,y:40}, name:'Far East Flats', depth:'3-5 ft', warnings:['Very shallow at low tide'] },
  ],
  galveston: [
    { pos:{x:42,y:45}, name:'Yacht Basin', depth:'6-8 ft', warnings:['No wake zone'] },
    { pos:{x:45,y:50}, name:'Harborside Channel', depth:'6-8 ft', warnings:[] },
    { pos:{x:50,y:55}, name:'Texas City Channel', depth:'10-14 ft', warnings:['Ship traffic'] },
    { pos:{x:55,y:48}, name:'Dollar Reef Area', depth:'4-6 ft', warnings:[] },
    { pos:{x:60,y:40}, name:'Mid-Bay', depth:'6-8 ft', warnings:[] },
    { pos:{x:70,y:35}, name:'Trinity Bay Approach', depth:'5-7 ft', warnings:['Shallow east side'] },
    { pos:{x:40,y:65}, name:'West Bay Entry', depth:'4-6 ft', warnings:['Markers shift — use GPS'] },
  ],
};

// ─── AUTO-ROUTE GENERATOR ───
// Generates navigation route from harbor to any spot
function generateRoute(bayId, targetPos, spotName) {
  const harbor = BAY_HARBORS[bayId];
  const channels = CHANNEL_WAYPOINTS[bayId] || [];
  if (!harbor) return [];

  const dist2d = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

  // Find nearest channel waypoint to target
  let bestIdx = 0;
  let bestDist = Infinity;
  channels.forEach((wp, i) => {
    const d = dist2d(wp.pos, targetPos);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  });

  // Build route: harbor -> channel waypoints (in order up to nearest) -> target
  const route = [];
  
  // Start at harbor
  route.push({
    pos: harbor.position,
    title: harbor.name,
    desc: 'Depart harbor, follow channel markers',
    depth: harbor.depth,
    warnings: ['No wake in harbor/marina'],
  });

  // Add intermediate channel waypoints (skip first if it IS the harbor)
  const startCh = channels[0] && dist2d(channels[0].pos, harbor.position) < 5 ? 1 : 0;
  for (let i = startCh; i <= bestIdx; i++) {
    const wp = channels[i];
    // Skip if too close to harbor or target
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

  // Final waypoint: the spot itself
  route.push({
    pos: targetPos,
    title: spotName,
    desc: 'Arrive at fishing spot',
    depth: '3-6 ft',
    warnings: ['Watch depth sounder'],
  });

  return route;
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
// ─── MOBILE DETECTION HOOK ───
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

export default function App() {
  const isMobile = useIsMobile();
  const [mobilePanel, setMobilePanel] = useState(null); // 'spots' | 'spot-detail' | 'nav' | 'editor' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const longPressTimer = useRef(null);
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

  // ─── TRIP TIMER ───
  const [tripActive,setTripActive]=useState(false);
  const [tripStart,setTripStart]=useState(null);
  const [tripElapsed,setTripElapsed]=useState('0:00');
  useEffect(()=>{
    if(!tripActive||!tripStart)return;
    const iv=setInterval(()=>{const d=Math.floor((Date.now()-tripStart)/1000);const m=Math.floor(d/60);const s=d%60;setTripElapsed(`${m}:${s.toString().padStart(2,'0')}`);},1000);
    return ()=>clearInterval(iv);
  },[tripActive,tripStart]);

  // ─── UNDO STACK ───
  const [undoStack,setUndoStack]=useState([]);
  const handleUndo=()=>{
    if(!undoStack.length) return;
    const last=undoStack[undoStack.length-1];
    if(last.type==='spot') setAllSpots(p=>[...p,last.data]);
    else if(last.type==='launch') setLaunches(p=>[...p,last.data]);
    else if(last.type==='zone') setShadeZones(p=>[...p,last.data]);
    else if(last.type==='wadeline') setWadeLines(p=>[...p,last.data]);
    else if(last.type==='photo') setCommunityPhotos(p=>[...p,last.data]);
    setUndoStack(p=>p.slice(0,-1));
    showT('Restored!');
  };
  const [confirmDelete,setConfirmDelete]=useState(null);

  const [shadeZones,setShadeZones]=useState([
    {id:1,type:'wade',label:'Shell Island Wade Zone',cx:77,cy:25,rx:9,ry:5,color:C.amber,bay:'matagorda'},
    {id:2,type:'wade',label:'River Mouth Sand Bar',cx:18,cy:59,rx:6,ry:3,color:C.amber,bay:'matagorda'},
    {id:3,type:'kayak',label:'Oyster Lake Paddle Zone',cx:27,cy:42,rx:6,ry:4,color:C.green,bay:'matagorda'},
    {id:4,type:'wade',label:'Dollar Reef Flat',cx:55,cy:52,rx:7,ry:4,color:C.amber,bay:'galveston'},
    {id:5,type:'boat',label:'Ship Channel Drift',cx:50,cy:40,rx:5,ry:8,color:C.blue,bay:'galveston'},
  ]);
  const [launches,setLaunches]=useState([
    {id:1,name:'Matagorda Harbor',type:'boat',position:{x:12,y:78},gps:'28.6847\u00B0N, 95.9654\u00B0W',notes:'50+ spots, fuel, bait, ice',bay:'matagorda',isHarbor:true},
    {id:2,name:'Oyster Lake Park',type:'kayak',position:{x:22,y:50},gps:'28.6912\u00B0N, 95.9234\u00B0W',notes:'Free, kayak-only',bay:'matagorda'},
    {id:3,name:'River Road Access',type:'drivein',position:{x:8,y:65},gps:'28.6801\u00B0N, 95.9601\u00B0W',notes:'4WD recommended',bay:'matagorda'},
    {id:4,name:'Galveston Yacht Basin',type:'boat',position:{x:42,y:45},gps:'29.2889\u00B0N, 94.7912\u00B0W',notes:'Full service marina',bay:'galveston',isHarbor:true},
    {id:5,name:'Texas City Dike',type:'boat',position:{x:50,y:60},gps:'29.3834\u00B0N, 94.9012\u00B0W',notes:'Public ramp, $12',bay:'galveston'},
    {id:6,name:'Eagle Point Marina',type:'boat',position:{x:35,y:38},gps:'29.3456\u00B0N, 94.8234\u00B0W',notes:'Protected launch, $15',bay:'galveston'},
  ]);
  const [communityPhotos,setCommunityPhotos]=useState([
    {id:1,user:'CaptMike',position:{x:73,y:30},caption:'Shell pad at low tide',time:'2 days ago',likes:24,bay:'matagorda'},
    {id:2,user:'WadeFisher22',position:{x:16,y:63},caption:'River mouth sandbar',time:'1 week ago',likes:18,bay:'matagorda'},
    {id:3,user:'KayakJen',position:{x:24,y:44},caption:'Tailing reds in back lake',time:'3 days ago',likes:31,bay:'matagorda'},
    {id:4,user:'BayRat42',position:{x:52,y:58},caption:'Sheepshead on fiddler crabs',time:'1 day ago',likes:14,bay:'galveston'},
  ]);
  const [newShade,setNewShade]=useState({type:'wade',label:'',cx:50,cy:50,rx:8,ry:5});
  const [newLaunch,setNewLaunch]=useState({name:'',type:'boat',gps:'',notes:''});

  // ─── ENHANCED MAP EDITOR STATE ───
  const [edMapMode,setEdMapMode]=useState(null);
  const [editingSpot,setEditingSpot]=useState(null);
  const [edSearch,setEdSearch]=useState('');
  const [edSortBy,setEdSortBy]=useState('name');
  const [editingWaypoint,setEditingWaypoint]=useState(null);
  const [gpsInput,setGpsInput]=useState({mode:'click',lat:'',lng:'',dms:'',format:'dd'});
  const [selFolder,setSelFolder]=useState('default');
  const [showGPSEntry,setShowGPSEntry]=useState(false);
  const [wpFolders,setWpFolders]=useState([{id:'default',name:'All Spots',color:C.cyan},{id:'fav',name:'Favorites',color:C.amber},{id:'recent',name:'Recent Trips',color:C.green}]);
  const [newSpotDraft,setNewSpotDraft]=useState({name:'',type:'wade',species:[],bestTide:'Incoming',bestTime:'',lures:[],desc:'',gps:{lat:'',lng:''},position:{x:50,y:50}});
  const [photoGPS,setPhotoGPS]=useState(null);
  const [photoCaption,setPhotoCaption]=useState('');
  const [showImport,setShowImport]=useState(false);
  const [showExport,setShowExport]=useState(false);
  const [spotNotes,setSpotNotes]=useState({});
  const [editMode,setEditMode]=useState(false);
  const [ctxMenu,setCtxMenu]=useState(null);
  const [editPopup,setEditPopup]=useState(null);
  const [dragging,setDragging]=useState(null);
  const [wadeLines,setWadeLines]=useState([
    {id:1,bay:'matagorda',label:'Shell Island Wade',points:[{x:72,y:32},{x:75,y:26},{x:78,y:22}],color:C.amber,castRange:40},
    {id:2,bay:'matagorda',label:'River Mouth Wade',points:[{x:13,y:64},{x:16,y:60},{x:19,y:57}],color:C.amber,castRange:40},
    {id:3,bay:'galveston',label:'Dike Rocks Wade',points:[{x:48,y:62},{x:52,y:58},{x:55,y:55}],color:C.amber,castRange:40},
  ]);
  const [drawingLine,setDrawingLine]=useState(null);
  const [editingZone,setEditingZone]=useState(null);
  const [editingLine,setEditingLine]=useState(null);
  const CAST_METERS = 40 * 0.9144;

  const weather={temp:78,wind:12,windDir:'SE',gusts:18,conditions:'Partly Cloudy',waterTemp:71};
  const tide={status:'Rising',next:'High at 2:34 PM'};

  const bayData={
    matagorda:{id:'matagorda',name:'Matagorda Bay Complex',sub:'East & West Matagorda Bay',region:'Matagorda, TX',cameras:[{name:'Harbor'},{name:'River Mouth'}],reports:[{user:'CaptMike',time:'2h ago',text:'Solid box of trout on topwater at Shell Island.',likes:12},{user:'WadeFisher22',time:'5h ago',text:'Reds stacked on river mouth. Gold spoon.',likes:8},{user:'KayakJen',time:'Yesterday',text:'4 reds on Gulp in Oyster Lake back.',likes:15}]},
    galveston:{id:'galveston',name:'Galveston Bay Complex',sub:'West Bay, Trinity, East Bay',region:'Galveston, TX',cameras:[{name:'Pier Cam'},{name:'Dike Cam'}],reports:[{user:'BayRat',time:'3h ago',text:'Sheepshead at dike rocks. Fiddler crabs.',likes:9},{user:'TrophyHunter',time:'6h ago',text:'Big trout on topwater near Dollar Reef sunrise.',likes:22},{user:'WadeKing',time:'1d ago',text:'Slot reds in West Bay grass. Gulp shrimp.',likes:16}]},
  };

  // ─── FISHING SPOTS (ALL BAYS) ───
  const [allSpots,setAllSpots]=useState([
    // MATAGORDA
    {id:1,bay:'matagorda',name:'Shell Island Flats',type:'wade',position:{x:75,y:28},gps:{lat:'28.7234\u00B0N',lng:'95.8612\u00B0W'},rating:4.9,species:['Redfish','Trout','Flounder'],bestTide:'Incoming',bestTime:'5-9 AM',bestSeason:'Spring & Fall',bestWind:'SE 5-15',lures:['She Dog','Bass Assassin 4\u2033','Gold Spoon'],desc:'Prime wade flat with scattered shell pads. Park boat 3ft south edge, wade north toward birds.',parking:{x:72,y:32},media:[{type:'photo',label:'Shell pad low tide'},{type:'video',label:'How to wade this flat'}]},
    {id:2,bay:'matagorda',name:'Bird Island Reef',type:'boat',position:{x:55,y:38},gps:{lat:'28.7089\u00B0N',lng:'95.8845\u00B0W'},rating:4.7,species:['Redfish','Black Drum','Sheepshead'],bestTide:'Moving',bestTime:'8-11 AM',bestSeason:'Year-round',bestWind:'S-SE <20',lures:['Live Shrimp','Blue Crab','Cut Mullet'],desc:'Drift reef edges or anchor leeward. Structure fishing all year.',parking:{x:53,y:41},media:[]},
    {id:3,bay:'matagorda',name:'Oyster Lake Back',type:'kayak',position:{x:25,y:45},gps:{lat:'28.6912\u00B0N',lng:'95.9234\u00B0W'},rating:4.5,species:['Redfish','Flounder'],bestTide:'High incoming',bestTime:'Dawn',bestSeason:'Fall',bestWind:'Light N-NE',lures:['Gold Spoon','Gulp 3\u2033','Topwater'],desc:'Skinny water kayak paradise. Sight-cast tailing reds.',parking:{x:22,y:50},media:[{type:'photo',label:'Dawn launch'}]},
    {id:4,bay:'matagorda',name:'Colorado River Mouth',type:'wade',position:{x:15,y:62},gps:{lat:'28.6756\u00B0N',lng:'95.9512\u00B0W'},rating:4.8,species:['Redfish','Trout','Snook'],bestTide:'Outgoing',bestTime:'4-7 PM',bestSeason:'Summer & Fall',bestWind:'Any <15',lures:['Topwater','Soft Plastic','Live Croaker'],desc:'Where river meets bay. Only reliable snook spot in TX bays.',parking:{x:12,y:66},media:[{type:'video',label:'Snook on outgoing'}]},
    {id:5,bay:'matagorda',name:'Army Hole',type:'boat',position:{x:42,y:50},gps:{lat:'28.6998\u00B0N',lng:'95.9001\u00B0W'},rating:4.6,species:['Trout','Redfish'],bestTide:'Incoming',bestTime:'6-10 AM',bestSeason:'Winter & Spring',bestWind:'N 10-20',lures:['MirrOlure','Jerk Shad','Live Shrimp'],desc:'Deep hole (8-12ft) near ICW. Fish stage here in cold fronts.',parking:{x:40,y:52},media:[]},
    // GALVESTON
    {id:6,bay:'galveston',name:'Dollar Reef',type:'wade',position:{x:55,y:52},gps:{lat:'29.2945\u00B0N',lng:'94.8123\u00B0W'},rating:4.7,species:['Redfish','Trout','Black Drum'],bestTide:'Incoming',bestTime:'6-10 AM',bestSeason:'Spring & Fall',bestWind:'S-SE 10-15',lures:['Gold Spoon','She Dog','Soft Plastic'],desc:'Classic Galveston wade spot. Scattered shell over hard sand. Wade the reef edges on incoming tide.',parking:{x:52,y:55},media:[]},
    {id:7,bay:'galveston',name:'San Luis Pass',type:'boat',position:{x:30,y:70},gps:{lat:'29.0823\u00B0N',lng:'95.1234\u00B0W'},rating:4.8,species:['Redfish','Trout','Tarpon','Jack Crevalle'],bestTide:'Outgoing',bestTime:'Dawn/Dusk',bestSeason:'Summer',bestWind:'Light any',lures:['Live Mullet','Topwater','Gotcha Plug'],desc:'Pass between Galveston and Follets Islands. Strong current = big fish. Anchor up-current and free-line live bait.',parking:{x:28,y:72},media:[]},
    {id:8,bay:'galveston',name:'Confederate Reef',type:'boat',position:{x:60,y:38},gps:{lat:'29.3456\u00B0N',lng:'94.7234\u00B0W'},rating:4.5,species:['Trout','Redfish','Flounder'],bestTide:'Moving',bestTime:'7-11 AM',bestSeason:'Year-round',bestWind:'S <20',lures:['Live Shrimp','Gulp','MirrOlure'],desc:'Submerged reef system mid-bay. Drift the edges with live shrimp under popping cork.',parking:{x:58,y:40},media:[]},
    {id:9,bay:'galveston',name:'West Bay Grass Flats',type:'kayak',position:{x:35,y:65},gps:{lat:'29.1234\u00B0N',lng:'95.0123\u00B0W'},rating:4.6,species:['Redfish','Flounder'],bestTide:'High incoming',bestTime:'Dawn',bestSeason:'Fall',bestWind:'Light N',lures:['Gold Spoon','Gulp 3\u2033 Shrimp','Topwater'],desc:'Endless grass flats in West Bay. Sight-cast reds tailing on high tide. Best by kayak for stealth.',parking:{x:33,y:67},media:[]},
    {id:10,bay:'galveston',name:'Texas City Dike Rocks',type:'wade',position:{x:50,y:58},gps:{lat:'29.3834\u00B0N',lng:'94.9012\u00B0W'},rating:4.4,species:['Sheepshead','Black Drum','Flounder'],bestTide:'Any',bestTime:'All Day',bestSeason:'Winter & Spring',bestWind:'Any <25',lures:['Fiddler Crabs','Live Shrimp','Cut Bait'],desc:'Rock jetty fishing from shore or wade the flats adjacent. Sheepshead stack up in winter.',parking:{x:48,y:60},media:[]},
  ]);

  const boatShareListings = [
    {id:1,name:'Mike R.',age:'Late 30s',boat:'22ft Haynie BigFoot \u2014 "Reel Deal"',avatar:'\uD83C\uDFA3',trips:47,rating:4.9,date:'Tomorrow (Tue)',time:'5:30 AM',launch:'Matagorda Harbor',area:'East Matagorda \u2014 shell flats',spotsOpen:2,gasSplit:'$30/person',plan:'Running to Shell Island area. Gonna wade the shell pads on incoming tide. Targeting reds and trout.',lookingFor:'experienced',lookingDesc:'Experienced wade fisherman who can fish independently.',rules:['Bring own tackle','Wade boots required','Be at ramp by 5:15','No keep if over limit'],vibe:'Serious fishing.'},
    {id:2,name:'Tommy D.',age:'50s',boat:'24ft Shallow Sport Mod-V \u2014 "Cold Beer"',avatar:'\uD83C\uDF7A',trips:89,rating:4.8,date:'Saturday',time:'6:00 AM',launch:'Matagorda Harbor',area:'West Mat \u2014 Bird Island, Army Hole',spotsOpen:3,gasSplit:'$25/person',plan:'Drifting reefs and deep holes. Got a 45qt of live shrimp coming.',lookingFor:'anyone',lookingDesc:'Anybody is welcome. Don\'t need your own gear.',rules:['BYOB','Sunscreen','$25 covers bait too','Kids welcome'],vibe:'Low-key day on the water.'},
    {id:3,name:'Sarah & Jake',age:'Late 20s',boat:'18ft Majek Extreme \u2014 "Skinny Dipper"',avatar:'\uD83D\uDC1F',trips:23,rating:4.7,date:'Sunday',time:'5:00 AM',launch:'River Road Access',area:'Colorado River Mouth \u2014 wade trip',spotsOpen:1,gasSplit:'$20/person',plan:'Short boat ride to the river mouth. All wading.',lookingFor:'intermediate',lookingDesc:'Someone comfortable wading waist-deep in current.',rules:['Own gear required','Wading belt mandatory','Share GPS spots from the day'],vibe:'We fish as a team.'},
    {id:4,name:'Big Ray',age:'60s',boat:'21ft Dargel Skout \u2014 "Pay Day"',avatar:'\u2693',trips:'200+',rating:5.0,date:'Wednesday',time:'4:30 AM',launch:'Matagorda Harbor',area:'East Mat \u2014 multiple spots',spotsOpen:1,gasSplit:'$35/person',plan:'Full day \u2014 leaving in the dark. I fish 3-4 spots depending on conditions.',lookingFor:'experienced',lookingDesc:'Serious fisherman only. 30+ years on this bay.',rules:['There by 4:15 or I leave','Own premium gear','No phones during fishing','Split cleaning at dock'],vibe:'Old school. No nonsense.'},
  ];

  const bayConfig = selBay ? BAY_CONFIGS[selBay.id] : BAY_CONFIGS.matagorda;
  const baySpots = allSpots.filter(s=>s.bay===selBay?.id);
  const filtered = spotFilter==='all'?baySpots:baySpots.filter(s=>s.type===spotFilter);
  const bayShades = shadeZones.filter(z=>z.bay===(selBay?.id||'matagorda'));
  const bayLaunches = launches.filter(l=>l.bay===(selBay?.id||'matagorda'));
  const bayWadeLines = wadeLines.filter(w=>w.bay===(selBay?.id||'matagorda'));
  const bayPhotos = communityPhotos.filter(p=>p.bay===(selBay?.id||'matagorda'));

  // ─── NAVIGATION: AUTO-ROUTE FROM HARBOR ───
  // Always generates fresh route from bay's harbor to selected spot
  const curRoute = useMemo(()=>{
    if(!selSpot || !selBay) return [];
    const bayId = selBay.id;
    const route = generateRoute(bayId, selSpot.position, selSpot.name);
    // Convert positions to lat/lng and compute distances
    return route.map((wp, i, arr) => {
      const [lat, lng] = bayConfig.toLatLng(wp.pos);
      let dist = 0, brng = 0, brngLbl = '';
      if (i > 0) {
        const [pLat, pLng] = bayConfig.toLatLng(arr[i-1].pos);
        dist = haversineNM(pLat, pLng, lat, lng);
        brng = calcBearing(pLat, pLng, lat, lng);
        brngLbl = bearingLabel(brng);
      }
      return { ...wp, lat, lng, dist, brng, brngLbl, cumDist: 0 };
    });
  }, [selSpot, selBay, bayConfig]);

  // Compute cumulative distances
  useMemo(()=>{let cum=0;curRoute.forEach(wp=>{cum+=wp.dist;wp.cumDist=cum;});},[curRoute]);
  const totalRouteNM = curRoute.length>0 ? curRoute[curRoute.length-1]?.cumDist||0 : 0;
  const curWP = curRoute[routeStep];

  // ─── GPS & COORDINATE HELPERS ───
  const parseDMS = (dms) => {
    // Parse DMS coordinates like 28 43 24.1 N 95 52 36.2 W
    const parts = dms.replace(/[\u00B0\u2032\u2033]/g,' ').replace(/['"]/g,' ').trim().split(/\s+/);
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
    // Parse decimal coordinates like 28.7234, -95.8612
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
    // Bay-aware: use selected bay config or fallback
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
      // Generate route for export
      const route = generateRoute(selBay?.id || 'matagorda', s.position, s.name);
      if(route.length > 0) {
        gpx += `  <rte><name>${s.name} Route</name>\n`;
        route.forEach((wp,i) => {
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
        imported.push({ id: Date.now() + Math.random(), bay:'matagorda', name, type: ['wade','boat','kayak'].includes(type)?type:'boat', position: pos, gps:{lat:formatGPS(lat,lng).split(',')[0],lng:formatGPS(lat,lng).split(',')[1]?.trim()}, rating:0, species:[], bestTide:'Any', bestTime:'', bestSeason:'', bestWind:'', lures:[], desc, parking:pos, media:[] });
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
    if (!showRoute || !curRoute.length) return [];
    return curRoute.map(w => [w.lat, w.lng]);
  }, [showRoute, curRoute]);

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

  // ─── INTERACTIVE MAP EDITING FUNCTIONS ───
  const dragJustEnded = useRef(false);
  const editPanelRef = useRef(null);

  const latLngToPosition = (lat, lng) => {
    const bc = selBay?.id === 'galveston' ? BAY_CONFIGS.galveston : BAY_CONFIGS.matagorda;
    const refLat = bc === BAY_CONFIGS.galveston ? 29.45 : 28.85;
    const refLng = bc === BAY_CONFIGS.galveston ? -95.10 : -96.18;
    const spanLat = bc === BAY_CONFIGS.galveston ? 0.30 : 0.32;
    const spanLng = bc === BAY_CONFIGS.galveston ? 0.55 : 0.62;
    const y = ((refLat - lat) / spanLat) * 100;
    const x = ((lng - refLng) / spanLng) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const posToGPS = (pos) => {
    const [lat, lng] = bayConfig.toLatLng(pos);
    return { lat, lng, str: lat.toFixed(5) + ', ' + lng.toFixed(5) };
  };

  const posToGPSStr = (pos) => {
    const [lat, lng] = bayConfig.toLatLng(pos);
    return { lat: Math.abs(lat).toFixed(4) + '\u00B0' + (lat >= 0 ? 'N' : 'S'), lng: Math.abs(lng).toFixed(4) + '\u00B0' + (lng <= 0 ? 'W' : 'E') };
  };

  const getCastLineOffsets = (pts, rangeMeters) => {
    if (pts.length < 2) return { left: [], right: [] };
    const coords = pts.map(p => bayConfig.toLatLng(p));
    const left = []; const right = [];
    const mPerLat = 111320;
    for (let i = 0; i < coords.length; i++) {
      let dx = 0; let dy = 0;
      if (i < coords.length - 1) { dx = coords[i+1][1] - coords[i][1]; dy = coords[i+1][0] - coords[i][0]; }
      else { dx = coords[i][1] - coords[i-1][1]; dy = coords[i][0] - coords[i-1][0]; }
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) { left.push(coords[i]); right.push(coords[i]); continue; }
      const nx = -dy / len; const ny = dx / len;
      const oLat = rangeMeters / mPerLat;
      const oLng = rangeMeters / (mPerLat * Math.cos(coords[i][0] * Math.PI / 180));
      left.push([coords[i][0] + nx * oLat, coords[i][1] + ny * oLng]);
      right.push([coords[i][0] - nx * oLat, coords[i][1] - ny * oLng]);
    }
    return { left, right };
  };

  // Select a marker for editing (called by click handlers)
  const selectForEdit = useCallback((type, id) => {
    if (dragJustEnded.current) return;
    let data = null;
    if (type === 'spot') data = allSpots.find(s => s.id === id);
    else if (type === 'launch') data = launches.find(l => l.id === id);
    else if (type === 'zone') data = shadeZones.find(z => z.id === id);
    else if (type === 'wadeline') data = wadeLines.find(w => w.id === id);
    else if (type === 'photo') data = communityPhotos.find(p => p.id === id);
    if (data) { setEditPopup({ type, id, data: { ...data } }); setCtxMenu(null); }
  }, [allSpots, launches, shadeZones, wadeLines, communityPhotos]);

  const handleMapRightClick = (e) => {
    e.originalEvent.preventDefault();
    if (drawingLine) {
      const pos = latLngToPosition(e.latlng.lat, e.latlng.lng);
      setDrawingLine(prev => ({ ...prev, points: [...prev.points, pos] }));
      showT('Point ' + (drawingLine.points.length + 1) + ' added');
      return;
    }
    setCtxMenu({ lat: e.latlng.lat, lng: e.latlng.lng, x: e.containerPoint.x, y: e.containerPoint.y });
  };

  const handleMapLeftClick = useCallback(() => {
    if (dragJustEnded.current) { dragJustEnded.current = false; return; }
    setCtxMenu(null);
  }, []);

  const handleAddFromCtx = (type) => {
    if (!ctxMenu) return;
    const pos = latLngToPosition(ctxMenu.lat, ctxMenu.lng);
    const gps = posToGPSStr(pos);
    const id = Date.now();
    if (type === 'wade-line') {
      setDrawingLine({ points: [pos], label: 'New Wade Line' });
      setCtxMenu(null);
      showT('Wade line started! Right-click map to add points.');
      return;
    }
    if (type === 'wade-zone') {
      const newZ = { id, type: 'wade', label: 'New Wade Zone', cx: pos.x, cy: pos.y, rx: 6, ry: 4, color: C.amber, bay: selBay?.id || 'matagorda' };
      setShadeZones(prev => [...prev, newZ]);
      setEditPopup({ type: 'zone', id, data: newZ });
      setCtxMenu(null);
      return;
    }
    if (type.startsWith('launch-')) {
      const lt = type.replace('launch-', '');
      const newL = { id, name: 'New Launch', type: lt, position: pos, gps: gps.lat + ', ' + gps.lng, notes: '', bay: selBay?.id || 'matagorda' };
      setLaunches(prev => [...prev, newL]);
      setEditPopup({ type: 'launch', id, data: newL });
    } else {
      const newS = { id, bay: selBay?.id || 'matagorda', name: 'New Spot', type, position: pos, gps, rating: 0, species: [], bestTide: 'Any', bestTime: '', bestSeason: '', bestWind: '', lures: [], desc: '', parking: pos, media: [] };
      setAllSpots(prev => [...prev, newS]);
      setEditPopup({ type: 'spot', id, data: newS });
    }
    setCtxMenu(null);
  };

  const handleFinishWadeLine = () => {
    if (!drawingLine || drawingLine.points.length < 2) { showT('Need at least 2 points'); return; }
    const id = Date.now();
    const wl = { id, bay: selBay?.id || 'matagorda', label: drawingLine.label || 'Wade Line', points: drawingLine.points, color: C.amber, castRange: 40 };
    setWadeLines(prev => [...prev, wl]);
    setEditPopup({ type: 'wadeline', id, data: wl });
    setDrawingLine(null);
    showT('Wade line saved with 40-yard cast range!');
  };

  const handleMarkerDragEnd = (markerType, id, e) => {
    dragJustEnded.current = true;
    setTimeout(() => { dragJustEnded.current = false; }, 300);
    const ll = e.target.getLatLng();
    const newPos = latLngToPosition(ll.lat, ll.lng);
    const newGps = posToGPSStr(newPos);
    const gpsStr = ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5);
    if (markerType === 'spot') {
      setAllSpots(prev => prev.map(s => s.id === id ? { ...s, position: newPos, gps: newGps } : s));
      if (selSpot?.id === id) setSelSpot(prev => prev ? { ...prev, position: newPos, gps: newGps } : prev);
    } else if (markerType === 'launch') {
      setLaunches(prev => prev.map(l => l.id === id ? { ...l, position: newPos, gps: newGps.lat + ', ' + newGps.lng } : l));
    } else if (markerType === 'photo') {
      setCommunityPhotos(prev => prev.map(p => p.id === id ? { ...p, position: newPos } : p));
    } else if (markerType === 'zone-center') {
      setShadeZones(prev => prev.map(z => z.id === id ? { ...z, cx: newPos.x, cy: newPos.y } : z));
    } else if (markerType === 'wade-pt') {
      setWadeLines(prev => prev.map(wl => wl.id === id.lineId ? { ...wl, points: wl.points.map((p, i) => i === id.ptIndex ? newPos : p) } : wl));
    }
    // Refresh edit popup if this item is being edited
    if (editPopup) {
      if (markerType === 'spot' && editPopup.type === 'spot' && editPopup.id === id) {
        setEditPopup(prev => ({ ...prev, data: { ...prev.data, position: newPos, gps: newGps } }));
      } else if (markerType === 'launch' && editPopup.type === 'launch' && editPopup.id === id) {
        setEditPopup(prev => ({ ...prev, data: { ...prev.data, position: newPos, gps: newGps.lat + ', ' + newGps.lng } }));
      } else if (markerType === 'zone-center' && editPopup.type === 'zone' && editPopup.id === id) {
        setEditPopup(prev => ({ ...prev, data: { ...prev.data, cx: newPos.x, cy: newPos.y } }));
      }
    }
    showT(gpsStr);
  };

  // Update functions that write to actual data stores (not editPopup.data)
  const updateSpot = (id, field, value) => {
    setAllSpots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    if (selSpot?.id === id) setSelSpot(prev => prev ? { ...prev, [field]: value } : prev);
  };
  const updateLaunch = (id, field, value) => {
    setLaunches(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };
  const updateZone = (id, field, value) => {
    setShadeZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };
  const updateWadeLine = (id, field, value) => {
    setWadeLines(prev => prev.map(wl => wl.id === id ? { ...wl, [field]: value } : wl));
  };

  const handleDeleteMarker = (markerType, id) => {
    let data = null;
    if (markerType === 'spot') data = allSpots.find(s => s.id === id);
    else if (markerType === 'launch') data = launches.find(l => l.id === id);
    else if (markerType === 'zone') data = shadeZones.find(z => z.id === id);
    else if (markerType === 'wadeline') data = wadeLines.find(w => w.id === id);
    else if (markerType === 'photo') data = communityPhotos.find(p => p.id === id);
    if (data) setUndoStack(prev => [...prev.slice(-9), { type: markerType, data }]);
    if (markerType === 'spot') { setAllSpots(prev => prev.filter(s => s.id !== id)); if (selSpot?.id === id) setSelSpot(null); }
    else if (markerType === 'launch') setLaunches(prev => prev.filter(l => l.id !== id));
    else if (markerType === 'zone') setShadeZones(prev => prev.filter(z => z.id !== id));
    else if (markerType === 'wadeline') setWadeLines(prev => prev.filter(w => w.id !== id));
    else if (markerType === 'photo') setCommunityPhotos(prev => prev.filter(p => p.id !== id));
    setEditPopup(null); setConfirmDelete(null); showT('Deleted \u2014 tap Undo to restore');
  };

  const zoneCenterIcon = useCallback((color) => L.divIcon({
    className: '',
    html: '<div style="width:22px;height:22px;border-radius:50%;background:' + color + ';border:3px solid #fff;cursor:move;box-shadow:0 2px 8px #0008;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700">+</div>',
    iconSize: [22, 22], iconAnchor: [11, 11],
  }), []);

  const wadePointIcon = useCallback(() => L.divIcon({
    className: '',
    html: '<div style="width:16px;height:16px;border-radius:50%;background:' + C.amber + ';border:3px solid #fff;cursor:move;box-shadow:0 2px 6px #0008"></div>',
    iconSize: [16, 16], iconAnchor: [8, 8],
  }), []);

  // Get live GPS for currently edited item
  const getEditGPS = () => {
    const d = editData;
    if (!d) return '';
    
    if (d.position) return posToGPS(d.position).str;
    if (d.cx != null) return posToGPS({ x: d.cx, y: d.cy }).str;
    if (d.gps && typeof d.gps === 'string') return d.gps;
    if (d.gps) return d.gps.lat + ', ' + d.gps.lng;
    return '';
  };

  // Get live data for the currently edited item
  const getEditData = useCallback(() => {
    if (!editPopup) return null;
    const { type, id } = editPopup;
    if (type === 'spot') return allSpots.find(s => s.id === id);
    if (type === 'launch') return launches.find(l => l.id === id);
    if (type === 'zone') return shadeZones.find(z => z.id === id);
    if (type === 'wadeline') return wadeLines.find(w => w.id === id);
    if (type === 'photo') return communityPhotos.find(p => p.id === id);
    return null;
  }, [editPopup, allSpots, launches, shadeZones, wadeLines, communityPhotos]);

  // Use live data for display values (GPS, selects) but defaultValue for text inputs
  const editData = editPopup ? (getEditData() || editPopup.data) : null;

  const handleDropPin = () => {
    let coords;
    if(gpsInput.format==='dms') coords = parseDMS(gpsInput.dms);
    else coords = { lat: parseFloat(gpsInput.lat), lng: parseFloat(gpsInput.lng) };
    if(coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
      const pos = gpsToPosition(coords.lat, coords.lng);
      setNewSpotDraft({...newSpotDraft,gps:{lat:coords.lat.toFixed(4)+'\u00B0N',lng:Math.abs(coords.lng).toFixed(4)+'\u00B0W'},position:pos});
      showT('Pin dropped: '+coords.lat.toFixed(4)+', '+coords.lng.toFixed(4));
    } else showT('Invalid GPS coordinates');
  };

  const showT=m=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const cpGPS=g=>{navigator.clipboard?.writeText(`${g.lat}, ${g.lng}`);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const openBay=id=>{setSelBay(bayData[id]);setPage('bay');setSelSpot(null);setShowRoute(false);setShowBS(false);setSpotFilter('all');};
  const openSpot=useCallback(s=>{setSelSpot(s);setShowRoute(false);setRouteStep(0);setMobilePanel('spot-detail');},[]);
  const endNav=()=>{setShowRoute(false);setRouteStep(0);setPlaying(false);setTripActive(false);setMobilePanel(null);};
  const startNav=()=>{setShowRoute(true);setRouteStep(0);setPlaying(false);setTripActive(true);setTripStart(Date.now());setMobilePanel('nav');};
  const lfColor=t=>({experienced:C.amber,intermediate:C.cyan,anyone:C.green}[t]||C.mid);
  const lfLabel=t=>({experienced:'Experienced Fisherman',intermediate:'Intermediate — Knows Basics',anyone:'Anyone Welcome — All Levels'}[t]||t);


  // ─── UI COMPONENTS ───
  const Btn=({children,primary,small,danger,...p})=><button {...p} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:small?(isMobile?'8px 14px':'6px 12px'):(isMobile?'12px 20px':'10px 18px'),borderRadius:small?(isMobile?8:6):(isMobile?12:10),background:danger?`${C.red}20`:primary?`linear-gradient(135deg,${C.cyan},${C.teal})`:C.card2,color:danger?C.red:primary?C.bg:C.mid,border:`1px solid ${danger?`${C.red}40`:primary?'transparent':C.bdr}`,fontWeight:primary?700:500,fontSize:small?(isMobile?13:12):(isMobile?15:14),cursor:'pointer',fontFamily:Fnt,minHeight:isMobile?44:0,...(p.style||{})}}>{children}</button>;
  const Lbl=({children})=><div style={{fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700,marginBottom:6}}>{children}</div>;
  const Inp=({label,...p})=><div style={{marginBottom:12}}>{label&&<Lbl>{label}</Lbl>}<input {...p} style={{width:'100%',padding:isMobile?'12px 14px':'10px 14px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:isMobile?16:13,fontFamily:Fnt,outline:'none',minHeight:isMobile?44:0,...(p.style||{})}}/></div>;
  const Sel=({label,options,...p})=><div style={{marginBottom:12}}>{label&&<Lbl>{label}</Lbl>}<select {...p} style={{width:'100%',padding:isMobile?'12px 14px':'10px 14px',borderRadius:8,background:C.card2,border:`1px solid ${C.bdr}`,color:C.txt,fontSize:isMobile?16:13,fontFamily:Fnt,minHeight:isMobile?44:0,...(p.style||{})}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
  const Badge=({color,children})=><span style={{padding:'3px 10px',borderRadius:6,background:`${color}20`,color,fontSize:11,fontWeight:600}}>{children}</span>;
  const Modal=({title,sub,onClose,wide,children})=>(
    <div style={{position:'fixed',inset:0,background:'#000a',display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center',zIndex:1000,padding:isMobile?0:20}} onClick={onClose}>
      <div style={isMobile?{background:C.card,borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'90vh',overflow:'auto'}:{background:C.card,borderRadius:20,maxWidth:wide?800:560,width:'100%',maxHeight:'90vh',overflow:'auto',border:`1px solid ${C.bdr2}`}} onClick={e=>e.stopPropagation()}>
        {isMobile&&<div style={{display:'flex',justifyContent:'center',paddingTop:8}}><div style={{width:40,height:4,borderRadius:2,background:C.bdr2}}/></div>}
        <div style={{padding:isMobile?'12px 16px':'16px 24px',borderBottom:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:C.card,zIndex:1,borderRadius:isMobile?'20px 20px 0 0':'20px 20px 0 0'}}>
          <div><div style={{fontWeight:700,fontSize:isMobile?15:16}}>{title}</div>{sub&&<div style={{fontSize:12,color:C.mid}}>{sub}</div>}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.dim,cursor:'pointer',padding:8}}><XI s={18}/></button>
        </div>
        <div style={{padding:isMobile?16:24}}>{children}</div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:Fnt,background:C.bg,color:C.txt,minHeight:'100vh',minHeight:'-webkit-fill-available'}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"/>

      {/* HEADER */}
      <header style={{background:C.card,borderBottom:`1px solid ${C.bdr}`,padding:isMobile?'8px 12px':'10px 20px',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?6:10,cursor:'pointer'}} onClick={()=>{setPage('home');setSelBay(null);setSelSpot(null);setShowBS(false);endNav();setMobilePanel(null);}}>
            <div style={{width:isMobile?30:36,height:isMobile?30:36,borderRadius:isMobile?8:10,background:`linear-gradient(135deg,${C.cyan},${C.teal})`,display:'flex',alignItems:'center',justifyContent:'center'}}><FishI s={isMobile?16:20} c="#0b1220"/></div>
            <div><div style={{fontSize:isMobile?15:18,fontWeight:700}}>TEXAS<span style={{color:C.cyan}}>TIDES</span></div>{!isMobile&&<div style={{fontSize:10,color:C.dim,letterSpacing:'0.1em'}}>COASTAL FISHING GUIDE</div>}</div>
          </div>
          <div style={{display:'flex',gap:isMobile?2:4,alignItems:'center'}}>
            {tripActive&&<div style={{display:'flex',alignItems:'center',gap:4,padding:isMobile?'4px 8px':'5px 12px',borderRadius:8,background:`${C.green}20`,border:`1px solid ${C.green}40`,marginRight:4}}><ClockI s={13} c={C.green}/><span style={{fontSize:11,fontWeight:700,color:C.green,fontFamily:FM}}>{tripElapsed}</span></div>}
            {[{l:'Map',i:<PinI s={14}/>,a:()=>{setShowBS(false);if(!selBay)setPage('home');},on:!showBS},{l:'Boats',i:<UsrI s={14}/>,a:()=>setShowBS(true),on:showBS}].map(t=><button key={t.l} onClick={t.a} style={{display:'flex',alignItems:'center',gap:isMobile?3:5,padding:isMobile?'6px 8px':'7px 14px',borderRadius:8,fontSize:isMobile?11:12,fontWeight:600,background:t.on?C.cyan:'transparent',color:t.on?C.bg:C.mid,border:'none',cursor:'pointer',fontFamily:Fnt}}>{t.i} {isMobile?'':t.l}</button>)}
            {!isMobile&&<div style={{width:1,height:24,background:C.bdr,margin:'0 4px'}}/>}
            {undoStack.length>0&&<button onClick={handleUndo} style={{padding:isMobile?'6px 8px':'7px 10px',borderRadius:8,background:`${C.amber}20`,border:`1px solid ${C.amber}40`,color:C.amber,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:Fnt,display:'flex',alignItems:'center',gap:4}} title="Undo last delete"><UndoI s={14} c={C.amber}/></button>}
            <button onClick={()=>setShowEditor(true)} style={{padding:isMobile?'6px 8px':'7px 10px',borderRadius:8,background:'transparent',border:'none',color:C.mid,cursor:'pointer'}} title="Map Editor"><MapEdI s={16}/></button>
            {!isMobile&&<button onClick={()=>setShowSettings(true)} style={{padding:'7px 10px',borderRadius:8,background:'transparent',border:'none',color:C.mid,cursor:'pointer'}} title="Settings"><GearI s={16}/></button>}
          </div>
        </div>
      </header>

      {/* WEATHER BAR */}
      <div style={{background:`${C.card}99`,borderBottom:`1px solid ${C.bdr}`,padding:isMobile?'6px 10px':'7px 20px',overflow:'hidden'}}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',alignItems:'center',gap:isMobile?8:16,fontSize:isMobile?11:12,overflowX:isMobile?'auto':'visible',whiteSpace:'nowrap',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',msOverflowStyle:'none'}}>
          <span style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}><ThermI s={13} c={C.amber}/> {weather.temp}°F</span>
          <span style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}><WindI s={13} c={C.cyan}/> {weather.wind} mph {weather.windDir}{!isMobile&&` (gusts ${weather.gusts})`}</span>
          <span style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}><WaveI s={13} c={C.teal}/> {tide.status}</span>
          <span style={{flexShrink:0}}>{'\uD83D\uDCA7'} {weather.waterTemp}°F</span>
          {!isMobile&&<span style={{marginLeft:'auto',color:C.cyan}}><SunI s={13}/> {weather.conditions}</span>}
        </div>
      </div>

      <main style={{maxWidth:1280,margin:'0 auto',padding:isMobile?10:20}}>
        {/* HOME */}
        {page==='home'&&!showBS&&(
          <div>
            <div style={{marginBottom:isMobile?16:28,padding:isMobile?'20px 16px':'36px 28px',borderRadius:isMobile?12:16,background:`linear-gradient(135deg,${C.card},#0d2847)`,border:`1px solid ${C.bdr}`,position:'relative',overflow:'hidden'}}>
              {!isMobile&&<div style={{position:'absolute',top:0,right:0,width:300,height:200,background:`radial-gradient(circle at 100% 0%,${C.cyan}15,transparent 70%)`}}/>}
              <h2 style={{fontSize:isMobile?20:26,fontWeight:700,marginBottom:6}}>Texas Bay Fishing Guide</h2>
              <p style={{color:C.mid,fontSize:isMobile?13:14,maxWidth:580,lineHeight:1.6,marginBottom:isMobile?12:16}}>Satellite imagery, GPS waypoints, navigation routes, and AI-powered spot recommendations.</p>
              <Btn primary onClick={()=>setShowAI(true)}><SparkI s={14} c={C.bg}/> Where Should I Fish?</Btn>
            </div>
            <Lbl>Select a Bay System</Lbl>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fill,minmax(360px,1fr))',gap:isMobile?10:16,marginTop:8}}>
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
              <button onClick={()=>{setPage('home');setSelBay(null);setSelSpot(null);setMobilePanel(null);}} style={{padding:isMobile?'8px 12px':'5px 10px',borderRadius:6,background:C.card,border:`1px solid ${C.bdr}`,color:C.mid,cursor:'pointer',fontFamily:Fnt,fontSize:12,display:'flex',alignItems:'center',gap:4}}><ArrowLI s={13}/> Back</button>
              <div style={{flex:1,minWidth:0}}><h2 style={{fontSize:isMobile?16:20,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{selBay.name}</h2>{!isMobile&&<p style={{fontSize:12,color:C.mid}}>{selBay.sub} — Satellite imagery</p>}</div>
              <div style={{display:'flex',gap:4}}>
                {!isMobile&&<Btn small onClick={()=>setShowPhotoUp(true)}><CamI s={13}/> Add Photo</Btn>}
                <Btn small primary onClick={()=>setShowAI(true)}><SparkI s={13} c={C.bg}/> AI</Btn>
              </div>
            </div>
            <div style={{display:'flex',gap:4,marginBottom:isMobile?8:14,overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',paddingBottom:2}}>
              {[{id:'all',l:'All',i:'\uD83D\uDCCD'},{id:'wade',l:'Wade',i:'\uD83D\uDEB6'},{id:'boat',l:'Boat',i:'\uD83D\uDEA4'},{id:'kayak',l:'Kayak',i:'\uD83D\uDEF6'}].map(f=><button key={f.id} onClick={()=>setSpotFilter(f.id)} style={{display:'flex',alignItems:'center',gap:3,padding:isMobile?'8px 14px':'5px 12px',borderRadius:6,fontSize:isMobile?12:11,fontWeight:600,background:spotFilter===f.id?C.cyan:C.card,color:spotFilter===f.id?C.bg:C.mid,border:`1px solid ${spotFilter===f.id?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:Fnt,flexShrink:0}}>{f.i} {f.l}</button>)}
            </div>

            <div style={{display:isMobile?'flex':'grid',flexDirection:'column',gridTemplateColumns:isMobile?'1fr':'1fr 340px',gap:isMobile?0:14}}>
              {/* SATELLITE MAP */}
              <div style={{background:C.card,borderRadius:isMobile?0:14,border:editMode?'2px solid '+C.amber:isMobile?'none':'1px solid '+C.bdr,overflow:'hidden',position:'relative'}}>
                {/* Map toolbar */}
                <div style={{padding:isMobile?'8px 10px':'10px 14px',borderBottom:`1px solid ${C.bdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:isMobile?12:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{showRoute?'Route \u2192 '+selSpot?.name:editMode?'Edit Mode':'Satellite Map'}</div>{!isMobile&&<div style={{fontSize:11,color:editMode?C.amber:C.dim}}>{editMode?'Right-click: add marker \u2022 Click: edit \u2022 Drag: move':'Sentinel-2 / USGS / ESRI'}</div>}</div>
                  <div style={{display:'flex',gap:4}}>
                    <button onClick={()=>{setEditMode(!editMode);setCtxMenu(null);setEditPopup(null);}} style={{padding:isMobile?'6px 10px':'5px 12px',borderRadius:6,fontSize:11,fontWeight:700,background:editMode?C.amber:C.card2,color:editMode?C.bg:C.mid,border:`1px solid ${editMode?C.amber:C.bdr}`,cursor:'pointer',fontFamily:Fnt,display:'flex',alignItems:'center',gap:4}}><EditI s={13}/> {editMode?'Done':'Edit'}</button>
                    {showRoute&&<button onClick={()=>{setShowRoute(false);setRouteStep(0);setPlaying(false);if(isMobile)setMobilePanel(null);}} style={{fontSize:11,color:C.mid,background:C.card2,border:`1px solid ${C.bdr}`,borderRadius:5,padding:isMobile?'6px 10px':'4px 10px',cursor:'pointer',fontFamily:Fnt}}>\u2190 Map</button>}
                  </div>
                </div>

                <div style={{height:isMobile?'calc(100vh - 200px)':500,position:'relative',minHeight:isMobile?300:400}}>
                  <MapContainer center={bayConfig.center} zoom={bayConfig.zoom} style={{height:'100%',width:'100%'}} zoomControl={false} key={selBay.id} tap={true} touchZoom={true}>
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

                    {/* Map click/right-click events */}
                    <MapClickHandler onRightClick={handleMapRightClick} onLeftClick={handleMapLeftClick} editMode={editMode} isMobile={isMobile} />

                    {/* Shade zones */}
                    {!showRoute && bayShades.map(z=>(
                      <Polygon key={z.id} positions={shadeToPolygon(z)} pathOptions={{color:z.color,weight:editMode?2.5:1.5,dashArray:editMode?'':'6 4',fillColor:z.color,fillOpacity:editMode?0.2:0.12}} eventHandlers={{click:()=>{ if(editMode) selectForEdit('zone',z.id); }}}>
                        <Tooltip>{z.label}{editMode?' (click to edit)':''}</Tooltip>
                      </Polygon>
                    ))}

                    {/* Zone center markers (edit mode - drag to move zone) */}
                    {editMode && !showRoute && bayShades.map(z=>(
                      <Marker key={'zc'+z.id} position={bayConfig.toLatLng({x:z.cx,y:z.cy})} icon={zoneCenterIcon(z.color)} draggable={true} eventHandlers={{click:()=>selectForEdit('zone',z.id), dragend:(e)=>handleMarkerDragEnd('zone-center',z.id,e)}}>
                        <Tooltip>Drag to move {z.label}</Tooltip>
                      </Marker>
                    ))}

                    {/* Wade lines with cast range */}
                    {!showRoute && bayWadeLines.map(wl=>{
                      const lineCoords = wl.points.map(p=>bayConfig.toLatLng(p));
                      const cast = getCastLineOffsets(wl.points, CAST_METERS);
                      return <React.Fragment key={'wl'+wl.id}>
                        <Polyline positions={lineCoords} pathOptions={{color:wl.color,weight:3,opacity:0.9}} eventHandlers={{click:()=>{ if(editMode) selectForEdit('wadeline',wl.id); }}}>
                          <Tooltip>{wl.label} ({wl.castRange||40}yd cast range){editMode?' - click to edit':''}</Tooltip>
                        </Polyline>
                        {cast.left.length>1 && <Polyline positions={cast.left} pathOptions={{color:wl.color,weight:1,opacity:0.4,dashArray:'4 6'}}/>}
                        {cast.right.length>1 && <Polyline positions={cast.right} pathOptions={{color:wl.color,weight:1,opacity:0.4,dashArray:'4 6'}}/>}
                        {editMode && wl.points.map((pt,pi)=>(
                          <Marker key={'wlp'+wl.id+'-'+pi} position={bayConfig.toLatLng(pt)} icon={wadePointIcon()} draggable={true} eventHandlers={{dragend:(e)=>handleMarkerDragEnd('wade-pt',{lineId:wl.id,ptIndex:pi},e)}}>
                            <Tooltip>Wade point {pi+1} - drag to move</Tooltip>
                          </Marker>
                        ))}
                      </React.Fragment>;
                    })}

                    {/* Drawing line preview */}
                    {drawingLine && drawingLine.points.length > 0 && <>
                      <Polyline positions={drawingLine.points.map(p=>bayConfig.toLatLng(p))} pathOptions={{color:C.green,weight:3,dashArray:'8 4'}}/>
                      {drawingLine.points.map((pt,i)=>(
                        <Marker key={'draw'+i} position={bayConfig.toLatLng(pt)} icon={wadePointIcon()}>
                          <Tooltip>Point {i+1}</Tooltip>
                        </Marker>
                      ))}
                    </>}

                    {/* Launch markers */}
                    {!showRoute && bayLaunches.map(l=>(
                      <Marker key={`l${l.id}`} position={bayConfig.toLatLng(l.position)} icon={launchIcon(l.type)} draggable={editMode} eventHandlers={{click:()=>{ if(editMode) selectForEdit('launch',l.id); }, dragend:(e)=>handleMarkerDragEnd('launch',l.id,e)}}>
                        <Tooltip><b>{l.name}</b><br/>{editMode ? 'Drag to move \u2022 Click to edit' : l.notes}</Tooltip>
                      </Marker>
                    ))}

                    {/* Photo markers */}
                    {!showRoute && bayPhotos.map(p=>(
                      <Marker key={`p${p.id}`} position={bayConfig.toLatLng(p.position)} icon={photoIcon()} draggable={editMode} eventHandlers={{click:()=>{ if(editMode) selectForEdit('photo',p.id); }, dragend:(e)=>handleMarkerDragEnd('photo',p.id,e)}}>
                        {!editMode && <Popup><b>{p.caption}</b><br/><span style={{fontSize:11}}>by {p.user} • {p.time}</span></Popup>}
                        {editMode && <Tooltip>Drag to move - Click to edit</Tooltip>}
                      </Marker>
                    ))}

                    {/* Route */}
                    {showRoute && routeCoords.length > 0 && <>
                      <Polyline positions={routeCoords} pathOptions={{color:C.cyan,weight:3,dashArray:'8 6',opacity:0.3}}/>
                      {routeStep > 0 && <Polyline positions={routeCoords.slice(0,routeStep+1)} pathOptions={{color:'#22d3ee',weight:4,opacity:0.9}}/>}
                      <Marker position={routeCoords[0]} icon={harborIcon()} eventHandlers={{click:()=>setRouteStep(0)}}><Tooltip><b>{curRoute[0]?.title||'Launch'}</b><br/>Starting point</Tooltip></Marker>
                      {curRoute.slice(1).map((w,i)=>{
                        const idx = i+1;
                        const status = idx<routeStep?'done':idx===routeStep?'active':'pending';
                        return(
                          <Marker key={`wp${idx}`} position={[w.lat,w.lng]} icon={waypointIcon(idx,status)} eventHandlers={{click:()=>setRouteStep(idx)}}>
                            <Tooltip><b>{w.title}</b><br/>{w.desc}<br/>Depth: {w.depth}{w.dist>0?' \u2022 '+w.dist.toFixed(1)+' NM':''}</Tooltip>
                          </Marker>
                        );
                      })}
                      {routeCoords[routeStep] && <Circle center={routeCoords[routeStep]} radius={400} pathOptions={{color:C.cyan,fillColor:C.cyan,fillOpacity:0.12,weight:1}}/>}
                    </>}

                    {/* Spot markers */}
                    {!showRoute && filtered.map(s=>(
                      <Marker key={`s${s.id}`} position={bayConfig.toLatLng(s.position)} icon={spotIcon(s.type,selSpot?.id===s.id)} draggable={editMode} eventHandlers={{click:()=>{ if(editMode) selectForEdit('spot',s.id); else openSpot(s); }, dragend:(e)=>handleMarkerDragEnd('spot',s.id,e)}}>
                        <Tooltip><b>{s.name}</b><br/>{editMode ? 'Drag to move \u2022 Click to edit' : '\u2B50 '+s.rating+' \u2022 '+s.species.slice(0,2).join(', ')}</Tooltip>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* EDIT POPUP rendered inside map for context menu only */}
                  {ctxMenu && editMode && <div style={isMobile?{position:'fixed',bottom:0,left:0,right:0,zIndex:1100,background:C.card,border:'none',borderTop:'2px solid '+C.bdr2,borderRadius:'16px 16px 0 0',padding:'12px 12px 24px',boxShadow:'0 -8px 32px #000a'}:{position:'absolute',left:Math.min(ctxMenu.x+14,250),top:ctxMenu.y+52,zIndex:1000,background:C.card,border:'1px solid '+C.bdr2,borderRadius:12,padding:6,minWidth:180,boxShadow:'0 8px 32px #000a'}} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}>
                    {isMobile&&<div style={{display:'flex',justifyContent:'center',marginBottom:8}}><div style={{width:40,height:4,borderRadius:2,background:C.bdr2}}/></div>}
                    {isMobile&&<div style={{fontSize:12,fontWeight:700,color:C.mid,marginBottom:8,textAlign:'center'}}>Add to Map</div>}
                    <div style={{padding:'6px 10px',fontSize:10,color:C.dim,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Add Marker Here</div>
                    <div style={{fontSize:11,color:C.mid,padding:'2px 10px 8px',fontFamily:FM}}>{ctxMenu.lat.toFixed(5)}, {ctxMenu.lng.toFixed(5)}</div>
                    <div style={isMobile?{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}:{}}>{[{t:'wade',l:'Wade Spot',i:'\uD83D\uDEB6',c:C.amber},{t:'boat',l:'Boat Spot',i:'\uD83D\uDEA4',c:C.blue},{t:'kayak',l:'Kayak Spot',i:'\uD83D\uDEF6',c:C.green},{t:'wade-line',l:'Wade Line + Cast',i:'\uD83C\uDFA3',c:C.amber},{t:'wade-zone',l:'Wade Zone',i:'\uD83D\uDDFA',c:C.amber},{t:'launch-boat',l:'Boat Ramp',i:'\u2693',c:C.cyan},{t:'launch-kayak',l:'Kayak Launch',i:'\uD83D\uDEF6',c:C.teal},{t:'launch-drivein',l:'Drive-in Access',i:'\uD83D\uDE97',c:C.purple}].map(opt=><button key={opt.t} onClick={()=>handleAddFromCtx(opt.t)} style={{display:'flex',alignItems:isMobile?'center':'center',gap:8,width:'100%',padding:isMobile?'12px 10px':'8px 10px',borderRadius:8,background:isMobile?C.card2:'transparent',border:isMobile?`1px solid ${C.bdr}`:'none',color:C.txt,cursor:'pointer',fontFamily:Fnt,fontSize:isMobile?13:12,textAlign:'left'}} onMouseEnter={e=>{if(!isMobile)e.currentTarget.style.background=C.card2;}} onMouseLeave={e=>{if(!isMobile)e.currentTarget.style.background='transparent';}}><span style={{width:isMobile?32:28,height:isMobile?32:28,borderRadius:6,background:opt.c+'25',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?18:15,flexShrink:0}}>{opt.i}</span><div style={{fontWeight:600}}>{opt.l}</div></button>)}</div>
                    <div style={{borderTop:'1px solid '+C.bdr,marginTop:4,paddingTop:4}}><button onClick={()=>setCtxMenu(null)} style={{width:'100%',padding:'6px 10px',borderRadius:6,background:'transparent',border:'none',color:C.dim,cursor:'pointer',fontFamily:Fnt,fontSize:11,textAlign:'center'}}>Cancel</button></div>
                  </div>}
                </div>

                {/* ═══ EDIT PANEL — OUTSIDE MAP CONTAINER — NO FOCUS ISSUES ═══ */}
                {editPopup && editMode && <div ref={editPanelRef} style={isMobile?{position:'fixed',bottom:0,left:0,right:0,zIndex:50,background:C.card,border:'none',borderTop:'2px solid '+C.bdr2,borderRadius:'16px 16px 0 0',maxHeight:'65vh',overflow:'auto',boxShadow:'0 -4px 30px #000a',WebkitOverflowScrolling:'touch'}:{background:C.card,border:'1px solid '+C.bdr2,borderRadius:14,overflow:'hidden',marginTop:8}} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}>
                  {isMobile&&<div style={{display:'flex',justifyContent:'center',padding:'8px 0 4px',position:'sticky',top:0,background:C.card,zIndex:1}}><div style={{width:40,height:4,borderRadius:2,background:C.bdr2}}/></div>}
                  <div style={{padding:'12px 16px',borderBottom:'1px solid '+C.bdr,display:'flex',justifyContent:'space-between',alignItems:'center',background:C.cyan+'10'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <EditI s={16} c={C.cyan}/>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>Edit {editPopup.type==='spot'?'Fishing Spot':editPopup.type==='launch'?'Launch Point':editPopup.type==='zone'?'Wade Zone':editPopup.type==='wadeline'?'Wade Line':'Photo'}</div>
                        <div style={{fontSize:11,color:C.cyan,fontFamily:FM}}>{getEditGPS()}</div>
                      </div>
                    </div>
                    <button onClick={()=>setEditPopup(null)} style={{background:C.card2,border:'1px solid '+C.bdr,borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><XI s={14} c={C.dim}/></button>
                  </div>
                  <div style={{padding:16}}>
                    {editPopup.type==='spot' && <div style={{display:'grid',gap:12}}>
                      <div><Lbl>Spot Name</Lbl><input defaultValue={editPopup.data.name} key={editPopup.id+'name'} onBlur={e=>updateSpot(editPopup.id,'name',e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:14,fontFamily:Fnt,outline:'none',fontWeight:600}}/></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <Sel label="Type" value={editData?.type||'wade'} onChange={e=>updateSpot(editPopup.id,'type',e.target.value)} options={[{value:'wade',label:'Wade'},{value:'boat',label:'Boat'},{value:'kayak',label:'Kayak'}]}/>
                        <Sel label="Best Tide" value={editData?.bestTide||'Any'} onChange={e=>updateSpot(editPopup.id,'bestTide',e.target.value)} options={[{value:'Incoming',label:'Incoming'},{value:'Outgoing',label:'Outgoing'},{value:'High',label:'High'},{value:'Low',label:'Low'},{value:'Moving',label:'Any Moving'},{value:'Any',label:'Any'}]}/>
                      </div>
                      <div><Lbl>Species (comma separated)</Lbl><input defaultValue={editPopup.data.species?.join(', ')||''} key={editPopup.id+'species'} onBlur={e=>updateSpot(editPopup.id,'species',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div><Lbl>Best Time</Lbl><input defaultValue={editPopup.data.bestTime||''} key={editPopup.id+'time'} onBlur={e=>updateSpot(editPopup.id,'bestTime',e.target.value)} placeholder="e.g. 5-9 AM" style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                        <div><Lbl>Best Wind</Lbl><input defaultValue={editPopup.data.bestWind||''} key={editPopup.id+'wind'} onBlur={e=>updateSpot(editPopup.id,'bestWind',e.target.value)} placeholder="SE 5-15" style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                      </div>
                      <div><Lbl>Lures (comma separated)</Lbl><input defaultValue={editPopup.data.lures?.join(', ')||''} key={editPopup.id+'lures'} onBlur={e=>updateSpot(editPopup.id,'lures',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                      <div><Lbl>Notes</Lbl><textarea defaultValue={editPopup.data.desc||''} key={editPopup.id+'desc'} onBlur={e=>updateSpot(editPopup.id,'desc',e.target.value)} rows={3} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none',resize:'vertical'}}/></div>
                    </div>}
                    {editPopup.type==='launch' && <div style={{display:'grid',gap:12}}>
                      <div><Lbl>Name</Lbl><input defaultValue={editPopup.data.name} key={editPopup.id+'lname'} onBlur={e=>updateLaunch(editPopup.id,'name',e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:14,fontFamily:Fnt,outline:'none',fontWeight:600}}/></div>
                      <Sel label="Type" value={editData?.type||'wade'} onChange={e=>updateLaunch(editPopup.id,'type',e.target.value)} options={[{value:'boat',label:'Boat Ramp'},{value:'kayak',label:'Kayak Launch'},{value:'drivein',label:'Drive-in Access'}]}/>
                      <div><Lbl>Notes</Lbl><input defaultValue={editPopup.data.notes||''} key={editPopup.id+'lnotes'} onBlur={e=>updateLaunch(editPopup.id,'notes',e.target.value)} placeholder="Parking, fees, conditions..." style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                    </div>}
                    {editPopup.type==='zone' && <div style={{display:'grid',gap:12}}>
                      <div><Lbl>Zone Label</Lbl><input defaultValue={editPopup.data.label||''} key={editPopup.id+'zlabel'} onBlur={e=>updateZone(editPopup.id,'label',e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:14,fontFamily:Fnt,outline:'none',fontWeight:600}}/></div>
                      <Sel label="Zone Type" value={editData?.type||'wade'} onChange={e=>{updateZone(editPopup.id,'type',e.target.value);updateZone(editPopup.id,'color',sc(e.target.value));}} options={[{value:'wade',label:'Wade Zone'},{value:'kayak',label:'Kayak Zone'},{value:'boat',label:'Boat Zone'}]}/>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div><Lbl>Width</Lbl><input type="number" defaultValue={editPopup.data.rx||6} key={editPopup.id+'zw'} onBlur={e=>updateZone(editPopup.id,'rx',+e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                        <div><Lbl>Height</Lbl><input type="number" defaultValue={editPopup.data.ry||4} key={editPopup.id+'zh'} onBlur={e=>updateZone(editPopup.id,'ry',+e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                      </div>
                      <div style={{fontSize:12,color:C.mid,padding:8,background:C.card2,borderRadius:8,textAlign:'center'}}>Drag the + marker on the map to reposition this zone</div>
                    </div>}
                    {editPopup.type==='wadeline' && <div style={{display:'grid',gap:12}}>
                      <div><Lbl>Line Label</Lbl><input defaultValue={editPopup.data.label||''} key={editPopup.id+'wlabel'} onBlur={e=>updateWadeLine(editPopup.id,'label',e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:14,fontFamily:Fnt,outline:'none',fontWeight:600}}/></div>
                      <div><Lbl>Cast Range (yards)</Lbl><input type="number" defaultValue={editPopup.data.castRange||40} key={editPopup.id+'wcast'} onBlur={e=>updateWadeLine(editPopup.id,'castRange',+e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:13,fontFamily:Fnt,outline:'none'}}/></div>
                      <div style={{fontSize:12,color:C.mid,padding:8,background:C.card2,borderRadius:8,textAlign:'center'}}>{editPopup.data.points?.length||0} points - drag orange dots on map to reshape</div>
                      <Btn small style={{width:'100%'}} onClick={()=>{const pts=editPopup.data.points||[];if(pts.length>=2){const last=pts[pts.length-1];const prev=pts[pts.length-2];updateWadeLine(editPopup.id,'points',[...pts,{x:last.x+(last.x-prev.x)*0.5,y:last.y+(last.y-prev.y)*0.5}]);}}}><PlusI s={12}/> Add Point to End</Btn>
                    </div>}
                    {editPopup.type==='photo' && <div style={{display:'grid',gap:12}}>
                      <div><Lbl>Caption</Lbl><input defaultValue={editPopup.data.caption||''} key={editPopup.id+'pcap'} onBlur={e=>setCommunityPhotos(prev=>prev.map(p=>p.id===editPopup.id?{...p,caption:e.target.value}:p))} style={{width:'100%',padding:'10px 14px',borderRadius:8,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:14,fontFamily:Fnt,outline:'none',fontWeight:600}}/></div>
                      <div style={{fontSize:12,color:C.mid,padding:8,background:C.card2,borderRadius:8,textAlign:'center'}}>Drag marker on map to reposition</div>
                    </div>}
                    <div style={{display:'flex',gap:8,marginTop:16}}>
                      <Btn primary small style={{flex:1}} onClick={()=>{showT('Saved!');setEditPopup(null);setConfirmDelete(null);}}><ChkI s={14} c={C.bg}/> Done</Btn>
                      {confirmDelete===editPopup.id
                        ? <Btn small danger onClick={()=>handleDeleteMarker(editPopup.type,editPopup.id)}><TrashI s={14}/> Confirm?</Btn>
                        : <Btn small danger onClick={()=>setConfirmDelete(editPopup.id)}><TrashI s={14}/> Delete</Btn>
                      }
                    </div>
                  </div>
                </div>}

                  {/* WADE LINE DRAWING CONTROLS */}
                  {drawingLine && editMode && <div style={{position:'absolute',bottom:isMobile?16:10,left:'50%',transform:'translateX(-50%)',zIndex:1000,background:C.card,border:'1px solid '+C.green,borderRadius:12,padding:isMobile?'10px 14px':'8px 16px',boxShadow:'0 4px 20px #000a',display:'flex',alignItems:'center',gap:isMobile?8:10,flexWrap:isMobile?'wrap':'nowrap',justifyContent:'center',maxWidth:isMobile?'90vw':'auto'}}>
                    <div style={{fontSize:12,color:C.green,fontWeight:600}}>Drawing: {drawingLine.points.length} points</div>
                    <input value={drawingLine.label} onChange={e=>setDrawingLine(prev=>({...prev,label:e.target.value}))} style={{padding:'4px 8px',borderRadius:6,background:C.card2,border:'1px solid '+C.bdr,color:C.txt,fontSize:12,fontFamily:Fnt,width:140,outline:'none'}} placeholder="Wade line name"/>
                    <Btn small primary onClick={handleFinishWadeLine}><ChkI s={12} c={C.bg}/> Finish</Btn>
                    <Btn small danger onClick={()=>{setDrawingLine(null);showT('Cancelled');}}><XI s={12}/> Cancel</Btn>
                  </div>}
                </div>

                {showRoute&&curRoute.length>0&&<div style={{padding:isMobile?'12px 10px':'10px 14px',borderTop:'1px solid '+C.bdr}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,flexWrap:isMobile?'wrap':'nowrap',gap:6}}>
                    <div style={{display:'flex',gap:6,fontSize:isMobile?12:11,color:C.mid,alignItems:'center'}}>
                      <span>{'\u2693'} {curRoute[0]?.title}</span>
                      <span>{'\u2192'}</span>
                      <span>{'\uD83C\uDFAF'} {curRoute[curRoute.length-1]?.title}</span>
                      <span style={{color:C.cyan,fontWeight:600}}>{totalRouteNM.toFixed(1)} NM</span>
                    </div>
                    <button onClick={endNav} style={{padding:isMobile?'8px 14px':'3px 10px',borderRadius:6,background:C.red+'20',border:'1px solid '+C.red+'40',color:C.red,fontSize:isMobile?12:11,fontWeight:600,cursor:'pointer',fontFamily:Fnt}}>End Nav</button>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                    <div style={{display:'flex',gap:isMobile?4:3}}>
                      {[{i:'\u25C0',fn:()=>setRouteStep(Math.max(0,routeStep-1)),d:!routeStep},{i:playing?'\u23F8':'\u25B6',fn:()=>setPlaying(!playing),p:true},{i:'\u25B6',fn:()=>setRouteStep(Math.min(curRoute.length-1,routeStep+1)),d:routeStep>=curRoute.length-1},{i:'\u21BA',fn:()=>{setRouteStep(0);setPlaying(false);}}].map((b,i)=><button key={i} onClick={b.fn} disabled={b.d} style={{width:b.p?(isMobile?48:40):(isMobile?40:32),height:isMobile?40:32,borderRadius:isMobile?8:6,background:b.p?(playing?C.amber:C.cyan):C.card2,border:`1px solid ${C.bdr}`,color:b.p?C.bg:'#fff',cursor:b.d?'default':'pointer',opacity:b.d?.4:1,fontFamily:Fnt,fontSize:isMobile?15:13}}>{b.i}</button>)}
                    </div>
                    <div style={{display:'flex',gap:3,flex:1,justifyContent:'center',overflow:'hidden'}}>{curRoute.map((_,i)=><button key={i} onClick={()=>setRouteStep(i)} style={{width:i===routeStep?(isMobile?20:18):(isMobile?8:6),height:isMobile?8:6,borderRadius:isMobile?4:3,background:i<routeStep?C.green:i===routeStep?C.cyan:C.bdr,border:'none',cursor:'pointer',transition:'all 0.2s',flexShrink:0}}/>)}</div>
                    <span style={{fontSize:isMobile?12:11,color:C.dim,flexShrink:0}}>{routeStep+1}/{curRoute.length}</span>
                  </div>
                </div>}
              </div>

              {/* RIGHT PANEL — Desktop: sidebar, Mobile: bottom sheet */}
              <div style={isMobile?{position:'fixed',bottom:0,left:0,right:0,zIndex:40,background:C.card,borderTop:`2px solid ${C.bdr2}`,borderRadius:'16px 16px 0 0',maxHeight:mobilePanel==='spot-detail'||mobilePanel==='nav'?'70vh':'50vh',overflow:'auto',transition:'max-height 0.3s ease',boxShadow:'0 -4px 30px #000a',WebkitOverflowScrolling:'touch'}:{display:'flex',flexDirection:'column',gap:10}}>
                {/* Mobile drag handle */}
                {isMobile&&<div style={{display:'flex',justifyContent:'center',padding:'8px 0 4px',position:'sticky',top:0,background:C.card,zIndex:1,borderRadius:'16px 16px 0 0'}}><div style={{width:40,height:4,borderRadius:2,background:C.bdr2}}/></div>}
                {selSpot?<>
                  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.bdr}`,overflow:'hidden'}}>
                    <div style={{padding:14,borderBottom:`1px solid ${C.bdr}`,background:`${sc(selSpot.type)}08`}}>
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <div style={{display:'flex',gap:10,alignItems:'center'}}>
                          <div style={{width:40,height:40,borderRadius:10,background:sc(selSpot.type),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{si(selSpot.type)}</div>
                          <div><div style={{fontSize:15,fontWeight:700}}>{selSpot.name}</div><div style={{fontSize:12,color:C.mid}}><StarI s={12} c={C.amber} filled/> {selSpot.rating} <Badge color={sc(selSpot.type)}>{selSpot.type}</Badge></div></div>
                        </div>
                        <button onClick={()=>{setSelSpot(null);setShowRoute(false);setMobilePanel(null);}} style={{background:'none',border:'none',color:C.dim,cursor:'pointer',padding:6}}><XI s={18}/></button>
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
                      <Btn primary style={{width:'100%'}} onClick={startNav}><NavI s={14} c={C.bg}/> Navigate from {BAY_HARBORS[selBay?.id]?.name || 'Harbor'} ({curRoute.length} waypoints, {totalRouteNM.toFixed(1)} NM)</Btn>
                    </div>
                  </div>
                  {showRoute&&curWP&&<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.cyan}40`,padding:14}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:C.cyan,display:'flex',alignItems:'center',justifyContent:'center',color:C.bg,fontWeight:700,fontSize:14}}>{routeStep+1}</div>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{curWP.title}</div><div style={{fontSize:11,color:C.cyan}}>Depth: {curWP.depth}</div></div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:8}}>
                      <div style={{background:C.card2,borderRadius:6,padding:'6px 8px',textAlign:'center'}}><div style={{fontSize:9,color:C.dim}}>Bearing</div><div style={{fontWeight:700,fontSize:12,color:C.cyan}}>{routeStep>0?Math.round(curWP.brng)+'\u00B0 '+curWP.brngLbl:'\u2014'}</div></div>
                      <div style={{background:C.card2,borderRadius:6,padding:'6px 8px',textAlign:'center'}}><div style={{fontSize:9,color:C.dim}}>Leg Dist</div><div style={{fontWeight:700,fontSize:12,color:C.teal}}>{routeStep>0?curWP.dist.toFixed(1)+' NM':'\u2014'}</div></div>
                      <div style={{background:C.card2,borderRadius:6,padding:'6px 8px',textAlign:'center'}}><div style={{fontSize:9,color:C.dim}}>Total</div><div style={{fontWeight:700,fontSize:12,color:C.green}}>{curWP.cumDist.toFixed(1)} NM</div></div>
                    </div>
                    <p style={{fontSize:12,color:C.mid,lineHeight:1.5,marginBottom:8}}>{curWP.desc}</p>
                    {curWP.warnings?.length>0&&<div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}20`,borderRadius:6,padding:8}}>{curWP.warnings.map((w,i)=><div key={i} style={{fontSize:11,color:C.amber}}>\u26A0 {w}</div>)}</div>}
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
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:8}}>
              <div><h2 style={{fontSize:isMobile?18:22,fontWeight:700}}>BoatShare</h2><p style={{color:C.mid,fontSize:isMobile?12:13}}>Split gas, share the ride</p></div>
              <Btn primary><PlusI s={14} c={C.bg}/> Post Trip</Btn>
            </div>
            {!isMobile&&<p style={{color:C.dim,fontSize:12,marginBottom:20,lineHeight:1.5}}>These aren't guides — just regular fishermen with open spots on their boat. Chip in for gas, bring your gear (or not), and go fishing.</p>}
            <div style={{display:'flex',flexDirection:'column',gap:isMobile?10:16}}>
              {boatShareListings.map(l=>(
                <div key={l.id} style={{background:C.card,borderRadius:isMobile?12:16,border:`1px solid ${C.bdr}`,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr'}}>
                    <div style={{padding:isMobile?14:20,borderRight:isMobile?'none':`1px solid ${C.bdr}`,borderBottom:isMobile?`1px solid ${C.bdr}`:'none'}}>
                      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:isMobile?10:14}}>
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
                      <div style={{marginBottom:16}}><Lbl>The Vibe</Lbl><div style={{background:C.card2,borderRadius:10,padding:12,border:`1px solid ${C.bdr}`}}><p style={{fontSize:12,color:C.txt,lineHeight:1.5,margin:0,fontStyle:'italic'}}>{'\u201C'}{l.vibe}{'\u201D'}</p></div></div>
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
          <div style={{display:'flex',gap:4,overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',paddingBottom:4}}>{[{id:'spots',l:'Spots',i:'\uD83C\uDFAF'},{id:'waypoints',l:'Waypoints',i:'\uD83D\uDCCC'},{id:'shading',l:'Zones',i:'\uD83D\uDDFA\uFE0F'},{id:'launches',l:'Launches',i:'\u26F5'},{id:'photos',l:'Photos',i:'\uD83D\uDCF7'},{id:'tools',l:'Tools',i:'\uD83D\uDEE0\uFE0F'}].map(t=><button key={t.id} onClick={()=>setEdTab(t.id)} style={{flex:'0 0 auto',minWidth:isMobile?60:55,padding:isMobile?'10px 8px':'8px 6px',borderRadius:8,fontSize:isMobile?12:11,fontWeight:600,background:edTab===t.id?C.cyan:C.card2,color:edTab===t.id?C.bg:C.mid,border:`1px solid ${edTab===t.id?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:Fnt}}>{t.i}<br/>{t.l}</button>)}</div>
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
              <div style={{fontSize:10,color:C.dim,marginTop:2}}>{s.species?.slice(0,3).join(' • ')} • Auto-nav from harbor</div>
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
              <div style={{textAlign:'center',padding:8,borderRadius:8,background:`${C.blue}15`,border:`1px solid ${C.blue}30`}}><div style={{fontSize:18}}>📍</div><div style={{fontSize:10,color:C.blue,fontWeight:600}}>Auto-Route from Harbor</div></div>
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
                <button onClick={()=>setGpsInput({...gpsInput,format:'dms'})} style={{flex:1,padding:6,borderRadius:6,fontSize:10,fontWeight:600,background:gpsInput.format==='dms'?C.cyan:C.card2,color:gpsInput.format==='dms'?C.bg:C.mid,border:`1px solid ${gpsInput.format==='dms'?C.cyan:C.bdr}`,cursor:'pointer',fontFamily:Fnt}}>DMS (28d 43m 24s N)</button>
              </div>
              {gpsInput.format!=='dms' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Inp label="Latitude" placeholder="28.7234" value={gpsInput.lat} onChange={e=>setGpsInput({...gpsInput,lat:e.target.value})}/>
                <Inp label="Longitude" placeholder="-95.8612" value={gpsInput.lng} onChange={e=>setGpsInput({...gpsInput,lng:e.target.value})}/>
              </div>}
              {gpsInput.format==='dms' && <div>
                <Inp label="DMS Coordinates" placeholder="28 43 24.1 N 95 52 36.2 W" value={gpsInput.dms} onChange={e=>setGpsInput({...gpsInput,dms:e.target.value})}/>
              </div>}
              <Btn primary style={{width:'100%',marginTop:10}} onClick={handleDropPin}><PinI s={14} c={C.bg}/> Drop Pin at Coordinates</Btn>
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
                setNewSpotDraft({name:'',type:'wade',species:[],bestTide:'Incoming',bestTime:'',lures:[],desc:'',gps:{lat:'',lng:''},position:{x:50,y:50}});
                setPhotoGPS(null);
              }}><SaveI s={14} c={C.bg}/> Save Spot</Btn>
              <Btn style={{flex:1}} onClick={()=>{setNewSpotDraft({name:'',type:'wade',species:[],bestTide:'Incoming',bestTime:'',lures:[],desc:'',gps:{lat:'',lng:''},position:{x:50,y:50}});setPhotoGPS(null);}}><XI s={14}/> Cancel</Btn>
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
            <Inp label="Paste any coordinate format" placeholder="28.7234, -95.8612  or  28 43 24 N 95 52 36 W" onChange={e=>{
              const coords = parseGPS(e.target.value);
              if(coords) setGpsInput({...gpsInput,lat:coords.lat.toFixed(6),lng:coords.lng.toFixed(6)});
            }}/>
            {gpsInput.lat&&<div style={{marginTop:8,padding:10,background:C.bg,borderRadius:8,border:`1px solid ${C.bdr}`,fontFamily:FM,fontSize:11}}>
              <div style={{color:C.cyan}}>Decimal: {gpsInput.lat}, {gpsInput.lng}</div>
              <div style={{color:C.teal,marginTop:4}}>DMS: {Math.abs(parseFloat(gpsInput.lat)).toFixed(0)}{'\u00B0'}{((Math.abs(parseFloat(gpsInput.lat))%1)*60).toFixed(0)}{'\u2032'}{((((Math.abs(parseFloat(gpsInput.lat))%1)*60)%1)*60).toFixed(1)}{'\u2033'}{ parseFloat(gpsInput.lat)>=0?'N':'S'} {Math.abs(parseFloat(gpsInput.lng)).toFixed(0)}{'\u00B0'}{((Math.abs(parseFloat(gpsInput.lng))%1)*60).toFixed(0)}{'\u2032'}{((((Math.abs(parseFloat(gpsInput.lng))%1)*60)%1)*60).toFixed(1)}{'\u2033'}{ parseFloat(gpsInput.lng)>=0?'E':'W'}</div>
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
        <div style={{background:C.card2,borderRadius:10,padding:12,marginBottom:14}}><div style={{fontSize:10,textTransform:'uppercase',color:C.teal,fontWeight:700,marginBottom:6}}>🎣 Lure Strategy</div><p style={{fontSize:12,color:C.mid,lineHeight:1.5,margin:0}}>She Dog topwater at dawn. Bass Assassin 4&quot; on 1/8oz when wind picks up. Gold spoon for tailers.</p></div>
        <div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}20`,borderRadius:10,padding:12}}><div style={{fontSize:10,textTransform:'uppercase',color:C.amber,fontWeight:700,marginBottom:6}}>⚠️ Avoid Today</div><p style={{fontSize:12,color:C.mid,lineHeight:1.5,margin:0}}>Open bay flats — choppy at 12+ mph SE. Stick to protected shell areas.</p></div></div>}
      </Modal>}

      {/* MOBILE FLOATING SPOT BUTTON — shows on bay page when bottom sheet is hidden */}
      {isMobile && page==='bay' && selBay && !selSpot && !mobilePanel && !editMode && <div style={{position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:35,display:'flex',gap:8}}>
        <button onClick={()=>setMobilePanel('spots')} style={{padding:'12px 20px',borderRadius:24,background:`linear-gradient(135deg,${C.cyan},${C.teal})`,color:C.bg,fontWeight:700,fontSize:14,border:'none',cursor:'pointer',fontFamily:Fnt,boxShadow:'0 4px 20px #06b6d440',display:'flex',alignItems:'center',gap:6}}><PinI s={16} c={C.bg}/> {filtered.length} Spots</button>
        <button onClick={()=>setShowAI(true)} style={{width:48,height:48,borderRadius:24,background:C.card,border:`1px solid ${C.bdr}`,color:C.cyan,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px #0006'}}><SparkI s={20} c={C.cyan}/></button>
      </div>}

      {/* MOBILE SPOT LIST SHEET */}
      {isMobile && mobilePanel==='spots' && !selSpot && <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:45,background:C.card,borderTop:`2px solid ${C.bdr2}`,borderRadius:'16px 16px 0 0',maxHeight:'60vh',overflow:'auto',boxShadow:'0 -4px 30px #000a',WebkitOverflowScrolling:'touch'}}>
        <div style={{position:'sticky',top:0,background:C.card,zIndex:1,borderRadius:'16px 16px 0 0',padding:'8px 14px 6px'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:6}}><div style={{width:40,height:4,borderRadius:2,background:C.bdr2}}/></div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:700,fontSize:14}}>Fishing Spots ({filtered.length})</div>
            <button onClick={()=>setMobilePanel(null)} style={{background:'none',border:'none',color:C.dim,cursor:'pointer',padding:4}}><XI s={18}/></button>
          </div>
        </div>
        <div style={{padding:'0 14px 20px',display:'flex',flexDirection:'column',gap:6}}>
          {filtered.map(s=><button key={s.id} onClick={()=>{openSpot(s);setMobilePanel('spot-detail');}} style={{display:'flex',alignItems:'center',gap:10,padding:12,borderRadius:10,background:C.card2,border:`1px solid ${C.bdr}`,cursor:'pointer',textAlign:'left',width:'100%',fontFamily:Fnt,color:C.txt}}>
            <div style={{width:40,height:40,borderRadius:8,background:sc(s.type),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{si(s.type)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14}}>{s.name}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:2}}><StarI s={10} c={C.amber} filled/> {s.rating} {'\u2022'} {s.species.slice(0,2).join(', ')}</div>
            </div>
            <NavI s={16} c={C.dim}/>
          </button>)}
        </div>
      </div>}

      {/* MOBILE EDIT MODE HINT */}
      {isMobile && editMode && !ctxMenu && <div style={{position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:35,background:C.amber,color:C.bg,padding:'10px 20px',borderRadius:24,fontSize:13,fontWeight:700,boxShadow:'0 4px 20px #f59e0b40',fontFamily:Fnt}}>Long-press map to add marker</div>}

      {toast&&<div style={{position:'fixed',bottom:isMobile?80:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'#fff',padding:isMobile?'12px 24px':'10px 24px',borderRadius:10,fontSize:13,fontWeight:600,zIndex:2000,boxShadow:'0 4px 20px #0008',display:'flex',alignItems:'center',gap:6}}>{'\u2713'} {toast}</div>}

      <style>{`
        * { box-sizing:border-box; margin:0; -webkit-tap-highlight-color: transparent; }
        body { background:${C.bg}; overscroll-behavior: none; }
        html { touch-action: manipulation; }
        button { transition:all 0.15s; -webkit-touch-callout: none; }
        button:hover { filter:brightness(1.08); }
        button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:${C.bdr2}; border-radius:3px; }
        input, select, textarea { font-size: 16px !important; } /* Prevents iOS zoom on focus */
        @media (max-width: 768px) {
          .leaflet-control-layers { font-size: 11px !important; }
          .leaflet-control-zoom a { width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 18px !important; }
          .leaflet-control-scale { bottom: 60px !important; }
          .leaflet-control-layers-toggle { width: 36px !important; height: 36px !important; }
        }
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
