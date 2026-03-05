import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Tooltip, Polyline, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';

// Modular imports
import { C, Fnt, FM, sc, si, li } from './utils/theme';
import { haversineNM, calcBearing, bearingLabel, parseDMS, parseDecimal, parseGPS, formatGPS } from './utils/geo';
import { extractPhotoGPS, generateGPX, parseGPXFile, downloadFile } from './utils/gps';
import { DEFAULT_SPOTS } from './data/spots';
import { BAY_CONFIGS, BAY_HARBORS, CHANNEL_WAYPOINTS, BAY_DATA, DEFAULT_SHADE_ZONES, DEFAULT_LAUNCHES, DEFAULT_WADE_LINES, DEFAULT_PHOTOS, BOATSHARE_LISTINGS, generateRoute } from './data/bays';
import { FitBounds, MapClickHandler, FlyToLocation, spotIcon, launchIcon, photoIcon, waypointIcon, harborIcon, userLocationIcon, zoneCenterIcon, wadePointIcon } from './components/MapHelpers';
import { FishI, WindI, WaveI, SunI, PinI, UsrI, NavI, StarI, XI, ChkI, PlusI, GearI, CamI, ImgI, SparkI, AnchorI, ArrowLI, EditI, TrashI, SaveI, KeyI, UploadI, MapEdI, ThermI, TargetI, CopyI, DownloadI, SearchI, LayerI, MoveI, UndoI, ClockI, HeartI, LocI } from './components/Icons';
import { Btn, Lbl, Inp, Sel, Badge, Modal } from './components/UI';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useGeolocation } from './hooks/useGeolocation';
import { useIsMobile } from './hooks/useIsMobile';

// ─── CAST RANGE CONSTANT ───
const CAST_METERS = 40 * 0.9144;

export default function App() {
  const isMobile = useIsMobile();
  const geo = useGeolocation();
  const [flyToUser, setFlyToUser] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const longPressTimer = useRef(null);
  const [page, setPage] = useState('home');
  const [selBay, setSelBay] = useState(null);
  const [selSpot, setSelSpot] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeStep, setRouteStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [spotFilter, setSpotFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showBS, setShowBS] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPhotoUp, setShowPhotoUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [edTab, setEdTab] = useState('spots');
  const [toast, setToast] = useState(null);

  // ─── PERSISTED STATE (localStorage) ───
  const [allSpots, setAllSpots] = useLocalStorage('tt_spots', DEFAULT_SPOTS);
  const [launches, setLaunches] = useLocalStorage('tt_launches', DEFAULT_LAUNCHES);
  const [shadeZones, setShadeZones] = useLocalStorage('tt_zones', DEFAULT_SHADE_ZONES);
  const [wadeLines, setWadeLines] = useLocalStorage('tt_wadelines', DEFAULT_WADE_LINES);
  const [communityPhotos, setCommunityPhotos] = useLocalStorage('tt_photos', DEFAULT_PHOTOS);
  const [favorites, setFavorites] = useLocalStorage('tt_favorites', []);
  const [settings, setSettings] = useLocalStorage('tt_settings', { claudeApiKey: '', autoAI: true, units: 'imperial' });

  // ─── TRIP TIMER ───
  const [tripActive, setTripActive] = useState(false);
  const [tripStart, setTripStart] = useState(null);
  const [tripElapsed, setTripElapsed] = useState('0:00');
  useEffect(() => {
    if (!tripActive || !tripStart) return;
    const iv = setInterval(() => {
      const d = Math.floor((Date.now() - tripStart) / 1000);
      const m = Math.floor(d / 60);
      const s = d % 60;
      setTripElapsed(`${m}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [tripActive, tripStart]);

  // ─── UNDO STACK ───
  const [undoStack, setUndoStack] = useState([]);
  const handleUndo = () => {
    if (!undoStack.length) return;
    const last = undoStack[undoStack.length - 1];
    if (last.type === 'spot') setAllSpots((p) => [...p, last.data]);
    else if (last.type === 'launch') setLaunches((p) => [...p, last.data]);
    else if (last.type === 'zone') setShadeZones((p) => [...p, last.data]);
    else if (last.type === 'wadeline') setWadeLines((p) => [...p, last.data]);
    else if (last.type === 'photo') setCommunityPhotos((p) => [...p, last.data]);
    setUndoStack((p) => p.slice(0, -1));
    showT('Restored!');
  };
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ─── EDITOR STATE ───
  const [edMapMode, setEdMapMode] = useState(null);
  const [editingSpot, setEditingSpot] = useState(null);
  const [edSearch, setEdSearch] = useState('');
  const [edSortBy, setEdSortBy] = useState('name');
  const [gpsInput, setGpsInput] = useState({ mode: 'click', lat: '', lng: '', dms: '', format: 'dd' });
  const [newSpotDraft, setNewSpotDraft] = useState({ name: '', type: 'wade', species: [], bestTide: 'Incoming', bestTime: '', lures: [], desc: '', gps: { lat: '', lng: '' }, position: { x: 50, y: 50 } });
  const [photoGPS, setPhotoGPS] = useState(null);
  const [newShade, setNewShade] = useState({ type: 'wade', label: '', cx: 50, cy: 50, rx: 8, ry: 5 });
  const [newLaunch, setNewLaunch] = useState({ name: '', type: 'boat', gps: '', notes: '' });
  const [spotNotes, setSpotNotes] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [editPopup, setEditPopup] = useState(null);
  const [drawingLine, setDrawingLine] = useState(null);
  const dragJustEnded = useRef(false);
  const editPanelRef = useRef(null);

  const weather = { temp: 78, wind: 12, windDir: 'SE', gusts: 18, conditions: 'Partly Cloudy', waterTemp: 71 };
  const tide = { status: 'Rising', next: 'High at 2:34 PM' };

  const bayConfig = selBay ? BAY_CONFIGS[selBay.id] : BAY_CONFIGS.matagorda;
  const baySpots = allSpots.filter((s) => s.bay === selBay?.id);

  // ─── FILTERING WITH SEARCH, FAVORITES, TYPE ───
  const filtered = useMemo(() => {
    let spots = baySpots;
    if (spotFilter === 'favorites') spots = spots.filter((s) => favorites.includes(s.id));
    else if (spotFilter !== 'all') spots = spots.filter((s) => s.type === spotFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      spots = spots.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.species?.some((sp) => sp.toLowerCase().includes(q)) ||
        s.lures?.some((l) => l.toLowerCase().includes(q)) ||
        s.type.toLowerCase().includes(q)
      );
    }
    return spots;
  }, [baySpots, spotFilter, searchQuery, favorites]);

  const bayShades = shadeZones.filter((z) => z.bay === (selBay?.id || 'matagorda'));
  const bayLaunches = launches.filter((l) => l.bay === (selBay?.id || 'matagorda'));
  const bayWadeLines = wadeLines.filter((w) => w.bay === (selBay?.id || 'matagorda'));
  const bayPhotos = communityPhotos.filter((p) => p.bay === (selBay?.id || 'matagorda'));

  // ─── FAVORITES ───
  const toggleFavorite = (spotId) => {
    setFavorites((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]
    );
  };

  // ─── NAVIGATION ROUTE ───
  const curRoute = useMemo(() => {
    if (!selSpot || !selBay) return [];
    const route = generateRoute(selBay.id, selSpot.position, selSpot.name);
    return route.map((wp, i, arr) => {
      const [lat, lng] = bayConfig.toLatLng(wp.pos);
      let dist = 0, brng = 0, brngLbl = '';
      if (i > 0) {
        const [pLat, pLng] = bayConfig.toLatLng(arr[i - 1].pos);
        dist = haversineNM(pLat, pLng, lat, lng);
        brng = calcBearing(pLat, pLng, lat, lng);
        brngLbl = bearingLabel(brng);
      }
      return { ...wp, lat, lng, dist, brng, brngLbl, cumDist: 0 };
    });
  }, [selSpot, selBay, bayConfig]);

  useMemo(() => { let cum = 0; curRoute.forEach((wp) => { cum += wp.dist; wp.cumDist = cum; }); }, [curRoute]);
  const totalRouteNM = curRoute.length > 0 ? curRoute[curRoute.length - 1]?.cumDist || 0 : 0;
  const curWP = curRoute[routeStep];

  // ─── DISTANCE FROM USER ───
  const distFromUser = useMemo(() => {
    if (!geo.position || !selSpot || !selBay) return null;
    const [lat, lng] = bayConfig.toLatLng(selSpot.position);
    return haversineNM(geo.position.lat, geo.position.lng, lat, lng);
  }, [geo.position, selSpot, selBay, bayConfig]);

  // ─── GPS & POSITION HELPERS ───
  const gpsToPosition = (lat, lng) => {
    const y = ((28.85 - lat) / 0.32) * 100;
    const x = ((lng + 96.18) / 0.62) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

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

  const getCastLineOffsets = (pts, rangeMeters) => {
    if (pts.length < 2) return { left: [], right: [] };
    const coords = pts.map((p) => bayConfig.toLatLng(p));
    const left = []; const right = [];
    const mPerLat = 111320;
    for (let i = 0; i < coords.length; i++) {
      let dx = 0; let dy = 0;
      if (i < coords.length - 1) { dx = coords[i + 1][1] - coords[i][1]; dy = coords[i + 1][0] - coords[i][0]; }
      else { dx = coords[i][1] - coords[i - 1][1]; dy = coords[i][0] - coords[i - 1][0]; }
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

  const routeCoords = useMemo(() => {
    if (!showRoute || !curRoute.length) return [];
    return curRoute.map((w) => [w.lat, w.lng]);
  }, [showRoute, curRoute]);

  const routeBounds = useMemo(() => {
    if (showRoute && routeCoords.length >= 2) return routeCoords;
    if (filtered.length >= 2) return filtered.map((s) => bayConfig.toLatLng(s.position));
    return null;
  }, [showRoute, routeCoords, filtered, bayConfig]);

  useEffect(() => {
    if (playing && curRoute.length) {
      const t = setInterval(() => setRouteStep((p) => { if (p >= curRoute.length - 1) { setPlaying(false); return p; } return p + 1; }), 3500);
      return () => clearInterval(t);
    }
  }, [playing, curRoute.length]);

  // ─── MAP EDITING FUNCTIONS ───
  const selectForEdit = useCallback((type, id) => {
    if (dragJustEnded.current) return;
    let data = null;
    if (type === 'spot') data = allSpots.find((s) => s.id === id);
    else if (type === 'launch') data = launches.find((l) => l.id === id);
    else if (type === 'zone') data = shadeZones.find((z) => z.id === id);
    else if (type === 'wadeline') data = wadeLines.find((w) => w.id === id);
    else if (type === 'photo') data = communityPhotos.find((p) => p.id === id);
    if (data) { setEditPopup({ type, id, data: { ...data } }); setCtxMenu(null); }
  }, [allSpots, launches, shadeZones, wadeLines, communityPhotos]);

  const handleMapRightClick = (e) => {
    e.originalEvent.preventDefault();
    if (drawingLine) {
      const pos = latLngToPosition(e.latlng.lat, e.latlng.lng);
      setDrawingLine((prev) => ({ ...prev, points: [...prev.points, pos] }));
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
    const bay = selBay?.id || 'matagorda';
    if (type === 'wade-line') {
      setDrawingLine({ points: [pos], label: 'New Wade Line' });
      setCtxMenu(null);
      showT('Wade line started! Right-click map to add points.');
      return;
    }
    if (type === 'wade-zone') {
      const newZ = { id, type: 'wade', label: 'New Wade Zone', cx: pos.x, cy: pos.y, rx: 6, ry: 4, color: C.amber, bay, userAdded: true };
      setShadeZones((prev) => [...prev, newZ]);
      setEditPopup({ type: 'zone', id, data: newZ });
      setCtxMenu(null);
      return;
    }
    if (type.startsWith('launch-')) {
      const lt = type.replace('launch-', '');
      const newL = { id, name: 'New Launch', type: lt, position: pos, gps: gps.lat + ', ' + gps.lng, notes: '', bay, userAdded: true };
      setLaunches((prev) => [...prev, newL]);
      setEditPopup({ type: 'launch', id, data: newL });
    } else {
      const newS = { id, bay, name: 'New Spot', type, position: pos, gps, rating: 0, species: [], bestTide: 'Any', bestTime: '', bestSeason: '', bestWind: '', lures: [], desc: '', parking: pos, media: [], userAdded: true };
      setAllSpots((prev) => [...prev, newS]);
      setEditPopup({ type: 'spot', id, data: newS });
    }
    setCtxMenu(null);
  };

  const handleFinishWadeLine = () => {
    if (!drawingLine || drawingLine.points.length < 2) { showT('Need at least 2 points'); return; }
    const id = Date.now();
    const wl = { id, bay: selBay?.id || 'matagorda', label: drawingLine.label || 'Wade Line', points: drawingLine.points, color: C.amber, castRange: 40, userAdded: true };
    setWadeLines((prev) => [...prev, wl]);
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
      setAllSpots((prev) => prev.map((s) => s.id === id ? { ...s, position: newPos, gps: newGps } : s));
      if (selSpot?.id === id) setSelSpot((prev) => prev ? { ...prev, position: newPos, gps: newGps } : prev);
    } else if (markerType === 'launch') {
      setLaunches((prev) => prev.map((l) => l.id === id ? { ...l, position: newPos, gps: newGps.lat + ', ' + newGps.lng } : l));
    } else if (markerType === 'photo') {
      setCommunityPhotos((prev) => prev.map((p) => p.id === id ? { ...p, position: newPos } : p));
    } else if (markerType === 'zone-center') {
      setShadeZones((prev) => prev.map((z) => z.id === id ? { ...z, cx: newPos.x, cy: newPos.y } : z));
    } else if (markerType === 'wade-pt') {
      setWadeLines((prev) => prev.map((wl) => wl.id === id.lineId ? { ...wl, points: wl.points.map((p, i) => i === id.ptIndex ? newPos : p) } : wl));
    }
    if (editPopup) {
      if (markerType === 'spot' && editPopup.type === 'spot' && editPopup.id === id) {
        setEditPopup((prev) => ({ ...prev, data: { ...prev.data, position: newPos, gps: newGps } }));
      } else if (markerType === 'launch' && editPopup.type === 'launch' && editPopup.id === id) {
        setEditPopup((prev) => ({ ...prev, data: { ...prev.data, position: newPos, gps: newGps.lat + ', ' + newGps.lng } }));
      } else if (markerType === 'zone-center' && editPopup.type === 'zone' && editPopup.id === id) {
        setEditPopup((prev) => ({ ...prev, data: { ...prev.data, cx: newPos.x, cy: newPos.y } }));
      }
    }
    showT(gpsStr);
  };

  const updateSpot = (id, field, value) => {
    setAllSpots((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
    if (selSpot?.id === id) setSelSpot((prev) => prev ? { ...prev, [field]: value } : prev);
  };
  const updateLaunch = (id, field, value) => { setLaunches((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l)); };
  const updateZone = (id, field, value) => { setShadeZones((prev) => prev.map((z) => z.id === id ? { ...z, [field]: value } : z)); };
  const updateWadeLine = (id, field, value) => { setWadeLines((prev) => prev.map((wl) => wl.id === id ? { ...wl, [field]: value } : wl)); };

  const handleDeleteMarker = (markerType, id) => {
    let data = null;
    if (markerType === 'spot') data = allSpots.find((s) => s.id === id);
    else if (markerType === 'launch') data = launches.find((l) => l.id === id);
    else if (markerType === 'zone') data = shadeZones.find((z) => z.id === id);
    else if (markerType === 'wadeline') data = wadeLines.find((w) => w.id === id);
    else if (markerType === 'photo') data = communityPhotos.find((p) => p.id === id);
    if (data) setUndoStack((prev) => [...prev.slice(-9), { type: markerType, data }]);
    if (markerType === 'spot') { setAllSpots((prev) => prev.filter((s) => s.id !== id)); if (selSpot?.id === id) setSelSpot(null); }
    else if (markerType === 'launch') setLaunches((prev) => prev.filter((l) => l.id !== id));
    else if (markerType === 'zone') setShadeZones((prev) => prev.filter((z) => z.id !== id));
    else if (markerType === 'wadeline') setWadeLines((prev) => prev.filter((w) => w.id !== id));
    else if (markerType === 'photo') setCommunityPhotos((prev) => prev.filter((p) => p.id !== id));
    setEditPopup(null); setConfirmDelete(null); showT('Deleted \u2014 tap Undo to restore');
  };

  const getEditData = useCallback(() => {
    if (!editPopup) return null;
    const { type, id } = editPopup;
    if (type === 'spot') return allSpots.find((s) => s.id === id);
    if (type === 'launch') return launches.find((l) => l.id === id);
    if (type === 'zone') return shadeZones.find((z) => z.id === id);
    if (type === 'wadeline') return wadeLines.find((w) => w.id === id);
    if (type === 'photo') return communityPhotos.find((p) => p.id === id);
    return null;
  }, [editPopup, allSpots, launches, shadeZones, wadeLines, communityPhotos]);

  const editData = editPopup ? (getEditData() || editPopup.data) : null;
  const getEditGPS = () => {
    const d = editData;
    if (!d) return '';
    if (d.position) return posToGPS(d.position).str;
    if (d.cx != null) return posToGPS({ x: d.cx, y: d.cy }).str;
    if (d.gps && typeof d.gps === 'string') return d.gps;
    if (d.gps) return d.gps.lat + ', ' + d.gps.lng;
    return '';
  };

  const handleDropPin = () => {
    let coords;
    if (gpsInput.format === 'dms') coords = parseDMS(gpsInput.dms);
    else coords = { lat: parseFloat(gpsInput.lat), lng: parseFloat(gpsInput.lng) };
    if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
      const pos = gpsToPosition(coords.lat, coords.lng);
      setNewSpotDraft({ ...newSpotDraft, gps: { lat: coords.lat.toFixed(4) + '\u00B0N', lng: Math.abs(coords.lng).toFixed(4) + '\u00B0W' }, position: pos });
      showT('Pin dropped: ' + coords.lat.toFixed(4) + ', ' + coords.lng.toFixed(4));
    } else showT('Invalid GPS coordinates');
  };

  const showT = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const cpGPS = (g) => { navigator.clipboard?.writeText(`${g.lat}, ${g.lng}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const openBay = (id) => { setSelBay(BAY_DATA[id]); setPage('bay'); setSelSpot(null); setShowRoute(false); setShowBS(false); setSpotFilter('all'); setSearchQuery(''); };
  const openSpot = useCallback((s) => { setSelSpot(s); setShowRoute(false); setRouteStep(0); setMobilePanel('spot-detail'); }, []);
  const endNav = () => { setShowRoute(false); setRouteStep(0); setPlaying(false); setTripActive(false); setMobilePanel(null); };
  const startNav = () => { setShowRoute(true); setRouteStep(0); setPlaying(false); setTripActive(true); setTripStart(Date.now()); setMobilePanel('nav'); };
  const lfColor = (t) => ({ experienced: C.amber, intermediate: C.cyan, anyone: C.green }[t] || C.mid);
  const lfLabel = (t) => ({ experienced: 'Experienced Fisherman', intermediate: 'Intermediate \u2014 Knows Basics', anyone: 'Anyone Welcome \u2014 All Levels' }[t] || t);

  const handleLocateMe = () => {
    geo.requestLocation();
    setFlyToUser(true);
    showT('Getting your location...');
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: Fnt, background: C.bg, color: C.txt, minHeight: '-webkit-fill-available' }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#0b1220" />

      {/* HEADER */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.bdr}`, padding: isMobile ? '8px 12px' : '10px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, cursor: 'pointer' }} onClick={() => { setPage('home'); setSelBay(null); setSelSpot(null); setShowBS(false); endNav(); setMobilePanel(null); }}>
            <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: isMobile ? 8 : 10, background: `linear-gradient(135deg,${C.cyan},${C.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FishI s={isMobile ? 16 : 20} c="#0b1220" /></div>
            <div><div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700 }}>TEXAS<span style={{ color: C.cyan }}>TIDES</span></div>{!isMobile && <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.1em' }}>COASTAL FISHING GUIDE</div>}</div>
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 2 : 4, alignItems: 'center' }}>
            {tripActive && <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: isMobile ? '4px 8px' : '5px 12px', borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}40`, marginRight: 4 }}><ClockI s={13} c={C.green} /><span style={{ fontSize: 11, fontWeight: 700, color: C.green, fontFamily: FM }}>{tripElapsed}</span></div>}
            {[{ l: 'Map', i: <PinI s={14} />, a: () => { setShowBS(false); if (!selBay) setPage('home'); }, on: !showBS }, { l: 'Boats', i: <UsrI s={14} />, a: () => setShowBS(true), on: showBS }].map((t) => <button key={t.l} onClick={t.a} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 5, padding: isMobile ? '6px 8px' : '7px 14px', borderRadius: 8, fontSize: isMobile ? 11 : 12, fontWeight: 600, background: t.on ? C.cyan : 'transparent', color: t.on ? C.bg : C.mid, border: 'none', cursor: 'pointer', fontFamily: Fnt }}>{t.i} {isMobile ? '' : t.l}</button>)}
            {!isMobile && <div style={{ width: 1, height: 24, background: C.bdr, margin: '0 4px' }} />}
            {undoStack.length > 0 && <button onClick={handleUndo} style={{ padding: isMobile ? '6px 8px' : '7px 10px', borderRadius: 8, background: `${C.amber}20`, border: `1px solid ${C.amber}40`, color: C.amber, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }} title="Undo last delete"><UndoI s={14} c={C.amber} /></button>}
            <button onClick={() => setShowEditor(true)} style={{ padding: isMobile ? '6px 8px' : '7px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: C.mid, cursor: 'pointer' }} title="Map Editor"><MapEdI s={16} /></button>
            {!isMobile && <button onClick={() => setShowSettings(true)} style={{ padding: '7px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: C.mid, cursor: 'pointer' }} title="Settings"><GearI s={16} /></button>}
          </div>
        </div>
      </header>

      {/* WEATHER BAR */}
      <div style={{ background: `${C.card}99`, borderBottom: `1px solid ${C.bdr}`, padding: isMobile ? '6px 10px' : '7px 20px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, fontSize: isMobile ? 11 : 12, overflowX: isMobile ? 'auto' : 'visible', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><ThermI s={13} c={C.amber} /> {weather.temp}\u00B0F</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><WindI s={13} c={C.cyan} /> {weather.wind} mph {weather.windDir}{!isMobile && ` (gusts ${weather.gusts})`}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><WaveI s={13} c={C.teal} /> {tide.status}</span>
          <span style={{ flexShrink: 0 }}>{'\uD83D\uDCA7'} {weather.waterTemp}\u00B0F</span>
          {!isMobile && <span style={{ marginLeft: 'auto', color: C.cyan }}><SunI s={13} /> {weather.conditions}</span>}
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? 10 : 20 }}>
        {/* HOME */}
        {page === 'home' && !showBS && (
          <div>
            <div style={{ marginBottom: isMobile ? 16 : 28, padding: isMobile ? '20px 16px' : '36px 28px', borderRadius: isMobile ? 12 : 16, background: `linear-gradient(135deg,${C.card},#0d2847)`, border: `1px solid ${C.bdr}`, position: 'relative', overflow: 'hidden' }}>
              {!isMobile && <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 200, background: `radial-gradient(circle at 100% 0%,${C.cyan}15,transparent 70%)` }} />}
              <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, marginBottom: 6 }}>Texas Bay Fishing Guide</h2>
              <p style={{ color: C.mid, fontSize: isMobile ? 13 : 14, maxWidth: 580, lineHeight: 1.6, marginBottom: isMobile ? 12 : 16 }}>Satellite imagery, GPS waypoints, navigation routes, and AI-powered spot recommendations.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn primary isMobile={isMobile} onClick={() => setShowAI(true)}><SparkI s={14} c={C.bg} /> Where Should I Fish?</Btn>
                <Btn isMobile={isMobile} onClick={handleLocateMe}><LocI s={14} c={C.cyan} /> My Location</Btn>
              </div>
            </div>
            <Lbl>Select a Bay System</Lbl>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(360px,1fr))', gap: isMobile ? 10 : 16, marginTop: 8 }}>
              {Object.values(BAY_DATA).map((bay) => (
                <div key={bay.id} onClick={() => openBay(bay.id)} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = C.cyan} onMouseLeave={(e) => e.currentTarget.style.borderColor = C.bdr}>
                  <div style={{ height: 160, background: '#081828', position: 'relative', overflow: 'hidden' }}>
                    <img src={`https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/10/${bay.id === 'matagorda' ? '410/254' : '409/254'}.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.background = '#0c4a6e'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%,#081828)' }} />
                    <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', gap: 6 }}>
                      {bay.cameras?.map((c) => <span key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, background: '#000a', fontSize: 9, fontWeight: 700 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: C.red }} />LIVE</span>)}
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{bay.name}</h3>
                    <p style={{ fontSize: 12, color: C.mid, marginBottom: 10 }}>{bay.sub} \u2014 {bay.region}</p>
                    {bay.reports?.[0] && <div style={{ background: C.card2, borderRadius: 8, padding: 10, border: `1px solid ${C.bdr}` }}><div style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 11 }}><span style={{ fontWeight: 600, color: C.cyan }}>{bay.reports[0].user}</span><span style={{ color: C.dim }}>{bay.reports[0].time}</span></div><p style={{ fontSize: 11, color: C.mid, margin: 0, lineHeight: 1.4 }}>{bay.reports[0].text}</p></div>}
                    <div style={{ marginTop: 10, fontSize: 11, color: C.dim }}>{allSpots.filter((s) => s.bay === bay.id).length} spots \u2022 {launches.filter((l) => l.bay === bay.id).length} launches</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BAY DETAIL */}
        {page === 'bay' && selBay && !showBS && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button onClick={() => { setPage('home'); setSelBay(null); setSelSpot(null); setMobilePanel(null); }} style={{ padding: isMobile ? '8px 12px' : '5px 10px', borderRadius: 6, background: C.card, border: `1px solid ${C.bdr}`, color: C.mid, cursor: 'pointer', fontFamily: Fnt, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><ArrowLI s={13} /> Back</button>
              <div style={{ flex: 1, minWidth: 0 }}><h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selBay.name}</h2>{!isMobile && <p style={{ fontSize: 12, color: C.mid }}>{selBay.sub} \u2014 Satellite imagery</p>}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn small isMobile={isMobile} onClick={handleLocateMe}><LocI s={13} c={C.cyan} /></Btn>
                <Btn small primary isMobile={isMobile} onClick={() => setShowAI(true)}><SparkI s={13} c={C.bg} /> AI</Btn>
              </div>
            </div>

            {/* SEARCH BAR */}
            <div style={{ marginBottom: isMobile ? 8 : 12 }}>
              <div style={{ position: 'relative' }}>
                <SearchI s={14} c={C.dim} style={{ position: 'absolute', left: 12, top: isMobile ? 14 : 11 }} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search spots, species, lures..." style={{ width: '100%', padding: isMobile ? '12px 14px 12px 36px' : '10px 14px 10px 36px', borderRadius: 10, background: C.card, border: `1px solid ${C.bdr}`, color: C.txt, fontSize: isMobile ? 15 : 13, fontFamily: Fnt, outline: 'none', minHeight: isMobile ? 44 : 0 }} />
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: isMobile ? 12 : 9, background: 'none', border: 'none', color: C.dim, cursor: 'pointer' }}><XI s={16} /></button>}
              </div>
            </div>

            {/* FILTER CHIPS */}
            <div style={{ display: 'flex', gap: 4, marginBottom: isMobile ? 8 : 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {[{ id: 'all', l: 'All', i: '\uD83D\uDCCD' }, { id: 'favorites', l: 'Saved', i: '\u2764\uFE0F' }, { id: 'wade', l: 'Wade', i: '\uD83D\uDEB6' }, { id: 'boat', l: 'Boat', i: '\uD83D\uDEA4' }, { id: 'kayak', l: 'Kayak', i: '\uD83D\uDEF6' }].map((f) => <button key={f.id} onClick={() => setSpotFilter(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: isMobile ? '8px 14px' : '5px 12px', borderRadius: 6, fontSize: isMobile ? 12 : 11, fontWeight: 600, background: spotFilter === f.id ? (f.id === 'favorites' ? C.red : C.cyan) : C.card, color: spotFilter === f.id ? C.bg : C.mid, border: `1px solid ${spotFilter === f.id ? (f.id === 'favorites' ? C.red : C.cyan) : C.bdr}`, cursor: 'pointer', fontFamily: Fnt, flexShrink: 0 }}>{f.i} {f.l}{f.id === 'favorites' ? ` (${favorites.filter((fid) => baySpots.some((s) => s.id === fid)).length})` : ''}</button>)}
            </div>

            <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: isMobile ? 0 : 14 }}>
              {/* SATELLITE MAP */}
              <div style={{ background: C.card, borderRadius: isMobile ? 0 : 14, border: editMode ? '2px solid ' + C.amber : isMobile ? 'none' : '1px solid ' + C.bdr, overflow: 'hidden', position: 'relative' }}>
                <div style={{ padding: isMobile ? '8px 10px' : '10px 14px', borderBottom: `1px solid ${C.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{showRoute ? 'Route \u2192 ' + selSpot?.name : editMode ? 'Edit Mode' : 'Satellite Map'}</div>{!isMobile && <div style={{ fontSize: 11, color: editMode ? C.amber : C.dim }}>{editMode ? 'Right-click: add marker \u2022 Click: edit \u2022 Drag: move' : 'Sentinel-2 / USGS / ESRI'}</div>}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={handleLocateMe} style={{ padding: isMobile ? '6px 10px' : '5px 10px', borderRadius: 6, fontSize: 11, background: geo.position ? `${C.blue}20` : C.card2, border: `1px solid ${geo.position ? C.blue : C.bdr}`, color: geo.position ? C.blue : C.mid, cursor: 'pointer', fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }} title="My Location"><LocI s={13} /></button>
                    <button onClick={() => { setEditMode(!editMode); setCtxMenu(null); setEditPopup(null); }} style={{ padding: isMobile ? '6px 10px' : '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: editMode ? C.amber : C.card2, color: editMode ? C.bg : C.mid, border: `1px solid ${editMode ? C.amber : C.bdr}`, cursor: 'pointer', fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }}><EditI s={13} /> {editMode ? 'Done' : 'Edit'}</button>
                    {showRoute && <button onClick={() => { setShowRoute(false); setRouteStep(0); setPlaying(false); if (isMobile) setMobilePanel(null); }} style={{ fontSize: 11, color: C.mid, background: C.card2, border: `1px solid ${C.bdr}`, borderRadius: 5, padding: isMobile ? '6px 10px' : '4px 10px', cursor: 'pointer', fontFamily: Fnt }}>{'\u2190'} Map</button>}
                  </div>
                </div>

                <div style={{ height: isMobile ? 'calc(100vh - 240px)' : 500, position: 'relative', minHeight: isMobile ? 300 : 400 }}>
                  <MapContainer center={bayConfig.center} zoom={bayConfig.zoom} style={{ height: '100%', width: '100%' }} zoomControl={false} key={selBay.id} tap={true} touchZoom={true}>
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="Sentinel-2 Satellite">
                        <TileLayer url="https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg" maxZoom={15} attribution="Sentinel-2 &copy; EOX" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="USGS Aerial">
                        <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}" maxZoom={16} attribution="USGS" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="ESRI World Imagery">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={18} attribution="Esri" />
                      </LayersControl.BaseLayer>
                    </LayersControl>

                    {routeBounds && <FitBounds bounds={routeBounds} />}
                    {flyToUser && geo.position && <FlyToLocation position={geo.position} />}
                    <MapClickHandler onRightClick={handleMapRightClick} onLeftClick={handleMapLeftClick} editMode={editMode} isMobile={isMobile} />

                    {/* USER LOCATION */}
                    {geo.position && <>
                      <Marker position={[geo.position.lat, geo.position.lng]} icon={userLocationIcon()}>
                        <Tooltip>You are here ({geo.position.accuracy?.toFixed(0) || '?'}m accuracy)</Tooltip>
                      </Marker>
                      <Circle center={[geo.position.lat, geo.position.lng]} radius={geo.position.accuracy || 100} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }} />
                    </>}

                    {/* Shade zones */}
                    {!showRoute && bayShades.map((z) => (
                      <Polygon key={z.id} positions={shadeToPolygon(z)} pathOptions={{ color: z.color, weight: editMode ? 2.5 : 1.5, dashArray: editMode ? '' : '6 4', fillColor: z.color, fillOpacity: editMode ? 0.2 : 0.12 }} eventHandlers={{ click: () => { if (editMode) selectForEdit('zone', z.id); } }}>
                        <Tooltip>{z.label}{editMode ? ' (click to edit)' : ''}</Tooltip>
                      </Polygon>
                    ))}

                    {editMode && !showRoute && bayShades.map((z) => (
                      <Marker key={'zc' + z.id} position={bayConfig.toLatLng({ x: z.cx, y: z.cy })} icon={zoneCenterIcon(z.color)} draggable={true} eventHandlers={{ click: () => selectForEdit('zone', z.id), dragend: (e) => handleMarkerDragEnd('zone-center', z.id, e) }}>
                        <Tooltip>Drag to move {z.label}</Tooltip>
                      </Marker>
                    ))}

                    {/* Wade lines */}
                    {!showRoute && bayWadeLines.map((wl) => {
                      const lineCoords = wl.points.map((p) => bayConfig.toLatLng(p));
                      const cast = getCastLineOffsets(wl.points, CAST_METERS);
                      return <React.Fragment key={'wl' + wl.id}>
                        <Polyline positions={lineCoords} pathOptions={{ color: wl.color, weight: 3, opacity: 0.9 }} eventHandlers={{ click: () => { if (editMode) selectForEdit('wadeline', wl.id); } }}>
                          <Tooltip>{wl.label} ({wl.castRange || 40}yd cast range){editMode ? ' - click to edit' : ''}</Tooltip>
                        </Polyline>
                        {cast.left.length > 1 && <Polyline positions={cast.left} pathOptions={{ color: wl.color, weight: 1, opacity: 0.4, dashArray: '4 6' }} />}
                        {cast.right.length > 1 && <Polyline positions={cast.right} pathOptions={{ color: wl.color, weight: 1, opacity: 0.4, dashArray: '4 6' }} />}
                        {editMode && wl.points.map((pt, pi) => (
                          <Marker key={'wlp' + wl.id + '-' + pi} position={bayConfig.toLatLng(pt)} icon={wadePointIcon()} draggable={true} eventHandlers={{ dragend: (e) => handleMarkerDragEnd('wade-pt', { lineId: wl.id, ptIndex: pi }, e) }}>
                            <Tooltip>Wade point {pi + 1} - drag to move</Tooltip>
                          </Marker>
                        ))}
                      </React.Fragment>;
                    })}

                    {/* Drawing line preview */}
                    {drawingLine && drawingLine.points.length > 0 && <>
                      <Polyline positions={drawingLine.points.map((p) => bayConfig.toLatLng(p))} pathOptions={{ color: C.green, weight: 3, dashArray: '8 4' }} />
                      {drawingLine.points.map((pt, i) => (
                        <Marker key={'draw' + i} position={bayConfig.toLatLng(pt)} icon={wadePointIcon()}>
                          <Tooltip>Point {i + 1}</Tooltip>
                        </Marker>
                      ))}
                    </>}

                    {/* Launch markers */}
                    {!showRoute && bayLaunches.map((l) => (
                      <Marker key={`l${l.id}`} position={bayConfig.toLatLng(l.position)} icon={launchIcon(l.type)} draggable={editMode} eventHandlers={{ click: () => { if (editMode) selectForEdit('launch', l.id); }, dragend: (e) => handleMarkerDragEnd('launch', l.id, e) }}>
                        <Tooltip><b>{l.name}</b><br />{editMode ? 'Drag to move \u2022 Click to edit' : l.notes}</Tooltip>
                      </Marker>
                    ))}

                    {/* Photo markers */}
                    {!showRoute && bayPhotos.map((p) => (
                      <Marker key={`p${p.id}`} position={bayConfig.toLatLng(p.position)} icon={photoIcon()} draggable={editMode} eventHandlers={{ click: () => { if (editMode) selectForEdit('photo', p.id); }, dragend: (e) => handleMarkerDragEnd('photo', p.id, e) }}>
                        {!editMode && <Popup><b>{p.caption}</b><br /><span style={{ fontSize: 11 }}>by {p.user} \u2022 {p.time}</span></Popup>}
                        {editMode && <Tooltip>Drag to move - Click to edit</Tooltip>}
                      </Marker>
                    ))}

                    {/* Route */}
                    {showRoute && routeCoords.length > 0 && <>
                      <Polyline positions={routeCoords} pathOptions={{ color: C.cyan, weight: 3, dashArray: '8 6', opacity: 0.3 }} />
                      {routeStep > 0 && <Polyline positions={routeCoords.slice(0, routeStep + 1)} pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.9 }} />}
                      <Marker position={routeCoords[0]} icon={harborIcon()} eventHandlers={{ click: () => setRouteStep(0) }}><Tooltip><b>{curRoute[0]?.title || 'Launch'}</b><br />Starting point</Tooltip></Marker>
                      {curRoute.slice(1).map((w, i) => {
                        const idx = i + 1;
                        const status = idx < routeStep ? 'done' : idx === routeStep ? 'active' : 'pending';
                        return (
                          <Marker key={`wp${idx}`} position={[w.lat, w.lng]} icon={waypointIcon(idx, status)} eventHandlers={{ click: () => setRouteStep(idx) }}>
                            <Tooltip><b>{w.title}</b><br />{w.desc}<br />Depth: {w.depth}{w.dist > 0 ? ' \u2022 ' + w.dist.toFixed(1) + ' NM' : ''}</Tooltip>
                          </Marker>
                        );
                      })}
                      {routeCoords[routeStep] && <Circle center={routeCoords[routeStep]} radius={400} pathOptions={{ color: C.cyan, fillColor: C.cyan, fillOpacity: 0.12, weight: 1 }} />}
                    </>}

                    {/* Spot markers */}
                    {!showRoute && filtered.map((s) => (
                      <Marker key={`s${s.id}`} position={bayConfig.toLatLng(s.position)} icon={spotIcon(s.type, selSpot?.id === s.id)} draggable={editMode} eventHandlers={{ click: () => { if (editMode) selectForEdit('spot', s.id); else openSpot(s); }, dragend: (e) => handleMarkerDragEnd('spot', s.id, e) }}>
                        <Tooltip><b>{s.name}</b>{favorites.includes(s.id) ? ' \u2764\uFE0F' : ''}<br />{editMode ? 'Drag to move \u2022 Click to edit' : '\u2B50 ' + s.rating + ' \u2022 ' + s.species.slice(0, 2).join(', ')}</Tooltip>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* CONTEXT MENU */}
                  {ctxMenu && editMode && <div style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100, background: C.card, borderTop: '2px solid ' + C.bdr2, borderRadius: '16px 16px 0 0', padding: '12px 12px 24px', boxShadow: '0 -8px 32px #000a' } : { position: 'absolute', left: Math.min(ctxMenu.x + 14, 250), top: ctxMenu.y + 52, zIndex: 1000, background: C.card, border: '1px solid ' + C.bdr2, borderRadius: 12, padding: 6, minWidth: 180, boxShadow: '0 8px 32px #000a' }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                    {isMobile && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>}
                    {isMobile && <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 8, textAlign: 'center' }}>Add to Map</div>}
                    <div style={{ padding: '6px 10px', fontSize: 10, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Marker Here</div>
                    <div style={{ fontSize: 11, color: C.mid, padding: '2px 10px 8px', fontFamily: FM }}>{ctxMenu.lat.toFixed(5)}, {ctxMenu.lng.toFixed(5)}</div>
                    <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 } : {}}>{[{ t: 'wade', l: 'Wade Spot', i: '\uD83D\uDEB6', c: C.amber }, { t: 'boat', l: 'Boat Spot', i: '\uD83D\uDEA4', c: C.blue }, { t: 'kayak', l: 'Kayak Spot', i: '\uD83D\uDEF6', c: C.green }, { t: 'wade-line', l: 'Wade Line + Cast', i: '\uD83C\uDFA3', c: C.amber }, { t: 'wade-zone', l: 'Wade Zone', i: '\uD83D\uDDFA', c: C.amber }, { t: 'launch-boat', l: 'Boat Ramp', i: '\u2693', c: C.cyan }, { t: 'launch-kayak', l: 'Kayak Launch', i: '\uD83D\uDEF6', c: C.teal }, { t: 'launch-drivein', l: 'Drive-in Access', i: '\uD83D\uDE97', c: C.purple }].map((opt) => <button key={opt.t} onClick={() => handleAddFromCtx(opt.t)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: isMobile ? '12px 10px' : '8px 10px', borderRadius: 8, background: isMobile ? C.card2 : 'transparent', border: isMobile ? `1px solid ${C.bdr}` : 'none', color: C.txt, cursor: 'pointer', fontFamily: Fnt, fontSize: isMobile ? 13 : 12, textAlign: 'left' }} onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.background = C.card2; }} onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.background = 'transparent'; }}><span style={{ width: isMobile ? 32 : 28, height: isMobile ? 32 : 28, borderRadius: 6, background: opt.c + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 15, flexShrink: 0 }}>{opt.i}</span><div style={{ fontWeight: 600 }}>{opt.l}</div></button>)}</div>
                    <div style={{ borderTop: '1px solid ' + C.bdr, marginTop: 4, paddingTop: 4 }}><button onClick={() => setCtxMenu(null)} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontFamily: Fnt, fontSize: 11, textAlign: 'center' }}>Cancel</button></div>
                  </div>}
                </div>

                {/* EDIT PANEL */}
                {editPopup && editMode && <div ref={editPanelRef} style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: C.card, borderTop: '2px solid ' + C.bdr2, borderRadius: '16px 16px 0 0', maxHeight: '65vh', overflow: 'auto', boxShadow: '0 -4px 30px #000a', WebkitOverflowScrolling: 'touch' } : { background: C.card, border: '1px solid ' + C.bdr2, borderRadius: 14, overflow: 'hidden', marginTop: 8 }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  {isMobile && <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', position: 'sticky', top: 0, background: C.card, zIndex: 1 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + C.bdr, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.cyan + '10' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EditI s={16} c={C.cyan} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Edit {editPopup.type === 'spot' ? 'Fishing Spot' : editPopup.type === 'launch' ? 'Launch Point' : editPopup.type === 'zone' ? 'Wade Zone' : editPopup.type === 'wadeline' ? 'Wade Line' : 'Photo'}</div>
                        <div style={{ fontSize: 11, color: C.cyan, fontFamily: FM }}>{getEditGPS()}</div>
                      </div>
                    </div>
                    <button onClick={() => setEditPopup(null)} style={{ background: C.card2, border: '1px solid ' + C.bdr, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><XI s={14} c={C.dim} /></button>
                  </div>
                  <div style={{ padding: 16 }}>
                    {editPopup.type === 'spot' && <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Spot Name</Lbl><input defaultValue={editPopup.data.name} key={editPopup.id + 'name'} onBlur={(e) => updateSpot(editPopup.id, 'name', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <Sel label="Type" isMobile={isMobile} value={editData?.type || 'wade'} onChange={(e) => updateSpot(editPopup.id, 'type', e.target.value)} options={[{ value: 'wade', label: 'Wade' }, { value: 'boat', label: 'Boat' }, { value: 'kayak', label: 'Kayak' }]} />
                        <Sel label="Best Tide" isMobile={isMobile} value={editData?.bestTide || 'Any'} onChange={(e) => updateSpot(editPopup.id, 'bestTide', e.target.value)} options={[{ value: 'Incoming', label: 'Incoming' }, { value: 'Outgoing', label: 'Outgoing' }, { value: 'High', label: 'High' }, { value: 'Low', label: 'Low' }, { value: 'Moving', label: 'Any Moving' }, { value: 'Any', label: 'Any' }]} />
                      </div>
                      <div><Lbl>Species (comma separated)</Lbl><input defaultValue={editPopup.data.species?.join(', ') || ''} key={editPopup.id + 'species'} onBlur={(e) => updateSpot(editPopup.id, 'species', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div><Lbl>Best Time</Lbl><input defaultValue={editPopup.data.bestTime || ''} key={editPopup.id + 'time'} onBlur={(e) => updateSpot(editPopup.id, 'bestTime', e.target.value)} placeholder="e.g. 5-9 AM" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                        <div><Lbl>Best Wind</Lbl><input defaultValue={editPopup.data.bestWind || ''} key={editPopup.id + 'wind'} onBlur={(e) => updateSpot(editPopup.id, 'bestWind', e.target.value)} placeholder="SE 5-15" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                      </div>
                      <div><Lbl>Lures (comma separated)</Lbl><input defaultValue={editPopup.data.lures?.join(', ') || ''} key={editPopup.id + 'lures'} onBlur={(e) => updateSpot(editPopup.id, 'lures', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                      <div><Lbl>Notes</Lbl><textarea defaultValue={editPopup.data.desc || ''} key={editPopup.id + 'desc'} onBlur={(e) => updateSpot(editPopup.id, 'desc', e.target.value)} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none', resize: 'vertical' }} /></div>
                    </div>}
                    {editPopup.type === 'launch' && <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Name</Lbl><input defaultValue={editPopup.data.name} key={editPopup.id + 'lname'} onBlur={(e) => updateLaunch(editPopup.id, 'name', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                      <Sel label="Type" isMobile={isMobile} value={editData?.type || 'boat'} onChange={(e) => updateLaunch(editPopup.id, 'type', e.target.value)} options={[{ value: 'boat', label: 'Boat Ramp' }, { value: 'kayak', label: 'Kayak Launch' }, { value: 'drivein', label: 'Drive-in Access' }]} />
                      <div><Lbl>Notes</Lbl><input defaultValue={editPopup.data.notes || ''} key={editPopup.id + 'lnotes'} onBlur={(e) => updateLaunch(editPopup.id, 'notes', e.target.value)} placeholder="Parking, fees, conditions..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                    </div>}
                    {editPopup.type === 'zone' && <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Zone Label</Lbl><input defaultValue={editPopup.data.label || ''} key={editPopup.id + 'zlabel'} onBlur={(e) => updateZone(editPopup.id, 'label', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                      <Sel label="Zone Type" isMobile={isMobile} value={editData?.type || 'wade'} onChange={(e) => { updateZone(editPopup.id, 'type', e.target.value); updateZone(editPopup.id, 'color', sc(e.target.value)); }} options={[{ value: 'wade', label: 'Wade Zone' }, { value: 'kayak', label: 'Kayak Zone' }, { value: 'boat', label: 'Boat Zone' }]} />
                    </div>}
                    {editPopup.type === 'wadeline' && <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Line Label</Lbl><input defaultValue={editPopup.data.label || ''} key={editPopup.id + 'wlabel'} onBlur={(e) => updateWadeLine(editPopup.id, 'label', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                      <div><Lbl>Cast Range (yards)</Lbl><input type="number" defaultValue={editPopup.data.castRange || 40} key={editPopup.id + 'wcast'} onBlur={(e) => updateWadeLine(editPopup.id, 'castRange', +e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                    </div>}
                    {editPopup.type === 'photo' && <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Caption</Lbl><input defaultValue={editPopup.data.caption || ''} key={editPopup.id + 'pcap'} onBlur={(e) => setCommunityPhotos((prev) => prev.map((p) => p.id === editPopup.id ? { ...p, caption: e.target.value } : p))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                    </div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <Btn primary small isMobile={isMobile} style={{ flex: 1 }} onClick={() => { showT('Saved!'); setEditPopup(null); setConfirmDelete(null); }}><ChkI s={14} c={C.bg} /> Done</Btn>
                      {confirmDelete === editPopup.id
                        ? <Btn small danger isMobile={isMobile} onClick={() => handleDeleteMarker(editPopup.type, editPopup.id)}><TrashI s={14} /> Confirm?</Btn>
                        : <Btn small danger isMobile={isMobile} onClick={() => setConfirmDelete(editPopup.id)}><TrashI s={14} /> Delete</Btn>
                      }
                    </div>
                  </div>
                </div>}

                {/* Wade line drawing controls */}
                {drawingLine && editMode && <div style={{ position: 'absolute', bottom: isMobile ? 16 : 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: C.card, border: '1px solid ' + C.green, borderRadius: 12, padding: isMobile ? '10px 14px' : '8px 16px', boxShadow: '0 4px 20px #000a', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, flexWrap: isMobile ? 'wrap' : 'nowrap', justifyContent: 'center', maxWidth: isMobile ? '90vw' : 'auto' }}>
                  <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Drawing: {drawingLine.points.length} points</div>
                  <input value={drawingLine.label} onChange={(e) => setDrawingLine((prev) => ({ ...prev, label: e.target.value }))} style={{ padding: '4px 8px', borderRadius: 6, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 12, fontFamily: Fnt, width: 140, outline: 'none' }} placeholder="Wade line name" />
                  <Btn small primary isMobile={isMobile} onClick={handleFinishWadeLine}><ChkI s={12} c={C.bg} /> Finish</Btn>
                  <Btn small danger isMobile={isMobile} onClick={() => { setDrawingLine(null); showT('Cancelled'); }}><XI s={12} /> Cancel</Btn>
                </div>}

                {showRoute && curRoute.length > 0 && <div style={{ padding: isMobile ? '12px 10px' : '10px 14px', borderTop: '1px solid ' + C.bdr }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, fontSize: isMobile ? 12 : 11, color: C.mid, alignItems: 'center' }}>
                      <span>{'\u2693'} {curRoute[0]?.title}</span><span>{'\u2192'}</span><span>{'\uD83C\uDFAF'} {curRoute[curRoute.length - 1]?.title}</span>
                      <span style={{ color: C.cyan, fontWeight: 600 }}>{totalRouteNM.toFixed(1)} NM</span>
                    </div>
                    <button onClick={endNav} style={{ padding: isMobile ? '8px 14px' : '3px 10px', borderRadius: 6, background: C.red + '20', border: '1px solid ' + C.red + '40', color: C.red, fontSize: isMobile ? 12 : 11, fontWeight: 600, cursor: 'pointer', fontFamily: Fnt }}>End Nav</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', gap: isMobile ? 4 : 3 }}>
                      {[{ i: '\u25C0', fn: () => setRouteStep(Math.max(0, routeStep - 1)), d: !routeStep }, { i: playing ? '\u23F8' : '\u25B6', fn: () => setPlaying(!playing), p: true }, { i: '\u25B6', fn: () => setRouteStep(Math.min(curRoute.length - 1, routeStep + 1)), d: routeStep >= curRoute.length - 1 }, { i: '\u21BA', fn: () => { setRouteStep(0); setPlaying(false); } }].map((b, i) => <button key={i} onClick={b.fn} disabled={b.d} style={{ width: b.p ? (isMobile ? 48 : 40) : (isMobile ? 40 : 32), height: isMobile ? 40 : 32, borderRadius: isMobile ? 8 : 6, background: b.p ? (playing ? C.amber : C.cyan) : C.card2, border: `1px solid ${C.bdr}`, color: b.p ? C.bg : '#fff', cursor: b.d ? 'default' : 'pointer', opacity: b.d ? .4 : 1, fontFamily: Fnt, fontSize: isMobile ? 15 : 13 }}>{b.i}</button>)}
                    </div>
                    <div style={{ display: 'flex', gap: 3, flex: 1, justifyContent: 'center', overflow: 'hidden' }}>{curRoute.map((_, i) => <button key={i} onClick={() => setRouteStep(i)} style={{ width: i === routeStep ? (isMobile ? 20 : 18) : (isMobile ? 8 : 6), height: isMobile ? 8 : 6, borderRadius: isMobile ? 4 : 3, background: i < routeStep ? C.green : i === routeStep ? C.cyan : C.bdr, border: 'none', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} />)}</div>
                    <span style={{ fontSize: isMobile ? 12 : 11, color: C.dim, flexShrink: 0 }}>{routeStep + 1}/{curRoute.length}</span>
                  </div>
                </div>}
              </div>

              {/* RIGHT PANEL */}
              <div style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: C.card, borderTop: `2px solid ${C.bdr2}`, borderRadius: '16px 16px 0 0', maxHeight: mobilePanel === 'spot-detail' || mobilePanel === 'nav' ? '70vh' : '50vh', overflow: 'auto', transition: 'max-height 0.3s ease', boxShadow: '0 -4px 30px #000a', WebkitOverflowScrolling: 'touch' } : { display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isMobile && <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', position: 'sticky', top: 0, background: C.card, zIndex: 1, borderRadius: '16px 16px 0 0' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>}
                {selSpot ? <>
                  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.bdr}`, overflow: 'hidden' }}>
                    <div style={{ padding: 14, borderBottom: `1px solid ${C.bdr}`, background: `${sc(selSpot.type)}08` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: sc(selSpot.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{si(selSpot.type)}</div>
                          <div><div style={{ fontSize: 15, fontWeight: 700 }}>{selSpot.name}</div><div style={{ fontSize: 12, color: C.mid }}><StarI s={12} c={C.amber} filled /> {selSpot.rating} <Badge color={sc(selSpot.type)}>{selSpot.type}</Badge>{selSpot.userAdded && <Badge color={C.purple}>Custom</Badge>}</div></div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => toggleFavorite(selSpot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}><HeartI s={20} c={C.red} filled={favorites.includes(selSpot.id)} /></button>
                          <button onClick={() => { setSelSpot(null); setShowRoute(false); setMobilePanel(null); }} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 6 }}><XI s={18} /></button>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: 14, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.card2, borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                        <div><div style={{ fontSize: 9, color: C.dim }}>GPS</div><div style={{ fontFamily: FM, fontSize: 12 }}>{selSpot.gps.lat}, {selSpot.gps.lng}</div></div>
                        <button onClick={() => cpGPS(selSpot.gps)} style={{ padding: '4px 8px', borderRadius: 4, background: copied ? C.green : C.card, border: `1px solid ${C.bdr}`, color: copied ? '#fff' : C.mid, cursor: 'pointer', fontSize: 10, fontFamily: Fnt }}>{copied ? '\u2713' : 'Copy'}</button>
                      </div>
                      {distFromUser != null && <div style={{ background: `${C.blue}15`, borderRadius: 8, padding: '8px 10px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.blue}30` }}>
                        <LocI s={14} c={C.blue} />
                        <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>{distFromUser.toFixed(1)} NM from you</span>
                      </div>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>{selSpot.species.map((s) => <Badge key={s} color={C.teal}>{s}</Badge>)}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                        {[['Tide', selSpot.bestTide], ['Time', selSpot.bestTime], ['Season', selSpot.bestSeason], ['Wind', selSpot.bestWind]].map(([l, v]) => <div key={l} style={{ background: C.card2, borderRadius: 6, padding: '6px 8px' }}><div style={{ fontSize: 9, color: C.dim }}>{l}</div><div style={{ fontWeight: 600, fontSize: 11 }}>{v}</div></div>)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>{selSpot.lures.map((l) => <Badge key={l} color={C.cyan}>{l}</Badge>)}</div>
                      <p style={{ color: C.mid, lineHeight: 1.5, marginBottom: 12 }}>{selSpot.desc}</p>
                      {selSpot.media?.length > 0 && <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{selSpot.media.map((m, i) => <div key={i} style={{ flex: 1, background: C.card2, borderRadius: 8, padding: 8, border: `1px solid ${C.bdr}`, cursor: 'pointer' }}><div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>{m.type === 'video' ? '\uD83C\uDFA5' : '\uD83D\uDCF7'} {m.label}</div></div>)}</div>}
                      <Btn primary isMobile={isMobile} style={{ width: '100%' }} onClick={startNav}><NavI s={14} c={C.bg} /> Navigate from {BAY_HARBORS[selBay?.id]?.name || 'Harbor'} ({curRoute.length} waypoints, {totalRouteNM.toFixed(1)} NM)</Btn>
                    </div>
                  </div>
                  {showRoute && curWP && <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.cyan}40`, padding: 14 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.bg, fontWeight: 700, fontSize: 14 }}>{routeStep + 1}</div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{curWP.title}</div><div style={{ fontSize: 11, color: C.cyan }}>Depth: {curWP.depth}</div></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                      <div style={{ background: C.card2, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}><div style={{ fontSize: 9, color: C.dim }}>Bearing</div><div style={{ fontWeight: 700, fontSize: 12, color: C.cyan }}>{routeStep > 0 ? Math.round(curWP.brng) + '\u00B0 ' + curWP.brngLbl : '\u2014'}</div></div>
                      <div style={{ background: C.card2, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}><div style={{ fontSize: 9, color: C.dim }}>Leg Dist</div><div style={{ fontWeight: 700, fontSize: 12, color: C.teal }}>{routeStep > 0 ? curWP.dist.toFixed(1) + ' NM' : '\u2014'}</div></div>
                      <div style={{ background: C.card2, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}><div style={{ fontSize: 9, color: C.dim }}>Total</div><div style={{ fontWeight: 700, fontSize: 12, color: C.green }}>{curWP.cumDist.toFixed(1)} NM</div></div>
                    </div>
                    <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, marginBottom: 8 }}>{curWP.desc}</p>
                    {curWP.warnings?.length > 0 && <div style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}20`, borderRadius: 6, padding: 8 }}>{curWP.warnings.map((w, i) => <div key={i} style={{ fontSize: 11, color: C.amber }}>{'\u26A0'} {w}</div>)}</div>}
                  </div>}
                </> : <>
                  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.bdr}`, padding: 14 }}>
                    <Lbl>Fishing Spots ({filtered.length})</Lbl>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflow: 'auto' }}>
                      {filtered.map((s) => <button key={s.id} onClick={() => openSpot(s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: C.card2, border: `1px solid ${C.bdr}`, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: Fnt, color: C.txt }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: sc(s.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{si(s.type)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</div><div style={{ fontSize: 10, color: C.dim }}><StarI s={9} c={C.amber} filled /> {s.rating} {'\u2022'} {s.species.slice(0, 2).join(', ')}</div></div>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}><HeartI s={16} c={C.red} filled={favorites.includes(s.id)} /></button>
                      </button>)}
                    </div>
                  </div>
                  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.bdr}`, padding: 14 }}>
                    <Lbl>Recent Reports</Lbl>
                    {selBay.reports?.map((r, i) => <div key={i} style={{ background: C.card2, borderRadius: 8, padding: 8, marginBottom: 6, border: `1px solid ${C.bdr}` }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}><span style={{ fontWeight: 600, color: C.cyan }}>{r.user}</span><span style={{ color: C.dim }}>{r.time}</span></div><p style={{ fontSize: 11, color: C.mid, margin: 0, lineHeight: 1.4 }}>{r.text}</p></div>)}
                  </div>
                  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.bdr}`, padding: 14 }}>
                    <Lbl>Launch Points</Lbl>
                    {bayLaunches.map((l) => <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, background: C.card2, borderRadius: 8, marginBottom: 4, border: `1px solid ${C.bdr}` }}><span style={{ fontSize: 18 }}>{li(l.type)}</span><div><div style={{ fontSize: 12, fontWeight: 600 }}>{l.name}</div><div style={{ fontSize: 10, color: C.dim }}>{l.notes}</div></div></div>)}
                  </div>
                </>}
              </div>
            </div>
          </div>
        )}

        {/* BOATSHARE */}
        {showBS && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div><h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700 }}>BoatShare</h2><p style={{ color: C.mid, fontSize: isMobile ? 12 : 13 }}>Split gas, share the ride</p></div>
              <Btn primary isMobile={isMobile}><PlusI s={14} c={C.bg} /> Post Trip</Btn>
            </div>
            {!isMobile && <p style={{ color: C.dim, fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>These aren't guides \u2014 just regular fishermen with open spots on their boat. Chip in for gas, bring your gear (or not), and go fishing.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16 }}>
              {BOATSHARE_LISTINGS.map((l) => (
                <div key={l.id} style={{ background: C.card, borderRadius: isMobile ? 12 : 16, border: `1px solid ${C.bdr}`, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                    <div style={{ padding: isMobile ? 14 : 20, borderRight: isMobile ? 'none' : `1px solid ${C.bdr}`, borderBottom: isMobile ? `1px solid ${C.bdr}` : 'none' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: isMobile ? 10 : 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: C.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{l.avatar}</div>
                        <div><div style={{ fontSize: 17, fontWeight: 700 }}>{l.name}</div><div style={{ fontSize: 12, color: C.mid }}>{l.age} {'\u2022'} <StarI s={11} c={C.amber} filled /> {l.rating} {'\u2022'} {l.trips} trips</div></div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', background: C.card2, borderRadius: 8, marginBottom: 12 }}><AnchorI s={14} c={C.cyan} /><span style={{ fontSize: 13, fontWeight: 500 }}>{l.boat}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: C.mid, marginBottom: 14 }}>
                        <div style={{ background: C.card2, borderRadius: 6, padding: '6px 10px' }}>{'\uD83D\uDCC5'} {l.date}</div>
                        <div style={{ background: C.card2, borderRadius: 6, padding: '6px 10px' }}>{'\u23F0'} {l.time}</div>
                        <div style={{ background: C.card2, borderRadius: 6, padding: '6px 10px' }}>{'\uD83D\uDCCD'} {l.area}</div>
                        <div style={{ background: C.card2, borderRadius: 6, padding: '6px 10px' }}>{'\uD83D\uDE80'} {l.launch}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                        <div style={{ background: `${C.green}15`, borderRadius: 8, padding: '8px 14px', border: `1px solid ${C.green}30` }}><div style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>SPOTS OPEN</div><div style={{ fontSize: 20, fontWeight: 700 }}>{l.spotsOpen}</div></div>
                        <div style={{ background: `${C.cyan}10`, borderRadius: 8, padding: '8px 14px', border: `1px solid ${C.cyan}30` }}><div style={{ fontSize: 10, color: C.cyan, fontWeight: 700 }}>GAS SPLIT</div><div style={{ fontSize: 20, fontWeight: 700 }}>{l.gasSplit}</div></div>
                      </div>
                      <Btn primary isMobile={isMobile} style={{ width: '100%' }}>{'\uD83E\uDD19'} Request to Join</Btn>
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ marginBottom: 16 }}><Lbl>Looking For</Lbl><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${lfColor(l.lookingFor)}10`, borderRadius: 10, border: `1px solid ${lfColor(l.lookingFor)}25` }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: lfColor(l.lookingFor) }} /><div><div style={{ fontSize: 13, fontWeight: 600, color: lfColor(l.lookingFor) }}>{lfLabel(l.lookingFor)}</div><div style={{ fontSize: 11, color: C.mid, lineHeight: 1.4, marginTop: 2 }}>{l.lookingDesc}</div></div></div></div>
                      <div style={{ marginBottom: 16 }}><Lbl>The Plan</Lbl><p style={{ fontSize: 12, color: C.mid, lineHeight: 1.6, margin: 0 }}>{l.plan}</p></div>
                      <div style={{ marginBottom: 16 }}><Lbl>The Vibe</Lbl><div style={{ background: C.card2, borderRadius: 10, padding: 12, border: `1px solid ${C.bdr}` }}><p style={{ fontSize: 12, color: C.txt, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>{'\u201C'}{l.vibe}{'\u201D'}</p></div></div>
                      <div><Lbl>Rules / Need to Know</Lbl><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{l.rules.map((r) => <span key={r} style={{ padding: '4px 10px', borderRadius: 6, background: C.card2, fontSize: 11, color: C.mid, border: `1px solid ${C.bdr}` }}>{r}</span>)}</div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showSettings && <Modal title="Settings" sub="API keys & preferences" onClose={() => setShowSettings(false)} isMobile={isMobile}>
        <div style={{ marginBottom: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><KeyI s={16} c={C.cyan} /><span style={{ fontWeight: 700 }}>Claude API Key</span></div>
        <Inp label="API Key" isMobile={isMobile} type="password" placeholder="sk-ant-..." value={settings.claudeApiKey} onChange={(e) => setSettings({ ...settings, claudeApiKey: e.target.value })} />
        <div style={{ background: `${C.cyan}08`, borderRadius: 10, padding: 12, border: `1px solid ${C.cyan}20` }}><p style={{ fontSize: 11, color: C.mid, margin: 0, lineHeight: 1.5 }}>Powers the AI Advisor. Analyzes conditions against your spots. Get yours at console.anthropic.com</p></div></div>
        <Btn primary isMobile={isMobile} style={{ width: '100%' }} onClick={() => { showT('Settings saved'); setShowSettings(false); }}><SaveI s={14} c={C.bg} /> Save</Btn>
      </Modal>}

      {showAI && <Modal title="AI Fishing Advisor" sub="Powered by Claude" onClose={() => setShowAI(false)} isMobile={isMobile}>{!settings.claudeApiKey ? <div style={{ textAlign: 'center', padding: '20px 0' }}><SparkI s={40} c={C.dim} /><h3 style={{ marginTop: 12 }}>API Key Required</h3><p style={{ fontSize: 13, color: C.mid, marginTop: 6, marginBottom: 16 }}>Add your Claude API key in Settings.</p><Btn primary isMobile={isMobile} onClick={() => { setShowAI(false); setShowSettings(true); }}><KeyI s={14} c={C.bg} /> Open Settings</Btn></div> :
        <div><div style={{ background: C.card2, borderRadius: 10, padding: 12, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}><div><div style={{ color: C.dim }}>Wind</div><div style={{ fontWeight: 600 }}>{weather.wind} mph {weather.windDir}</div></div><div><div style={{ color: C.dim }}>Tide</div><div style={{ fontWeight: 600 }}>{tide.status}</div></div><div><div style={{ color: C.dim }}>Water</div><div style={{ fontWeight: 600 }}>{weather.waterTemp}\u00B0F</div></div></div>
        <div style={{ background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`, borderRadius: 12, padding: 14, marginBottom: 14 }}><div style={{ fontSize: 10, textTransform: 'uppercase', color: C.cyan, fontWeight: 700, marginBottom: 6 }}>{'\uD83C\uDFAF'} Top Pick Today</div><div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Shell Island Flats</div><p style={{ fontSize: 12, color: C.mid, lineHeight: 1.6, margin: 0 }}>SE wind pushes bait onto shell pads. Incoming tide floods grass edges \u2014 reds will feed aggressively.</p></div>
        <div style={{ background: C.card2, borderRadius: 10, padding: 12, marginBottom: 14 }}><div style={{ fontSize: 10, textTransform: 'uppercase', color: C.teal, fontWeight: 700, marginBottom: 6 }}>{'\uD83C\uDFA3'} Lure Strategy</div><p style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, margin: 0 }}>She Dog topwater at dawn. Bass Assassin 4&quot; on 1/8oz when wind picks up. Gold spoon for tailers.</p></div>
        <div style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}20`, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 10, textTransform: 'uppercase', color: C.amber, fontWeight: 700, marginBottom: 6 }}>{'\u26A0\uFE0F'} Avoid Today</div><p style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, margin: 0 }}>Open bay flats \u2014 choppy at 12+ mph SE. Stick to protected shell areas.</p></div></div>}
      </Modal>}

      {showEditor && <Modal title="Map Editor Pro" sub="Add spots, launches, zones \u2014 saved to your device" onClose={() => { setShowEditor(false); }} wide isMobile={isMobile}>
        <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: C.green }}>
          All changes you make here are automatically saved to your device. Close this editor and use Edit mode on the map to add markers by right-clicking (or long-pressing on mobile).
        </div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 8 }}>You have {allSpots.filter((s) => s.userAdded).length} custom spots, {launches.filter((l) => l.userAdded).length} custom launches, {shadeZones.filter((z) => z.userAdded).length} custom zones, {wadeLines.filter((w) => w.userAdded).length} custom wade lines saved.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn small isMobile={isMobile} onClick={() => { const gpx = generateGPX(allSpots.filter((s) => s.bay === (selBay?.id || 'matagorda')), bayConfig, selBay?.id || 'matagorda', generateRoute); downloadFile(gpx, 'texastides-spots.gpx'); showT('GPX exported!'); }}><DownloadI s={12} /> Export GPX</Btn>
          <Btn small isMobile={isMobile} onClick={() => { const json = JSON.stringify(allSpots, null, 2); downloadFile(json, 'texastides-spots.json', 'application/json'); showT('JSON exported'); }}><DownloadI s={12} /> Export JSON</Btn>
          <Btn small danger isMobile={isMobile} onClick={() => { setAllSpots(DEFAULT_SPOTS); setLaunches(DEFAULT_LAUNCHES); setShadeZones(DEFAULT_SHADE_ZONES); setWadeLines(DEFAULT_WADE_LINES); setCommunityPhotos(DEFAULT_PHOTOS); showT('Reset to defaults'); }}><TrashI s={12} /> Reset All</Btn>
        </div>
      </Modal>}

      {/* MOBILE FLOATING BUTTONS */}
      {isMobile && page === 'bay' && selBay && !selSpot && !mobilePanel && !editMode && <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 35, display: 'flex', gap: 8 }}>
        <button onClick={() => setMobilePanel('spots')} style={{ padding: '12px 20px', borderRadius: 24, background: `linear-gradient(135deg,${C.cyan},${C.teal})`, color: C.bg, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: Fnt, boxShadow: '0 4px 20px #06b6d440', display: 'flex', alignItems: 'center', gap: 6 }}><PinI s={16} c={C.bg} /> {filtered.length} Spots</button>
        <button onClick={handleLocateMe} style={{ width: 48, height: 48, borderRadius: 24, background: geo.position ? C.blue : C.card, border: `1px solid ${geo.position ? C.blue : C.bdr}`, color: geo.position ? '#fff' : C.cyan, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px #0006' }}><LocI s={20} /></button>
        <button onClick={() => setShowAI(true)} style={{ width: 48, height: 48, borderRadius: 24, background: C.card, border: `1px solid ${C.bdr}`, color: C.cyan, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px #0006' }}><SparkI s={20} c={C.cyan} /></button>
      </div>}

      {/* MOBILE SPOT LIST SHEET */}
      {isMobile && mobilePanel === 'spots' && !selSpot && <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45, background: C.card, borderTop: `2px solid ${C.bdr2}`, borderRadius: '16px 16px 0 0', maxHeight: '60vh', overflow: 'auto', boxShadow: '0 -4px 30px #000a', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ position: 'sticky', top: 0, background: C.card, zIndex: 1, borderRadius: '16px 16px 0 0', padding: '8px 14px 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Fishing Spots ({filtered.length})</div>
            <button onClick={() => setMobilePanel(null)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 4 }}><XI s={18} /></button>
          </div>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <SearchI s={14} c={C.dim} style={{ position: 'absolute', left: 10, top: 12 }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search spots, species, lures..." style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 8, background: C.card2, border: `1px solid ${C.bdr}`, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none' }} />
          </div>
        </div>
        <div style={{ padding: '0 14px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((s) => <button key={s.id} onClick={() => { openSpot(s); setMobilePanel('spot-detail'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: C.card2, border: `1px solid ${C.bdr}`, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: Fnt, color: C.txt }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: sc(s.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{si(s.type)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}><StarI s={10} c={C.amber} filled /> {s.rating} {'\u2022'} {s.species.slice(0, 2).join(', ')}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}><HeartI s={18} c={C.red} filled={favorites.includes(s.id)} /></button>
          </button>)}
        </div>
      </div>}

      {/* MOBILE EDIT MODE HINT */}
      {isMobile && editMode && !ctxMenu && <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 35, background: C.amber, color: C.bg, padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 20px #f59e0b40', fontFamily: Fnt }}>Long-press map to add marker</div>}

      {toast && <div style={{ position: 'fixed', bottom: isMobile ? 80 : 24, left: '50%', transform: 'translateX(-50%)', background: C.green, color: '#fff', padding: isMobile ? '12px 24px' : '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px #0008', display: 'flex', alignItems: 'center', gap: 6 }}>{'\u2713'} {toast}</div>}

      <style>{`
        * { box-sizing:border-box; margin:0; -webkit-tap-highlight-color: transparent; }
        body { background:${C.bg}; overscroll-behavior: none; }
        html { touch-action: manipulation; }
        button { transition:all 0.15s; -webkit-touch-callout: none; }
        button:hover { filter:brightness(1.08); }
        button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:${C.bdr2}; border-radius:3px; }
        input, select, textarea { font-size: 16px !important; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 #3b82f640; } 50% { box-shadow: 0 0 0 12px #3b82f600; } }
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
