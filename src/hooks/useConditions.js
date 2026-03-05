import { useState, useEffect, useCallback, useRef } from 'react';

// ─── NOAA TIDE STATIONS ───
const TIDE_STATIONS = {
  matagorda: { id: '8773037', name: 'Matagorda City' },
  galveston: { id: '8771341', name: 'Galveston Bay Entrance' },
};

// ─── MOON PHASE (pure math, no API) ───
export function getMoonPhase(date = new Date()) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();
  // Trig-based moon phase calculation
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

// Moon phase fishing quality
export function moonFishingRating(phase) {
  // New moon and full moon = best fishing (major solunar periods)
  const ratings = [5, 3, 2, 3, 5, 3, 2, 3]; // new, wax cres, 1st q, wax gib, full, wan gib, last q, wan cres
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

  // Fetch tide predictions (hi/lo)
  const hiloUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${fmt(start)}&end_date=${fmt(end)}&station=${stationId}&product=predictions&datum=MLLW&interval=hilo&units=english&time_zone=lst_ldt&application=TexasTides&format=json`;

  // Fetch hourly water level predictions for current state
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

    // Determine current tide state
    const nowTime = now.getTime();
    let currentHeight = null;
    let tideState = 'unknown';
    let nextTide = null;
    let prevTide = null;

    // Find closest hourly reading for current height
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

    // Tide strength (0-1) based on position between prev and next
    let tideStrength = 0.5;
    if (prevTide && nextTide) {
      const total = nextTide.time.getTime() - prevTide.time.getTime();
      const elapsed = nowTime - prevTide.time.getTime();
      const progress = elapsed / total;
      // Strongest in the middle of the tide cycle
      tideStrength = Math.sin(progress * Math.PI);
    }

    return {
      predictions,
      hourly,
      currentHeight: currentHeight ? Math.round(currentHeight * 100) / 100 : null,
      tideState,
      tideStrength: Math.round(tideStrength * 100) / 100,
      nextTide,
      prevTide,
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

    // WMO weather code to description
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

    // Wind direction to compass
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

// ─── OPEN-METEO MARINE FETCH (wave/swell) ───
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
    // Marine data may not be available for inland bays
    console.warn('Marine fetch failed (normal for bays):', err);
    return null;
  }
}

// ─── FISHING REPORTS FRAMEWORK ───
// Placeholder for 2CoolFishing scraping - would need a backend proxy
// For now, returns cached sample data with framework for future API
async function fetchFishingReports(bayId) {
  // In production, this would hit a backend that scrapes 2coolfishing.com
  // and texassaltwater.com fishing reports
  const reports = {
    matagorda: [
      { source: '2Cool Fishing', time: 'Today 6:14 AM', user: 'BayRat42', text: 'Solid box of trout on topwater at Shell Island. Hit em hard from 6-9 on incoming. She Dogs and Spook Jrs.', species: ['Trout'], area: 'Shell Island' },
      { source: '2Cool Fishing', time: 'Yesterday', user: 'WadeKing', text: 'Reds stacked on the river mouth sand bar. Gold spoon was money. All slot fish.', species: ['Redfish'], area: 'River Mouth' },
      { source: 'TX Parks & Wildlife', time: '2 days ago', user: 'TPWD Report', text: 'Good numbers of trout and redfish in East Matagorda. Wade fishing producing best results around shell pads on incoming tides.', species: ['Trout', 'Redfish'], area: 'East Matagorda' },
      { source: '2Cool Fishing', time: '3 days ago', user: 'KayakJen', text: '4 nice reds on Gulp in Oyster Lake back. Kayak access only. Tailing fish in knee-deep water.', species: ['Redfish'], area: 'Oyster Lake' },
    ],
    galveston: [
      { source: '2Cool Fishing', time: 'Today 7:30 AM', user: 'DikeFisher', text: 'Sheepshead on fire at dike rocks. Fiddler crabs are the ticket. 8 keepers by 10 AM.', species: ['Sheepshead'], area: 'Dike Rocks' },
      { source: '2Cool Fishing', time: 'Yesterday', user: 'TrophyHunter', text: 'Caught a 28" trout on topwater near Dollar Reef at sunrise. Best bite was first hour.', species: ['Trout'], area: 'Dollar Reef' },
      { source: 'TX Parks & Wildlife', time: '2 days ago', user: 'TPWD Report', text: 'West Galveston Bay producing slot reds in grass lines. Gulp shrimp under popping cork best method.', species: ['Redfish'], area: 'West Bay' },
      { source: '2Cool Fishing', time: '4 days ago', user: 'BayBum', text: 'Flounder run starting in San Luis Pass. Berkley Gulp chartreuse on jighead. 5 keepers.', species: ['Flounder'], area: 'San Luis Pass' },
    ],
  };
  // Simulate network delay
  return reports[bayId] || [];
}

// ─── CURRENT/WAVE ARROWS DATA ───
// Calculate bay current vectors based on wind + tide
export function calculateCurrents(windDir, windSpeed, tideState, tideStrength, bayId) {
  // Wind-driven current is ~3% of wind speed, deflected ~15° to the right (Northern Hemisphere)
  const windCurrentSpeed = windSpeed * 0.03; // knots
  const windCurrentDir = (windDir + 15) % 360; // Ekman deflection

  // Tide current direction depends on bay geography
  // Matagorda: incoming flows NW into bay, outgoing flows SE toward pass
  // Galveston: incoming flows W into bay, outgoing flows E toward jetties
  const tideAngles = {
    matagorda: { incoming: 315, outgoing: 135 }, // NW in, SE out
    galveston: { incoming: 270, outgoing: 90 }, // W in, E out
  };

  const tideAngle = tideAngles[bayId]?.[tideState] || 0;
  const tideCurrentSpeed = tideStrength * 1.5; // max ~1.5 knots at peak tide

  // Combine wind and tide currents (vector addition)
  const windRad = (windCurrentDir * Math.PI) / 180;
  const tideRad = (tideAngle * Math.PI) / 180;

  const wx = windCurrentSpeed * Math.sin(windRad);
  const wy = windCurrentSpeed * Math.cos(windRad);
  const tx = tideCurrentSpeed * Math.sin(tideRad);
  const ty = tideCurrentSpeed * Math.cos(tideRad);

  const totalX = wx + tx;
  const totalY = wy + ty;
  const totalSpeed = Math.sqrt(totalX * totalX + totalY * totalY);
  const totalDir = ((Math.atan2(totalX, totalY) * 180) / Math.PI + 360) % 360;

  // Generate arrow positions across the bay
  const arrows = [];
  for (let gx = 15; gx <= 85; gx += 15) {
    for (let gy = 25; gy <= 75; gy += 15) {
      // Vary speed slightly by position (edges slower)
      const edgeFactor = Math.min(gx, 100 - gx, gy, 100 - gy) / 25;
      const localSpeed = totalSpeed * Math.min(1, edgeFactor);
      if (localSpeed > 0.05) {
        arrows.push({
          x: gx + (Math.random() - 0.5) * 4,
          y: gy + (Math.random() - 0.5) * 4,
          dir: totalDir + (Math.random() - 0.5) * 20,
          speed: localSpeed,
        });
      }
    }
  }

  return {
    windCurrent: { speed: windCurrentSpeed, dir: windCurrentDir },
    tideCurrent: { speed: tideCurrentSpeed, dir: tideAngle },
    combined: { speed: Math.round(totalSpeed * 100) / 100, dir: Math.round(totalDir) },
    arrows,
    tideState,
  };
}

// ─── MAIN HOOK ───
export function useConditions(bayId) {
  const [tides, setTides] = useState(null);
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
    const station = TIDE_STATIONS[bayId] || TIDE_STATIONS.matagorda;

    const [tideData, weatherData, marineData, reportData] = await Promise.all([
      fetchTides(station.id),
      fetchWeather(coords.lat, coords.lng),
      fetchMarine(coords.lat, coords.lng),
      fetchFishingReports(bayId),
    ]);

    setTides(tideData);
    setWeather(weatherData);
    setMarine(marineData);
    setReports(reportData);
    setLastFetch(new Date());
    setLoading(false);
  }, [bayId]);

  // Fetch on mount and when bay changes
  useEffect(() => {
    fetchAll();
    // Refresh every 15 minutes
    intervalRef.current = setInterval(fetchAll, 15 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  const moon = getMoonPhase();
  const moonRating = moonFishingRating(moon.phase);

  // Calculate currents if we have wind + tide data
  const currents = useMemo(() => {
    if (!weather || !tides) return null;
    return calculateCurrents(
      weather.windDir, weather.windSpeed,
      tides.tideState, tides.tideStrength,
      bayId
    );
  }, [weather, tides, bayId]);

  return {
    tides,
    weather,
    marine,
    reports,
    moon,
    moonRating,
    currents,
    loading,
    lastFetch,
    refresh: fetchAll,
  };
}
