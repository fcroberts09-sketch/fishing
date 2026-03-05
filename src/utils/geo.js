// Haversine distance in nautical miles
export function haversineNM(lat1, lng1, lat2, lng2) {
  const R = 3440.065;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1),
    dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function calcBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function bearingLabel(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Parse DMS coordinates like "28 43 24.1 N 95 52 36.2 W"
export const parseDMS = (dms) => {
  const parts = dms.replace(/[\u00B0\u2032\u2033]/g, ' ').replace(/['"]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 4) {
    const lat = parseFloat(parts[0]) + parseFloat(parts[1] || 0) / 60 + parseFloat(parts[2] || 0) / 3600;
    const latDir = parts[3]?.toUpperCase();
    let lng, lngDir;
    if (parts.length >= 8) {
      lng = parseFloat(parts[4]) + parseFloat(parts[5] || 0) / 60 + parseFloat(parts[6] || 0) / 3600;
      lngDir = parts[7]?.toUpperCase();
    } else if (parts.length >= 6) {
      lng = parseFloat(parts[4]) + parseFloat(parts[5] || 0) / 60;
      lngDir = parts[6]?.toUpperCase();
    }
    return { lat: latDir === 'S' ? -lat : lat, lng: lngDir === 'W' ? -lng : lng };
  }
  return null;
};

export const parseDecimal = (input) => {
  const clean = input.replace(/[\u00B0NSEW,]/gi, ' ').trim().split(/\s+/);
  if (clean.length >= 2) {
    let lat = parseFloat(clean[0]),
      lng = parseFloat(clean[1]);
    if (input.match(/[Ss]/)) lat = -Math.abs(lat);
    if (input.match(/[Ww]/)) lng = -Math.abs(lng);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return null;
};

export const parseGPS = (input) => {
  if (!input) return null;
  return parseDecimal(input) || parseDMS(input);
};

export const formatGPS = (lat, lng) => {
  const la = Math.abs(lat).toFixed(4);
  const lo = Math.abs(lng).toFixed(4);
  return `${la}\u00B0${lat >= 0 ? 'N' : 'S'}, ${lo}\u00B0${lng <= 0 ? 'W' : 'E'}`;
};
