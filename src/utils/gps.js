// EXIF GPS extraction
export const extractPhotoGPS = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result);
        if (view.getUint16(0) !== 0xffd8) { resolve(null); return; }
        let offset = 2;
        while (offset < view.byteLength) {
          if (view.getUint16(offset) === 0xffe1) {
            const exifData = parseExifGPS(view, offset + 4);
            resolve(exifData);
            return;
          }
          offset += 2 + view.getUint16(offset + 2);
        }
        resolve(null);
      } catch (err) { resolve(null); }
    };
    reader.readAsArrayBuffer(file.slice(0, 131072));
  });
};

const parseExifGPS = (view, start) => {
  try {
    if (view.getUint32(start) !== 0x45786966) return null;
    const tiffStart = start + 6;
    const bigEndian = view.getUint16(tiffStart) === 0x4d4d;
    const g16 = (o) => (bigEndian ? view.getUint16(o) : view.getUint16(o, true));
    const g32 = (o) => (bigEndian ? view.getUint32(o) : view.getUint32(o, true));
    const gR = (o) => g32(o) / g32(o + 4);
    let ifdOff = tiffStart + g32(tiffStart + 4);
    let gpsOff = 0;
    const entries = g16(ifdOff);
    for (let i = 0; i < entries; i++) {
      const tag = g16(ifdOff + 2 + i * 12);
      if (tag === 0x8825) { gpsOff = tiffStart + g32(ifdOff + 2 + i * 12 + 8); break; }
    }
    if (!gpsOff) return null;
    const gpsEntries = g16(gpsOff);
    let latRef = 'N', lngRef = 'W', latVals = null, lngVals = null;
    for (let i = 0; i < gpsEntries; i++) {
      const tag = g16(gpsOff + 2 + i * 12);
      const valOff = tiffStart + g32(gpsOff + 2 + i * 12 + 8);
      if (tag === 1) latRef = String.fromCharCode(view.getUint8(gpsOff + 2 + i * 12 + 8));
      if (tag === 2) latVals = [gR(valOff), gR(valOff + 8), gR(valOff + 16)];
      if (tag === 3) lngRef = String.fromCharCode(view.getUint8(gpsOff + 2 + i * 12 + 8));
      if (tag === 4) lngVals = [gR(valOff), gR(valOff + 8), gR(valOff + 16)];
    }
    if (!latVals || !lngVals) return null;
    let lat = latVals[0] + latVals[1] / 60 + latVals[2] / 3600;
    let lng = lngVals[0] + lngVals[1] / 60 + lngVals[2] / 3600;
    if (latRef === 'S') lat = -lat;
    if (lngRef === 'W') lng = -lng;
    return { lat, lng };
  } catch (e) { return null; }
};

// GPX generation
export const generateGPX = (spots, bayConfig, bayId, generateRoute) => {
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="TexasTides">\n  <metadata><name>TexasTides Fishing Spots</name><time>${new Date().toISOString()}</time></metadata>\n`;
  spots.forEach((s) => {
    const [lat, lng] = bayConfig.toLatLng(s.position);
    gpx += `  <wpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"><name>${s.name}</name><desc>${s.desc || ''}</desc><type>${s.type}</type></wpt>\n`;
    const route = generateRoute(bayId, s.position, s.name);
    if (route.length > 0) {
      gpx += `  <rte><name>${s.name} Route</name>\n`;
      route.forEach((wp) => {
        const [wlat, wlng] = bayConfig.toLatLng(wp.pos);
        gpx += `    <rtept lat="${wlat.toFixed(6)}" lon="${wlng.toFixed(6)}"><name>${wp.title}</name><desc>${wp.desc || ''}</desc></rtept>\n`;
      });
      gpx += `  </rte>\n`;
    }
  });
  gpx += `</gpx>`;
  return gpx;
};

export const parseGPXFile = (text, gpsToPosition, formatGPSFn) => {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const wpts = xml.querySelectorAll('wpt');
    const imported = [];
    wpts.forEach((wpt) => {
      const lat = parseFloat(wpt.getAttribute('lat'));
      const lng = parseFloat(wpt.getAttribute('lon'));
      const name = wpt.querySelector('name')?.textContent || 'Imported Spot';
      const desc = wpt.querySelector('desc')?.textContent || '';
      const type = wpt.querySelector('type')?.textContent || 'boat';
      const pos = gpsToPosition(lat, lng);
      imported.push({
        id: Date.now() + Math.random(),
        bay: 'matagorda',
        name,
        type: ['wade', 'boat', 'kayak'].includes(type) ? type : 'boat',
        position: pos,
        gps: { lat: formatGPSFn(lat, lng).split(',')[0], lng: formatGPSFn(lat, lng).split(',')[1]?.trim() },
        rating: 0,
        species: [],
        bestTide: 'Any',
        bestTime: '',
        bestSeason: '',
        bestWind: '',
        lures: [],
        desc,
        parking: pos,
        media: [],
      });
    });
    return imported;
  } catch (e) { return []; }
};

export const downloadFile = (content, filename, type = 'text/xml') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
