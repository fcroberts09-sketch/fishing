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

    // Skip if bounds haven't actually changed (prevents re-fit on same data)
    if (boundsEqual(bounds, lastBoundsRef.current) && initialFitDone.current) return;
    lastBoundsRef.current = bounds;
    initialFitDone.current = true;

    // On mobile, disable animation to prevent glitchy zoom; also invalidateSize
    // in case container recently resized (e.g., fullscreen toggle)
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

    // Track user-initiated zoom/pan to block programmatic camera moves
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

// Disable double-click zoom when in edit mode (so double-click adds markers)
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

// Icon factories - all sizes reduced for mobile clarity
// Tap target is always at least 48px on mobile for accessibility
export function spotIcon(type, selected, mobile) {
  const col = sc(type);
  const icon = si(type);
  const size = mobile ? (selected ? 28 : 22) : (selected ? 36 : 28);
  const br = mobile ? (selected ? 8 : 6) : (selected ? 10 : 8);
  const fs = mobile ? (selected ? 14 : 11) : (selected ? 18 : 14);
  const tap = mobile ? Math.max(48, size) : size;
  return L.divIcon({
    className: '',
    html: `<div style="width:${tap}px;height:${tap}px;display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:${size}px;height:${size}px;border-radius:${br}px;background:${col};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${fs}px;box-shadow:0 1px 6px #0006;transition:all 0.2s">${icon}</div></div>`,
    iconSize: [tap, tap],
    iconAnchor: [tap / 2, tap / 2],
  });
}

export function launchIcon(type, mobile) {
  const icon = li(type);
  const size = mobile ? 22 : 28;
  const fs = mobile ? 11 : 14;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:6px;background:${C.bg};border:2px solid ${sc(type)};display:flex;align-items:center;justify-content:center;font-size:${fs}px;box-shadow:0 1px 4px #0004">${icon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function photoIcon(mobile) {
  const size = mobile ? 20 : 26;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${C.purple};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${mobile ? 9 : 12}px;box-shadow:0 1px 6px #0006">\u{1F4F7}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function waypointIcon(index, status, mobile) {
  const col = status === 'done' ? C.green : status === 'active' ? C.cyan : '#475569';
  const label = status === 'done' ? '\u2713' : index + 1;
  const size = mobile ? 24 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:${status === 'active' ? C.bg : '#fff'};font-weight:700;font-size:${mobile ? 11 : 14}px;font-family:'Instrument Sans',sans-serif;box-shadow:0 2px 8px #0006">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function harborIcon(mobile) {
  const size = mobile ? 26 : 34;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${C.green};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${mobile ? 12 : 16}px;box-shadow:0 2px 8px #0006">\u2693</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function userLocationIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 6px #3b82f620, 0 2px 10px #0006;animation:pulse 2s infinite"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export const zoneCenterIcon = (color) => L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:' + color + ';border:2px solid #fff;cursor:move;box-shadow:0 2px 6px #0008;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700">+</div>',
  iconSize: [18, 18], iconAnchor: [9, 9],
});

export const wadePointIcon = () => L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;border-radius:50%;background:' + C.amber + ';border:2px solid #fff;cursor:move;box-shadow:0 1px 4px #0008"></div>',
  iconSize: [12, 12], iconAnchor: [6, 6],
});

export function depthColor(depth) {
  if (depth <= 1.5) return '#22c55e';
  if (depth <= 3) return '#84cc16';
  if (depth <= 4.5) return C.amber;
  if (depth <= 6) return '#f97316';
  return '#3b82f6';
}

const btIcons = { mud: '\u{1F7EB}', sand: '\u{1F7E8}', shell: '\u{1F41A}', grass: '\u{1F33F}', reef: '\u{1FAB8}' };

export function depthMarkerIcon(depth, bottomType, mobile) {
  const col = depthColor(depth);
  const bt = btIcons[bottomType] || '';
  const h = mobile ? 18 : 22;
  const fs = mobile ? 9 : 11;
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto">
      <div style="min-width:${mobile ? 26 : 32}px;height:${h}px;border-radius:5px;background:${col};border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:700;color:#fff;font-family:'JetBrains Mono',monospace;box-shadow:0 1px 4px #0006;padding:0 3px;gap:1px;white-space:nowrap">${depth}<span style="font-size:${mobile ? 7 : 8}px;font-weight:400">ft</span></div>
      ${bt ? `<div style="font-size:${mobile ? 8 : 10}px;margin-top:-2px">${bt}</div>` : ''}
    </div>`,
    iconSize: [mobile ? 28 : 36, mobile ? 22 : 28],
    iconAnchor: [mobile ? 14 : 18, mobile ? 11 : 14],
  });
}

const shellColors = { scattered: C.amber, heavy: '#ff8c00', reef: '#ef4444' };
const shellEmojis = { scattered: '\u{1F41A}', heavy: '\u{1F41A}\u{1F41A}', reef: '\u{1FAB8}' };

export function shellPadIcon(shellType, mobile) {
  const col = shellColors[shellType] || C.amber;
  const emoji = shellEmojis[shellType] || '\u{1F41A}';
  const size = mobile ? 22 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col}30;border:1.5px solid ${col};display:flex;align-items:center;justify-content:center;font-size:${mobile ? 10 : 14}px;box-shadow:0 1px 4px #0006;cursor:pointer">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function resizeHandleIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid ${C.cyan};cursor:nwse-resize;box-shadow:0 1px 4px #0008"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

export function sandBarPointIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:#d4a574;border:2px solid #fff;cursor:move;box-shadow:0 1px 4px #0008"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export function castDistLabel(yards) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#00000088;color:#fff;font-size:9px;font-weight:600;padding:1px 4px;border-radius:3px;font-family:'JetBrains Mono',monospace;white-space:nowrap;pointer-events:none">${yards}yd</div>`,
    iconSize: [32, 14],
    iconAnchor: [16, 7],
  });
}

export function currentArrowIcon(dir, speed, tideState) {
  const color = tideState === 'incoming' ? '#06b6d4' : tideState === 'outgoing' ? '#f59e0b' : '#94a3b8';
  const opacity = Math.min(0.5, 0.15 + speed * 0.2);
  const size = Math.min(18, 10 + speed * 4);
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
  const opacity = Math.min(0.85, 0.35 + (speed / 25) * 0.5);
  const size = Math.min(32, 18 + (speed / 25) * 14);
  const color = speed > 20 ? '#ef4444' : speed > 15 ? '#f59e0b' : speed > 10 ? '#06b6d4' : '#7dd3fc';
  const labelSize = Math.max(8, Math.min(10, speed > 10 ? 10 : 9));
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;opacity:${opacity}">
      <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transform:rotate(${dir}deg)">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}40" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="20" x2="12" y2="5"/>
          <polyline points="6,10 12,4 18,10"/>
        </svg>
      </div>
      <div style="font-size:${labelSize}px;font-weight:700;color:${color};text-shadow:0 1px 3px #000,0 0 6px #000;margin-top:-2px;white-space:nowrap">${Math.round(speed)}</div>
    </div>`,
    iconSize: [size, size + 14],
    iconAnchor: [size / 2, (size + 14) / 2],
  });
}

export function baitShopIcon(mobile) {
  const size = mobile ? 20 : 26;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:5px;background:#16a34a;border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${mobile ? 10 : 13}px;box-shadow:0 1px 4px #0006;cursor:pointer">\u{1F3E3}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function marinaIcon(mobile) {
  const size = mobile ? 22 : 28;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#0284c7;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${mobile ? 11 : 14}px;box-shadow:0 1px 6px #0006;cursor:pointer">\u2693</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function kayakLaunchIcon(mobile) {
  const size = mobile ? 20 : 26;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:6px;background:#0d9488;border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${mobile ? 10 : 13}px;box-shadow:0 1px 4px #0006;cursor:pointer">\u{1F6F6}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Wave height label on the bay
export function waveHeightIcon(label, height) {
  const isFlat = height < 0.3;
  const color = isFlat ? '#22c55e' : height < 0.5 ? '#84cc16' : height < 1.0 ? '#eab308' : height < 1.5 ? '#f97316' : '#ef4444';
  const bg = isFlat ? '#22c55e20' : `${color}25`;
  const fs = isFlat ? 9 : 10;
  const text = isFlat ? 'Flat' : label;
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};border:1px solid ${color}60;border-radius:4px;padding:1px 5px;font-size:${fs}px;font-weight:600;color:${color};font-family:'JetBrains Mono',monospace;white-space:nowrap;pointer-events:none;text-shadow:0 0 4px #000,0 0 8px #000;opacity:0.8">${text}</div>`,
    iconSize: [36, 16],
    iconAnchor: [18, 8],
  });
}

export function areaLabelIcon(name, size, type) {
  const fontSize = size === 'large' ? 13 : size === 'medium' ? 11 : 9;
  const fontWeight = size === 'large' ? 700 : size === 'medium' ? 600 : 500;
  const color = type === 'water' ? '#7dd3fc' : type === 'channel' ? '#93c5fd' : type === 'reef' ? '#fbbf24' : '#d1d5db';
  const style = type === 'water' || type === 'channel' ? 'italic' : 'normal';
  const letterSpacing = size === 'large' ? '0.1em' : size === 'medium' ? '0.06em' : '0.03em';
  const textShadow = '0 0 4px #000, 0 0 8px #000, 0 1px 2px #000';
  const width = Math.max(60, name.length * (fontSize * 0.62));
  return L.divIcon({
    className: '',
    html: `<div style="width:${width}px;text-align:center;pointer-events:none;font-family:'Instrument Sans',sans-serif;font-size:${fontSize}px;font-weight:${fontWeight};color:${color};font-style:${style};letter-spacing:${letterSpacing};text-shadow:${textShadow};white-space:nowrap;opacity:0.65">${name}</div>`,
    iconSize: [width, fontSize + 4],
    iconAnchor: [width / 2, (fontSize + 4) / 2],
  });
}
