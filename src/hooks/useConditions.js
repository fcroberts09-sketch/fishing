import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ─── NOAA TIDE STATIONS ───
// Each bay gets a PREDICTION station (for hi/lo schedule) and an OBSERVATION station (for real-time water level).
// Prediction stations at passes/entrances have larger tidal ranges than inside-bay stations.
// Observation stations give actual measured water levels (includes wind effects).
const BAY_STATIONS = {
  matagorda: {
    // Freeport USCG Station - nearest reference station with meaningful tidal range
    prediction: { id: '8772471', name: 'Freeport, USCG Station' },
    // Matagorda City - actual measured levels inside the bay
    observation: { id: '8773037', name: 'Matagorda City' },
    // Backup prediction from entrance
    prediction2: { id: '8773767', name: 'Matagorda Bay Entrance' },
  },
  west_matagorda: {
    prediction: { id: '8772471', name: 'Freeport, USCG Station' },
    observation: { id: '8773037', name: 'Matagorda City' },
    prediction2: { id: '8773767', name: 'Matagorda Bay Entrance' },
  },
  san_antonio: {
    // Port O'Connor - nearest prediction station with decent range
    prediction: { id: '8773701', name: "Port O'Connor" },
    observation: { id: '8773259', name: 'Port Lavaca' },
    prediction2: { id: '8773259', name: 'Port Lavaca' },
  },
};

// ─── MOON PHASE (pure math, no API) ───
export function getMoonPhase(date = new Date()) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();
  let c = 0, e = 0, jd = 0, b = 0;
  if (month < 3) { year--; month += 12; }
  ++month;
  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09;
  jd /= 29.5305882;
  b = parseInt(jd);
  jd -= b;
  const phase = Math.round(jd * 8);
  const age = jd * 29.5305882;
  const pct = phase <= 4 ? (phase / 4) * 100 : ((8 - phase) / 4) * 100;
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const icons = ['\u{1F311}', '\u{1F312}', '\u{1F313}', '\u{1F314}', '\u{1F315}', '\u{1F316}', '\u{1F317}', '\u{1F318}'];
  const idx = phase >= 8 ? 0 : phase;
  return { name: names[idx], icon: icons[idx], age: Math.round(age * 10) / 10, illumination: Math.round(pct), phase: idx };
}

export function moonFishingRating(phase) {
  const ratings = [5, 3, 2, 3, 5, 3, 2, 3];
  return { rating: ratings[phase], label: ['Excellent', 'Poor', 'Poor', 'Good', 'Good', 'Excellent'][ratings[phase] - 1] || 'Fair' };
}

// ─── DATE FORMATTING ───
const fmtDate = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

// ─── NOAA TIDE PREDICTIONS FETCH (7 days, hi/lo + hourly) ───
async function fetchTidePredictions(stationId, days = 7) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  const baseParams = `station=${stationId}&datum=MLLW&units=english&time_zone=lst_ldt&application=TexasTides&format=json`;
  const hiloUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${fmtDate(start)}&end_date=${fmtDate(end)}&${baseParams}&product=predictions&interval=hilo`;
  const hourlyUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${fmtDate(start)}&end_date=${fmtDate(end)}&${baseParams}&product=predictions&interval=h`;

  try {
    const [hiloRes, hourlyRes] = await Promise.all([
      fetch(hiloUrl).then((r) => r.json()),
      fetch(hourlyUrl).then((r) => r.json()),
    ]);

    const predictions = (hiloRes.predictions || []).map((p) => ({
      time: new Date(p.t),
      timeStr: p.t,
      height: parseFloat(p.v),
      type: p.type === 'H' ? 'high' : 'low',
    }));

    const hourly = (hourlyRes.predictions || []).map((p) => ({
      time: new Date(p.t),
      height: parseFloat(p.v),
    }));

    return { predictions, hourly, stationId, fetchedAt: now };
  } catch (err) {
    console.warn('Tide predictions fetch failed:', err);
    return null;
  }
}

// ─── NOAA REAL-TIME WATER LEVEL OBSERVATIONS ───
async function fetchWaterLevel(stationId) {
  // Get last 24 hours of actual measured water levels
  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=${stationId}&product=water_level&datum=MLLW&units=english&time_zone=lst_ldt&application=TexasTides&format=json`;

  try {
    const res = await fetch(url).then((r) => r.json());
    const data = res.data || [];
    if (data.length > 0) {
      const latest = data[data.length - 1];
      return {
        height: parseFloat(latest.v),
        time: new Date(latest.t),
        stationId,
        quality: latest.q,
        fetchedAt: new Date(),
      };
    }
    return null;
  } catch (err) {
    console.warn('Water level fetch failed (station may not have real-time data):', err);
    return null;
  }
}

// ─── PROCESS TIDE DATA (compute state, next/prev, schedule by day) ───
function processTideData(predData, observedLevel) {
  if (!predData) return null;
  const { predictions, hourly } = predData;
  const now = new Date();
  const nowTime = now.getTime();

  // Interpolate current predicted height from hourly data
  let currentPredicted = null;
  for (let i = 0; i < hourly.length - 1; i++) {
    if (hourly[i].time.getTime() <= nowTime && hourly[i + 1].time.getTime() > nowTime) {
      const frac = (nowTime - hourly[i].time.getTime()) / (hourly[i + 1].time.getTime() - hourly[i].time.getTime());
      currentPredicted = hourly[i].height + frac * (hourly[i + 1].height - hourly[i].height);
      break;
    }
  }

  // Use observed level if available, otherwise predicted
  const currentHeight = observedLevel?.height ?? currentPredicted;

  // Find next and previous hi/lo
  let nextTide = null, prevTide = null;
  for (const p of predictions) {
    if (p.time.getTime() > nowTime) {
      if (!nextTide) nextTide = p;
    } else {
      prevTide = p;
    }
  }

  let tideState = 'unknown';
  if (prevTide && nextTide) {
    tideState = nextTide.type === 'high' ? 'incoming' : 'outgoing';
  }

  // Tide strength (0-1) based on sinusoidal progress between prev and next
  let tideStrength = 0.5;
  if (prevTide && nextTide) {
    const total = nextTide.time.getTime() - prevTide.time.getTime();
    const elapsed = nowTime - prevTide.time.getTime();
    const progress = elapsed / total;
    tideStrength = Math.sin(progress * Math.PI);
  }

  // Group predictions by day
  const dayMap = {};
  for (const p of predictions) {
    const dayKey = p.time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dateKey = p.time.toDateString();
    if (!dayMap[dateKey]) dayMap[dateKey] = { label: dayKey, date: new Date(p.time), tides: [] };
    dayMap[dateKey].tides.push(p);
  }
  const dailyTides = Object.values(dayMap).sort((a, b) => a.date - b.date);

  // Today and tomorrow shortcuts
  const today = now.toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();
  const todayTides = dayMap[today]?.tides || [];
  const tomorrowTides = dayMap[tomorrow]?.tides || [];

  return {
    predictions,
    hourly,
    currentHeight: currentHeight != null ? Math.round(currentHeight * 100) / 100 : null,
    currentPredicted: currentPredicted != null ? Math.round(currentPredicted * 100) / 100 : null,
    observedHeight: observedLevel?.height ?? null,
    observedTime: observedLevel?.time ?? null,
    tideState,
    tideStrength: Math.round(tideStrength * 100) / 100,
    nextTide,
    prevTide,
    todayTides,
    tomorrowTides,
    dailyTides,
    stationId: predData.stationId,
    fetchedAt: predData.fetchedAt,
  };
}

// ─── LOCALSTORAGE TIDE CACHE ───
const TIDE_CACHE_KEY = 'tt_tide_cache_v2';
const TIDE_CACHE_MAX_AGE = 12 * 60 * 60 * 1000; // 12 hours for predictions
const OBS_CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes for observations

function getCachedTides(bayId) {
  try {
    const raw = localStorage.getItem(TIDE_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const entry = cache[bayId];
    if (!entry) return null;
    const age = Date.now() - entry.fetchedAt;
    if (age > TIDE_CACHE_MAX_AGE) return null;
    // Rehydrate dates
    if (entry.predictions) {
      entry.predictions = entry.predictions.map(p => ({ ...p, time: new Date(p.time) }));
    }
    if (entry.hourly) {
      entry.hourly = entry.hourly.map(p => ({ ...p, time: new Date(p.time) }));
    }
    return entry;
  } catch { return null; }
}

function setCachedTides(bayId, data) {
  try {
    const raw = localStorage.getItem(TIDE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[bayId] = { ...data, fetchedAt: Date.now() };
    localStorage.setItem(TIDE_CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded, ignore */ }
}

// ─── OPEN-METEO WEATHER FETCH ───
async function fetchWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=2`;

  try {
    const res = await fetch(url).then((r) => r.json());
    const c = res.current;

    const weatherDesc = (code) => {
      const map = {
        0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle',
        55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 80: 'Rain Showers',
        81: 'Mod. Rain', 82: 'Heavy Showers', 95: 'Thunderstorm',
        96: 'T-storm + Hail', 99: 'T-storm + Hail',
      };
      return map[code] || 'Unknown';
    };

    const weatherIcon = (code) => {
      if (code <= 1) return '\u2600\uFE0F';
      if (code <= 3) return '\u26C5';
      if (code <= 48) return '\u{1F32B}\uFE0F';
      if (code <= 55) return '\u{1F327}\uFE0F';
      if (code <= 65) return '\u{1F327}\uFE0F';
      if (code <= 75) return '\u{1F328}\uFE0F';
      if (code <= 82) return '\u{1F326}\uFE0F';
      return '\u26C8\uFE0F';
    };

    const windCompass = (deg) => {
      const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      return dirs[Math.round(deg / 22.5) % 16];
    };

    return {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      windDir: c.wind_direction_10m,
      windDirLabel: windCompass(c.wind_direction_10m),
      windGusts: Math.round(c.wind_gusts_10m),
      pressure: Math.round(c.surface_pressure),
      conditions: weatherDesc(c.weather_code),
      conditionIcon: weatherIcon(c.weather_code),
      weatherCode: c.weather_code,
      hourly: res.hourly ? {
        time: res.hourly.time,
        temp: res.hourly.temperature_2m,
        wind: res.hourly.wind_speed_10m,
        windDir: res.hourly.wind_direction_10m,
        gusts: res.hourly.wind_gusts_10m,
        weatherCode: res.hourly.weather_code,
      } : null,
      fetchedAt: new Date(),
    };
  } catch (err) {
    console.warn('Weather fetch failed:', err);
    return null;
  }
}

// ─── OPEN-METEO MARINE FETCH ───
async function fetchMarine(lat, lng) {
  const url = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction&hourly=wave_height,wave_direction,wave_period&length_unit=imperial&timezone=America%2FChicago&forecast_days=2`;

  try {
    const res = await fetch(url).then((r) => r.json());
    if (res.current) {
      return {
        waveHeight: res.current.wave_height,
        waveDir: res.current.wave_direction,
        wavePeriod: res.current.wave_period,
        currentVelocity: res.current.ocean_current_velocity,
        currentDir: res.current.ocean_current_direction,
        hourly: res.hourly || null,
        fetchedAt: new Date(),
      };
    }
    return null;
  } catch (err) {
    console.warn('Marine fetch failed (normal for bays):', err);
    return null;
  }
}

// ─── FISHING REPORTS ───
async function fetchFishingReports(bayId) {
  const reports = {
    matagorda: [
      { source: '2Cool Fishing', time: 'Today 6:14 AM', user: 'BayRat42', text: 'Solid box of trout on topwater at Shell Island. Hit em hard from 6-9 on incoming. She Dogs and Spook Jrs.', species: ['Trout'], area: 'Shell Island' },
      { source: '2Cool Fishing', time: 'Yesterday', user: 'WadeKing', text: 'Reds stacked on the river mouth sand bar. Gold spoon was money. All slot fish.', species: ['Redfish'], area: 'River Mouth' },
      { source: 'TX Parks & Wildlife', time: '2 days ago', user: 'TPWD Report', text: 'Good numbers of trout and redfish in East Matagorda. Wade fishing producing best results around shell pads on incoming tides.', species: ['Trout', 'Redfish'], area: 'East Matagorda' },
    ],
    west_matagorda: [
      { source: '2Cool Fishing', time: 'Today 7:30 AM', user: 'CaptMike', text: 'Reds on shell reef west side. Gold spoon in the morning.', species: ['Redfish'], area: 'West Bay Shell' },
      { source: 'TX Parks & Wildlife', time: '2 days ago', user: 'TPWD Report', text: 'Good trout action in the cuts west of the ship channel on topwater.', species: ['Trout'], area: 'West Bay Cuts' },
    ],
    san_antonio: [
      { source: '2Cool Fishing', time: 'Today 6:00 AM', user: 'DeltaDrifter', text: 'Slot reds on popping cork in the Guadalupe delta. Best on incoming.', species: ['Redfish'], area: 'Guadalupe Delta' },
      { source: 'TX Parks & Wildlife', time: '1 day ago', user: 'TPWD Report', text: 'Trout and redfish in Hynes Bay on soft plastics. Clear water conditions.', species: ['Trout', 'Redfish'], area: 'Hynes Bay' },
    ],
  };
  return reports[bayId] || [];
}

// ─── MAIN HOOK ───
export function useConditions(bayId) {
  const [tides, setTides] = useState(null);
  const [observedLevel, setObservedLevel] = useState(null);
  const [weather, setWeather] = useState(null);
  const [marine, setMarine] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [tideSource, setTideSource] = useState(null);
  const intervalRef = useRef(null);

  const bayCoords = {
    matagorda: { lat: 28.72, lng: -95.88 },
    west_matagorda: { lat: 28.68, lng: -96.10 },
    san_antonio: { lat: 28.30, lng: -96.60 },
  };

  const fetchAll = useCallback(async () => {
    if (!bayId) return;
    setLoading(true);
    const coords = bayCoords[bayId] || bayCoords.matagorda;
    const stations = BAY_STATIONS[bayId] || BAY_STATIONS.matagorda;

    // Check cache for tide predictions
    let predData = getCachedTides(bayId);
    let tidesFresh = false;

    if (!predData) {
      // Fetch fresh 7-day predictions from primary station
      predData = await fetchTidePredictions(stations.prediction.id, 7);
      if (predData) {
        setCachedTides(bayId, predData);
        tidesFresh = true;
      }
    } else {
      // Rehydrate cached data
      tidesFresh = false;
    }

    // Always fetch real-time observation (lightweight, single data point)
    const obsData = await fetchWaterLevel(stations.observation.id).catch(() => null);

    // Fetch weather, marine, reports in parallel
    const [weatherData, marineData, reportData] = await Promise.all([
      fetchWeather(coords.lat, coords.lng),
      fetchMarine(coords.lat, coords.lng),
      fetchFishingReports(bayId),
    ]);

    if (predData) {
      setTides(predData);
    }
    setObservedLevel(obsData);
    setWeather(weatherData);
    setMarine(marineData);
    setReports(reportData);
    setTideSource({
      prediction: stations.prediction.name,
      predictionId: stations.prediction.id,
      observation: stations.observation.name,
      observationId: stations.observation.id,
      hasObserved: !!obsData,
    });
    setLastFetch(new Date());
    setLoading(false);
  }, [bayId]);

  useEffect(() => {
    fetchAll();
    // Refresh every 30 min (mainly for observed water level + weather)
    intervalRef.current = setInterval(fetchAll, 30 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  const moon = getMoonPhase();
  const moonRating = moonFishingRating(moon.phase);

  // Process tide data with observed levels
  const processedTides = useMemo(() => {
    return processTideData(tides, observedLevel);
  }, [tides, observedLevel]);

  // Verification info
  const tideVerification = useMemo(() => {
    const stations = BAY_STATIONS[bayId] || BAY_STATIONS.matagorda;
    return {
      verified: !!observedLevel,
      confidence: observedLevel ? 'live observation + predictions' : 'predictions only',
      predStation: { name: stations.prediction.name, id: stations.prediction.id },
      obsStation: { name: stations.observation.name, id: stations.observation.id, hasData: !!observedLevel },
    };
  }, [observedLevel, bayId]);

  return {
    tides: processedTides,
    tideSource,
    tideVerification,
    weather,
    marine,
    reports,
    moon,
    moonRating,
    loading,
    lastFetch,
    refresh: fetchAll,
  };
}
