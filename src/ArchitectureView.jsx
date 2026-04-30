import React from 'react';
import { INK, INK_SOFT, AMBER } from './constants.js';

export default function ArchitectureView() {
  return (
    <div>
      <div style={{ maxWidth: 720, marginBottom: 36 }}>
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontStyle: 'italic',
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          margin: '0 0 16px',
        }}>
          How it works.
        </h2>
        <p style={archBody}>
          Attune is a <strong style={{ color: INK }}>signal-fusion mood inference system</strong>. It pulls four kinds of evidence about your present state—<strong style={{ color: INK }}>ambient</strong> (where you are, what the sky is doing), <strong style={{ color: INK }}>physiological</strong> (heart rate), <strong style={{ color: INK }}>linguistic</strong> (notes), and <strong style={{ color: INK }}>preferential</strong> (music taste)—and combines them into a single mood estimate. That estimate then drives a music recommendation strategy.
        </p>
      </div>

      <div style={{ border: `1px solid ${INK}`, padding: 28, background: 'rgba(255,255,255,0.3)', marginBottom: 36 }}>
        <ArchDiagram />
      </div>

      <LayerCard num="01" name="Sensing" title="Where the data comes from" tech="navigator.geolocation · fetch() · BigDataCloud · Open-Meteo · <input> / <textarea>">
        Four independent channels feed the system. <S>Geolocation</S> uses the browser's built-in navigator.geolocation, then a free reverse-geocoding service (BigDataCloud) turns coordinates into a human-readable place name. <S>Weather</S> comes from Open-Meteo — a free, no-key API returning temperature, sky condition, wind, humidity, and a day/night flag. <S>Heart rate</S> is a slider in this prototype; on a real phone you'd swap in Apple HealthKit or Android Health Connect to read live data from a watch. <S>Self-report</S> is two free-text fields the user types into.
      </LayerCard>

      <LayerCard num="02" name="Aggregate" title="Normalize into one object" tech={<>{'Output shape: { place, localTime, weather: {...}, bpm, notes, taste }'}</>}>
        Each signal arrives at a different time and in a different shape. The aggregation layer collects them into a single JavaScript object — a snapshot of <em>your present moment</em> — that becomes the sole input to inference. This separation matters: it means we can swap the inference engine without touching the sensing code, and vice versa. That's a clean <S>boundary</S> in software architecture.
      </LayerCard>

      <LayerCard num="03" name="Inference" title="Two ways to reach a mood" tech="The science-fair comparison: Mode A is deterministic and explainable but rigid. Mode B is flexible and contextual but opaque. Showing both is a real research contribution.">
        <p style={{ ...layerDesc, marginTop: 0 }}>
          <S>Mode A — rule-based.</S> A classical psychology model called the <S>circumplex of affect</S> places every emotion on two axes: <em>valence</em> (negative ↔ positive) and <em>arousal</em> (low ↔ high energy). The classifier nudges these two scores up or down based on each signal — sun adds +0.3 valence, rain subtracts; a heart rate of 110 adds +0.4 arousal; the word "anxious" subtracts 0.3 valence and adds 0.2 arousal. The final (valence, arousal) coordinate falls into one of four quadrants, each mapped to a mood label and a curated list of mainstream tracks.
        </p>
        <p style={layerDesc}>
          <S>Mode B — LLM.</S> The same signal object is formatted into a natural-language prompt and sent to Claude through a server-side proxy (so the API key stays out of the browser). The model returns structured JSON containing a mood, a written reading, a strategy, and five song recommendations. The LLM picks up nuance the rule system can't — sarcasm in your notes, that you said "Sunday" and it matters, that 50°F + rain in November feels different from 50°F + rain in March.
        </p>
      </LayerCard>

      <LayerCard num="04" name="Action" title="Render and connect to music" tech="Why search-link instead of embed? Real playback would require Spotify Web Playback SDK + Premium auth, or YouTube Data API for video IDs. A science-fair demo doesn't need that — search links are zero-auth and work on every device.">
        The mood reading is rendered into the right column with a color tint pulled from the inference result. Each track gets two deep-link buttons — <S>Spotify</S> and <S>YouTube Music</S> — that open search results for the exact title and artist; one click in either app starts playback. A <S>"Play first"</S> button at the top of the prescription opens the lead track immediately, giving you a near-playlist experience without needing to authenticate against either platform's API.
      </LayerCard>

      <div style={{ border: `1px solid ${INK}`, padding: 28, background: 'rgba(194,106,61,0.05)', marginTop: 36 }}>
        <div style={layerName}>A testable claim</div>
        <h3 style={{ ...layerTitle, marginTop: 8 }}>The hypothesis behind Attune</h3>
        <p style={{ ...layerDesc, fontSize: 15 }}>
          A mood inference built from <S>multiple weak signals</S> (weather + heart rate + language + time) is more accurate and more useful than one built from any single signal alone. You can test this on your own data: log the system's predictions across a week, rate each one for accuracy, and compare against a control where only one input channel is used. That's a real experiment.
        </p>
      </div>
    </div>
  );
}

function S({ children }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const archBody = { fontSize: 15, lineHeight: 1.65, color: INK_SOFT };
const layerName = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: 4 };
const layerTitle = { fontFamily: "'Fraunces', serif", fontSize: 28, fontStyle: 'italic', margin: '0 0 12px', lineHeight: 1.1 };
const layerDesc = { fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 12px' };
const layerTech = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: INK_SOFT, borderTop: `1px dotted ${INK_SOFT}`, paddingTop: 10, marginTop: 12 };

function LayerCard({ num, name, title, tech, children }) {
  return (
    <div style={{
      border: `1px solid ${INK}`, padding: 24, marginBottom: 20,
      background: 'rgba(255,255,255,0.4)',
      display: 'grid', gridTemplateColumns: '80px 1fr', gap: 24,
    }} className="layer-card">
      <div style={{
        fontFamily: "'Fraunces', serif", fontStyle: 'italic',
        fontSize: 64, lineHeight: 1, color: AMBER,
        fontVariationSettings: "'opsz' 144",
      }}>
        {num}
      </div>
      <div>
        <div style={layerName}>{name}</div>
        <h3 style={layerTitle}>{title}</h3>
        <div style={layerDesc}>{children}</div>
        <div style={layerTech}><strong style={{ color: INK }}>{typeof tech === 'string' ? 'Tech: ' : ''}</strong>{tech}</div>
      </div>
    </div>
  );
}

function ArchDiagram() {
  return (
    <svg viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#1A1611" />
        </marker>
      </defs>

      <text x="20" y="30" fontSize="11" fill="#5A5048" letterSpacing="2">01 · SENSING</text>
      <line x1="20" y1="40" x2="780" y2="40" stroke="#5A5048" strokeDasharray="2 4" />

      <g fontSize="12" fill="#1A1611">
        <rect x="20" y="55" width="170" height="80" fill="none" stroke="#1A1611" />
        <text x="105" y="80" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="16">geolocation</text>
        <text x="105" y="100" textAnchor="middle" fontSize="10" fill="#5A5048">browser API</text>
        <text x="105" y="118" textAnchor="middle" fontSize="10" fill="#5A5048">+ reverse geocode</text>

        <rect x="220" y="55" width="170" height="80" fill="none" stroke="#1A1611" />
        <text x="305" y="80" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="16">weather</text>
        <text x="305" y="100" textAnchor="middle" fontSize="10" fill="#5A5048">Open-Meteo API</text>
        <text x="305" y="118" textAnchor="middle" fontSize="10" fill="#5A5048">temp, sky, wind</text>

        <rect x="420" y="55" width="170" height="80" fill="none" stroke="#1A1611" />
        <text x="505" y="80" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="16">heart rate</text>
        <text x="505" y="100" textAnchor="middle" fontSize="10" fill="#5A5048">slider (demo)</text>
        <text x="505" y="118" textAnchor="middle" fontSize="10" fill="#5A5048">→ HealthKit (real)</text>

        <rect x="610" y="55" width="170" height="80" fill="none" stroke="#1A1611" />
        <text x="695" y="80" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="16">self-report</text>
        <text x="695" y="100" textAnchor="middle" fontSize="10" fill="#5A5048">notes + taste</text>
        <text x="695" y="118" textAnchor="middle" fontSize="10" fill="#5A5048">free-text input</text>
      </g>

      <line x1="105" y1="135" x2="105" y2="180" stroke="#1A1611" markerEnd="url(#arrow)" />
      <line x1="305" y1="135" x2="305" y2="180" stroke="#1A1611" markerEnd="url(#arrow)" />
      <line x1="505" y1="135" x2="505" y2="180" stroke="#1A1611" markerEnd="url(#arrow)" />
      <line x1="695" y1="135" x2="695" y2="180" stroke="#1A1611" markerEnd="url(#arrow)" />

      <text x="20" y="200" fontSize="11" fill="#5A5048" letterSpacing="2">02 · AGGREGATE</text>
      <line x1="20" y1="210" x2="780" y2="210" stroke="#5A5048" strokeDasharray="2 4" />
      <rect x="20" y="225" width="760" height="70" fill="rgba(194,106,61,0.08)" stroke="#1A1611" />
      <text x="400" y="255" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="20" fill="#1A1611">{'signals = { place, time, weather, bpm, notes, taste }'}</text>
      <text x="400" y="278" textAnchor="middle" fontSize="11" fill="#5A5048">a single normalized object — the input to inference</text>

      <line x1="400" y1="295" x2="400" y2="320" stroke="#1A1611" markerEnd="url(#arrow)" />

      <text x="20" y="338" fontSize="11" fill="#5A5048" letterSpacing="2">03 · INFERENCE</text>
      <line x1="20" y1="348" x2="780" y2="348" stroke="#5A5048" strokeDasharray="2 4" />

      <rect x="60" y="365" width="320" height="100" fill="none" stroke="#1A1611" />
      <text x="220" y="390" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="18">A · rule-based</text>
      <text x="220" y="410" textAnchor="middle" fontSize="11" fill="#5A5048">2-D valence/arousal classifier</text>
      <text x="220" y="425" textAnchor="middle" fontSize="11" fill="#5A5048">+ keyword scan + curated library</text>
      <text x="220" y="450" textAnchor="middle" fontSize="10" fill="#C26A3D" letterSpacing="1.5">DEFAULT · OFFLINE</text>

      <rect x="420" y="365" width="320" height="100" fill="none" stroke="#1A1611" />
      <text x="580" y="390" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="18">B · LLM</text>
      <text x="580" y="410" textAnchor="middle" fontSize="11" fill="#5A5048">Anthropic API · server proxy</text>
      <text x="580" y="425" textAnchor="middle" fontSize="11" fill="#5A5048">prompt: signals → mood + tracks</text>
      <text x="580" y="450" textAnchor="middle" fontSize="10" fill="#C26A3D" letterSpacing="1.5">REQUIRES API KEY</text>

      <line x1="220" y1="465" x2="350" y2="495" stroke="#1A1611" markerEnd="url(#arrow)" />
      <line x1="580" y1="465" x2="450" y2="495" stroke="#1A1611" markerEnd="url(#arrow)" />

      <text x="20" y="513" fontSize="11" fill="#5A5048" letterSpacing="2">04 · ACTION</text>
      <line x1="20" y1="523" x2="780" y2="523" stroke="#5A5048" strokeDasharray="2 4" />
      <rect x="220" y="500" width="360" height="50" fill="#1A1611" />
      <text x="400" y="525" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="20" fill="#F2EBDD">mood reading + 5 tracks</text>
      <text x="400" y="543" textAnchor="middle" fontSize="10" fill="#F2EBDD" letterSpacing="1.5">→ YOUTUBE MUSIC · SPOTIFY · PLAY FIRST</text>
    </svg>
  );
}
