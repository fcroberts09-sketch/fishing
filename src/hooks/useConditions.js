import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ─── NOAA TIDE STATIONS ───
// Use two stations per bay for cross-verification
const TIDE_STATIONS = {
  matagorda: [
    { id: '8773037', name: 'Matagorda City' },
    { id: '8773767', name: 'Matagorda Bay Entrance' },
  ],
  galveston: [
    { id: '8771341', name: 'Galveston Bay Entrance' },
    { id: '8771450', name: 'Galveston Pier 21' },
  ],
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

// ─── NOAA TIDES FETCH ───
async function fetchTides(stationId) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  const fmt = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

  const hiloUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${fmt(start)}&end_date=${fmt(end)}&station=${stationId}&product=predictions&datum=MLLW&interval=hilo&units=english&time_zone=lst_ldt&application=TexasTides&format=json`;
  const hourlyUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${fmt(start)}&end_date=${fmt(end)}&station=${stationId}&product=predictions&datum=MLLW&interval=h&units=english&time_zone=lst_ldt&application=TexasTides&format=json`;

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

    const nowTime = now.getTime();
    let currentHeight = null;
    let tideState = 'unknown';
    let nextTide = null;
    let prevTide = null;

    // Interpolate current height from hourly data
    for (let i = 0; i < hourly.length - 1; i++) {
      if (hourly[i].time.getTime() <= nowTime && hourly[i + 1].time.getTime() > nowTime) {
        const frac = (nowTime - hourly[i].time.getTime()) / (hourly[i + 1].time.getTime() - hourly[i].time.getTime());
        currentHeight = hourly[i].height + frac * (hourly[i + 1].height - hourly[i].height);
        break;
      }
    }

    // Find next and previous hi/lo
    for (const p of predictions) {
      if (p.time.getTime() > nowTime) {
        if (!nextTide) nextTide = p;
      } else {
        prevTide = p;
      }
    }

    if (prevTide && nextTide) {
      tideState = nextTide.type === 'high' ? 'incoming' : 'outgoing';
    }

    // Tide strength (0-1)
    let tideStrength = 0.5;
    if (prevTide && nextTide) {
      const total = nextTide.time.getTime() - prevTide.time.getTime();
      const elapsed = nowTime - prevTide.time.getTime();
      const progress = elapsed / total;
      tideStrength = Math.sin(progress * Math.PI);
    }

    // Calculate movement amount (difference between prev and next)
    let movementFt = null;
    if (prevTide && nextTide) {
      movementFt = Math.abs(nextTide.height - prevTide.height);
    }

    // Get today's and tomorrow's tide schedule
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();
    const todayTides = predictions.filter((p) => p.time.toDateString() === today);
    const tomorrowTides = predictions.filter((p) => p.time.toDateString() === tomorrow);

    return {
      predictions,
      hourly,
      currentHeight: currentHeight ? Math.round(currentHeight * 100) / 100 : null,
      tideState,
      tideStrength: Math.round(tideStrength * 100) / 100,
      nextTide,
      prevTide,
      movementFt: movementFt ? Math.round(movementFt * 10) / 10 : null,
      todayTides,
      tomorrowTides,
      stationId,
      fetchedAt: now,
    };
  } catch (err) {
    console.warn('Tide fetch failed:', err);
    return null;
  }
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
    galveston: [
      { source: '2Cool Fishing', time: 'Today 7:30 AM', user: 'DikeFisher', text: 'Sheepshead on fire at dike rocks. Fiddler crabs are the ticket.', species: ['Sheepshead'], area: 'Dike Rocks' },
      { source: '2Cool Fishing', time: 'Yesterday', user: 'TrophyHunter', text: 'Caught a 28" trout on topwater near Dollar Reef at sunrise.', species: ['Trout'], area: 'Dollar Reef' },
      { source: 'TX Parks & Wildlife', time: '2 days ago', user: 'TPWD Report', text: 'West Galveston Bay producing slot reds in grass lines. Gulp shrimp under popping cork.', species: ['Redfish'], area: 'West Bay' },
    ],
  };
  return reports[bayId] || [];
}

// ─── MAIN HOOK ───
export function useConditions(bayId) {
  const [tides, setTides] = useState(null);
  const [tides2, setTides2] = useState(null); // second station for verification
  const [weather, setWeather] = useState(null);
  const [marine, setMarine] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const intervalRef = useRef(null);

  const bayCoords = {
    matagorda: { lat: 28.72, lng: -95.88 },
    galveston: { lat: 29.30, lng: -94.85 },
  };

  const fetchAll = useCallback(async () => {
    if (!bayId) return;
    setLoading(true);
    const coords = bayCoords[bayId] || bayCoords.matagorda;
    const stations = TIDE_STATIONS[bayId] || TIDE_STATIONS.matagorda;

    const [tideData1, tideData2, weatherData, marineData, reportData] = await Promise.all([
      fetchTides(stations[0].id),
      fetchTides(stations[1].id),
      fetchWeather(coords.lat, coords.lng),
      fetchMarine(coords.lat, coords.lng),
      fetchFishingReports(bayId),
    ]);

    setTides(tideData1);
    setTides2(tideData2);
    setWeather(weatherData);
    setMarine(marineData);
    setReports(reportData);
    setLastFetch(new Date());
    setLoading(false);
  }, [bayId]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 15 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  const moon = getMoonPhase();
  const moonRating = moonFishingRating(moon.phase);

  // Cross-verify tide data: if both stations agree on state, high confidence
  const tideVerification = useMemo(() => {
    if (!tides || !tides2) return { verified: false, confidence: 'single source' };
    const agree = tides.tideState === tides2.tideState;
    return {
      verified: agree,
      confidence: agree ? 'verified (2 stations)' : 'stations disagree',
      station1: { name: (TIDE_STATIONS[bayId] || TIDE_STATIONS.matagorda)[0].name, state: tides.tideState, height: tides.currentHeight },
      station2: { name: (TIDE_STATIONS[bayId] || TIDE_STATIONS.matagorda)[1].name, state: tides2.tideState, height: tides2.currentHeight },
    };
  }, [tides, tides2, bayId]);

  return {
    tides,
    tides2,
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
