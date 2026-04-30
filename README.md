# Attune

A signal-fusion mood inference system: pulls weather, time, heart rate, free-text notes, and music taste into a single mood reading and prescribes 5 tracks to meet you where you are.

Two inference modes:
- **Demo** — offline rule-based 2-D valence/arousal classifier with a curated track library. Works without any API key.
- **AI** — Anthropic Claude via a server-side proxy. Requires `ANTHROPIC_API_KEY` set on the deployment.

## Local development

```bash
npm install
npm run dev
```

This starts Vite at `http://localhost:5173`. Demo mode works immediately; AI mode requires running the serverless function locally — see below.

### Running AI mode locally

The `/api/analyze` endpoint is a Vercel serverless function. To run it locally you need the Vercel CLI:

```bash
npm i -g vercel
cp .env.example .env
# edit .env and paste your real ANTHROPIC_API_KEY
vercel dev
```

`vercel dev` starts both the Vite frontend and the serverless function on the same port (usually `http://localhost:3000`), so the `fetch('/api/analyze')` call resolves correctly.

## Deploying to Vercel

1. Push this folder to a GitHub repo (or run `vercel` from the project directory).
2. In the Vercel dashboard for the project, go to **Settings → Environment Variables** and add:
   - `ANTHROPIC_API_KEY` = your key from <https://console.anthropic.com/>
3. Redeploy.

Vercel auto-detects the Vite framework. The `api/` directory is automatically deployed as serverless functions — no additional config needed.

## Project structure

```
attune/
├── api/
│   └── analyze.js          # Serverless proxy → Anthropic Claude
├── src/
│   ├── App.jsx             # Tabs + masthead + footer
│   ├── InstrumentView.jsx  # The signal panel + mood reading
│   ├── ArchitectureView.jsx# 4-layer explainer with SVG diagram
│   ├── inference.js        # Rule-based classifier + curated track library
│   ├── constants.js        # Color palette, fonts
│   └── main.jsx            # React entry
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

## Notes

- **Geolocation** uses the browser API; if denied or unavailable, falls back to New York, NY.
- **Weather** comes from [Open-Meteo](https://open-meteo.com/) (no key required).
- **Reverse geocoding** uses [BigDataCloud](https://www.bigdatacloud.com/)'s free no-key endpoint.
- **Music links** are search deep-links into YouTube Music and Spotify — no auth required, works on any device.
- The Anthropic call uses Claude Opus 4.7 with adaptive thinking and structured JSON output.
