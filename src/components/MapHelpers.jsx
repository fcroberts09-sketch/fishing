import React, { useEffect, useRef, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { C } from '../utils/theme';
import { sc, si, li } from '../utils/theme';

// Global touch/interaction state shared across components
let _isTouching = false;
let _lastUserInteraction = 0; // timestamp of last manual zoom/pan
export function isTouching() { return _isTouching; }

// Block programmatic camera moves for N ms after user interaction
function userRecentlyInteracted() {
  return Date.now() - _lastUserInteraction < 2000;
}

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Deep-compare bounds arrays to avoid unnecessary fitBounds calls
function boundsEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i], bi = b[i];
    const aLat = Array.isArray(ai) ? ai[0] : ai.lat;
    const aLng = Array.isArray(ai) ? ai[1] : ai.lng;
    const bLat = Array.isArray(bi) ? bi[0] : bi.lat;
    const bLng = Array.isArray(bi) ? bi[1] : bi.lng;
    if (aLat !== bLat || aLng !== bLng) return false;
  }
  return true;
}

export function FitBounds({ bounds }) {
  const map = useMap();
  const lastBoundsRef = useRef(null);
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (!bounds || bounds.length < 2) return;
    if (_isTouching || userRecentlyInteracted()) return;

    if (boundsEqual(bounds, lastBoundsRef.current) && initialFitDone.current) return;
    lastBoundsRef.current = bounds;
    initialFitDone.current = true;

    map.invalidateSize({ animate: false });
    setTimeout(() => {
      if (_isTouching || userRecentlyInteracted()) return;
      map.stop();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
    }, 50);
  }, [bounds, map]);
  return null;
}

// Touch guard + scroll zoom rate + disable double-tap zoom + user interaction tracking
export function MapStabilizer() {
  const map = useMap();
  useEffect(() => {
    const canvas = map.getContainer();
    const onTouchStart = () => { _isTouching = true; _lastUserInteraction = Date.now(); };
    const onTouchEnd = () => { _lastUserInteraction = Date.now(); setTimeout(() => { _isTouching = false; }, 600); };
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });
    map.doubleClickZoom.disable();
    if (map.scrollWheelZoom) {
      map.options.wheelPxPerZoomLevel = 120;
    }

    const onZoomStart = () => { _lastUserInteraction = Date.now(); };
    const onMoveStart = () => { _lastUserInteraction = Date.now(); };
    map.on('zoomstart', onZoomStart);
    map.on('dragstart', onMoveStart);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      map.off('zoomstart', onZoomStart);
      map.off('dragstart', onMoveStart);
    };
  }, [map]);
  return null;
}

export function EditModeZoomControl({ editMode }) {
  const map = useMap();
  useEffect(() => {
    if (editMode) {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [editMode, map]);
  return null;
}

export function MapClickHandler({ onRightClick, onLeftClick, editMode, isMobile }) {
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
        const rect = container.getBoundingClientRect();
        const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
        const latlng = map.containerPointToLatLng(point);
        onRightClick({ originalEvent: { preventDefault: () => {} }, latlng, containerPoint: point });
        if (navigator.vibrate) navigator.vibrate(50);
      }, 600);
    };
    const onTouchMove = (e) => {
      if (pressTimer.current && pressPos.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - pressPos.current.x;
        const dy = touch.clientY - pressPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) { clearTimeout(pressTimer.current); pressTimer.current = null; }
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
    dblclick: (e) => { if (editMode) { e.originalEvent.preventDefault(); onRightClick(e); } },
    click: () => { onLeftClick(); },
  });
  return null;
}

export function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && !_isTouching && !userRecentlyInteracted()) {
      map.stop();
      map.flyTo([position.lat, position.lng], 14, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// ──────────────────────────────────────────
// SVG ICON HELPERS - Clean, professional pins
// ──────────────────────────────────────────

// SVG mini-icons for spot types (crisp at any size)
const SVG_SPOT = {
  wade: `<path d="M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6c-1.1 0-2 .45-2 1v2h2v5h2v-5h2v-2c0-.55-.9-1-2-1z" fill="currentColor"/>`,
  boat: `<path d="M4 17l1.5-1.5C7 14 9.5 13 12 13s5 1 6.5 2.5L20 17M6 20l2-2c1.5-1 3-1.5 4-1.5s2.5.5 4 1.5l2 2M12 3v7M9 6l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  kayak: `<path d="M3 14c2.5-2 5.5-3 9-3s6.5 1 9 3M6 17c2-1.2 4-1.8 6-1.8s4 .6 6 1.8M12 4v7M10 8h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  drivein: `<path d="M5 16h14M6 16V9a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7M8 16v2M16 16v2M7.5 12h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// SVG mini-icons for launches
const SVG_LAUNCH = {
  boat: `<path d="M3 17l2-2c2-2 5-3 7-3s5 1 7 3l2 2M12 4v8M10 7h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  kayak: `<path d="M4 15c2.5-2 5-3 8-3s5.5 1 8 3M12 5v7M10 8h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  drivein: `<path d="M5 15h14M7 15V9h10v6M9 15v1.5M15 15v1.5M8 12h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// Professional pin: slim teardrop shape with SVG icon
function pinHtml(color, svgInner, size, selected) {
  const s = size;
  const pinH = Math.round(s * 1.4);
  const shadow = selected ? `filter:drop-shadow(0 2px 6px ${color}80)` : 'filter:drop-shadow(0 1px 3px rgba(0,0,0,0.4))';
  return `<div style="width:${s}px;height:${pinH}px;display:flex;flex-direction:column;align-items:center;${shadow}">
    <div style="width:${s}px;height:${s}px;border-radius:${Math.round(s * 0.35)}px ${Math.round(s * 0.35)}px ${Math.round(s * 0.35)}px ${Math.round(s * 0.08)}px;background:${color};display:flex;align-items:center;justify-content:center;transform:rotate(-45deg)">
      <svg width="${Math.round(s * 0.55)}" height="${Math.round(s * 0.55)}" viewBox="0 0 24 24" style="color:#fff;transform:rotate(45deg)">${svgInner}</svg>
    </div>
    <div style="width:2px;height:${Math.round(s * 0.3)}px;background:${color};border-radius:0 0 1px 1px;margin-top:-1px"></div>
  </div>`;
}

// Compact dot marker (for secondary features)
function dotHtml(color, label, size) {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:1.5px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.35);cursor:pointer">
    <svg width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}" viewBox="0 0 24 24" style="color:#fff">${label}</svg>
  </div>`;
}

// ──────────────────────────────────────────
// FISHING SPOT MARKERS
// ──────────────────────────────────────────
export function spotIcon(type, selected, mobile) {
  const col = sc(type);
  const svg = SVG_SPOT[type] || SVG_SPOT.wade;
  const size = mobile ? (selected ? 26 : 20) : (selected ? 32 : 24);
  const pinH = Math.round(size * 1.4);
  const tap = mobile ? Math.max(44, size) : size;
  return L.divIcon({
    className: '',
    html: `<div style="width:${tap}px;height:${tap + 8}px;display:flex;align-items:flex-start;justify-content:center;padding-top:${Math.round((tap - pinH) / 2)}px;cursor:pointer">${pinHtml(col, svg, size, selected)}</div>`,
    iconSize: [tap, tap + 8],
    iconAnchor: [tap / 2, tap + 4],
  });
}

// ──────────────────────────────────────────
// LAUNCH / RAMP MARKERS
// ──────────────────────────────────────────
export function launchIcon(type, mobile) {
  const col = { boat: '#0ea5e9', kayak: '#14b8a6', drivein: '#8b5cf6' }[type] || '#64748b';
  const svg = SVG_LAUNCH[type] || SVG_LAUNCH.boat;
  const size = mobile ? 18 : 22;
  return L.divIcon({
    className: '',
    html: dotHtml(col, svg, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ──────────────────────────────────────────
// PHOTO MARKERS
// ──────────────────────────────────────────
const SVG_CAMERA = `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/>`;

export function photoIcon(mobile) {
  const size = mobile ? 16 : 20;
  return L.divIcon({
    className: '',
    html: dotHtml(C.purple, SVG_CAMERA, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ──────────────────────────────────────────
// WAYPOINT / ROUTE MARKERS
// ──────────────────────────────────────────
export function waypointIcon(index, status, mobile) {
  const col = status === 'done' ? C.green : status === 'active' ? C.cyan : '#475569';
  const label = status === 'done' ? '\u2713' : index + 1;
  const size = mobile ? 20 : 24;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col};border:1.5px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${mobile ? 9 : 11}px;font-family:'JetBrains Mono',monospace;box-shadow:0 1px 4px rgba(0,0,0,0.35)">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ──────────────────────────────────────────
// HARBOR / START MARKER
// ──────────────────────────────────────────
const SVG_ANCHOR = `<circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v10M5 17c0-3.87 3.13-7 7-7s7 3.13 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`;

export function harborIcon(mobile) {
  const size = mobile ? 22 : 28;
  return L.divIcon({
    className: '',
    html: dotHtml(C.green, SVG_ANCHOR, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ──────────────────────────────────────────
// USER LOCATION
// ──────────────────────────────────────────
export function userLocationIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2.5px solid #fff;box-shadow:0 0 0 4px #3b82f620, 0 1px 6px rgba(0,0,0,0.3);animation:pulse 2s infinite"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ──────────────────────────────────────────
// EDIT MODE HELPERS
// ──────────────────────────────────────────
export const zoneCenterIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:1.5px solid #fff;cursor:move;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center">
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  </div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

export const wadePointIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:8px;height:8px;border-radius:50%;background:${C.amber};border:1.5px solid rgba(255,255,255,0.9);cursor:move;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
  iconSize: [8, 8], iconAnchor: [4, 4],
});

// ──────────────────────────────────────────
// DEPTH MARKERS
// ──────────────────────────────────────────
export function depthColor(depth) {
  if (depth <= 1.5) return '#22c55e';
  if (depth <= 3) return '#84cc16';
  if (depth <= 4.5) return C.amber;
  if (depth <= 6) return '#f97316';
  return '#3b82f6';
}

const btLabels = { mud: 'M', sand: 'S', shell: 'Sh', grass: 'G', reef: 'R' };

export function depthMarkerIcon(depth, bottomType, mobile) {
  const col = depthColor(depth);
  const bt = btLabels[bottomType] || '';
  const h = mobile ? 14 : 16;
  const fs = mobile ? 8 : 9;
  return L.divIcon({
    className: '',
    html: `<div style="display:inline-flex;align-items:center;gap:1px;height:${h}px;border-radius:${Math.round(h / 2)}px;background:${col};padding:0 ${mobile ? 4 : 5}px;font-size:${fs}px;font-weight:700;color:#fff;font-family:'JetBrains Mono',monospace;box-shadow:0 1px 3px rgba(0,0,0,0.35);white-space:nowrap;line-height:${h}px;border:1px solid rgba(255,255,255,0.25)">${depth}${bt ? `<span style="font-size:${fs - 1}px;opacity:0.7;margin-left:1px">${bt}</span>` : ''}</div>`,
    iconSize: [mobile ? 28 : 34, h],
    iconAnchor: [mobile ? 14 : 17, h / 2],
  });
}

// ──────────────────────────────────────────
// SHELL PAD MARKERS
// ──────────────────────────────────────────
const shellColors = { scattered: '#b8860b', heavy: '#cd853f', reef: '#8b4513' };
const shellLabels = { scattered: 'Sh', heavy: 'ShH', reef: 'Rf' };

export function shellPadIcon(shellType, mobile) {
  const col = shellColors[shellType] || '#b8860b';
  const label = shellLabels[shellType] || 'Sh';
  const size = mobile ? 16 : 20;
  const fs = mobile ? 7 : 8;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:3px;background:${col};border:1px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:700;color:#fff;font-family:'JetBrains Mono',monospace;box-shadow:0 1px 3px rgba(0,0,0,0.35);cursor:pointer">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function resizeHandleIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:8px;height:8px;border-radius:50%;background:#fff;border:1.5px solid ${C.cyan};cursor:nwse-resize;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
}

export function sandBarPointIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:8px;height:8px;border-radius:50%;background:#c4a060;border:1.5px solid rgba(255,255,255,0.8);cursor:move;box-shadow:0 1px 3px rgba(0,0,0,0.35)"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
}

export function castDistLabel(yards) {
  return L.divIcon({
    className: '',
    html: `<div style="background:rgba(0,0,0,0.5);color:#fff;font-size:8px;font-weight:600;padding:1px 4px;border-radius:3px;font-family:'JetBrains Mono',monospace;white-space:nowrap;pointer-events:none">${yards}yd</div>`,
    iconSize: [28, 12],
    iconAnchor: [14, 6],
  });
}

// ──────────────────────────────────────────
// CURRENT / WIND ARROWS
// ──────────────────────────────────────────
export function currentArrowIcon(dir, speed, tideState) {
  const color = tideState === 'incoming' ? '#06b6d4' : tideState === 'outgoing' ? '#f59e0b' : '#94a3b8';
  const opacity = Math.min(0.5, 0.15 + speed * 0.2);
  const size = Math.min(16, 8 + speed * 4);
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${opacity};transform:rotate(${dir}deg)">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="none">
        <path d="M12 2l-5 14h3v6h4v-6h3z"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function windArrowIcon(dir, speed) {
  const opacity = Math.min(0.8, 0.3 + (speed / 25) * 0.5);
  const size = Math.min(28, 16 + (speed / 25) * 12);
  const color = speed > 20 ? '#ef4444' : speed > 15 ? '#f59e0b' : speed > 10 ? '#06b6d4' : '#7dd3fc';
  const fs = Math.max(7, Math.min(9, speed > 10 ? 9 : 8));
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;opacity:${opacity}">
      <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transform:rotate(${dir}deg)">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}30" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="20" x2="12" y2="5"/>
          <polyline points="6,10 12,4 18,10"/>
        </svg>
      </div>
      <div style="font-size:${fs}px;font-weight:700;color:${color};text-shadow:0 1px 2px #000,0 0 4px #000;margin-top:-2px;white-space:nowrap">${Math.round(speed)}</div>
    </div>`,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, (size + 12) / 2],
  });
}

// ──────────────────────────────────────────
// POI MARKERS (bait shops, marinas, kayak launches)
// ──────────────────────────────────────────
const SVG_SHOP = `<path d="M3 21V9l9-6 9 6v12M9 21v-6h6v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
const SVG_MARINA = `<circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v10M5 17c0-3.87 3.13-7 7-7s7 3.13 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`;
const SVG_KAYAK = `<path d="M4 15c2.5-2 5-3 8-3s5.5 1 8 3M12 5v7M10 8h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;

export function baitShopIcon(mobile) {
  const size = mobile ? 16 : 20;
  return L.divIcon({
    className: '',
    html: dotHtml('#16a34a', SVG_SHOP, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function marinaIcon(mobile) {
  const size = mobile ? 18 : 22;
  return L.divIcon({
    className: '',
    html: dotHtml('#0284c7', SVG_MARINA, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function kayakLaunchIcon(mobile) {
  const size = mobile ? 16 : 20;
  return L.divIcon({
    className: '',
    html: dotHtml('#0d9488', SVG_KAYAK, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Wave height label on the bay
export function waveHeightIcon(label, height) {
  const isFlat = height < 0.3;
  const color = isFlat ? '#22c55e' : height < 0.5 ? '#84cc16' : height < 1.0 ? '#eab308' : height < 1.5 ? '#f97316' : '#ef4444';
  const bg = isFlat ? '#22c55e18' : `${color}20`;
  const fs = isFlat ? 8 : 9;
  const text = isFlat ? 'Flat' : label;
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};border:1px solid ${color}50;border-radius:3px;padding:1px 4px;font-size:${fs}px;font-weight:600;color:${color};font-family:'JetBrains Mono',monospace;white-space:nowrap;pointer-events:none;text-shadow:0 0 3px #000,0 0 6px #000;opacity:0.75">${text}</div>`,
    iconSize: [32, 14],
    iconAnchor: [16, 7],
  });
}

export function areaLabelIcon(name, size, type) {
  const fontSize = size === 'large' ? 12 : size === 'medium' ? 10 : 8;
  const fontWeight = size === 'large' ? 700 : size === 'medium' ? 600 : 500;
  const color = type === 'water' ? '#7dd3fc' : type === 'channel' ? '#93c5fd' : type === 'reef' ? '#fbbf24' : '#d1d5db';
  const style = type === 'water' || type === 'channel' ? 'italic' : 'normal';
  const letterSpacing = size === 'large' ? '0.1em' : size === 'medium' ? '0.06em' : '0.03em';
  const textShadow = '0 0 3px #000, 0 0 6px #000, 0 1px 2px #000';
  const width = Math.max(50, name.length * (fontSize * 0.62));
  return L.divIcon({
    className: '',
    html: `<div style="width:${width}px;text-align:center;pointer-events:none;font-family:'Instrument Sans',sans-serif;font-size:${fontSize}px;font-weight:${fontWeight};color:${color};font-style:${style};letter-spacing:${letterSpacing};text-shadow:${textShadow};white-space:nowrap;opacity:0.6">${name}</div>`,
    iconSize: [width, fontSize + 4],
    iconAnchor: [width / 2, (fontSize + 4) / 2],
  });
}
