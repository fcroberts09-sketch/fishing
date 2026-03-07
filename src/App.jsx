import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Tooltip, Polyline, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';

// Modular imports
import { C, Fnt, FM, sc, si, li } from './utils/theme';
import { haversineNM, calcBearing, bearingLabel, parseDMS, parseDecimal, parseGPS, formatGPS } from './utils/geo';
import { extractPhotoGPS, generateGPX, parseGPXFile, downloadFile } from './utils/gps';
import { DEFAULT_SPOTS } from './data/spots';
import { BAY_CONFIGS, BAY_DATA, DEFAULT_SHADE_ZONES, DEFAULT_LAUNCHES, DEFAULT_WADE_LINES, DEFAULT_PHOTOS, DEFAULT_DEPTH_MARKERS, DEFAULT_SAND_BARS, DEFAULT_SHELL_PADS, generateRoute, itemToLatLng, zoneToLatLng } from './data/bays';
import { FitBounds, EditModeZoomControl, MapClickHandler, FlyToLocation, MapStabilizer, spotIcon, launchIcon, photoIcon, waypointIcon, harborIcon, userLocationIcon, zoneCenterIcon, wadePointIcon, depthMarkerIcon, shellPadIcon, resizeHandleIcon, sandBarPointIcon, castDistLabel, depthColor, windArrowIcon, baitShopIcon, marinaIcon, kayakLaunchIcon, areaLabelIcon } from './components/MapHelpers';
import { KAYAK_LAUNCHES, BOAT_RAMPS, BAIT_SHOPS, MARINAS, BAY_AREA_LABELS, generateWindArrows, generateWaveMarkers } from './data/pois';
import { FishI, WindI, WaveI, SunI, PinI, UsrI, NavI, StarI, XI, ChkI, PlusI, GearI, CamI, ImgI, SparkI, AnchorI, ArrowLI, EditI, TrashI, SaveI, KeyI, UploadI, MapEdI, ThermI, TargetI, CopyI, DownloadI, SearchI, LayerI, MoveI, UndoI, ClockI, HeartI, LocI, DepthI, ShellI, SandI, EyeI, EyeOffI, MinusI } from './components/Icons';
import { Btn, Lbl, Inp, Sel, Badge, Modal } from './components/UI';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useGeolocation } from './hooks/useGeolocation';
import { useIsMobile } from './hooks/useIsMobile';
import { useConditions } from './hooks/useConditions';

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
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPhotoUp, setShowPhotoUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [edTab, setEdTab] = useState('spots');
  const [toast, setToast] = useState(null);

  // ─── PERSISTED STATE (localStorage) ───
  const [allSpots, setAllSpots] = useLocalStorage('tt_spots5', DEFAULT_SPOTS);
  const [launches, setLaunches] = useLocalStorage('tt_launches6', DEFAULT_LAUNCHES);
  const [shadeZones, setShadeZones] = useLocalStorage('tt_zones4', DEFAULT_SHADE_ZONES);
  const [wadeLines, setWadeLines] = useLocalStorage('tt_wadelines5', DEFAULT_WADE_LINES);
  const [communityPhotos, setCommunityPhotos] = useLocalStorage('tt_photos4', DEFAULT_PHOTOS);
  const [favorites, setFavorites] = useLocalStorage('tt_favorites', []);
  const [settings, setSettings] = useLocalStorage('tt_settings', { claudeApiKey: '', autoAI: true, units: 'imperial' });
  const [depthMarkers, setDepthMarkers] = useLocalStorage('tt_depth4', DEFAULT_DEPTH_MARKERS);
  const [sandBars, setSandBars] = useLocalStorage('tt_sandbars4', DEFAULT_SAND_BARS);
  const [shellPads, setShellPads] = useLocalStorage('tt_shellpads4', DEFAULT_SHELL_PADS);
  const [mapLayers, setMapLayers] = useLocalStorage('tt_layers6', { wadeLines: true, wadeZones: false, castRange: false, depthMarkers: false, sandBars: false, shellPads: false, spots: true, launches: true, photos: false, kayakLaunches: false, baitShops: false, marinas: false, areaLabels: false, windArrows: true, noaaCharts: true });
  const [customPOIs, setCustomPOIs] = useLocalStorage('tt_custom_pois', []);
  const [savedRoutes, setSavedRoutes] = useLocalStorage('tt_saved_routes', {});
  const [editingRoute, setEditingRoute] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [drawingPolygon, setDrawingPolygon] = useState(null);

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
    else if (last.type === 'depth') setDepthMarkers((p) => [...p, last.data]);
    else if (last.type === 'sandbar') setSandBars((p) => [...p, last.data]);
    else if (last.type === 'shellpad') setShellPads((p) => [...p, last.data]);
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
  const [newSpotDraft, setNewSpotDraft] = useState({ name: '', type: 'wade', species: [], bestTide: 'Incoming', bestTime: '', lures: [], desc: '', lat: 0, lng: 0 });
  const [photoGPS, setPhotoGPS] = useState(null);
  const [newShade, setNewShade] = useState({ type: 'wade', label: '', cx: 50, cy: 50, rx: 8, ry: 5 });
  const [newLaunch, setNewLaunch] = useState({ name: '', type: 'boat', gps: '', notes: '' });
  const [spotNotes, setSpotNotes] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [editPopup, setEditPopup] = useState(null);
  const [drawingLine, setDrawingLine] = useState(null);
  const dragJustEnded = useRef(false);

  // ─── MOBILE WAYPOINT EDITING ───
  const [waypointSheet, setWaypointSheet] = useState(null); // { type, id, data }
  const [movingWaypoint, setMovingWaypoint] = useState(null); // { type, id, originalLat, originalLng }
  const [pendingEdits, setPendingEdits] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  const editPanelRef = useRef(null);

  // ─── LIVE CONDITIONS (NOAA tides + Open-Meteo weather + Moon + Reports) ───
  const cond = useConditions(selBay?.id || 'matagorda');
  const weather = cond.weather || { temp: '--', windSpeed: 0, windDir: 0, windDirLabel: '--', windGusts: 0, conditions: 'Loading...', conditionIcon: '\u26C5' };
  const tide = useMemo(() => {
    if (!cond.tides) return { status: 'Loading...', next: '--', todayTides: [], tomorrowTides: [], dailyTides: [] };
    const t = cond.tides;
    const todayTides = t.todayTides || [];
    const tomorrowTides = t.tomorrowTides || [];
    const dailyTides = t.dailyTides || [];
    // Compute swing = difference between today's high and low tide heights
    const highs = todayTides.filter(p => p.type === 'high').map(p => p.height);
    const lows = todayTides.filter(p => p.type === 'low').map(p => p.height);
    const dayHigh = highs.length ? Math.max(...highs) : null;
    const dayLow = lows.length ? Math.min(...lows) : null;
    const swing = dayHigh != null && dayLow != null ? Math.abs(dayHigh - dayLow) : null;
    return {
      status: t.tideState === 'incoming' ? 'Incoming' : t.tideState === 'outgoing' ? 'Outgoing' : 'Slack',
      next: t.nextTide ? `${t.nextTide.type === 'high' ? 'High' : 'Low'} at ${t.nextTide.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '--',
      height: t.currentHeight,
      observedHeight: t.observedHeight,
      observedTime: t.observedTime,
      strength: t.tideStrength,
      swing,
      todayTides,
      tomorrowTides,
      dailyTides,
    };
  }, [cond.tides]);
  const [showConditions, setShowConditions] = useState(false);
  const [showReports, setShowReports] = useState(false);

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
  const bayDepthMarkers = depthMarkers.filter((d) => d.bay === (selBay?.id || 'matagorda'));
  const baySandBars = sandBars.filter((s) => s.bay === (selBay?.id || 'matagorda'));
  const bayShellPads = shellPads.filter((s) => s.bay === (selBay?.id || 'matagorda'));

  // ─── FAVORITES ───
  const toggleFavorite = (spotId) => {
    setFavorites((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]
    );
  };

  // ─── NAVIGATION ROUTE ───
  const routeKey = selSpot && selBay ? `${selBay.id}_${selSpot.id}` : null;
  const [routeStartPicker, setRouteStartPicker] = useState(false); // show start point picker

  // Compute route with bearing/distance for each waypoint
  const computeRouteStats = useCallback((wps) => {
    return wps.map((wp, i, arr) => {
      let dist = 0, brng = 0, brngLbl = '';
      if (i > 0) {
        dist = haversineNM(arr[i - 1].lat, arr[i - 1].lng, wp.lat, wp.lng);
        brng = calcBearing(arr[i - 1].lat, arr[i - 1].lng, wp.lat, wp.lng);
        brngLbl = bearingLabel(brng);
      }
      return { ...wp, dist, brng, brngLbl, cumDist: 0 };
    });
  }, []);

  const curRoute = useMemo(() => {
    if (!selSpot || !selBay) return [];
    // Use saved route if available
    if (routeKey && savedRoutes[routeKey]) {
      return computeRouteStats(savedRoutes[routeKey]);
    }
    // Default: simple 2-point route from Matagorda Harbor to destination
    const [sLat, sLng] = itemToLatLng(selSpot, bayConfig);
    // Hardcoded Matagorda Harbor coords as guaranteed fallback
    const HARBOR = { lat: 28.694112, lng: -95.957777, name: 'Matagorda Harbor' };
    const harbor = launches.find((l) => l.name === 'Matagorda Harbor');
    const startLat = harbor?.lat || HARBOR.lat;
    const startLng = harbor?.lng || HARBOR.lng;
    const startName = harbor?.name || HARBOR.name;
    const route = generateRoute(startLat, startLng, startName, sLat, sLng, selSpot.name);
    return computeRouteStats(route);
  }, [selSpot, selBay, bayConfig, routeKey, savedRoutes, launches, computeRouteStats]);

  useMemo(() => { let cum = 0; curRoute.forEach((wp) => { cum += wp.dist; wp.cumDist = cum; }); }, [curRoute]);

  // Save route to localStorage
  const saveRoute = useCallback((wps) => {
    if (!routeKey) return;
    const toSave = (wps || curRoute).map((wp) => ({ lat: wp.lat, lng: wp.lng, title: wp.title, desc: wp.desc || '', depth: wp.depth || '', warnings: wp.warnings || [] }));
    setSavedRoutes((prev) => ({ ...prev, [routeKey]: toSave }));
  }, [routeKey, curRoute, setSavedRoutes]);

  const saveCurrentRoute = useCallback(() => {
    saveRoute();
    setEditingRoute(false);
    showT('Route saved!');
  }, [saveRoute]);

  // Update a single waypoint field and auto-save
  const updateRouteWaypoint = useCallback((idx, field, value) => {
    if (!routeKey) return;
    const base = savedRoutes[routeKey] || curRoute.map((wp) => ({ lat: wp.lat, lng: wp.lng, title: wp.title, desc: wp.desc || '', depth: wp.depth || '', warnings: wp.warnings || [] }));
    const updated = base.map((wp, i) => i === idx ? { ...wp, [field]: value } : wp);
    setSavedRoutes((prev) => ({ ...prev, [routeKey]: updated }));
  }, [routeKey, savedRoutes, curRoute, setSavedRoutes]);

  // Handle drag of route waypoint
  const handleRouteWaypointDrag = useCallback((idx, e) => {
    const { lat, lng } = e.target.getLatLng();
    if (!routeKey) return;
    const base = savedRoutes[routeKey] || curRoute.map((wp) => ({ lat: wp.lat, lng: wp.lng, title: wp.title, desc: wp.desc || '', depth: wp.depth || '', warnings: wp.warnings || [] }));
    const updated = base.map((wp, i) => i === idx ? { ...wp, lat, lng } : wp);
    setSavedRoutes((prev) => ({ ...prev, [routeKey]: updated }));
  }, [routeKey, savedRoutes, curRoute, setSavedRoutes]);

  // Add a new waypoint after the current step
  const addRouteWaypoint = useCallback(() => {
    if (!routeKey || !curRoute.length) return;
    const base = savedRoutes[routeKey] || curRoute.map((wp) => ({ lat: wp.lat, lng: wp.lng, title: wp.title, desc: wp.desc || '', depth: wp.depth || '', warnings: [] }));
    const insertAfter = Math.min(routeStep, base.length - 1);
    const prevWp = base[insertAfter];
    const nextWp = base[insertAfter + 1] || base[insertAfter];
    const newWp = {
      lat: (prevWp.lat + nextWp.lat) / 2,
      lng: (prevWp.lng + nextWp.lng) / 2,
      title: 'Waypoint ' + (insertAfter + 2),
      desc: 'New waypoint',
      depth: '',
      warnings: [],
    };
    const updated = [...base.slice(0, insertAfter + 1), newWp, ...base.slice(insertAfter + 1)];
    setSavedRoutes((prev) => ({ ...prev, [routeKey]: updated }));
    setRouteStep(insertAfter + 1);
  }, [routeKey, savedRoutes, curRoute, routeStep, setSavedRoutes]);

  // Delete a waypoint (can't delete first or last)
  const deleteRouteWaypoint = useCallback((idx) => {
    if (!routeKey || curRoute.length <= 2) return;
    if (idx === 0 || idx === curRoute.length - 1) { showT("Can't delete start/end point"); return; }
    const base = savedRoutes[routeKey] || curRoute.map((wp) => ({ lat: wp.lat, lng: wp.lng, title: wp.title, desc: wp.desc || '', depth: wp.depth || '', warnings: [] }));
    const updated = base.filter((_, i) => i !== idx);
    setSavedRoutes((prev) => ({ ...prev, [routeKey]: updated }));
    if (routeStep >= idx && routeStep > 0) setRouteStep(routeStep - 1);
  }, [routeKey, savedRoutes, curRoute, routeStep, setSavedRoutes]);

  // Change route start point
  const setRouteStart = useCallback((lat, lng, name) => {
    if (!routeKey) return;
    const base = savedRoutes[routeKey] || curRoute.map((wp) => ({ lat: wp.lat, lng: wp.lng, title: wp.title, desc: wp.desc || '', depth: wp.depth || '', warnings: [] }));
    const updated = [{ ...base[0], lat, lng, title: name, desc: 'Starting point' }, ...base.slice(1)];
    setSavedRoutes((prev) => ({ ...prev, [routeKey]: updated }));
    setRouteStartPicker(false);
    showT('Start point updated!');
  }, [routeKey, savedRoutes, curRoute, setSavedRoutes]);
  const totalRouteNM = curRoute.length > 0 ? curRoute[curRoute.length - 1]?.cumDist || 0 : 0;
  const curWP = curRoute[routeStep];

  // ─── DISTANCE FROM USER ───
  const distFromUser = useMemo(() => {
    if (!geo.position || !selSpot || !selBay) return null;
    const [lat, lng] = itemToLatLng(selSpot, bayConfig);
    return haversineNM(geo.position.lat, geo.position.lng, lat, lng);
  }, [geo.position, selSpot, selBay, bayConfig]);

  // ─── GPS & POSITION HELPERS ───
  const gpsToPosition = (lat, lng) => {
    const y = ((28.85 - lat) / 0.32) * 100;
    const x = ((lng + 96.18) / 0.62) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const latLngToPosition = (lat, lng) => {
    const bc = BAY_CONFIGS[selBay?.id] || BAY_CONFIGS.matagorda;
    const refLat = 28.85;
    const refLng = -96.18;
    const spanLat = 0.32;
    const spanLng = 0.62;
    const y = ((refLat - lat) / spanLat) * 100;
    const x = ((lng - refLng) / spanLng) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const posToGPS = (pos) => {
    const [lat, lng] = bayConfig.toLatLng(pos);
    return { lat, lng, str: lat.toFixed(5) + ', ' + lng.toFixed(5) };
  };

  const posToGPSStr = (pos) => {
    let lat, lng;
    if (pos && pos.lat != null && pos.lng != null) { lat = pos.lat; lng = pos.lng; }
    else { [lat, lng] = bayConfig.toLatLng(pos); }
    return { lat: Math.abs(lat).toFixed(4) + '\u00B0' + (lat >= 0 ? 'N' : 'S'), lng: Math.abs(lng).toFixed(4) + '\u00B0' + (lng <= 0 ? 'W' : 'E') };
  };

  const shadeToPolygon = (z) => {
    const pts = [];
    const center = zoneToLatLng(z, bayConfig);
    const rLat = z.radiusLat || (z.ry != null ? (z.ry / 100) * 0.14 : 0.008);
    const rLng = z.radiusLng || (z.rx != null ? (z.rx / 100) * 0.20 : 0.015);
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      pts.push([center[0] + Math.sin(a) * rLat, center[1] + Math.cos(a) * rLng]);
    }
    return pts;
  };

  const getCastLineOffsets = (pts, rangeMeters) => {
    if (pts.length < 2) return { left: [], right: [] };
    const coords = pts.map((p) => itemToLatLng(p, bayConfig));
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
    if (selSpot) return null; // Don't re-fit when viewing a single spot
    if (filtered.length >= 2) return filtered.map((s) => itemToLatLng(s, bayConfig));
    return null;
  }, [showRoute, routeCoords, filtered, bayConfig, selSpot]);

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
    else if (type === 'depth') data = depthMarkers.find((d) => d.id === id);
    else if (type === 'sandbar') data = sandBars.find((sb) => sb.id === id);
    else if (type === 'shellpad') data = shellPads.find((sp) => sp.id === id);
    if (data) {
      if (!data.userAdded) { showT('Built-in spot \u2014 cannot edit'); return; }
      setEditPopup({ type, id, data: { ...data } }); setCtxMenu(null);
    }
  }, [allSpots, launches, shadeZones, wadeLines, communityPhotos, depthMarkers, sandBars, shellPads]);

  const handleMapRightClick = (e) => {
    e.originalEvent.preventDefault();
    if (drawingLine) {
      const pt = { lat: e.latlng.lat, lng: e.latlng.lng };
      setDrawingLine((prev) => ({ ...prev, points: [...prev.points, pt] }));
      showT('Point ' + (drawingLine.points.length + 1) + ' added');
      return;
    }
    if (drawingPolygon) {
      const pt = { lat: e.latlng.lat, lng: e.latlng.lng };
      setDrawingPolygon((prev) => ({ ...prev, points: [...prev.points, pt] }));
      showT('Point ' + (drawingPolygon.points.length + 1) + ' added');
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
    const lat = ctxMenu.lat;
    const lng = ctxMenu.lng;
    const gps = posToGPSStr({ lat, lng });
    const id = Date.now();
    const bay = selBay?.id || 'matagorda';
    if (type === 'wade-line') {
      setDrawingLine({ points: [{ lat, lng }], label: 'New Wade Line' });
      setCtxMenu(null);
      showT('Wade line started! Right-click map to add points.');
      return;
    }
    if (type === 'wade-zone') {
      const newZ = { id, type: 'wade', label: 'New Wade Zone', lat, lng, radiusLat: 0.006, radiusLng: 0.012, color: C.amber, bay, userAdded: true };
      setShadeZones((prev) => [...prev, newZ]);
      setEditPopup({ type: 'zone', id, data: newZ });
      setCtxMenu(null);
      return;
    }
    if (type === 'depth') {
      const newD = { id, bay, lat, lng, depth: 3, bottomType: 'sand', note: '', userAdded: true };
      setDepthMarkers((prev) => [...prev, newD]);
      setEditPopup({ type: 'depth', id, data: newD });
      setCtxMenu(null);
      return;
    }
    if (type === 'sand-bar') {
      setDrawingPolygon({ points: [{ lat, lng }], label: 'New Sand Bar' });
      setCtxMenu(null);
      showT('Sand bar started! Right-click to add points.');
      return;
    }
    if (type.startsWith('shell-')) {
      const st = type.replace('shell-', '');
      const newSP = { id, bay, lat, lng, shellType: st, radius: 5, label: '', note: '', userAdded: true };
      setShellPads((prev) => [...prev, newSP]);
      setEditPopup({ type: 'shellpad', id, data: newSP });
      setCtxMenu(null);
      return;
    }
    if (type.startsWith('launch-')) {
      const lt = type.replace('launch-', '');
      const newL = { id, name: 'New Launch', type: lt, lat, lng, notes: '', bay, userAdded: true };
      setLaunches((prev) => [...prev, newL]);
      setEditPopup({ type: 'launch', id, data: newL });
    } else {
      const newS = { id, bay, name: 'New Spot', type, lat, lng, rating: 0, species: [], bestTide: 'Any', bestTime: '', bestSeason: '', bestWind: '', lures: [], desc: '', media: [], userAdded: true };
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

  const handleFinishSandBar = () => {
    if (!drawingPolygon || drawingPolygon.points.length < 3) { showT('Need at least 3 points'); return; }
    const id = Date.now();
    const sb = { id, bay: selBay?.id || 'matagorda', label: drawingPolygon.label || 'Sand Bar', points: drawingPolygon.points, depth: '1-3', note: '', userAdded: true };
    setSandBars((prev) => [...prev, sb]);
    setEditPopup({ type: 'sandbar', id, data: sb });
    setDrawingPolygon(null);
    showT('Sand bar saved!');
  };

  const handleMarkerDragEnd = (markerType, id, e) => {
    dragJustEnded.current = true;
    setTimeout(() => { dragJustEnded.current = false; }, 300);
    const ll = e.target.getLatLng();
    const newLat = ll.lat;
    const newLng = ll.lng;
    const gpsStr = newLat.toFixed(5) + ', ' + newLng.toFixed(5);
    if (markerType === 'spot') {
      setAllSpots((prev) => prev.map((s) => s.id === id ? { ...s, lat: newLat, lng: newLng } : s));
      if (selSpot?.id === id) setSelSpot((prev) => prev ? { ...prev, lat: newLat, lng: newLng } : prev);
    } else if (markerType === 'launch') {
      setLaunches((prev) => prev.map((l) => l.id === id ? { ...l, lat: newLat, lng: newLng } : l));
    } else if (markerType === 'photo') {
      setCommunityPhotos((prev) => prev.map((p) => p.id === id ? { ...p, lat: newLat, lng: newLng } : p));
    } else if (markerType === 'zone-center') {
      setShadeZones((prev) => prev.map((z) => z.id === id ? { ...z, lat: newLat, lng: newLng } : z));
    } else if (markerType === 'wade-pt') {
      setWadeLines((prev) => prev.map((wl) => wl.id === id.lineId ? { ...wl, points: wl.points.map((p, i) => i === id.ptIndex ? { lat: newLat, lng: newLng } : p) } : wl));
    } else if (markerType === 'depth') {
      setDepthMarkers((prev) => prev.map((d) => d.id === id ? { ...d, lat: newLat, lng: newLng } : d));
    } else if (markerType === 'shellpad') {
      setShellPads((prev) => prev.map((sp) => sp.id === id ? { ...sp, lat: newLat, lng: newLng } : sp));
    } else if (markerType === 'sandbar-pt') {
      setSandBars((prev) => prev.map((sb) => sb.id === id.barId ? { ...sb, points: sb.points.map((p, i) => i === id.ptIndex ? { lat: newLat, lng: newLng } : p) } : sb));
    } else if (markerType === 'zone-resize') {
      const z = shadeZones.find((z) => z.id === id.zoneId);
      if (z) {
        const center = zoneToLatLng(z, bayConfig);
        if (id.dir === 'n' || id.dir === 's') {
          const newR = Math.max(0.002, Math.abs(newLat - center[0]));
          setShadeZones((prev) => prev.map((zone) => zone.id === id.zoneId ? { ...zone, radiusLat: newR } : zone));
        } else {
          const newR = Math.max(0.003, Math.abs(newLng - center[1]));
          setShadeZones((prev) => prev.map((zone) => zone.id === id.zoneId ? { ...zone, radiusLng: newR } : zone));
        }
      }
    }
    if (editPopup) {
      if (markerType === 'spot' && editPopup.type === 'spot' && editPopup.id === id) {
        setEditPopup((prev) => ({ ...prev, data: { ...prev.data, lat: newLat, lng: newLng } }));
      } else if (markerType === 'launch' && editPopup.type === 'launch' && editPopup.id === id) {
        setEditPopup((prev) => ({ ...prev, data: { ...prev.data, lat: newLat, lng: newLng } }));
      } else if (markerType === 'zone-center' && editPopup.type === 'zone' && editPopup.id === id) {
        setEditPopup((prev) => ({ ...prev, data: { ...prev.data, lat: newLat, lng: newLng } }));
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
  const updateDepthMarker = (id, field, value) => { setDepthMarkers((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d)); };
  const updateSandBar = (id, field, value) => { setSandBars((prev) => prev.map((sb) => sb.id === id ? { ...sb, [field]: value } : sb)); };
  const updateShellPad = (id, field, value) => { setShellPads((prev) => prev.map((sp) => sp.id === id ? { ...sp, [field]: value } : sp)); };

  const toggleLayer = (layer) => { setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] })); };

  const shellTypeLabel = (t) => ({ scattered: 'Scattered Shell', heavy: 'Heavy Shell Pad', reef: 'Oyster Reef' }[t] || t);
  const shellColor = (t) => ({ scattered: C.amber, heavy: '#ff8c00', reef: '#ef4444' }[t] || C.amber);
  const shellDash = (t) => ({ scattered: '6 6', heavy: '3 3', reef: '' }[t] || '6 6');

  const handleDeleteMarker = (markerType, id) => {
    let data = null;
    if (markerType === 'spot') data = allSpots.find((s) => s.id === id);
    else if (markerType === 'launch') data = launches.find((l) => l.id === id);
    else if (markerType === 'zone') data = shadeZones.find((z) => z.id === id);
    else if (markerType === 'wadeline') data = wadeLines.find((w) => w.id === id);
    else if (markerType === 'photo') data = communityPhotos.find((p) => p.id === id);
    else if (markerType === 'depth') data = depthMarkers.find((d) => d.id === id);
    else if (markerType === 'sandbar') data = sandBars.find((sb) => sb.id === id);
    else if (markerType === 'shellpad') data = shellPads.find((sp) => sp.id === id);
    if (data) setUndoStack((prev) => [...prev.slice(-9), { type: markerType, data }]);
    if (markerType === 'spot') { setAllSpots((prev) => prev.filter((s) => s.id !== id)); if (selSpot?.id === id) setSelSpot(null); }
    else if (markerType === 'launch') setLaunches((prev) => prev.filter((l) => l.id !== id));
    else if (markerType === 'zone') setShadeZones((prev) => prev.filter((z) => z.id !== id));
    else if (markerType === 'wadeline') setWadeLines((prev) => prev.filter((w) => w.id !== id));
    else if (markerType === 'photo') setCommunityPhotos((prev) => prev.filter((p) => p.id !== id));
    else if (markerType === 'depth') setDepthMarkers((prev) => prev.filter((d) => d.id !== id));
    else if (markerType === 'sandbar') setSandBars((prev) => prev.filter((sb) => sb.id !== id));
    else if (markerType === 'shellpad') setShellPads((prev) => prev.filter((sp) => sp.id !== id));
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
    if (type === 'depth') return depthMarkers.find((d) => d.id === id);
    if (type === 'sandbar') return sandBars.find((sb) => sb.id === id);
    if (type === 'shellpad') return shellPads.find((sp) => sp.id === id);
    return null;
  }, [editPopup, allSpots, launches, shadeZones, wadeLines, communityPhotos, depthMarkers, sandBars, shellPads]);

  const editData = editPopup ? (getEditData() || editPopup.data) : null;
  const getEditGPS = () => {
    const d = editData;
    if (!d) return '';
    if (d.lat != null && d.lng != null) return d.lat.toFixed(5) + ', ' + d.lng.toFixed(5);
    if (d.position) { const [la, lo] = bayConfig.toLatLng(d.position); return la.toFixed(5) + ', ' + lo.toFixed(5); }
    if (d.cx != null) { const [la, lo] = bayConfig.toLatLng({ x: d.cx, y: d.cy }); return la.toFixed(5) + ', ' + lo.toFixed(5); }
    return '';
  };

  const handleDropPin = () => {
    let coords;
    if (gpsInput.format === 'dms') coords = parseDMS(gpsInput.dms);
    else coords = { lat: parseFloat(gpsInput.lat), lng: parseFloat(gpsInput.lng) };
    if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
      const pos = gpsToPosition(coords.lat, coords.lng);
      setNewSpotDraft({ ...newSpotDraft, lat: coords.lat, lng: coords.lng });
      showT('Pin dropped: ' + coords.lat.toFixed(4) + ', ' + coords.lng.toFixed(4));
    } else showT('Invalid GPS coordinates');
  };

  const showT = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const cpGPS = (g) => { navigator.clipboard?.writeText(`${g.lat}, ${g.lng}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const openBay = (id) => { setSelBay(BAY_DATA[id]); setPage('bay'); setSelSpot(null); setShowRoute(false); setSpotFilter('all'); setSearchQuery(''); };
  const openSpot = useCallback((s) => { setSelSpot(s); setShowRoute(false); setRouteStep(0); setMobilePanel('spot-detail'); }, []);
  const endNav = () => { setShowRoute(false); setRouteStep(0); setPlaying(false); setTripActive(false); setMobilePanel(null); setEditingRoute(false); };
  const startNav = () => { setShowRoute(true); setRouteStep(0); setPlaying(false); setTripActive(true); setTripStart(Date.now()); setMobilePanel('nav'); };

  // ─── MOBILE WAYPOINT EDITING CALLBACKS ───
  const handleWaypointLongPress = useCallback((type, id) => {
    let data = null;
    if (type === 'spot') data = allSpots.find((s) => s.id === id);
    else if (type === 'launch') data = launches.find((l) => l.id === id);
    if (data) {
      setWaypointSheet({ type, id, data: { ...data } });
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, [allSpots, launches]);

  const handleWaypointMove = useCallback(() => {
    if (!waypointSheet) return;
    const { type, id, data } = waypointSheet;
    setMovingWaypoint({ type, id, originalLat: data.lat, originalLng: data.lng });
    setWaypointSheet(null);
    setPendingEdits(true);
    showT('Drag marker to new position');
  }, [waypointSheet]);

  const handleWaypointRename = useCallback(() => {
    if (!waypointSheet || !renameInput.trim()) return;
    const { type, id } = waypointSheet;
    if (type === 'spot') {
      setAllSpots((prev) => prev.map((s) => s.id === id ? { ...s, name: renameInput.trim() } : s));
    } else if (type === 'launch') {
      setLaunches((prev) => prev.map((l) => l.id === id ? { ...l, name: renameInput.trim() } : l));
    }
    setPendingEdits(true);
    setWaypointSheet(null);
    setRenameInput('');
    showT('Renamed!');
  }, [waypointSheet, renameInput]);

  const handleWaypointDelete = useCallback(() => {
    if (!waypointSheet) return;
    const { type, id, data } = waypointSheet;
    setUndoStack((prev) => [...prev, { type, data }]);
    if (type === 'spot') {
      setAllSpots((prev) => prev.filter((s) => s.id !== id));
      if (selSpot?.id === id) setSelSpot(null);
    } else if (type === 'launch') {
      setLaunches((prev) => prev.filter((l) => l.id !== id));
    }
    setWaypointSheet(null);
    setPendingEdits(true);
    showT('Deleted — tap Undo to restore');
  }, [waypointSheet, selSpot]);

  const handleWaypointNavigate = useCallback(() => {
    if (!waypointSheet) return;
    const spot = allSpots.find((s) => s.id === waypointSheet.id);
    if (spot) {
      openSpot(spot);
      setWaypointSheet(null);
    }
  }, [waypointSheet, allSpots, openSpot]);

  const handleSavePendingEdits = useCallback(() => {
    setPendingEdits(false);
    setMovingWaypoint(null);
    showT('Changes saved');
  }, []);

  const handleCancelPendingEdits = useCallback(() => {
    if (movingWaypoint) {
      const { type, id, originalLat, originalLng } = movingWaypoint;
      if (type === 'spot') {
        setAllSpots((prev) => prev.map((s) => s.id === id ? { ...s, lat: originalLat, lng: originalLng } : s));
      } else if (type === 'launch') {
        setLaunches((prev) => prev.map((l) => l.id === id ? { ...l, lat: originalLat, lng: originalLng } : l));
      }
      setMovingWaypoint(null);
    }
    setPendingEdits(false);
    showT('Changes cancelled');
  }, [movingWaypoint]);

  const fetchAIRecommendation = async () => {
    if (!settings.claudeApiKey) return;
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);
    const bayName = selBay?.name || 'Matagorda Bay';
    const allBaySpots = allSpots.filter(s => !s.type || s.type !== 'launch');
    const spotsInfo = allBaySpots.map(s => `${s.name} (${s.type}, lat:${s.lat}, lng:${s.lng}, species: ${(s.species || []).join('/')}, bestTide: ${s.bestTide}, bestWind: ${s.bestWind}, bestTime: ${s.bestTime}, bestSeason: ${s.bestSeason}, lures: ${(s.lures || []).join('/')}, desc: ${s.desc})`).join('\n');
    const prompt = `You are an expert Texas coastal fishing guide specializing in Matagorda Bay. Analyze the current conditions and ALL available fishing spots to recommend the TOP 2 spots to fish RIGHT NOW.

CURRENT CONDITIONS:
- Wind: ${weather.windSpeed} mph from ${weather.windDirLabel || 'unknown'} (gusts ${weather.windGusts} mph)
- Temperature: ${weather.temp}°F, feels like ${weather.feelsLike}°F
- Tide: ${tide.status || 'unknown'}, Current level: ${tide.height != null ? tide.height.toFixed(1) + ' ft' : 'unknown'}
- Next tide: ${tide.next || 'unknown'}
- Today's tides: ${(tide.todayTides || []).map(t => `${t.type} at ${t.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} (${t.height > 0 ? '+' : ''}${t.height.toFixed(1)} ft)`).join(', ') || 'unknown'}
- Tide swing: ${tide.swing != null ? tide.swing.toFixed(1) + ' ft' : 'unknown'}
- Moon: ${cond.moon.name} (${cond.moon.illumination}% illumination)
- Date/Time: ${new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}

ALL FISHING SPOTS:
${spotsInfo || 'No spots loaded'}

IMPORTANT - LURE RECOMMENDATIONS:
- For soft plastics, ALWAYS recommend specific Down South Lure Co. colors. Down South makes paddle tail soft plastics popular on the Texas coast.
- Match color to water clarity: Dirty/stained water = darker colors (Midnight Magic, Black Gold, Plum Jelly, LSU). Clear water = natural colors (Opening Night, Saltwater Assassin, Cajun Cricket, Pearl). Moderate clarity = bright colors (Limetreuse, Electric Chicken, Pumpkinseed Chartreuse).
- For topwater, recommend She Dog, Spook Jr, or Skitter Walk with color tips.
- For gold spoon, recommend size (1/4 oz vs 1/2 oz) based on wind and depth.

Respond in this exact JSON format (no markdown, no code fences, just raw JSON):
{
  "spot1": { "name": "exact spot name from list", "reason": "2-3 sentences why this is the #1 pick given current wind, tide, and conditions" },
  "spot2": { "name": "exact spot name from list", "reason": "2-3 sentences why this is the #2 pick" },
  "lures": "3-4 sentences covering specific Down South Lure colors to throw, topwater recommendations, and gold spoon advice for today's conditions. Be specific on color names.",
  "strategy": "2-3 sentences on how to work the tide and wind today. When to fish where, how to position relative to wind.",
  "avoid": "1-2 sentences on what to avoid and why",
  "tide_tip": "1 sentence on timing your session around the tide schedule"
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${res.status}`);
      }
      const data = await res.json();
      let text = data.content?.[0]?.text || '';
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsed = JSON.parse(text);
      setAiResponse(parsed);
    } catch (e) {
      setAiError(e.message || 'Failed to get recommendation');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) { showT('Geolocation not supported on this device'); return; }
    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      showT('Location requires HTTPS. Please use https:// URL.');
      return;
    }
    geo.requestLocation();
    setFlyToUser(true);
    showT('Getting your location...');
    // Check for result after delays
    const checkResult = (delay) => {
      setTimeout(() => {
        if (geo.position) return; // success
        if (geo.error) showT(geo.error);
        else if (delay < 15000) showT('Still trying... make sure Location Services is enabled.');
      }, delay);
    };
    checkResult(5000);
    checkResult(15000);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, cursor: 'pointer' }} onClick={() => { setPage('home'); setSelBay(null); setSelSpot(null); endNav(); setMobilePanel(null); }}>
            <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: isMobile ? 8 : 10, background: `linear-gradient(135deg,${C.cyan},${C.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FishI s={isMobile ? 16 : 20} c="#0b1220" /></div>
            <div><div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700 }}>TEXAS<span style={{ color: C.cyan }}>TIDES</span></div>{!isMobile && <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.1em' }}>COASTAL FISHING GUIDE</div>}</div>
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 2 : 4, alignItems: 'center' }}>
            {tripActive && <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: isMobile ? '4px 8px' : '5px 12px', borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}40`, marginRight: 4 }}><ClockI s={13} c={C.green} /><span style={{ fontSize: 11, fontWeight: 700, color: C.green, fontFamily: FM }}>{tripElapsed}</span></div>}
            {!isMobile && <div style={{ width: 1, height: 24, background: C.bdr, margin: '0 4px' }} />}
            {undoStack.length > 0 && <button onClick={handleUndo} style={{ padding: isMobile ? '6px 8px' : '7px 10px', borderRadius: 8, background: `${C.amber}20`, border: `1px solid ${C.amber}40`, color: C.amber, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }} title="Undo last delete"><UndoI s={14} c={C.amber} /></button>}
            <button onClick={() => setShowEditor(true)} style={{ padding: isMobile ? '6px 8px' : '7px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: C.mid, cursor: 'pointer' }} title="Map Editor"><MapEdI s={16} /></button>
            <button onClick={() => setShowSettings(true)} style={{ padding: isMobile ? '6px 8px' : '7px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: C.mid, cursor: 'pointer' }} title="Settings"><GearI s={16} /></button>
          </div>
        </div>
      </header>

      {/* WEATHER BAR - LIVE DATA */}
      <div style={{ background: `${C.card}99`, borderBottom: `1px solid ${C.bdr}`, padding: isMobile ? '4px 8px' : '7px 20px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, fontSize: isMobile ? 11 : 12, overflowX: isMobile ? 'auto' : 'visible', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><ThermI s={13} c={C.amber} /> {weather.temp}{'°F'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><WindI s={13} c={C.cyan} /> {weather.windSpeed} mph {weather.windDirLabel}{!isMobile && ` (gusts ${weather.windGusts})`}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: tide.status === 'Incoming' ? C.cyan : tide.status === 'Outgoing' ? C.amber : C.mid }}><WaveI s={13} c={tide.status === 'Incoming' ? C.cyan : tide.status === 'Outgoing' ? C.amber : C.mid} /> {tide.status}{tide.height != null ? ` ${tide.height > 0 ? '+' : ''}${tide.height.toFixed(1)}ft` : ''}{tide.swing != null ? ` (${tide.swing.toFixed(1)}ft swing)` : ''}</span>
          <span style={{ flexShrink: 0 }}>{cond.moon.icon} {!isMobile ? cond.moon.name : ''}</span>
          {!isMobile && <span style={{ color: C.mid }}>{weather.conditionIcon} {weather.conditions}</span>}
          <button onClick={() => setShowConditions(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: C.card2, border: `1px solid ${C.bdr}`, color: C.cyan, cursor: 'pointer', fontFamily: Fnt, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{cond.loading ? '\u23F3' : '\uD83C\uDF0A'} {isMobile ? '' : 'Conditions'}</button>
          <button onClick={() => setShowReports(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: C.card2, border: `1px solid ${C.bdr}`, color: C.green, cursor: 'pointer', fontFamily: Fnt, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{'\uD83D\uDCCB'} {isMobile ? '' : 'Reports'}</button>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '4px 4px 0' : 20 }}>
        {/* HOME */}
        {page === 'home' && (
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
                    <img src={`https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/10/${bay.id === 'san_antonio' ? '409/254' : '410/254'}.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.background = '#0c4a6e'; }} />
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
        {page === 'bay' && selBay && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, marginBottom: isMobile ? 4 : 14 }}>
              <button onClick={() => { setPage('home'); setSelBay(null); setSelSpot(null); setMobilePanel(null); }} style={{ padding: isMobile ? '4px 8px' : '5px 10px', borderRadius: 6, background: C.card, border: `1px solid ${C.bdr}`, color: C.mid, cursor: 'pointer', fontFamily: Fnt, fontSize: isMobile ? 11 : 12, display: 'flex', alignItems: 'center', gap: 3 }}><ArrowLI s={12} /> {isMobile ? '' : 'Back'}</button>
              <div style={{ flex: 1, minWidth: 0 }}><h2 style={{ fontSize: isMobile ? 14 : 20, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selBay.name}</h2>{!isMobile && <p style={{ fontSize: 12, color: C.mid }}>{selBay.sub} \u2014 HD Satellite</p>}</div>
              {!isMobile && <div style={{ display: 'flex', gap: 4 }}>
                <Btn small isMobile={isMobile} onClick={handleLocateMe}><LocI s={13} c={C.cyan} /></Btn>
                <Btn small primary isMobile={isMobile} onClick={() => setShowAI(true)}><SparkI s={13} c={C.bg} /> AI</Btn>
              </div>}
            </div>

            {/* SEARCH BAR - desktop only, mobile has bottom sheet */}
            {!isMobile && <div style={{ marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <SearchI s={14} c={C.dim} style={{ position: 'absolute', left: 12, top: 11 }} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search spots, species, lures..." style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, background: C.card, border: `1px solid ${C.bdr}`, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} />
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: 9, background: 'none', border: 'none', color: C.dim, cursor: 'pointer' }}><XI s={16} /></button>}
              </div>
            </div>}

            {/* FILTER CHIPS - desktop only */}
            <div style={{ display: isMobile ? 'none' : 'flex', gap: 4, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {[{ id: 'all', l: 'All', i: '\uD83D\uDCCD' }, { id: 'favorites', l: 'Saved', i: '\u2764\uFE0F' }, { id: 'wade', l: 'Wade', i: '\uD83D\uDEB6' }, { id: 'boat', l: 'Boat', i: '\uD83D\uDEA4' }, { id: 'kayak', l: 'Kayak', i: '\uD83D\uDEF6' }].map((f) => <button key={f.id} onClick={() => setSpotFilter(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: isMobile ? '8px 14px' : '5px 12px', borderRadius: 6, fontSize: isMobile ? 12 : 11, fontWeight: 600, background: spotFilter === f.id ? (f.id === 'favorites' ? C.red : C.cyan) : C.card, color: spotFilter === f.id ? C.bg : C.mid, border: `1px solid ${spotFilter === f.id ? (f.id === 'favorites' ? C.red : C.cyan) : C.bdr}`, cursor: 'pointer', fontFamily: Fnt, flexShrink: 0 }}>{f.i} {f.l}{f.id === 'favorites' ? ` (${favorites.filter((fid) => baySpots.some((s) => s.id === fid)).length})` : ''}</button>)}
            </div>

            <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: isMobile ? 0 : 14 }}>
              {/* SATELLITE MAP */}
              <div style={{ background: C.card, borderRadius: isMobile && selSpot ? 0 : isMobile ? 0 : 14, border: editMode ? '2px solid ' + C.amber : isMobile ? 'none' : '1px solid ' + C.bdr, overflow: 'hidden', position: isMobile && selSpot ? 'fixed' : 'relative', ...(isMobile && selSpot ? { inset: 0, zIndex: 30 } : {}) }}>
                <div style={{ padding: isMobile ? '4px 8px' : '10px 14px', borderBottom: isMobile && selSpot ? 'none' : `1px solid ${C.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...(isMobile && selSpot ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1100, background: `${C.bg}cc`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}) }}>
                  <div style={{ flex: 1, minWidth: 0 }}>{!isMobile && <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{showRoute ? 'Route \u2192 ' + selSpot?.name : editMode ? 'Edit Mode' : 'Satellite Map'}</div>}{!isMobile && <div style={{ fontSize: 11, color: editMode ? C.amber : C.dim }}>{editMode ? 'Right-click: add marker \u2022 Click: edit \u2022 Drag: move' : 'HD Satellite / Google / USGS'}</div>}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={handleLocateMe} style={{ padding: isMobile ? '6px 10px' : '5px 10px', borderRadius: 6, fontSize: 11, background: geo.position ? `${C.blue}20` : C.card2, border: `1px solid ${geo.position ? C.blue : C.bdr}`, color: geo.position ? C.blue : C.mid, cursor: 'pointer', fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }} title="My Location"><LocI s={13} /></button>
                    <button onClick={() => setShowLayerPanel(!showLayerPanel)} style={{ padding: isMobile ? '6px 10px' : '5px 10px', borderRadius: 6, fontSize: 11, background: showLayerPanel ? `${C.cyan}20` : C.card2, border: `1px solid ${showLayerPanel ? C.cyan : C.bdr}`, color: showLayerPanel ? C.cyan : C.mid, cursor: 'pointer', fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }} title="Toggle Layers"><LayerI s={13} /></button>
                    {editMode && undoStack.length > 0 && <button onClick={handleUndo} style={{ padding: isMobile ? '6px 10px' : '5px 10px', borderRadius: 6, fontSize: 11, background: `${C.blue}20`, border: `1px solid ${C.blue}40`, color: C.blue, cursor: 'pointer', fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }} title="Undo"><UndoI s={13} c={C.blue} /></button>}
                    {!(isMobile && selSpot && !editMode) && <button onClick={() => { setEditMode(!editMode); setCtxMenu(null); setEditPopup(null); setMovingWaypoint(null); setPendingEdits(false); }} style={{ padding: isMobile ? '6px 10px' : '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: editMode ? C.amber : C.card2, color: editMode ? C.bg : C.mid, border: `1px solid ${editMode ? C.amber : C.bdr}`, cursor: 'pointer', fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }}><EditI s={13} /> {editMode ? 'Done' : 'Edit'}</button>}
                    {showRoute && <button onClick={() => { setShowRoute(false); setRouteStep(0); setPlaying(false); if (isMobile) setMobilePanel(null); }} style={{ fontSize: 11, color: C.mid, background: C.card2, border: `1px solid ${C.bdr}`, borderRadius: 5, padding: isMobile ? '6px 10px' : '4px 10px', cursor: 'pointer', fontFamily: Fnt }}>{'\u2190'} Map</button>}
                    {isMobile && selSpot && <button onClick={() => { setSelSpot(null); setShowRoute(false); setRouteStep(0); setPlaying(false); setMobilePanel(null); setEditingRoute(false); }} style={{ width: 36, height: 36, borderRadius: 18, background: `${C.bg}dd`, border: `1px solid ${C.bdr}`, color: C.txt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: Fnt, backdropFilter: 'blur(4px)' }}><XI s={16} /></button>}
                  </div>
                </div>

                {showLayerPanel && <div style={{ position: 'absolute', top: isMobile ? 90 : 48, right: isMobile ? 8 : 52, zIndex: 1100, background: C.card, border: `1px solid ${C.bdr2}`, borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px #000a', minWidth: 180 }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Map Layers</div>
                  {[
                    { key: 'noaaCharts', label: 'Charts', icon: '\uD83D\uDDFA\uFE0F', color: '#22d3ee' },
                    { key: 'areaLabels', label: 'Area Names', icon: '\uD83C\uDF0D', color: '#7dd3fc' },
                    { key: 'windArrows', label: 'Wind Direction', icon: '\uD83D\uDCA8', color: '#94a3b8' },
                    { key: 'kayakLaunches', label: 'Kayak Launches', icon: '\uD83D\uDEF6', color: C.teal },
                    { key: 'baitShops', label: 'Bait Shops', icon: '\uD83C\uDFE3', color: '#16a34a' },
                    { key: 'marinas', label: 'Harbors/Marinas', icon: '\u2693', color: '#0284c7' },
                    { key: 'wadeLines', label: 'Wade Lines', icon: '\uD83C\uDFA3', color: C.amber },
                    { key: 'castRange', label: 'Cast Range', icon: '\uD83C\uDFAF', color: C.amber },
                    { key: 'wadeZones', label: 'Wade Zones', icon: '\uD83D\uDDFA', color: C.amber },
                    { key: 'depthMarkers', label: 'Depth Markers', icon: '\uD83D\uDCCF', color: C.blue },
                    { key: 'sandBars', label: 'Sand Bars', icon: '\uD83C\uDFD6', color: '#d4a574' },
                    { key: 'shellPads', label: 'Shell Pads', icon: '\uD83D\uDC1A', color: C.amber },
                    { key: 'spots', label: 'Fishing Spots', icon: '\uD83D\uDCCD', color: C.cyan },
                    { key: 'launches', label: 'Launches', icon: '\u2693', color: C.teal },
                    { key: 'photos', label: 'Photos', icon: '\uD83D\uDCF7', color: C.purple },
                  ].map((layer) => (
                    <button key={layer.key} onClick={() => toggleLayer(layer.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, fontFamily: Fnt }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${mapLayers[layer.key] ? layer.color : C.dim}`, background: mapLayers[layer.key] ? layer.color + '30' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>{mapLayers[layer.key] ? '\u2713' : ''}</div>
                      <span style={{ fontSize: 12, color: mapLayers[layer.key] ? C.txt : C.dim, fontWeight: 500 }}>{layer.icon} {layer.label}</span>
                    </button>
                  ))}
                </div>}

                <div style={{ height: isMobile && selSpot ? '100%' : isMobile ? 'calc(100vh - 140px)' : 500, position: 'relative', minHeight: isMobile ? 400 : 400 }}>
                  <MapContainer center={bayConfig.center} zoom={bayConfig.zoom} style={{ height: '100%', width: '100%' }} zoomControl={!isMobile} key={selBay.id} tap={false} tapTolerance={15} touchZoom={true} maxZoom={20} minZoom={9} inertia={true} inertiaDeceleration={3000} inertiaMaxSpeed={1500} easeLinearity={0.25} bounceAtZoomLimits={false} wheelPxPerZoomLevel={120} zoomSnap={0} zoomDelta={1}>
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="HD Satellite">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} attribution="Esri" updateWhenZooming={false} updateWhenIdle={true} keepBuffer={4} />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Google Satellite">
                        <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" maxZoom={20} attribution="Google" updateWhenZooming={false} updateWhenIdle={true} keepBuffer={4} />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Google Hybrid">
                        <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" maxZoom={20} attribution="Google" updateWhenZooming={false} updateWhenIdle={true} keepBuffer={4} />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="USGS Aerial">
                        <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}" maxZoom={16} attribution="USGS" updateWhenZooming={false} updateWhenIdle={true} keepBuffer={4} />
                      </LayersControl.BaseLayer>
                    </LayersControl>

                    {mapLayers.noaaCharts && <TileLayer url="https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png" maxZoom={18} opacity={0.55} attribution="NOAA" zIndex={10} />}

                    <MapStabilizer />
                    {routeBounds && <FitBounds bounds={routeBounds} />}
                    {flyToUser && geo.position && <FlyToLocation position={geo.position} />}
                    <EditModeZoomControl editMode={editMode} />
                    <MapClickHandler onRightClick={handleMapRightClick} onLeftClick={handleMapLeftClick} editMode={editMode} isMobile={isMobile} />

                    {/* USER LOCATION */}
                    {geo.position && <>
                      <Marker position={[geo.position.lat, geo.position.lng]} icon={userLocationIcon()}>
                        <Tooltip>You are here ({geo.position.accuracy?.toFixed(0) || '?'}m accuracy)</Tooltip>
                      </Marker>
                      <Circle center={[geo.position.lat, geo.position.lng]} radius={geo.position.accuracy || 100} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }} />
                    </>}

                    {/* Shade zones */}
                    {mapLayers.wadeZones && !showRoute && bayShades.map((z) => (
                      <Polygon key={z.id} positions={shadeToPolygon(z)} pathOptions={{ color: z.color, weight: editMode ? 2.5 : 1.5, dashArray: editMode ? '' : '6 4', fillColor: z.color, fillOpacity: editMode ? 0.2 : 0.12 }} eventHandlers={{ click: () => { if (editMode) selectForEdit('zone', z.id); } }}>
                        <Tooltip>{z.label}{editMode ? ' (click to edit)' : ''}</Tooltip>
                      </Polygon>
                    ))}

                    {editMode && mapLayers.wadeZones && !showRoute && bayShades.map((z) => {
                      const zc = zoneToLatLng(z, bayConfig);
                      const rLat = z.radiusLat || (z.ry != null ? (z.ry / 100) * 0.14 : 0.008);
                      const rLng = z.radiusLng || (z.rx != null ? (z.rx / 100) * 0.20 : 0.015);
                      return <React.Fragment key={'zc' + z.id}>
                        <Marker position={zc} icon={zoneCenterIcon(z.color)} draggable={true} eventHandlers={{ click: () => selectForEdit('zone', z.id), dragend: (e) => handleMarkerDragEnd('zone-center', z.id, e) }}>
                          <Tooltip>Drag to move {z.label}</Tooltip>
                        </Marker>
                        {[
                          { dir: 'n', pos: [zc[0] + rLat, zc[1]] },
                          { dir: 's', pos: [zc[0] - rLat, zc[1]] },
                          { dir: 'e', pos: [zc[0], zc[1] + rLng] },
                          { dir: 'w', pos: [zc[0], zc[1] - rLng] },
                        ].map((h) => (
                          <Marker key={`rh-${z.id}-${h.dir}`} position={h.pos} icon={resizeHandleIcon()} draggable={true} eventHandlers={{ dragend: (e) => handleMarkerDragEnd('zone-resize', { zoneId: z.id, dir: h.dir }, e) }}>
                            <Tooltip>Drag to resize</Tooltip>
                          </Marker>
                        ))}
                      </React.Fragment>;
                    })}

                    {/* Wade lines with cast envelopes */}
                    {mapLayers.wadeLines && !showRoute && bayWadeLines.map((wl) => {
                      const lineCoords = wl.points.map((p) => itemToLatLng(p, bayConfig));
                      const castMeters = (wl.castRange || 40) * 0.9144;
                      const cast = getCastLineOffsets(wl.points, castMeters);
                      const castEnvelope = cast.left.length > 1 ? [...cast.left, ...cast.right.slice().reverse()] : [];
                      const midIdx = Math.floor(lineCoords.length / 2);
                      const midPt = lineCoords[midIdx] || lineCoords[0];
                      return <React.Fragment key={'wl' + wl.id}>
                        <Polyline positions={lineCoords} pathOptions={{ color: wl.color, weight: 3, opacity: 0.9 }} eventHandlers={{ click: () => { if (editMode) selectForEdit('wadeline', wl.id); } }}>
                          <Tooltip><b>{wl.label}</b><br/>{wl.castRange || 40}yd cast | {wl.bottomType || 'unknown'} bottom{wl.direction ? ' | Wade ' + wl.direction : ''}{editMode ? '\nClick to edit' : ''}</Tooltip>
                        </Polyline>
                        {mapLayers.castRange && castEnvelope.length > 2 && <Polygon positions={castEnvelope} pathOptions={{ color: wl.color, weight: 0.5, opacity: 0.3, fillColor: wl.color, fillOpacity: 0.1, dashArray: '4 6' }} />}
                        {mapLayers.castRange && cast.left.length > 1 && <Polyline positions={cast.left} pathOptions={{ color: wl.color, weight: 1, opacity: 0.3, dashArray: '4 6' }} />}
                        {mapLayers.castRange && cast.right.length > 1 && <Polyline positions={cast.right} pathOptions={{ color: wl.color, weight: 1, opacity: 0.3, dashArray: '4 6' }} />}
                        {mapLayers.castRange && midPt && <Marker position={midPt} icon={castDistLabel(wl.castRange || 40)} interactive={false} />}
                        {wl.direction && midPt && <Marker position={midPt} icon={L.divIcon({ className: '', html: `<div style="background:${wl.color};color:#000;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;margin-top:14px;white-space:nowrap;pointer-events:none">\u2192 ${wl.direction}</div>`, iconSize: [30, 14], iconAnchor: [15, -4] })} interactive={false} />}
                        {editMode && wl.points.map((pt, pi) => (
                          <Marker key={'wlp' + wl.id + '-' + pi} position={itemToLatLng(pt, bayConfig)} icon={wadePointIcon()} draggable={true} eventHandlers={{ dragend: (e) => handleMarkerDragEnd('wade-pt', { lineId: wl.id, ptIndex: pi }, e) }}>
                            <Tooltip>Point {pi + 1}/{wl.points.length} - drag to move</Tooltip>
                          </Marker>
                        ))}
                      </React.Fragment>;
                    })}

                    {/* Drawing line preview */}
                    {drawingLine && drawingLine.points.length > 0 && <>
                      <Polyline positions={drawingLine.points.map((p) => itemToLatLng(p, bayConfig))} pathOptions={{ color: C.green, weight: 3, dashArray: '8 4' }} />
                      {drawingLine.points.map((pt, i) => (
                        <Marker key={'draw' + i} position={itemToLatLng(pt, bayConfig)} icon={wadePointIcon()}>
                          <Tooltip>Point {i + 1}</Tooltip>
                        </Marker>
                      ))}
                    </>}

                    {/* Drawing polygon preview (sand bars) */}
                    {drawingPolygon && drawingPolygon.points.length > 0 && <>
                      {drawingPolygon.points.length >= 3 && <Polygon positions={drawingPolygon.points.map((p) => itemToLatLng(p, bayConfig))} pathOptions={{ color: '#d4a574', weight: 2, dashArray: '6 4', fillColor: '#d4a574', fillOpacity: 0.15 }} />}
                      {drawingPolygon.points.length < 3 && <Polyline positions={drawingPolygon.points.map((p) => itemToLatLng(p, bayConfig))} pathOptions={{ color: '#d4a574', weight: 2, dashArray: '6 4' }} />}
                      {drawingPolygon.points.map((pt, i) => (
                        <Marker key={'drawp' + i} position={itemToLatLng(pt, bayConfig)} icon={sandBarPointIcon()}>
                          <Tooltip>Point {i + 1}</Tooltip>
                        </Marker>
                      ))}
                    </>}

                    {/* Depth markers */}
                    {mapLayers.depthMarkers && !showRoute && bayDepthMarkers.map((d) => (
                      <Marker key={'dm' + d.id} position={itemToLatLng(d, bayConfig)} icon={depthMarkerIcon(d.depth, d.bottomType, isMobile)} draggable={editMode} eventHandlers={{ click: () => { if (editMode) selectForEdit('depth', d.id); }, dragend: (e) => handleMarkerDragEnd('depth', d.id, e) }}>
                        <Tooltip><b>{d.depth}ft</b> - {d.bottomType}{d.note ? ` | ${d.note}` : ''}{editMode ? '\nClick to edit' : ''}</Tooltip>
                      </Marker>
                    ))}

                    {/* Sand bars */}
                    {mapLayers.sandBars && !showRoute && baySandBars.map((sb) => (
                      <React.Fragment key={'sb' + sb.id}>
                        <Polygon positions={sb.points.map((p) => itemToLatLng(p, bayConfig))} pathOptions={{ color: '#d4a574', weight: 2, fillColor: '#d4a574', fillOpacity: editMode ? 0.25 : 0.18, dashArray: editMode ? '' : '6 4' }} eventHandlers={{ click: () => { if (editMode) selectForEdit('sandbar', sb.id); } }}>
                          <Tooltip><b>{sb.label}</b><br/>Depth: {sb.depth}ft{sb.note ? ` | ${sb.note}` : ''}{editMode ? '\nClick to edit' : ''}</Tooltip>
                        </Polygon>
                        {editMode && sb.points.map((pt, pi) => (
                          <Marker key={'sbp' + sb.id + '-' + pi} position={itemToLatLng(pt, bayConfig)} icon={sandBarPointIcon()} draggable={true} eventHandlers={{ dragend: (e) => handleMarkerDragEnd('sandbar-pt', { barId: sb.id, ptIndex: pi }, e) }}>
                            <Tooltip>Sand bar point {pi + 1} - drag to move</Tooltip>
                          </Marker>
                        ))}
                      </React.Fragment>
                    ))}

                    {/* Shell pads */}
                    {mapLayers.shellPads && !showRoute && bayShellPads.map((sp) => (
                      <React.Fragment key={'sp' + sp.id}>
                        <Circle center={itemToLatLng(sp, bayConfig)} radius={sp.radius * 80} pathOptions={{ color: shellColor(sp.shellType), weight: 1.5, fillColor: shellColor(sp.shellType), fillOpacity: editMode ? 0.2 : 0.12, dashArray: shellDash(sp.shellType) }} />
                        <Marker position={itemToLatLng(sp, bayConfig)} icon={shellPadIcon(sp.shellType, isMobile)} draggable={editMode} eventHandlers={{ click: () => { if (editMode) selectForEdit('shellpad', sp.id); }, dragend: (e) => handleMarkerDragEnd('shellpad', sp.id, e) }}>
                          <Tooltip><b>{sp.label || shellTypeLabel(sp.shellType)}</b>{sp.note ? `\n${sp.note}` : ''}{editMode ? '\nClick to edit | Drag to move' : ''}</Tooltip>
                        </Marker>
                      </React.Fragment>
                    ))}

                    {/* Launch markers */}
                    {mapLayers.launches && !showRoute && bayLaunches.map((l) => (
                      <Marker key={`l${l.id}`} position={itemToLatLng(l, bayConfig)} icon={launchIcon(l.type, isMobile)} draggable={editMode} eventHandlers={{ click: () => { if (editMode) selectForEdit('launch', l.id); }, dragend: (e) => handleMarkerDragEnd('launch', l.id, e) }}>
                        <Tooltip><b>{l.name}</b><br />{editMode ? 'Drag to move \u2022 Click to edit' : l.notes}</Tooltip>
                      </Marker>
                    ))}

                    {/* Photo markers */}
                    {mapLayers.photos && !showRoute && bayPhotos.map((p) => (
                      <Marker key={`p${p.id}`} position={itemToLatLng(p, bayConfig)} icon={photoIcon(isMobile)} draggable={editMode} eventHandlers={{ click: () => { if (editMode) selectForEdit('photo', p.id); }, dragend: (e) => handleMarkerDragEnd('photo', p.id, e) }}>
                        {!editMode && <Popup><b>{p.caption}</b><br /><span style={{ fontSize: 11 }}>by {p.user} \u2022 {p.time}</span></Popup>}
                        {editMode && <Tooltip>Drag to move - Click to edit</Tooltip>}
                      </Marker>
                    ))}

                    {/* Route */}
                    {showRoute && routeCoords.length > 0 && <>
                      <Polyline positions={routeCoords} pathOptions={{ color: '#ffffff', weight: 5, opacity: 0.4 }} />
                      <Polyline positions={routeCoords} pathOptions={{ color: '#00C4D4', weight: 3, dashArray: '10 8', opacity: 0.8, className: 'route-dash-animate' }} />
                      {routeStep > 0 && <Polyline positions={routeCoords.slice(0, routeStep + 1)} pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.9 }} />}
                      <Marker position={routeCoords[0]} icon={harborIcon(isMobile)} draggable={editingRoute} eventHandlers={{ click: () => setRouteStep(0), dragend: editingRoute ? (e) => handleRouteWaypointDrag(0, e) : undefined }}><Tooltip><b>{curRoute[0]?.title || 'Launch'}</b><br />{editingRoute ? 'Drag to move' : 'Starting point'}</Tooltip></Marker>
                      {curRoute.slice(1).map((w, i) => {
                        const idx = i + 1;
                        const status = idx < routeStep ? 'done' : idx === routeStep ? 'active' : 'pending';
                        return (
                          <Marker key={`wp${idx}`} position={[w.lat, w.lng]} icon={waypointIcon(idx, status, isMobile)} draggable={editingRoute} eventHandlers={{ click: () => setRouteStep(idx), dragend: editingRoute ? (e) => handleRouteWaypointDrag(idx, e) : undefined }}>
                            <Tooltip><b>{w.title}</b><br />{editingRoute ? 'Drag to move' : w.desc}<br />Depth: {w.depth}{w.dist > 0 ? ' \u2022 ' + w.dist.toFixed(1) + ' NM' : ''}</Tooltip>
                          </Marker>
                        );
                      })}
                      {routeCoords[routeStep] && <Circle center={routeCoords[routeStep]} radius={400} pathOptions={{ color: C.cyan, fillColor: C.cyan, fillOpacity: 0.12, weight: 1 }} />}
                    </>}

                    {/* Spot markers */}
                    {mapLayers.spots && !showRoute && filtered.map((s) => (
                      <Marker key={`s${s.id}`} position={itemToLatLng(s, bayConfig)} icon={spotIcon(s.type, selSpot?.id === s.id, isMobile)} draggable={(editMode && s.userAdded) || (movingWaypoint?.type === 'spot' && movingWaypoint?.id === s.id)} eventHandlers={{ click: () => { if (editMode && s.userAdded) selectForEdit('spot', s.id); else openSpot(s); }, contextmenu: (e) => { e.originalEvent.preventDefault(); handleWaypointLongPress('spot', s.id); }, dragend: (e) => { handleMarkerDragEnd('spot', s.id, e); if (movingWaypoint?.id === s.id) setPendingEdits(true); } }}>
                        <Tooltip><b>{s.name}</b>{favorites.includes(s.id) ? ' \u2764\uFE0F' : ''}{s.userAdded ? ' \u270F\uFE0F' : ''}<br />{editMode && s.userAdded ? 'Drag to move \u2022 Click to edit' : '\u2B50 ' + s.rating + ' \u2022 ' + s.species.slice(0, 2).join(', ')}</Tooltip>
                      </Marker>
                    ))}
                    {/* Ghost marker for moving waypoint */}
                    {movingWaypoint && <Marker position={[movingWaypoint.originalLat, movingWaypoint.originalLng]} icon={spotIcon('wade', false, isMobile)} opacity={0.3} interactive={false} />}

                    {/* Wind direction arrows + wave heights */}


                    {/* Wind direction arrows */}
                    {mapLayers.windArrows && !showRoute && !editMode && weather.windSpeed > 0 && generateWindArrows(weather.windDir, weather.windSpeed, selBay?.id).map((a, i) => (
                      <Marker key={'wa' + i} position={[a.lat, a.lng]} icon={windArrowIcon(a.dir, a.speed)} interactive={false} />
                    ))}

                    {/* Bay area name labels */}
                    {mapLayers.areaLabels && !showRoute && BAY_AREA_LABELS.filter((l) => l.bay === (selBay?.id || 'matagorda')).map((label) => (
                      <Marker key={label.id} position={[label.lat, label.lng]} icon={areaLabelIcon(label.name, label.size, label.type)} interactive={false} />
                    ))}

                    {/* Kayak launches */}
                    {mapLayers.kayakLaunches && !showRoute && KAYAK_LAUNCHES.filter((l) => l.bay === (selBay?.id || 'matagorda')).map((kl) => (
                      <Marker key={kl.id} position={[kl.lat, kl.lng]} icon={kayakLaunchIcon(isMobile)}>
                        <Popup><b>{kl.name}</b><br/><span style={{ fontSize: 11 }}>{kl.notes}</span>{kl.amenities?.length > 0 && <><br/><span style={{ fontSize: 10, color: '#6b7280' }}>{kl.amenities.join(' | ')}</span></>}</Popup>
                      </Marker>
                    ))}

                    {/* Boat ramps */}
                    {mapLayers.launches && !showRoute && BOAT_RAMPS.filter((r) => r.bay === (selBay?.id || 'matagorda')).map((br) => (
                      <Marker key={br.id} position={[br.lat, br.lng]} icon={launchIcon('boat', isMobile)}>
                        <Popup><b>{br.name}</b><br/><span style={{ fontSize: 11 }}>{br.notes}</span><br/><span style={{ fontSize: 10, color: '#6b7280' }}>Fee: {br.fee} | {br.amenities?.join(', ')}</span></Popup>
                      </Marker>
                    ))}

                    {/* Bait shops */}
                    {mapLayers.baitShops && !showRoute && BAIT_SHOPS.filter((s) => s.bay === (selBay?.id || 'matagorda')).map((bs) => (
                      <Marker key={bs.id} position={[bs.lat, bs.lng]} icon={baitShopIcon(isMobile)}>
                        <Popup><b>{bs.name}</b><br/><span style={{ fontSize: 11 }}>{bs.notes}</span><br/><span style={{ fontSize: 10, color: '#6b7280' }}>{bs.hours}{bs.phone ? ' | ' + bs.phone : ''}</span></Popup>
                      </Marker>
                    ))}

                    {/* Marinas / Harbors */}
                    {mapLayers.marinas && !showRoute && MARINAS.filter((m) => m.bay === (selBay?.id || 'matagorda')).map((ma) => (
                      <Marker key={ma.id} position={[ma.lat, ma.lng]} icon={marinaIcon(isMobile)}>
                        <Popup><b>{ma.name}</b><br/><span style={{ fontSize: 11 }}>{ma.notes}</span><br/><span style={{ fontSize: 10, color: '#6b7280' }}>{ma.slips} slips</span></Popup>
                      </Marker>
                    ))}

                    {/* Custom user POIs (permanent) */}
                    {customPOIs.filter((p) => p.bay === (selBay?.id || 'matagorda')).map((poi) => (
                      <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={poi.poiType === 'baitshop' ? baitShopIcon(isMobile) : poi.poiType === 'marina' ? marinaIcon(isMobile) : poi.poiType === 'kayak' ? kayakLaunchIcon(isMobile) : launchIcon('boat', isMobile)} draggable={editMode} eventHandlers={{ dragend: (e) => { const ll = e.target.getLatLng(); setCustomPOIs((prev) => prev.map((p) => p.id === poi.id ? { ...p, lat: ll.lat, lng: ll.lng } : p)); } }}>
                        <Popup><b>{poi.name}</b><br/><span style={{ fontSize: 11 }}>{poi.notes || ''}</span></Popup>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* CONTEXT MENU */}
                  {ctxMenu && editMode && <div style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100, background: C.card, borderTop: '2px solid ' + C.bdr2, borderRadius: '16px 16px 0 0', padding: '12px 12px 24px', boxShadow: '0 -8px 32px #000a' } : { position: 'absolute', left: Math.min(ctxMenu.x + 14, 250), top: ctxMenu.y + 52, zIndex: 1000, background: C.card, border: '1px solid ' + C.bdr2, borderRadius: 12, padding: 6, minWidth: 180, boxShadow: '0 8px 32px #000a' }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                    {isMobile && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>}
                    {isMobile && <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 8, textAlign: 'center' }}>Add to Map</div>}
                    <div style={{ fontSize: 11, color: C.mid, padding: '4px 10px 6px', fontFamily: FM }}>{ctxMenu.lat.toFixed(5)}, {ctxMenu.lng.toFixed(5)}</div>
                    {[
                      { section: 'Spots', items: [{ t: 'wade', l: 'Wade Spot', i: '\uD83D\uDEB6', c: C.amber }, { t: 'boat', l: 'Boat Spot', i: '\uD83D\uDEA4', c: C.blue }, { t: 'kayak', l: 'Kayak Spot', i: '\uD83D\uDEF6', c: C.green }] },
                      { section: 'Wade Features', items: [{ t: 'wade-line', l: 'Wade Line + Cast', i: '\uD83C\uDFA3', c: C.amber }, { t: 'wade-zone', l: 'Wade Zone', i: '\uD83D\uDDFA', c: C.amber }] },
                      { section: 'Bottom Features', items: [{ t: 'depth', l: 'Depth Marker', i: '\uD83D\uDCCF', c: C.blue }, { t: 'sand-bar', l: 'Sand Bar', i: '\uD83C\uDFD6\uFE0F', c: '#d4a574' }, { t: 'shell-scattered', l: 'Scattered Shell', i: '\uD83D\uDC1A', c: C.amber }, { t: 'shell-heavy', l: 'Heavy Shell Pad', i: '\uD83D\uDC1A', c: '#ff8c00' }, { t: 'shell-reef', l: 'Oyster Reef', i: '\uD83E\uDEB8', c: '#ef4444' }] },
                      { section: 'Infrastructure', items: [{ t: 'launch-boat', l: 'Boat Ramp', i: '\u2693', c: C.cyan }, { t: 'launch-kayak', l: 'Kayak Launch', i: '\uD83D\uDEF6', c: C.teal }, { t: 'launch-drivein', l: 'Drive-in Access', i: '\uD83D\uDE97', c: C.purple }] },
                    ].map((group) => (
                      <div key={group.section}>
                        <div style={{ padding: '6px 10px 2px', fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{group.section}</div>
                        <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: '0 2px' } : {}}>
                          {group.items.map((opt) => <button key={opt.t} onClick={() => handleAddFromCtx(opt.t)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: isMobile ? '10px 8px' : '6px 10px', borderRadius: 8, background: isMobile ? C.card2 : 'transparent', border: isMobile ? `1px solid ${C.bdr}` : 'none', color: C.txt, cursor: 'pointer', fontFamily: Fnt, fontSize: isMobile ? 12 : 11, textAlign: 'left' }} onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.background = C.card2; }} onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.background = 'transparent'; }}><span style={{ width: isMobile ? 28 : 24, height: isMobile ? 28 : 24, borderRadius: 5, background: opt.c + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 14 : 12, flexShrink: 0 }}>{opt.i}</span><div style={{ fontWeight: 600 }}>{opt.l}</div></button>)}
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid ' + C.bdr, marginTop: 6, paddingTop: 4 }}><button onClick={() => setCtxMenu(null)} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontFamily: Fnt, fontSize: 11, textAlign: 'center' }}>Cancel</button></div>
                  </div>}
                </div>

                {/* EDIT PANEL */}
                {editPopup && editMode && <div ref={editPanelRef} style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: C.card, borderTop: '2px solid ' + C.bdr2, borderRadius: '16px 16px 0 0', maxHeight: '65vh', overflow: 'auto', boxShadow: '0 -4px 30px #000a', WebkitOverflowScrolling: 'touch' } : { background: C.card, border: '1px solid ' + C.bdr2, borderRadius: 14, overflow: 'hidden', marginTop: 8 }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  {isMobile && <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', position: 'sticky', top: 0, background: C.card, zIndex: 1 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + C.bdr, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.cyan + '10' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EditI s={16} c={C.cyan} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Edit {{ spot: 'Fishing Spot', launch: 'Launch Point', zone: 'Wade Zone', wadeline: 'Wade Line', photo: 'Photo', depth: 'Depth Marker', sandbar: 'Sand Bar', shellpad: 'Shell Pad' }[editPopup.type] || editPopup.type}</div>
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
                      <div><Lbl>Width: {((editData?.radiusLng || editPopup.data.radiusLng || 0.012) * 1000).toFixed(0)}</Lbl><input type="range" min={3} max={30} step={1} value={(editData?.radiusLng || editPopup.data.radiusLng || 0.012) * 1000} onChange={(e) => updateZone(editPopup.id, 'radiusLng', +e.target.value / 1000)} style={{ width: '100%', accentColor: C.cyan }} /></div>
                      <div><Lbl>Height: {((editData?.radiusLat || editPopup.data.radiusLat || 0.006) * 1000).toFixed(0)}</Lbl><input type="range" min={2} max={20} step={1} value={(editData?.radiusLat || editPopup.data.radiusLat || 0.006) * 1000} onChange={(e) => updateZone(editPopup.id, 'radiusLat', +e.target.value / 1000)} style={{ width: '100%', accentColor: C.cyan }} /></div>
                      <div style={{ background: C.card2, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 11, color: C.mid }}><EyeI s={11} c={C.dim} /> Drag the white handles on the zone edges to resize interactively</div></div>
                    </div>}
                    {editPopup.type === 'wadeline' && (() => { const wl = editData || editPopup.data; return <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Line Label</Lbl><input defaultValue={editPopup.data.label || ''} key={editPopup.id + 'wlabel'} onBlur={(e) => updateWadeLine(editPopup.id, 'label', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                      <div><Lbl>Cast Range: {wl.castRange || 40} yards</Lbl>
                        <input type="range" min={10} max={80} step={5} value={wl.castRange || 40} onChange={(e) => updateWadeLine(editPopup.id, 'castRange', +e.target.value)} style={{ width: '100%', accentColor: C.amber }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.dim }}><span>10yd</span><span>40yd</span><span>80yd</span></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <Sel label="Wade Direction" isMobile={isMobile} value={wl.direction || ''} onChange={(e) => updateWadeLine(editPopup.id, 'direction', e.target.value)} options={[{ value: '', label: 'None' }, { value: 'N', label: 'North' }, { value: 'S', label: 'South' }, { value: 'E', label: 'East' }, { value: 'W', label: 'West' }, { value: 'NE', label: 'Northeast' }, { value: 'NW', label: 'Northwest' }, { value: 'SE', label: 'Southeast' }, { value: 'SW', label: 'Southwest' }]} />
                        <Sel label="Bottom Type" isMobile={isMobile} value={wl.bottomType || ''} onChange={(e) => updateWadeLine(editPopup.id, 'bottomType', e.target.value)} options={[{ value: '', label: 'Unknown' }, { value: 'sand', label: 'Sand' }, { value: 'mud', label: 'Mud' }, { value: 'shell', label: 'Shell' }, { value: 'mixed', label: 'Mixed' }, { value: 'grass', label: 'Grass' }, { value: 'reef', label: 'Reef' }]} />
                      </div>
                      <div style={{ background: C.card2, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: C.mid }}>{wl.points?.length || 0} points</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { const lastPt = wl.points?.[wl.points.length - 1]; if (lastPt) { const np = { lat: (lastPt.lat || 28.71) + 0.001, lng: (lastPt.lng || -95.87) - 0.001 }; updateWadeLine(editPopup.id, 'points', [...(wl.points || []), np]); showT('Point added'); } }} style={{ padding: '4px 8px', borderRadius: 4, background: C.cyan + '20', border: `1px solid ${C.cyan}40`, color: C.cyan, fontSize: 11, cursor: 'pointer', fontFamily: Fnt }}><PlusI s={10} c={C.cyan} /> Add</button>
                          <button onClick={() => { if (wl.points?.length > 2) { updateWadeLine(editPopup.id, 'points', wl.points.slice(0, -1)); showT('Last point removed'); } else { showT('Min 2 points'); } }} style={{ padding: '4px 8px', borderRadius: 4, background: C.red + '20', border: `1px solid ${C.red}40`, color: C.red, fontSize: 11, cursor: 'pointer', fontFamily: Fnt }}><MinusI s={10} c={C.red} /> Remove</button>
                        </div>
                      </div>
                      <div><Lbl>Line Color</Lbl><div style={{ display: 'flex', gap: 6 }}>
                        {[{ c: C.amber, l: 'Amber' }, { c: C.cyan, l: 'Cyan' }, { c: C.green, l: 'Green' }, { c: C.red, l: 'Red' }, { c: C.blue, l: 'Blue' }].map((col) => (
                          <button key={col.c} onClick={() => updateWadeLine(editPopup.id, 'color', col.c)} style={{ width: 28, height: 28, borderRadius: 6, background: col.c, border: wl.color === col.c ? '3px solid #fff' : '2px solid ' + C.bdr, cursor: 'pointer', boxShadow: wl.color === col.c ? '0 0 0 2px ' + col.c : 'none' }} title={col.l} />
                        ))}
                      </div></div>
                      <div><Lbl>Notes</Lbl><textarea defaultValue={editPopup.data.notes || ''} key={editPopup.id + 'wnotes'} onBlur={(e) => updateWadeLine(editPopup.id, 'notes', e.target.value)} rows={2} placeholder="Wade strategy, tips..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 12, fontFamily: Fnt, outline: 'none', resize: 'vertical' }} /></div>
                    </div>; })()}
                    {editPopup.type === 'photo' && <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Caption</Lbl><input defaultValue={editPopup.data.caption || ''} key={editPopup.id + 'pcap'} onBlur={(e) => setCommunityPhotos((prev) => prev.map((p) => p.id === editPopup.id ? { ...p, caption: e.target.value } : p))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                    </div>}
                    {editPopup.type === 'depth' && (() => { const dm = editData || editPopup.data; return <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Depth (ft)</Lbl>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="number" step={0.5} min={0} max={30} defaultValue={editPopup.data.depth} key={editPopup.id + 'ddepth'} onBlur={(e) => updateDepthMarker(editPopup.id, 'depth', +e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 16, fontFamily: FM, outline: 'none', fontWeight: 700 }} />
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: depthColor(dm.depth), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{dm.depth}</div>
                        </div>
                      </div>
                      <Sel label="Bottom Type" isMobile={isMobile} value={dm.bottomType || 'sand'} onChange={(e) => updateDepthMarker(editPopup.id, 'bottomType', e.target.value)} options={[{ value: 'sand', label: 'Sand' }, { value: 'mud', label: 'Mud' }, { value: 'shell', label: 'Shell' }, { value: 'grass', label: 'Grass' }, { value: 'reef', label: 'Reef' }]} />
                      <div style={{ background: C.card2, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.bdr}` }}>
                        <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Depth Color Guide</div>
                        <div style={{ display: 'flex', gap: 4 }}>{[{ d: '0-1.5', c: '#22c55e' }, { d: '1.5-3', c: '#84cc16' }, { d: '3-4.5', c: C.amber }, { d: '4.5-6', c: '#f97316' }, { d: '6+', c: '#3b82f6' }].map((r) => <div key={r.d} style={{ flex: 1, textAlign: 'center', padding: '3px 0', borderRadius: 4, background: r.c + '30', fontSize: 9, color: r.c, fontWeight: 600 }}>{r.d}ft</div>)}</div>
                      </div>
                      <div><Lbl>Note</Lbl><input defaultValue={editPopup.data.note || ''} key={editPopup.id + 'dnote'} onBlur={(e) => updateDepthMarker(editPopup.id, 'note', e.target.value)} placeholder="e.g. Shell pad edge, gut between bars..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                    </div>; })()}
                    {editPopup.type === 'sandbar' && (() => { const sb = editData || editPopup.data; return <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Sand Bar Label</Lbl><input defaultValue={editPopup.data.label || ''} key={editPopup.id + 'sblabel'} onBlur={(e) => updateSandBar(editPopup.id, 'label', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                      <div><Lbl>Depth Range (ft)</Lbl><input defaultValue={editPopup.data.depth || '1-3'} key={editPopup.id + 'sbdepth'} onBlur={(e) => updateSandBar(editPopup.id, 'depth', e.target.value)} placeholder="e.g. 1-3" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 13, fontFamily: Fnt, outline: 'none' }} /></div>
                      <div style={{ background: C.card2, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: C.mid }}>{sb.points?.length || 0} boundary points</span>
                        <span style={{ fontSize: 10, color: C.dim }}>Drag points on map to reshape</span>
                      </div>
                      <div><Lbl>Note</Lbl><textarea defaultValue={editPopup.data.note || ''} key={editPopup.id + 'sbnote'} onBlur={(e) => updateSandBar(editPopup.id, 'note', e.target.value)} rows={2} placeholder="Shifts with current, exposed at low tide..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 12, fontFamily: Fnt, outline: 'none', resize: 'vertical' }} /></div>
                    </div>; })()}
                    {editPopup.type === 'shellpad' && (() => { const sp = editData || editPopup.data; return <div style={{ display: 'grid', gap: 12 }}>
                      <div><Lbl>Shell Pad Label</Lbl><input defaultValue={editPopup.data.label || ''} key={editPopup.id + 'splabel'} onBlur={(e) => updateShellPad(editPopup.id, 'label', e.target.value)} placeholder="e.g. Main shell pad" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 14, fontFamily: Fnt, outline: 'none', fontWeight: 600 }} /></div>
                      <Sel label="Shell Type" isMobile={isMobile} value={sp.shellType || 'scattered'} onChange={(e) => updateShellPad(editPopup.id, 'shellType', e.target.value)} options={[{ value: 'scattered', label: 'Scattered Shell' }, { value: 'heavy', label: 'Heavy Shell Pad' }, { value: 'reef', label: 'Oyster Reef' }]} />
                      <div><Lbl>Radius: {sp.radius || 5}</Lbl>
                        <input type="range" min={2} max={15} step={1} value={sp.radius || 5} onChange={(e) => updateShellPad(editPopup.id, 'radius', +e.target.value)} style={{ width: '100%', accentColor: shellColor(sp.shellType) }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.dim }}><span>Small</span><span>Medium</span><span>Large</span></div>
                      </div>
                      <div style={{ background: C.card2, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.bdr}` }}>
                        <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Shell Types</div>
                        <div style={{ display: 'flex', gap: 6 }}>{[{ t: 'scattered', l: 'Scattered', d: 'Light shell over sand/mud' }, { t: 'heavy', l: 'Heavy Pad', d: 'Dense shell concentration' }, { t: 'reef', l: 'Reef', d: 'Live oyster reef' }].map((r) => <div key={r.t} style={{ flex: 1, padding: '6px', borderRadius: 6, background: sp.shellType === r.t ? shellColor(r.t) + '25' : 'transparent', border: `1px solid ${sp.shellType === r.t ? shellColor(r.t) : C.bdr}`, textAlign: 'center', cursor: 'pointer', fontSize: 10 }} onClick={() => updateShellPad(editPopup.id, 'shellType', r.t)}><div style={{ fontWeight: 600, color: shellColor(r.t) }}>{r.l}</div><div style={{ color: C.dim, fontSize: 8, marginTop: 2 }}>{r.d}</div></div>)}</div>
                      </div>
                      <div><Lbl>Note</Lbl><textarea defaultValue={editPopup.data.note || ''} key={editPopup.id + 'spnote'} onBlur={(e) => updateShellPad(editPopup.id, 'note', e.target.value)} rows={2} placeholder="Reds stack here on incoming..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 12, fontFamily: Fnt, outline: 'none', resize: 'vertical' }} /></div>
                    </div>; })()}
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
                  <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{'\uD83C\uDFA3'} Wade Line: {drawingLine.points.length} pts</div>
                  <input value={drawingLine.label} onChange={(e) => setDrawingLine((prev) => ({ ...prev, label: e.target.value }))} style={{ padding: '4px 8px', borderRadius: 6, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 12, fontFamily: Fnt, width: 130, outline: 'none' }} placeholder="Wade line name" />
                  {drawingLine.points.length > 1 && <Btn small isMobile={isMobile} onClick={() => setDrawingLine((prev) => ({ ...prev, points: prev.points.slice(0, -1) }))}><UndoI s={12} /> Undo</Btn>}
                  <Btn small primary isMobile={isMobile} onClick={handleFinishWadeLine}><ChkI s={12} c={C.bg} /> Finish ({drawingLine.points.length})</Btn>
                  <Btn small danger isMobile={isMobile} onClick={() => { setDrawingLine(null); showT('Cancelled'); }}><XI s={12} /> Cancel</Btn>
                </div>}

                {/* Sand bar polygon drawing controls */}
                {drawingPolygon && editMode && <div style={{ position: 'absolute', bottom: isMobile ? 16 : 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: C.card, border: '1px solid #d4a574', borderRadius: 12, padding: isMobile ? '10px 14px' : '8px 16px', boxShadow: '0 4px 20px #000a', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, flexWrap: isMobile ? 'wrap' : 'nowrap', justifyContent: 'center', maxWidth: isMobile ? '90vw' : 'auto' }}>
                  <div style={{ fontSize: 11, color: '#d4a574', fontWeight: 600 }}>{'\uD83C\uDFD6\uFE0F'} Sand Bar: {drawingPolygon.points.length} pts</div>
                  <input value={drawingPolygon.label} onChange={(e) => setDrawingPolygon((prev) => ({ ...prev, label: e.target.value }))} style={{ padding: '4px 8px', borderRadius: 6, background: C.card2, border: '1px solid ' + C.bdr, color: C.txt, fontSize: 12, fontFamily: Fnt, width: 130, outline: 'none' }} placeholder="Sand bar name" />
                  {drawingPolygon.points.length > 1 && <Btn small isMobile={isMobile} onClick={() => setDrawingPolygon((prev) => ({ ...prev, points: prev.points.slice(0, -1) }))}><UndoI s={12} /> Undo</Btn>}
                  <Btn small primary isMobile={isMobile} onClick={handleFinishSandBar}><ChkI s={12} c={C.bg} /> Finish ({drawingPolygon.points.length})</Btn>
                  <Btn small danger isMobile={isMobile} onClick={() => { setDrawingPolygon(null); showT('Cancelled'); }}><XI s={12} /> Cancel</Btn>
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
              {(!isMobile || selSpot || mobilePanel === 'spots') && <div style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: C.card, borderTop: `2px solid ${C.bdr2}`, borderRadius: '16px 16px 0 0', maxHeight: mobilePanel === 'spot-detail' || mobilePanel === 'nav' ? '55vh' : '55vh', overflow: 'auto', transition: 'max-height 0.3s ease', boxShadow: '0 -4px 30px #000a', WebkitOverflowScrolling: 'touch' } : { display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isMobile && <div onClick={() => { if (!selSpot) setMobilePanel(null); }} style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', position: 'sticky', top: 0, background: C.card, zIndex: 1, borderRadius: '16px 16px 0 0', cursor: 'pointer' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>}
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
                        <div><div style={{ fontSize: 9, color: C.dim }}>GPS</div><div style={{ fontFamily: FM, fontSize: 12 }}>{selSpot.lat != null ? selSpot.lat.toFixed(4) + '\u00B0N' : selSpot.gps?.lat || '--'}, {selSpot.lng != null ? Math.abs(selSpot.lng).toFixed(4) + '\u00B0W' : selSpot.gps?.lng || '--'}</div></div>
                        <button onClick={() => cpGPS(selSpot.lat != null ? { lat: selSpot.lat.toFixed(5), lng: selSpot.lng.toFixed(5) } : selSpot.gps || {})} style={{ padding: '4px 8px', borderRadius: 4, background: copied ? C.green : C.card, border: `1px solid ${C.bdr}`, color: copied ? '#fff' : C.mid, cursor: 'pointer', fontSize: 10, fontFamily: Fnt }}>{copied ? '\u2713' : 'Copy'}</button>
                      </div>
                      {distFromUser != null && <div style={{ background: `${C.blue}15`, borderRadius: 8, padding: '8px 10px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.blue}30` }}>
                        <LocI s={14} c={C.blue} />
                        <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>{distFromUser.toFixed(1)} NM from you</span>
                      </div>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>{selSpot.species.map((s) => <Badge key={s} color={C.teal}>{s}</Badge>)}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                        {[['Tide', selSpot.bestTide], ['Time', selSpot.bestTime], ['Season', selSpot.bestSeason], ['Wind', selSpot.bestWind]].map(([l, v]) => <div key={l} style={{ background: C.card2, borderRadius: 6, padding: '6px 8px' }}><div style={{ fontSize: 9, color: C.dim }}>{l}</div><div style={{ fontWeight: 600, fontSize: 11 }}>{v}</div></div>)}
                      </div>
                      {/* Live conditions mini-bar */}
                      <div style={{ background: `${tide.status === 'Incoming' ? C.cyan : C.amber}08`, borderRadius: 8, padding: '8px 10px', border: `1px solid ${tide.status === 'Incoming' ? C.cyan : C.amber}20`, marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 10 }}>
                        <div><div style={{ color: C.dim, fontSize: 8 }}>NOW</div><div style={{ fontWeight: 700, color: tide.status === 'Incoming' ? C.cyan : C.amber }}>{tide.status}{tide.height != null ? ` ${tide.height > 0 ? '+' : ''}${tide.height.toFixed(1)}ft` : ''}</div></div>
                        <div><div style={{ color: C.dim, fontSize: 8 }}>WIND</div><div style={{ fontWeight: 600 }}>{weather.windSpeed} {weather.windDirLabel}</div></div>
                        <div><div style={{ color: C.dim, fontSize: 8 }}>MOON</div><div style={{ fontWeight: 600 }}>{cond.moon.icon} {cond.moonRating.rating >= 4 ? '\u2B50' : ''}</div></div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>{selSpot.lures.map((l) => <Badge key={l} color={C.cyan}>{l}</Badge>)}</div>
                      <p style={{ color: C.mid, lineHeight: 1.5, marginBottom: 12 }}>{selSpot.desc}</p>
                      {selSpot.media?.length > 0 && <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{selSpot.media.map((m, i) => <div key={i} style={{ flex: 1, background: C.card2, borderRadius: 8, padding: 8, border: `1px solid ${C.bdr}`, cursor: 'pointer' }}><div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>{m.type === 'video' ? '\uD83C\uDFA5' : '\uD83D\uDCF7'} {m.label}</div></div>)}</div>}
                      <Btn primary isMobile={isMobile} style={{ width: '100%' }} onClick={startNav}><NavI s={14} c={C.bg} /> Navigate ({curRoute.length} waypoints, {totalRouteNM.toFixed(1)} NM)</Btn>
                    </div>
                  </div>
                  {showRoute && curRoute.length > 0 && <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.cyan}40`, padding: 14 }}>
                    {/* Route header with edit toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Route ({curRoute.length} pts, {totalRouteNM.toFixed(1)} NM)</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {editingRoute && <button onClick={addRouteWaypoint} style={{ padding: '5px 8px', borderRadius: 6, background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, color: C.cyan, cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 3 }}><PlusI s={10} c={C.cyan} /> Add Pt</button>}
                        <button onClick={() => { if (editingRoute) saveCurrentRoute(); else setEditingRoute(true); }} style={{ padding: '5px 10px', borderRadius: 6, background: editingRoute ? C.green + '20' : C.card2, border: `1px solid ${editingRoute ? C.green : C.bdr}`, color: editingRoute ? C.green : C.mid, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 4 }}>{editingRoute ? <><SaveI s={12} c={C.green} /> Done</> : <><EditI s={12} /> Edit</>}</button>
                      </div>
                    </div>

                    {/* Waypoint list - scrollable */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: editingRoute ? 300 : 200, overflow: 'auto', marginBottom: 8 }}>
                      {curRoute.map((wp, idx) => (
                        <div key={idx} onClick={() => setRouteStep(idx)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: idx === routeStep ? `${C.cyan}15` : C.card2, border: `1px solid ${idx === routeStep ? C.cyan + '40' : C.bdr}`, cursor: 'pointer' }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: idx < routeStep ? C.green : idx === routeStep ? C.cyan : C.bdr, display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx <= routeStep ? C.bg : C.mid, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{idx === 0 ? '\u2693' : idx === curRoute.length - 1 ? '\u{1F3AF}' : idx}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editingRoute ? (
                              <input value={wp.title} onClick={(e) => e.stopPropagation()} onChange={(e) => updateRouteWaypoint(idx, 'title', e.target.value)} style={{ width: '100%', padding: '2px 6px', borderRadius: 4, background: C.card, border: `1px solid ${C.bdr}`, color: C.txt, fontSize: 12, fontWeight: 600, fontFamily: Fnt, outline: 'none' }} />
                            ) : (
                              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wp.title}</div>
                            )}
                            <div style={{ fontSize: 10, color: C.dim }}>
                              {idx > 0 ? `${Math.round(wp.brng)}\u00B0 ${wp.brngLbl} \u2022 ${wp.dist.toFixed(1)} NM` : 'Start'}
                              {wp.depth ? ` \u2022 ${wp.depth}` : ''}
                            </div>
                          </div>
                          {editingRoute && idx > 0 && idx < curRoute.length - 1 && (
                            <button onClick={(e) => { e.stopPropagation(); deleteRouteWaypoint(idx); }} style={{ padding: 4, background: 'none', border: 'none', color: C.red, cursor: 'pointer', flexShrink: 0 }}><TrashI s={14} c={C.red} /></button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Current waypoint detail (when editing) */}
                    {editingRoute && curWP && (
                      <div style={{ background: C.card2, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                          <div><div style={{ fontSize: 9, color: C.dim }}>Depth</div><input value={curWP.depth || ''} onChange={(e) => updateRouteWaypoint(routeStep, 'depth', e.target.value)} placeholder="e.g. 3-5 ft" style={{ width: '100%', padding: '3px 6px', borderRadius: 4, background: C.card, border: `1px solid ${C.bdr}`, color: C.txt, fontSize: 11, fontFamily: Fnt, outline: 'none' }} /></div>
                          <div><div style={{ fontSize: 9, color: C.dim }}>GPS</div><div style={{ fontSize: 10, color: C.mid, fontFamily: FM, padding: '3px 0' }}>{curWP.lat.toFixed(4)}, {curWP.lng.toFixed(4)}</div></div>
                        </div>
                        <div><div style={{ fontSize: 9, color: C.dim }}>Notes</div><textarea value={curWP.desc || ''} onChange={(e) => updateRouteWaypoint(routeStep, 'desc', e.target.value)} rows={2} style={{ width: '100%', padding: '4px 6px', borderRadius: 4, background: C.card, border: `1px solid ${C.bdr}`, color: C.mid, fontSize: 11, fontFamily: Fnt, outline: 'none', resize: 'vertical' }} /></div>
                        <div style={{ fontSize: 9, color: C.dim, marginTop: 6 }}>Drag waypoints on map to reposition</div>
                      </div>
                    )}

                    {/* Bearing/distance stats (non-editing mode) */}
                    {!editingRoute && curWP && routeStep > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                        <div style={{ background: C.card2, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}><div style={{ fontSize: 9, color: C.dim }}>Bearing</div><div style={{ fontWeight: 700, fontSize: 12, color: C.cyan }}>{Math.round(curWP.brng) + '\u00B0 ' + curWP.brngLbl}</div></div>
                        <div style={{ background: C.card2, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}><div style={{ fontSize: 9, color: C.dim }}>Leg</div><div style={{ fontWeight: 700, fontSize: 12, color: C.teal }}>{curWP.dist.toFixed(1)} NM</div></div>
                        <div style={{ background: C.card2, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}><div style={{ fontSize: 9, color: C.dim }}>Total</div><div style={{ fontWeight: 700, fontSize: 12, color: C.green }}>{curWP.cumDist.toFixed(1)} NM</div></div>
                      </div>
                    )}
                    {/* Estimated bay wave height during navigation */}
                    {!editingRoute && weather.windSpeed > 0 && (() => {
                      const wm = generateWaveMarkers(weather.windDir || 0, weather.windSpeed || 0, selBay?.id);
                      const maxH = Math.max(...wm.map(w => w.height));
                      const waveLabel = maxH < 0.3 ? 'Flat' : maxH < 0.5 ? 'Light chop' : maxH < 1.0 ? 'Moderate chop' : maxH < 1.5 ? 'Rough' : 'Very rough';
                      const waveColor = maxH < 0.3 ? C.green : maxH < 0.5 ? '#84cc16' : maxH < 1.0 ? C.amber : maxH < 1.5 ? '#f97316' : C.red;
                      return <div style={{ background: `${waveColor}10`, borderRadius: 6, padding: '6px 10px', marginBottom: 8, border: `1px solid ${waveColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 10, color: C.dim }}>Est. Bay Waves</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: waveColor }}>{maxH < 0.3 ? 'Flat' : `~${maxH.toFixed(1)}' ${waveLabel}`}</div>
                      </div>;
                    })()}

                    {/* Change start point */}
                    {editingRoute && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button onClick={() => { if (geo.position) { setRouteStart(geo.position.lat, geo.position.lng, 'My Location'); } else showT('Location not available'); }} style={{ padding: '5px 8px', borderRadius: 6, background: `${C.blue}15`, border: `1px solid ${C.blue}30`, color: C.blue, cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: Fnt, display: 'flex', alignItems: 'center', gap: 3 }}><LocI s={10} c={C.blue} /> Start from me</button>
                        {launches.filter((l) => l.bay === selBay?.id).map((l) => (
                          <button key={l.id} onClick={() => setRouteStart(l.lat, l.lng, l.name)} style={{ padding: '5px 8px', borderRadius: 6, background: C.card2, border: `1px solid ${C.bdr}`, color: C.mid, cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: Fnt }}>{l.name}</button>
                        ))}
                      </div>
                    )}
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
              </div>}
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}
      {/* CONDITIONS MODAL */}
      {showConditions && <Modal title={`${weather.conditionIcon} Bay Conditions`} sub={`${selBay?.name || 'Matagorda Bay'} \u2022 Live data${cond.lastFetch ? ' \u2022 Updated ' + cond.lastFetch.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}`} onClose={() => setShowConditions(false)} wide isMobile={isMobile}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {/* TIDE SECTION */}
          <div style={{ background: C.card2, borderRadius: 12, padding: 16, border: `1px solid ${C.bdr}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <WaveI s={18} c={tide.status === 'Incoming' ? C.cyan : C.amber} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Tides</span>
              {cond.tideVerification?.verified && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${C.green}20`, color: C.green, fontWeight: 600 }}>LIVE</span>}
              <span style={{ fontSize: 10, color: C.dim, marginLeft: 'auto' }}>NOAA</span>
            </div>

            {/* Current status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}>
                <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: tide.status === 'Incoming' ? C.cyan : tide.status === 'Outgoing' ? C.amber : C.mid }}>{tide.status}</div>
              </div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}>
                <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Level {tide.observedHeight != null ? '(live)' : ''}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: tide.height > 0 ? C.cyan : tide.height < 0 ? C.amber : C.mid }}>{tide.height != null ? `${tide.height > 0 ? '+' : ''}${tide.height.toFixed(1)} ft` : '--'}</div>
              </div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}>
                <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Swing</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>{tide.swing != null ? `${tide.swing.toFixed(1)} ft` : '--'}</div>
              </div>
            </div>

            {/* Next tide + strength bar */}
            <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}`, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Next</div><div style={{ fontSize: 13, fontWeight: 600 }}>{tide.next}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Strength</div><div style={{ fontSize: 13, fontWeight: 600 }}>{Math.round((tide.strength || 0) * 100)}%</div></div>
              </div>
              <div style={{ height: 6, background: C.bdr, borderRadius: 3 }}><div style={{ height: '100%', borderRadius: 3, background: tide.status === 'Incoming' ? C.cyan : C.amber, width: `${(tide.strength || 0) * 100}%`, transition: 'width 1s' }} /></div>
            </div>

            {/* Multi-day tide schedule (7 days) */}
            {tide.dailyTides.length > 0 && tide.dailyTides.map((day, di) => (
              <div key={di} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: di === 0 ? C.cyan : C.dim, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{di === 0 ? 'Today' : di === 1 ? 'Tomorrow' : day.label}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {day.tides.map((p, i) => (
                    <div key={i} style={{ padding: di < 2 ? '8px 12px' : '6px 10px', borderRadius: di < 2 ? 8 : 6, background: p.type === 'high' ? `${C.cyan}${di < 2 ? '15' : '08'}` : `${C.amber}${di < 2 ? '15' : '08'}`, border: `1px solid ${p.type === 'high' ? C.cyan : C.amber}${di < 2 ? '30' : '15'}`, fontSize: di < 2 ? 12 : 11, flex: '1 1 auto', textAlign: 'center' }}>
                      <div style={{ fontWeight: di < 2 ? 700 : 600, color: p.type === 'high' ? C.cyan : C.amber, fontSize: di < 2 ? 14 : 11 }}>{p.type === 'high' ? '\u2191 HIGH' : '\u2193 LOW'}</div>
                      <div style={{ fontWeight: 700, fontSize: di < 2 ? 16 : 13 }}>{p.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                      <div style={{ color: C.mid, fontSize: di < 2 ? 12 : 10, fontWeight: 600 }}>{p.height > 0 ? '+' : ''}{p.height.toFixed(1)} ft</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Dual-source verification */}
            {cond.tideVerification && <div style={{ background: C.card, borderRadius: 6, padding: 8, border: `1px solid ${C.bdr}`, fontSize: 10, color: C.dim }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Data source: <span style={{ color: cond.tideVerification.verified ? C.green : C.amber }}>{cond.tideVerification.confidence}</span></div>
              <div>Predictions: {cond.tideVerification.predStation?.name} (7-day hi/lo schedule)</div>
              <div>Observed: {cond.tideVerification.obsStation?.name} {cond.tideVerification.obsStation?.hasData ? '(live)' : '(unavailable)'}</div>
            </div>}
          </div>

          {/* WEATHER SECTION */}
          <div style={{ background: C.card2, borderRadius: 12, padding: 16, border: `1px solid ${C.bdr}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><SunI s={18} c={C.amber} /><span style={{ fontWeight: 700, fontSize: 15 }}>Weather</span><span style={{ fontSize: 11, color: C.dim, marginLeft: 'auto' }}>Open-Meteo</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Temp</div><div style={{ fontSize: 22, fontWeight: 700 }}>{weather.temp}<span style={{ fontSize: 12 }}>{'\u00B0F'}</span></div></div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Feels Like</div><div style={{ fontSize: 22, fontWeight: 700 }}>{weather.feelsLike || '--'}<span style={{ fontSize: 12 }}>{'\u00B0F'}</span></div></div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Wind</div><div style={{ fontSize: 16, fontWeight: 700 }}>{weather.windSpeed} <span style={{ fontSize: 11, fontWeight: 400 }}>mph {weather.windDirLabel}</span></div></div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Gusts</div><div style={{ fontSize: 16, fontWeight: 700 }}>{weather.windGusts} <span style={{ fontSize: 11, fontWeight: 400 }}>mph</span></div></div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}`, gridColumn: '1 / -1' }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Conditions</div><div style={{ fontSize: 15, fontWeight: 600 }}>{weather.conditionIcon} {weather.conditions}{weather.humidity ? ` \u2022 ${weather.humidity}% humidity` : ''}</div></div>
            </div>
            {weather && <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}>
              <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Wave Estimate</div>
              {(() => { const wm = generateWaveMarkers(weather.windDir || 0, weather.windSpeed || 0, selBay?.id); const maxH = Math.max(...wm.map(w => w.height)); return <>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{maxH < 0.3 ? 'Flat' : maxH.toFixed(1) + "' waves"} {maxH < 0.3 ? '\u2705' : maxH < 1.0 ? '\u{1F7E1}' : '\u{1F534}'}</div>
                <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{weather.windSpeed || 0} mph wind from {weather.windDir || 0}{'\u00B0'} {'\u2022'} {maxH < 0.5 ? 'Great wading' : maxH < 1.0 ? 'Moderate chop' : maxH < 1.5 ? 'Rough - boat only' : 'Dangerous'}</div>
              </>; })()}
            </div>}
          </div>

          {/* MOON SECTION */}
          <div style={{ background: C.card2, borderRadius: 12, padding: 16, border: `1px solid ${C.bdr}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 20 }}>{cond.moon.icon}</span><span style={{ fontWeight: 700, fontSize: 15 }}>Moon Phase</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}`, textAlign: 'center' }}><div style={{ fontSize: 28 }}>{cond.moon.icon}</div><div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{cond.moon.name}</div></div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Illumination</div><div style={{ fontSize: 18, fontWeight: 700 }}>{cond.moon.illumination}%</div></div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Fishing</div><div style={{ fontSize: 14, fontWeight: 700, color: cond.moonRating.rating >= 4 ? C.green : cond.moonRating.rating >= 3 ? C.amber : C.dim }}>{'\u2B50'.repeat(cond.moonRating.rating)}</div><div style={{ fontSize: 10, color: C.mid }}>{cond.moonRating.label}</div></div>
            </div>
          </div>

          {/* MARINE / WAVES SECTION */}
          <div style={{ background: C.card2, borderRadius: 12, padding: 16, border: `1px solid ${C.bdr}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 18 }}>{'\uD83C\uDF0A'}</span><span style={{ fontWeight: 700, fontSize: 15 }}>Marine</span></div>
            {cond.marine ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Wave Height</div><div style={{ fontSize: 16, fontWeight: 700 }}>{cond.marine.waveHeight != null ? `${cond.marine.waveHeight} ft` : '--'}</div></div>
              <div style={{ background: C.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, textTransform: 'uppercase' }}>Wave Period</div><div style={{ fontSize: 16, fontWeight: 700 }}>{cond.marine.wavePeriod != null ? `${cond.marine.wavePeriod}s` : '--'}</div></div>
            </div> : <div style={{ fontSize: 12, color: C.mid, padding: 8 }}>Marine data not available for inland bays. Wave data is from nearest Gulf station.</div>}
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Btn primary isMobile={isMobile} style={{ flex: 1 }} onClick={() => { cond.refresh(); showT('Refreshing...'); }}><span>{'\uD83D\uDD04'}</span> Refresh Data</Btn>
          <Btn isMobile={isMobile} onClick={() => setShowConditions(false)}><XI s={14} /> Close</Btn>
        </div>
      </Modal>}

      {/* FISHING REPORTS MODAL */}
      {showReports && <Modal title={`\uD83D\uDCCB Fishing Reports`} sub={`${selBay?.name || 'Matagorda Bay'} \u2022 Latest reports`} onClose={() => setShowReports(false)} wide isMobile={isMobile}>
        {cond.reports.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: C.mid }}>No reports available</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cond.reports.map((r, i) => (
            <div key={i} style={{ background: C.card2, borderRadius: 10, padding: 14, border: `1px solid ${C.bdr}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.user}</div>
                <div style={{ fontSize: 10, color: C.dim }}>{r.time}</div>
                <div style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, background: `${C.cyan}15`, fontSize: 9, color: C.cyan, fontWeight: 600 }}>{r.source}</div>
              </div>
              <p style={{ fontSize: 13, color: C.txt, lineHeight: 1.5, margin: 0, marginBottom: 8 }}>{r.text}</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.species.map((sp) => <Badge key={sp} color={C.green}>{sp}</Badge>)}
                <Badge color={C.cyan}>{r.area}</Badge>
              </div>
            </div>
          ))}
        </div>}
        <div style={{ marginTop: 16, background: `${C.amber}10`, borderRadius: 10, padding: 12, border: `1px solid ${C.amber}25` }}>
          <p style={{ fontSize: 11, color: C.mid, margin: 0, lineHeight: 1.5 }}>{'\u{1F4A1}'} Reports sourced from 2CoolFishing, TX Parks & Wildlife, and local fishing communities. Data refreshes daily. For a backend-connected version with real-time scraping, a proxy server is needed.</p>
        </div>
      </Modal>}

      {showSettings && <Modal title="Settings" sub="API keys, preferences & custom map items" onClose={() => setShowSettings(false)} isMobile={isMobile} wide>
        <div style={{ marginBottom: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><KeyI s={16} c={C.cyan} /><span style={{ fontWeight: 700 }}>Claude API Key</span></div>
        <Inp label="API Key" isMobile={isMobile} type="password" placeholder="sk-ant-..." value={settings.claudeApiKey} onChange={(e) => setSettings({ ...settings, claudeApiKey: e.target.value })} />
        <div style={{ background: `${C.cyan}08`, borderRadius: 10, padding: 12, border: `1px solid ${C.cyan}20`, marginBottom: 8 }}><p style={{ fontSize: 11, color: C.mid, margin: 0, lineHeight: 1.5 }}>Powers the AI Advisor. Analyzes conditions against your spots. Get yours at console.anthropic.com</p></div></div>

        {/* MAP EDITOR MODE */}
        <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapEdI s={16} c={C.amber} /><span style={{ fontWeight: 700 }}>Map Editor Mode</span></div>
            <button onClick={() => { setEditMode(!editMode); setShowSettings(false); }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: editMode ? C.amber : C.card2, color: editMode ? C.bg : C.mid, border: `1px solid ${editMode ? C.amber : C.bdr}`, cursor: 'pointer', fontFamily: Fnt }}>{editMode ? 'Exit Editor' : 'Enter Editor'}</button>
          </div>
          <p style={{ fontSize: 11, color: C.mid, marginBottom: 8, lineHeight: 1.5 }}>Double-click the map to add markers at exact GPS coordinates. Drag to reposition. All coordinates are real GPS (lat/lng).</p>
          <div style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}25`, borderRadius: 8, padding: 10, fontSize: 11, color: C.amber, lineHeight: 1.5 }}>
            <b>Controls:</b> Double-click = add marker • Click marker = edit • Drag = move • Long-press on mobile
          </div>
        </div>

        {/* PERMANENT CUSTOM MAP ITEMS */}
        <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><PinI s={16} c={C.green} /><span style={{ fontWeight: 700 }}>Permanent Map Items</span></div>
          <p style={{ fontSize: 11, color: C.mid, marginBottom: 12, lineHeight: 1.5 }}>Add custom bait shops, kayak launches, marinas, or landmarks. These stay on your map permanently until you remove them.</p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Inp label="Name" isMobile={isMobile} placeholder="e.g. Joe's Bait" value={settings._poiName || ''} onChange={(e) => setSettings({ ...settings, _poiName: e.target.value })} />
              <Sel label="Type" isMobile={isMobile} value={settings._poiType || 'baitshop'} onChange={(e) => setSettings({ ...settings, _poiType: e.target.value })} options={[{ value: 'baitshop', label: 'Bait Shop' }, { value: 'kayak', label: 'Kayak Launch' }, { value: 'marina', label: 'Harbor/Marina' }, { value: 'boatramp', label: 'Boat Ramp' }, { value: 'landmark', label: 'Landmark' }]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Inp label="Latitude" isMobile={isMobile} placeholder="e.g. 28.6850" value={settings._poiLat || ''} onChange={(e) => setSettings({ ...settings, _poiLat: e.target.value })} />
              <Inp label="Longitude" isMobile={isMobile} placeholder="e.g. -95.9650" value={settings._poiLng || ''} onChange={(e) => setSettings({ ...settings, _poiLng: e.target.value })} />
            </div>
            <Inp label="Notes (optional)" isMobile={isMobile} placeholder="Hours, phone, details..." value={settings._poiNotes || ''} onChange={(e) => setSettings({ ...settings, _poiNotes: e.target.value })} />
            <Sel label="Bay" isMobile={isMobile} value={settings._poiBay || selBay?.id || 'matagorda'} onChange={(e) => setSettings({ ...settings, _poiBay: e.target.value })} options={[{ value: 'matagorda', label: 'Matagorda Bay' }, { value: 'west_matagorda', label: 'West Matagorda Bay' }, { value: 'san_antonio', label: 'San Antonio Bay' }]} />
            <Btn primary small isMobile={isMobile} onClick={() => {
              const name = settings._poiName?.trim();
              const lat = parseFloat(settings._poiLat);
              const lng = parseFloat(settings._poiLng);
              if (!name || isNaN(lat) || isNaN(lng)) { showT('Fill in name, lat, and lng'); return; }
              const poi = { id: 'cpoi-' + Date.now(), name, lat, lng, poiType: settings._poiType || 'baitshop', notes: settings._poiNotes || '', bay: settings._poiBay || selBay?.id || 'matagorda' };
              setCustomPOIs((prev) => [...prev, poi]);
              setSettings({ ...settings, _poiName: '', _poiLat: '', _poiLng: '', _poiNotes: '' });
              showT('Added ' + name + ' to map permanently!');
            }}><PlusI s={14} c={C.bg} /> Add to Map</Btn>
          </div>

          {customPOIs.length > 0 && <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your Custom Items ({customPOIs.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflow: 'auto' }}>
              {customPOIs.map((poi) => (
                <div key={poi.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.card2, borderRadius: 8, border: `1px solid ${C.bdr}` }}>
                  <span style={{ fontSize: 14 }}>{poi.poiType === 'baitshop' ? '\uD83C\uDFE3' : poi.poiType === 'kayak' ? '\uD83D\uDEF6' : poi.poiType === 'marina' ? '\u2693' : poi.poiType === 'boatramp' ? '\uD83D\uDEA4' : '\uD83D\uDCCD'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{poi.name}</div>
                    <div style={{ fontSize: 10, color: C.dim }}>{poi.bay} | {poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}</div>
                  </div>
                  <button onClick={() => { setCustomPOIs((prev) => prev.filter((p) => p.id !== poi.id)); showT('Removed ' + poi.name); }} style={{ background: `${C.red}20`, border: `1px solid ${C.red}40`, borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><TrashI s={12} c={C.red} /></button>
                </div>
              ))}
            </div>
          </div>}
        </div>

        <Btn primary isMobile={isMobile} style={{ width: '100%' }} onClick={() => { showT('Settings saved'); setShowSettings(false); }}><SaveI s={14} c={C.bg} /> Save</Btn>
      </Modal>}

      {showAI && <Modal title="AI Fishing Advisor" sub="Powered by Claude Haiku" onClose={() => { setShowAI(false); setAiResponse(null); setAiError(null); }} isMobile={isMobile}>{!settings.claudeApiKey ? <div style={{ textAlign: 'center', padding: '20px 0' }}><SparkI s={40} c={C.dim} /><h3 style={{ marginTop: 12 }}>API Key Required</h3><p style={{ fontSize: 13, color: C.mid, marginTop: 6, marginBottom: 16 }}>Add your Claude API key in Settings to get AI-powered fishing recommendations.</p><Btn primary isMobile={isMobile} onClick={() => { setShowAI(false); setShowSettings(true); }}><KeyI s={14} c={C.bg} /> Open Settings</Btn></div> :
        <div>
          <div style={{ background: C.card2, borderRadius: 10, padding: 12, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}><div><div style={{ color: C.dim }}>Wind</div><div style={{ fontWeight: 600 }}>{weather.windSpeed} mph {weather.windDirLabel}</div></div><div><div style={{ color: C.dim }}>Tide</div><div style={{ fontWeight: 600 }}>{tide.status}</div></div><div><div style={{ color: C.dim }}>Feels Like</div><div style={{ fontWeight: 600 }}>{weather.feelsLike}{'\u00B0'}F</div></div></div>
          {!aiResponse && !aiLoading && !aiError && <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 13, color: C.mid, marginBottom: 16 }}>Get a personalized fishing recommendation based on current wind, tide, and conditions.</p>
            <Btn primary isMobile={isMobile} onClick={fetchAIRecommendation}><SparkI s={14} c={C.bg} /> Get Recommendation</Btn>
          </div>}
          {aiLoading && <div style={{ textAlign: 'center', padding: '30px 0' }}><div style={{ fontSize: 13, color: C.mid }}>Analyzing conditions...</div><div style={{ marginTop: 10, fontSize: 20 }}>{'\u23F3'}</div></div>}
          {aiError && <div style={{ textAlign: 'center', padding: '20px 0' }}><div style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{aiError}</div><Btn small isMobile={isMobile} onClick={fetchAIRecommendation}>Retry</Btn></div>}
          {aiResponse && <>
            <div style={{ background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.cyan, fontWeight: 700, marginBottom: 6 }}>{'\uD83C\uDFAF'} #1 Spot</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{aiResponse.spot1?.name}</div>
              <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.6, margin: 0 }}>{aiResponse.spot1?.reason}</p>
            </div>
            <div style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}20`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.teal, fontWeight: 700, marginBottom: 6 }}>{'\uD83E\uDD48'} #2 Spot</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{aiResponse.spot2?.name}</div>
              <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.6, margin: 0 }}>{aiResponse.spot2?.reason}</p>
            </div>
            <div style={{ background: C.card2, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.green, fontWeight: 700, marginBottom: 6 }}>{'\uD83C\uDFA3'} Lures & Down South Colors</div>
              <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.6, margin: 0 }}>{aiResponse.lures}</p>
            </div>
            <div style={{ background: C.card2, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.cyan, fontWeight: 700, marginBottom: 6 }}>{'\uD83C\uDF0A'} Strategy</div>
              <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, margin: 0 }}>{aiResponse.strategy}</p>
            </div>
            {aiResponse.tide_tip && <div style={{ background: `${C.blue}08`, border: `1px solid ${C.blue}20`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.blue, fontWeight: 700, marginBottom: 6 }}>{'\u23F1\uFE0F'} Tide Timing</div>
              <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, margin: 0 }}>{aiResponse.tide_tip}</p>
            </div>}
            <div style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}20`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.amber, fontWeight: 700, marginBottom: 6 }}>{'\u26A0\uFE0F'} Avoid</div>
              <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, margin: 0 }}>{aiResponse.avoid}</p>
            </div>
            <Btn small isMobile={isMobile} onClick={fetchAIRecommendation} style={{ width: '100%' }}><SparkI s={12} /> Refresh</Btn>
          </>}
        </div>}
      </Modal>}

      {showEditor && <Modal title="Map Editor Pro" sub="Add spots, launches, zones \u2014 saved to your device" onClose={() => { setShowEditor(false); }} wide isMobile={isMobile}>
        <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: C.green }}>
          All changes you make here are automatically saved to your device. Close this editor and use Edit mode on the map to add markers by right-clicking (or long-pressing on mobile).
        </div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 8 }}>You have {allSpots.filter((s) => s.userAdded).length} custom spots, {launches.filter((l) => l.userAdded).length} custom launches, {shadeZones.filter((z) => z.userAdded).length} custom zones, {wadeLines.filter((w) => w.userAdded).length} custom wade lines saved.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn small isMobile={isMobile} onClick={() => { const gpx = generateGPX(allSpots.filter((s) => s.bay === (selBay?.id || 'matagorda'))); downloadFile(gpx, 'texastides-spots.gpx'); showT('GPX exported!'); }}><DownloadI s={12} /> Export GPX</Btn>
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

      {/* WAYPOINT ACTION BOTTOM SHEET */}
      {waypointSheet && <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setWaypointSheet(null)}>
        <div style={{ background: C.card, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, padding: '12px 16px 24px', boxShadow: '0 -4px 30px #000a' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{waypointSheet.data.name}</div>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 16 }}>{waypointSheet.data.lat?.toFixed(4)}, {waypointSheet.data.lng?.toFixed(4)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {waypointSheet.data.userAdded && <>
              <button onClick={handleWaypointMove} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: C.card2, border: `1px solid ${C.bdr}`, color: C.txt, cursor: 'pointer', fontFamily: Fnt, fontSize: 15, fontWeight: 600 }}><MoveI s={20} c={C.cyan} /> Move</button>
              <button onClick={() => { setRenameInput(waypointSheet.data.name); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: C.card2, border: `1px solid ${C.bdr}`, color: C.txt, cursor: 'pointer', fontFamily: Fnt, fontSize: 15, fontWeight: 600 }}><EditI s={20} c={C.amber} /> Rename</button>
              {renameInput !== '' && <div style={{ display: 'flex', gap: 8, padding: '0 0 4px' }}>
                <input value={renameInput} onChange={(e) => setRenameInput(e.target.value)} autoFocus style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: C.card2, border: `1px solid ${C.bdr}`, color: C.txt, fontSize: 15, fontFamily: Fnt, outline: 'none' }} />
                <button onClick={handleWaypointRename} style={{ padding: '10px 16px', borderRadius: 8, background: C.cyan, border: 'none', color: C.bg, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: Fnt }}>Save</button>
              </div>}
              <button onClick={handleWaypointDelete} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: `${C.red}10`, border: `1px solid ${C.red}30`, color: C.red, cursor: 'pointer', fontFamily: Fnt, fontSize: 15, fontWeight: 600 }}><TrashI s={20} c={C.red} /> Delete</button>
            </>}
            {!waypointSheet.data.userAdded && <div style={{ padding: '10px 0', fontSize: 13, color: C.dim, textAlign: 'center' }}>Built-in spot \u2014 view only</div>}
            {waypointSheet.type === 'spot' && <button onClick={handleWaypointNavigate} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, color: C.teal, cursor: 'pointer', fontFamily: Fnt, fontSize: 15, fontWeight: 600 }}><NavI s={20} c={C.teal} /> Navigate Here</button>}
          </div>
        </div>
      </div>}

      {/* SAVE/CANCEL BAR for unsaved edits */}
      {pendingEdits && <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1500, background: C.card, borderTop: `2px solid ${C.amber}`, padding: '12px 16px', display: 'flex', gap: 10, justifyContent: 'center', boxShadow: '0 -4px 20px #000a' }}>
        <button onClick={handleCancelPendingEdits} style={{ flex: 1, padding: '14px 20px', borderRadius: 12, background: C.card2, border: `1px solid ${C.bdr}`, color: C.mid, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: Fnt }}>Cancel</button>
        <button onClick={handleSavePendingEdits} style={{ flex: 1, padding: '14px 20px', borderRadius: 12, background: `linear-gradient(135deg,${C.cyan},${C.teal})`, border: 'none', color: C.bg, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: Fnt }}><SaveI s={16} c={C.bg} /> Save</button>
      </div>}
    </div>
  );
}
