# CLAUDE.md — TexasTides Codebase Guide

## Project Overview

**TexasTides** is a React + Vite single-page application for interactive satellite mapping and coastal fishing navigation in Texas bays. It features AI-powered recommendations, community features, GPS/route planning, and a map editor.

**Status:** Prototype / active development. Client-side only, no backend.

## Tech Stack

- **React 18.3** with hooks (no class components)
- **Vite 5.4** for dev server and builds
- **Leaflet 1.9 + react-leaflet 4.2** for interactive maps
- **No TypeScript** (despite `@types/*` dev deps)
- **No CSS files** — all styles are inline via `style` props
- **No state management library** — raw `useState`/`useReducer`
- **No router** — manual `page` state for navigation

## Project Structure

```
src/
  App.jsx       # Entire application (~1,650 lines)
  main.jsx      # Entry point
index.html      # HTML shell
vite.config.js  # Vite config (React plugin, host 0.0.0.0:5173)
package.json    # Scripts and dependencies
```

The app is a single-file architecture. All components, utilities, data, and styles live in `src/App.jsx`.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (port 5173, HMR enabled)
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

There are **no tests, linting, or formatting** tools configured.

## Architecture of App.jsx

The file is organized into these sections (top to bottom):

1. **Icon system** (~L13-46) — SVG icon factory `I()` and 30+ icon components (`FishI`, `WindI`, etc.)
2. **Utility functions** (~L48-65) — `haversineNM()`, `calcBearing()`, `bearingLabel()`
3. **Design system** (~L67-75) — Color palette `C`, font constants `Fnt`/`FM`, helper fns `sc()`/`si()`/`li()`
4. **Leaflet customization** (~L77-127) — `divIcon` factories, `MapClickHandler`, `FitBounds` hooks
5. **Bay configuration** (~L183-236) — Bay definitions (Matagorda, Galveston) with coordinate converters, harbors, channel waypoints
6. **Route generation** (~L237-292) — `generateRoute()` for harbor-to-spot navigation
7. **Main App component** (~L308-1649) — 40+ `useState` hooks, all data, all rendering

## Key Conventions

### Naming

- **Components:** PascalCase (`App`, `Modal`, `MapClickHandler`)
- **State variables:** camelCase, often abbreviated (`selBay`, `showRoute`, `editMode`)
- **Icons:** Abbreviated with `I` suffix (`FishI`, `WindI`, `ChkI`)
- **Colors:** Single-letter object `C` with keys like `C.bg`, `C.cyan`, `C.amber`

### Styling

- **Inline styles only** — no CSS files, no Tailwind, no CSS-in-JS libraries
- **Dark theme** with consistent color palette via `C` object
- **Opacity variants** appended as hex: `${C.cyan}08`, `${C.cyan}20`
- **Spacing scale:** 4, 6, 8, 10, 12, 14, 16, 20, 24, 32
- **Border-radius:** 4, 6, 8, 10, 12, 16, 20, 24
- **Box shadows:** `0 2px 6px #0004` (cards), `0 -4px 30px #000a` (bottom sheets)

### Fonts

- `Fnt` = `"Instrument Sans", "DM Sans", system-ui, sans-serif` — primary
- `FM` = `"JetBrains Mono", monospace` — GPS coordinates

### Responsive Design

- `isMobile` boolean from `window.innerWidth < 768`
- Ternary operators for mobile vs desktop values throughout JSX
- Mobile: bottom sheets (70vh), floating action buttons, long-press context menu
- Desktop: 3-column layout (toolbar, map, sidebar)

### Reusable UI Components (defined inside App.jsx)

- `Btn` — Button with primary/small/danger variants
- `Lbl` — Uppercase label
- `Inp` — Input with label
- `Sel` — Select dropdown with label
- `Badge` — Colored tag (species, lures)
- `Modal` — Responsive dialog (centered desktop, bottom sheet mobile)

## Data Structures

**Fishing Spot:**
```js
{ id, bay, name, type, position:{x,y}, gps:{lat,lng}, rating,
  species:[], bestTide, bestTime, bestSeason, bestWind,
  lures:[], desc, parking:{x,y}, media:[] }
```

**Launch Point:**
```js
{ id, name, type, position:{x,y}, gps, notes, bay, isHarbor? }
```

**Shade Zone:**
```js
{ id, type, label, cx, cy, rx, ry, color, bay }
```

**Wade Line:**
```js
{ id, bay, label, points:[{x,y}], color, castRange }
```

## Key Features

- Satellite map with 3 tile sources (Sentinel-2, USGS, ESRI)
- Fishing spot markers with drag-to-edit
- Auto-route generation from harbor to spot with waypoint navigation
- Route playback animation
- GPS coordinate parsing (decimal + DMS formats)
- JPEG EXIF GPS extraction
- Export: GPX, KML, JSON, tab-separated GPS
- Import: GPX, JSON
- Map editor with 6 tabs (Spots, Waypoints/GPS, Zones, Launches, Photos, Tools)
- Undo stack (max 10 actions)
- Community reports, photos, BoatShare listings (mock data)
- AI Advisor modal (requires Claude API key, not yet integrated)

## Development Notes

- All state is local (no persistence yet). `localStorage` is not used.
- Two bays supported: Matagorda and Galveston, each with `toLatLng()`/`fromLatLng()` coordinate converters.
- Positions use a normalized 0-100 coordinate system that maps to actual lat/lng per bay.
- Route generation uses channel waypoints and haversine distance calculations.
- No error boundaries, no accessibility attributes, no input validation.
- The app re-renders fully on every state change — no optimization layers.

## Deployment

Static site — build with `npm run build` and deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages).
