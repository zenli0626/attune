import React, { useState, useEffect, useRef } from 'react';
import { Heart, MapPin, Sparkles, Loader2, Wind, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react';
import { INK, INK_SOFT, AMBER, PAPER } from './constants.js';
import { weatherInfo, hrZone, ruleBasedInfer, WEATHER } from './inference.js';

const ANALYZING_STEPS = ['reading the sky…', 'listening to your pulse…', 'parsing your words…', 'synthesizing…'];

export default function InstrumentView() {
  const [place, setPlace] = useState('');
  const [weather, setWeather] = useState(null);
  const [bpm, setBpm] = useState(72);
  const [notes, setNotes] = useState('');
  const [taste, setTaste] = useState('');
  const [mode, setMode] = useState(() => localStorage.getItem('attune-mode') || 'demo');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [reading, setReading] = useState(() => {
    try { return JSON.parse(localStorage.getItem('attune-reading') || 'null'); } catch { return null; }
  });
  const [error, setError] = useState(null);
  const [locStatus, setLocStatus] = useState('detecting');
  const stepRef = useRef(null);

  useEffect(() => { localStorage.setItem('attune-mode', mode); }, [mode]);
  useEffect(() => {
    if (reading) localStorage.setItem('attune-reading', JSON.stringify(reading));
  }, [reading]);

  useEffect(() => {
    if (!analyzing) { clearInterval(stepRef.current); setAnalyzingStep(0); return; }
    setAnalyzingStep(0);
    let i = 0;
    stepRef.current = setInterval(() => {
      i = (i + 1) % ANALYZING_STEPS.length;
      setAnalyzingStep(i);
    }, 900);
    return () => clearInterval(stepRef.current);
  }, [analyzing]);

  useEffect(() => {
    const fallback = () => {
      setPlace('New York, NY');
      setLocStatus('default');
      fetchWeather(40.7128, -74.006);
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocStatus('located');
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const d = await r.json();
          const name = [d.city || d.locality, d.principalSubdivisionCode?.split('-')[1] || d.principalSubdivision]
            .filter(Boolean)
            .join(', ');
          setPlace(name || 'Unknown');
        } catch {
          setPlace('Unknown');
        }
        fetchWeather(latitude, longitude);
      },
      () => fallback(),
      { timeout: 8000 }
    );
  }, []);

  async function fetchWeather(lat, lon) {
    try {
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
      const d = await r.json();
      setWeather(d.current);
    } catch (e) {
      console.error('weather', e);
    }
  }

  async function analyze() {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);
    setReading(null);

    const signals = { place, weather, bpm, notes, taste };

    try {
      let result;
      if (mode === 'ai') {
        const wInfo = weather ? weatherInfo(weather.weather_code, weather.is_day) : null;
        const payload = {
          place: place || 'unknown',
          localTime: new Date().toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' }),
          weather: weather
            ? `${Math.round(weather.temperature_2m)}°F (feels ${Math.round(weather.apparent_temperature)}°F), ${wInfo.label}, ${weather.cloud_cover}% cloud, wind ${Math.round(weather.wind_speed_10m)} mph, humidity ${weather.relative_humidity_2m}%, ${weather.is_day ? 'daytime' : 'night'}`
            : 'unavailable',
          bpm,
          hrZone: hrZone(bpm),
          notes: notes.trim() || null,
          taste: taste.trim() || null,
        };
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Request failed (${res.status})`);
        }
        result = await res.json();
      } else {
        await new Promise((r) => setTimeout(r, 600));
        result = ruleBasedInfer(signals);
      }
      setReading(result);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setAnalyzing(false);
    }
  }

  const wInfo = weather ? weatherInfo(weather.weather_code, weather.is_day) : null;
  const moodColor = reading?.mood?.color || AMBER;

  return (
    <>
      {reading && (
        <div
          className="blob"
          style={{
            position: 'absolute', top: '-10%', right: '-15%',
            width: '60vw', height: '60vw', maxWidth: 800, maxHeight: 800,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${moodColor}55, transparent 60%)`,
            filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
          }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, position: 'relative', zIndex: 1 }}>
        {/* LEFT: SIGNAL PANEL */}
        <section>
          <SectionLabel n="01" label="Ambient signals" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: `1px solid ${INK}`, marginBottom: 24 }}>
            <Cell label="Where">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} strokeWidth={1.5} />
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontStyle: 'italic' }}>
                  {place || (locStatus === 'detecting' ? '…' : 'Unknown')}
                </span>
              </div>
            </Cell>
            <Cell label="Sky" border>
              {weather ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <wInfo.Icon size={14} strokeWidth={1.5} />
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontStyle: 'italic' }}>
                    {Math.round(weather.temperature_2m)}° · {wInfo.label}
                  </span>
                </div>
              ) : (
                <span style={{ color: INK_SOFT }}>fetching…</span>
              )}
            </Cell>
            {weather && (
              <>
                <Cell label="Wind" top>
                  <Mono><Wind size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: 6 }} />{Math.round(weather.wind_speed_10m)} mph</Mono>
                </Cell>
                <Cell label="Humidity" top border>
                  <Mono>{weather.relative_humidity_2m}%</Mono>
                </Cell>
              </>
            )}
          </div>

          <SectionLabel n="02" label="Body" />
          <div style={{ border: `1px solid ${INK}`, padding: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Heart size={16} fill={AMBER} stroke={AMBER} style={{ animation: `pulse ${60 / bpm * 1.2}s ease-in-out infinite` }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_SOFT }}>
                  Heart rate
                </span>
              </div>
              <div>
                <span style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 36, lineHeight: 1 }}>{bpm}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: INK_SOFT, marginLeft: 6 }}>BPM</span>
              </div>
            </div>
            <input
              type="range" min="40" max="160" value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="amber"
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Mono>40</Mono>
              <Mono style={{ color: AMBER }}>{hrZone(bpm)}</Mono>
              <Mono>160</Mono>
            </div>
          </div>

          <SectionLabel n="03" label="What's on your mind" />
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="A sentence or two about the day, a feeling, a thought you can't shake…"
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: `1px solid ${INK}`,
              padding: 14, fontSize: 15, color: INK, resize: 'vertical', outline: 'none',
              marginBottom: 24, fontStyle: 'italic', fontFamily: "'Fraunces', serif",
              boxSizing: 'border-box',
            }}
          />

          <SectionLabel n="04" label="What you like to listen to" />
          <input
            type="text" value={taste} onChange={(e) => setTaste(e.target.value)}
            placeholder="e.g. Taylor Swift, The Weeknd, Fleetwood Mac, Coldplay, Frank Ocean…"
            style={{
              width: '100%', background: 'transparent', border: `1px solid ${INK}`,
              padding: 14, fontSize: 15, color: INK, outline: 'none',
              marginBottom: 28, fontFamily: "'Fraunces', serif", fontStyle: 'italic',
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={analyze}
            disabled={analyzing}
            style={{
              width: '100%', background: INK, color: PAPER, border: 'none',
              padding: '20px 24px',
              fontFamily: "'Fraunces', serif", fontSize: 22, fontStyle: 'italic',
              letterSpacing: '-0.01em',
              cursor: analyzing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => !analyzing && (e.currentTarget.style.transform = 'translateY(2px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {analyzing ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Listening…
              </>
            ) : (
              <>
                <Sparkles size={18} fill={AMBER} stroke={AMBER} />
                {reading ? 'Re-tune' : 'Tune in'}
              </>
            )}
          </button>

          <ModeToggle mode={mode} setMode={setMode} />
        </section>

        {/* RIGHT: READING */}
        <section style={{ minHeight: 400, position: 'relative' }}>
          {!reading && !analyzing && !error && <EmptyState />}

          {analyzing && (
            <div style={{ paddingTop: 80, textAlign: 'center', color: INK_SOFT }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontStyle: 'italic', marginBottom: 16, minHeight: 36 }}>
                {ANALYZING_STEPS[analyzingStep]}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {ANALYZING_STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i === analyzingStep ? AMBER : 'transparent',
                    border: `1px solid ${i === analyzingStep ? AMBER : INK_SOFT}`,
                    transition: 'background 0.3s ease, border-color 0.3s ease',
                  }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ border: `1px solid ${INK}`, padding: 24 }}>
              <Mono style={{ color: AMBER, marginBottom: 8 }}>ERROR</Mono>
              <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 18 }}>{error}</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={analyze} style={errBtn}>
                  <RefreshCw size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Try again
                </button>
                {mode === 'ai' && (
                  <button onClick={() => { setMode('demo'); setError(null); }} style={errBtn}>
                    Switch to demo mode
                  </button>
                )}
              </div>
            </div>
          )}

          {reading && <Reading data={reading} moodColor={moodColor} />}
        </section>
      </div>
    </>
  );
}

function ModeToggle({ mode, setMode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginTop: 14,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
      color: INK_SOFT, textTransform: 'uppercase',
    }}>
      <span>Inference:</span>
      <button onClick={() => setMode('demo')} style={modeBtn(mode === 'demo')}>
        <span style={{ ...dotStyle, background: mode === 'demo' ? INK_SOFT : 'transparent', border: `1px solid ${INK_SOFT}` }} />
        Demo
      </button>
      <button onClick={() => setMode('ai')} style={modeBtn(mode === 'ai')}>
        <span style={{ ...dotStyle, background: mode === 'ai' ? AMBER : 'transparent', border: `1px solid ${AMBER}` }} />
        AI · Claude
      </button>
    </div>
  );
}

const dotStyle = { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' };

function modeBtn(active) {
  return {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
    color: active ? INK : INK_SOFT,
    textTransform: 'uppercase',
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0,
  };
}

const errBtn = {
  background: 'transparent', border: `1px solid ${INK}`,
  padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 13, color: INK,
};

function SectionLabel({ n, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: AMBER, letterSpacing: '0.1em' }}>{n}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT }}>{label}</span>
      <div style={{ flex: 1, borderBottom: `1px dotted ${INK_SOFT}`, marginBottom: 4 }} />
    </div>
  );
}

function Cell({ children, label, top, border }) {
  return (
    <div style={{
      padding: 14,
      borderTop: top ? `1px solid ${INK}` : 'none',
      borderLeft: border ? `1px solid ${INK}` : 'none',
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.05em', color: INK_SOFT, ...style }}>
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div style={{ paddingTop: 60 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontStyle: 'italic', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        Every feeling is a <span style={{ color: AMBER }}>signal</span>—<br/>
        from outside, and from in.
      </div>
      <div style={{ marginTop: 18, fontSize: 15, color: INK_SOFT, maxWidth: 420, lineHeight: 1.55 }}>
        Tell Attune what's around you and what's inside you. It will read the constellation of signals and prescribe a sound to meet you where you are—and walk you a step toward brighter.
      </div>
      <div style={{ marginTop: 28, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: INK_SOFT, letterSpacing: '0.15em' }}>
        ↙ &nbsp; START ON THE LEFT
      </div>
    </div>
  );
}

function Reading({ data, moodColor }) {
  const { mood, reading, strategy, tracks } = data;
  const firstQ = tracks?.length ? encodeURIComponent(`${tracks[0].title} ${tracks[0].artist}`) : '';
  const [copied, setCopied] = useState(false);

  function share() {
    const lines = [
      `Attune · ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`,
      ``,
      `${mood.primary}, ${mood.secondary}`,
      `Intensity ${Math.round((mood.intensity || 0) * 10)}/10 · Valence: ${mood.valence}`,
      ``,
      reading,
      ``,
      `Strategy: ${strategy.name} — ${strategy.rationale}`,
      ``,
      `Prescription:`,
      ...(tracks || []).map((t, i) => `${i + 1}. ${t.title} — ${t.artist}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rise" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <Mono style={{ marginBottom: 8, display: 'block' }}>THE READING</Mono>
        <button onClick={share} style={{
          background: 'transparent', border: `1px solid ${INK}`, cursor: 'pointer',
          padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
          color: copied ? AMBER : INK_SOFT, textTransform: 'uppercase',
          transition: 'color 0.2s ease, border-color 0.2s ease',
          borderColor: copied ? AMBER : INK,
        }}>
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontStyle: 'italic',
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          fontVariationSettings: "'opsz' 144, 'SOFT' 80",
        }}>
          <span style={{ color: moodColor }}>{mood.primary}</span>
          <span style={{ color: INK_SOFT }}>, </span>
          <span>{mood.secondary}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Meter value={mood.intensity} color={moodColor} />
          <Mono>VALENCE · {mood.valence?.toUpperCase()}</Mono>
        </div>
      </div>

      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 19, lineHeight: 1.5, fontStyle: 'italic', margin: '18px 0 28px', color: INK }}>
        {reading}
      </p>

      <div style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: '14px 0', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Mono>STRATEGY</Mono>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontStyle: 'italic', textTransform: 'lowercase' }}>
            <span style={{ color: moodColor }}>↳</span> {strategy.name}
          </div>
        </div>
        <div style={{ fontSize: 13, color: INK_SOFT, maxWidth: 320, lineHeight: 1.5 }}>
          {strategy.rationale}
        </div>
      </div>

      <Mono style={{ marginBottom: 14, display: 'block' }}>THE PRESCRIPTION · {tracks?.length || 0} TRACKS</Mono>

      {tracks?.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <a href={`https://music.youtube.com/search?q=${firstQ}`} target="_blank" rel="noreferrer" style={{ ...playAll, background: INK, color: PAPER }}>
            ▶ Play first on YT Music
          </a>
          <a href={`https://open.spotify.com/search/${firstQ}`} target="_blank" rel="noreferrer" style={{ ...playAll, background: 'transparent', color: INK }}>
            ▶ Play first on Spotify
          </a>
        </div>
      )}

      <div>
        {tracks?.map((t, i) => <Track key={i} t={t} i={i} accent={moodColor} />)}
      </div>
    </div>
  );
}

const playAll = {
  flex: 1, minWidth: 160,
  padding: '12px 16px',
  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.15em',
  textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  border: `1px solid ${INK}`,
};

function Meter({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Mono>INTENSITY</Mono>
      <div style={{ display: 'flex', gap: 3 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            width: 8, height: 14,
            background: i < Math.round(value * 10) ? color : 'transparent',
            border: `1px solid ${INK}`,
          }} />
        ))}
      </div>
    </div>
  );
}

function Track({ t, i, accent }) {
  const q = encodeURIComponent(`${t.title} ${t.artist}`);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 16,
      padding: '16px 0', borderBottom: `1px solid ${INK}33`, alignItems: 'start',
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: accent, letterSpacing: '0.1em', paddingTop: 4 }}>
        {String(i + 1).padStart(2, '0')}
      </div>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontStyle: 'italic', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          {t.title}
        </div>
        <div style={{ fontSize: 13, color: INK_SOFT, marginTop: 2 }}>by {t.artist}</div>
        <div style={{ fontSize: 13, color: INK, marginTop: 8, lineHeight: 1.5, maxWidth: 500 }}>
          {t.why}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <a href={`https://music.youtube.com/search?q=${q}`} target="_blank" rel="noreferrer" style={linkBtn}>
          YT Music <ExternalLink size={10} />
        </a>
        <a href={`https://open.spotify.com/search/${q}`} target="_blank" rel="noreferrer" style={linkBtn}>
          Spotify <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

const linkBtn = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10, letterSpacing: '0.12em', color: INK,
  textDecoration: 'none', border: `1px solid ${INK}`,
  padding: '5px 9px', display: 'inline-flex', alignItems: 'center', gap: 5,
  textTransform: 'uppercase', background: 'transparent', whiteSpace: 'nowrap',
};
