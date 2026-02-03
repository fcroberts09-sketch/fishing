# TexasTides — Texas Coastal Fishing Guide

Real satellite imagery, GPS waypoints, navigation routes, community photos, and AI-powered fishing recommendations.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel (Free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Import Project" → select your repo
4. Framework: Vite (auto-detected)
5. Click Deploy

Your site will be live at `your-project.vercel.app` in ~60 seconds.

## Deploy to Netlify (Free)

```bash
# Build
npm run build

# The `dist/` folder is ready to deploy
```

1. Go to [netlify.com](https://netlify.com)
2. Drag the `dist/` folder onto the deploy area
3. Done — live URL in seconds

Or connect your GitHub repo for auto-deploys on push.

## Deploy to Cloudflare Pages (Free)

1. Push to GitHub
2. Go to Cloudflare Dashboard → Pages → Create Project
3. Connect repo, set build command: `npm run build`, output: `dist`
4. Deploy

## Features

- **Satellite Map** — Sentinel-2, USGS Aerial, and ESRI World Imagery (all free, no API keys)
- **5 Fishing Spots** with GPS, species, conditions, lures, and detailed descriptions
- **Navigation Routes** with step-by-step waypoints, headings, depths, and warnings
- **Wade/Kayak Zones** — Admin shading overlays on the map
- **Launch Points** — Boat ramps, kayak launches, drive-in access
- **Community Photos** — Pin photos to map locations
- **AI Fishing Advisor** — Claude-powered (bring your own API key)
- **BoatShare** — Local fishermen sharing trips (not guides)
- **Settings** — API key management, preferences
- **Map Editor** — Admin tools for managing all map data

## Satellite Tile Sources (Free, No API Key)

| Provider | Best For | Max Zoom |
|----------|----------|----------|
| Sentinel-2 (EOX) | Underwater reef/shoal patterns | 15 |
| USGS Aerial | Sharp shoreline detail | 16 |
| ESRI World Imagery | Highest zoom, general aerial | 18 |

Toggle between them using the layer control (top-right of map).

## Tech Stack

- React 18 + Vite
- Leaflet + react-leaflet (satellite map)
- No backend required (static site)
- Claude API for AI recommendations (optional)
