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
