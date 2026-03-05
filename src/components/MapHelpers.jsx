import React, { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { C } from '../utils/theme';
import { sc, si, li } from '../utils/theme';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [bounds, map]);
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
    click: () => { onLeftClick(); },
  });
  return null;
}

export function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 14, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// Icon factories
export function spotIcon(type, selected) {
  const col = sc(type);
  const icon = si(type);
  const size = selected ? 38 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:${selected ? 12 : 8}px;background:${col};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${selected ? 20 : 16}px;box-shadow:0 2px 10px #0006;cursor:pointer;transition:all 0.2s">${icon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function launchIcon(type) {
  const icon = li(type);
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:8px;background:${C.bg};border:2px solid ${sc(type)};display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px #0004">${icon}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function photoIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${C.purple};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px #0006">\u{1F4F7}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function waypointIcon(index, status) {
  const col = status === 'done' ? C.green : status === 'active' ? C.cyan : '#475569';
  const label = status === 'done' ? '\u2713' : index + 1;
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${col};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;color:${status === 'active' ? C.bg : '#fff'};font-weight:700;font-size:14px;font-family:'Instrument Sans',sans-serif;box-shadow:0 3px 10px #0006">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function harborIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${C.green};border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 12px #0006">\u2693</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export function userLocationIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 6px #3b82f620, 0 2px 10px #0006;animation:pulse 2s infinite"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export const zoneCenterIcon = (color) => L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:' + color + ';border:3px solid #fff;cursor:move;box-shadow:0 2px 8px #0008;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700">+</div>',
  iconSize: [22, 22], iconAnchor: [11, 11],
});

export const wadePointIcon = () => L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:' + C.amber + ';border:3px solid #fff;cursor:move;box-shadow:0 2px 6px #0008"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8],
});

export function depthColor(depth) {
  if (depth <= 1.5) return '#22c55e';
  if (depth <= 3) return '#84cc16';
  if (depth <= 4.5) return C.amber;
  if (depth <= 6) return '#f97316';
  return '#3b82f6';
}

const btIcons = { mud: '\u{1F7EB}', sand: '\u{1F7E8}', shell: '\u{1F41A}', grass: '\u{1F33F}', reef: '\u{1FAB8}' };

export function depthMarkerIcon(depth, bottomType) {
  const col = depthColor(depth);
  const bt = btIcons[bottomType] || '';
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto">
      <div style="min-width:32px;height:22px;border-radius:6px;background:${col};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;font-family:'JetBrains Mono',monospace;box-shadow:0 2px 8px #0006;padding:0 4px;gap:2px;white-space:nowrap">${depth}<span style="font-size:8px;font-weight:400">ft</span></div>
      ${bt ? `<div style="font-size:10px;margin-top:-2px">${bt}</div>` : ''}
    </div>`,
    iconSize: [36, 28],
    iconAnchor: [18, 14],
  });
}

const shellColors = { scattered: C.amber, heavy: '#ff8c00', reef: '#ef4444' };
const shellEmojis = { scattered: '\u{1F41A}', heavy: '\u{1F41A}\u{1F41A}', reef: '\u{1FAB8}' };

export function shellPadIcon(shellType) {
  const col = shellColors[shellType] || C.amber;
  const emoji = shellEmojis[shellType] || '\u{1F41A}';
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${col}30;border:2px solid ${col};display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px #0006;cursor:pointer">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function resizeHandleIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid ${C.cyan};cursor:nwse-resize;box-shadow:0 1px 4px #0008"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export function sandBarPointIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#d4a574;border:2px solid #fff;cursor:move;box-shadow:0 1px 4px #0008"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function castDistLabel(yards) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#00000088;color:#fff;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;white-space:nowrap;pointer-events:none">${yards}yd</div>`,
    iconSize: [40, 18],
    iconAnchor: [20, 9],
  });
}

export function currentArrowIcon(dir, speed, tideState) {
  const color = tideState === 'incoming' ? '#06b6d4' : tideState === 'outgoing' ? '#f59e0b' : '#94a3b8';
  const opacity = Math.min(0.7, 0.2 + speed * 0.3);
  const size = Math.min(24, 12 + speed * 6);
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${opacity};transform:rotate(${dir}deg);transition:transform 2s ease">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="none">
        <path d="M12 2l-5 14h3v6h4v-6h3z"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Wind direction arrows - smaller, showing wind flow across the bay
export function windArrowIcon(dir, speed) {
  const opacity = Math.min(0.6, 0.15 + (speed / 30) * 0.45);
  const size = Math.min(18, 10 + (speed / 30) * 8);
  const color = speed > 20 ? '#ef4444' : speed > 15 ? '#f59e0b' : speed > 10 ? '#06b6d4' : '#94a3b8';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${opacity};transform:rotate(${dir}deg)">
      <svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round">
        <line x1="8" y1="14" x2="8" y2="3"/>
        <polyline points="4,7 8,3 12,7"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Bait shop icon
export function baitShopIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:6px;background:#16a34a;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px #0006;cursor:pointer">\u{1F3E3}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Marina icon
export function marinaIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:#0284c7;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 10px #0006;cursor:pointer">\u2693</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// Kayak launch specific icon
export function kayakLaunchIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:8px;background:#0d9488;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px #0006;cursor:pointer">\u{1F6F6}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Area label icon (text on map like Google Maps)
export function areaLabelIcon(name, size, type) {
  const fontSize = size === 'large' ? 14 : size === 'medium' ? 12 : 10;
  const fontWeight = size === 'large' ? 700 : size === 'medium' ? 600 : 500;
  const color = type === 'water' ? '#7dd3fc' : type === 'channel' ? '#93c5fd' : type === 'reef' ? '#fbbf24' : '#d1d5db';
  const style = type === 'water' || type === 'channel' ? 'italic' : 'normal';
  const letterSpacing = size === 'large' ? '0.12em' : size === 'medium' ? '0.08em' : '0.04em';
  const textShadow = '0 0 6px #000, 0 0 12px #000, 0 1px 3px #000';
  const width = Math.max(80, name.length * (fontSize * 0.65));
  return L.divIcon({
    className: '',
    html: `<div style="width:${width}px;text-align:center;pointer-events:none;font-family:'Instrument Sans',sans-serif;font-size:${fontSize}px;font-weight:${fontWeight};color:${color};font-style:${style};letter-spacing:${letterSpacing};text-shadow:${textShadow};white-space:nowrap;opacity:0.7">${name}</div>`,
    iconSize: [width, fontSize + 4],
    iconAnchor: [width / 2, (fontSize + 4) / 2],
  });
}
