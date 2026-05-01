import React, { useState, useEffect, useRef } from 'react';
import { Heart, MapPin, Sparkles, Loader2, Wind, RefreshCw, ExternalLink, Copy, Check, Radio, Square, SkipForward } from 'lucide-react';
import { INK, INK_SOFT, AMBER, PAPER } from './constants.js';
import { weatherInfo, hrZone, ruleBasedInfer } from './inference.js';

const ANALYZING_STEPS = ['reading the sky…', 'listening to your pulse…', 'parsing your words…', 'synthesizing…'];

export default function InstrumentView() {
  const [place, setPlace] = useState('');
  const [weather, setWeather] = useState(null);
  const [bpm, setBpm] = useState(72);
  const [selectedPresets, setSelectedPresets] = useState(new Set());
  const [customNote, setCustomNote] = useState('');
  const [otherOpen, setOtherOpen] = useState(false);
  const [taste, setTaste] = useState('');

  const notes = [...Array.from(selectedPresets), customNote.trim()].filter(Boolean).join('. ');
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
    const fallback = () => { setPlace('New York, NY'); setLocStatus('default'); fetchWeather(40.7128, -74.006); };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocStatus('located');
        try {
          const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const d = await r.json();
          const name = [d.city || d.locality, d.principalSubdivisionCode?.split('-')[1] || d.principalSubdivision].filter(Boolean).join(', ');
          setPlace(name || 'Unknown');
        } catch { setPlace('Unknown'); }
        fetchWeather(latitude, longitude);
      },
      () => fallback(),
      { timeout: 8000 }
    );
  }, []);

  async function fetchWeather(lat, lon) {
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph`);
      const d = await r.json();
      setWeather(d.current);
    } catch (e) { console.error('weather', e); }
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
          weather: weather ? `${Math.round(weather.temperature_2m)}°F (feels ${Math.round(weather.apparent_temperature)}°F), ${wInfo.label}, ${weather.cloud_cover}% cloud, wind ${Math.round(weather.wind_speed_10m)} mph, humidity ${weather.relative_humidity_2m}%, ${weather.is_day ? 'daytime' : 'night'}` : 'unavailable',
          bpm, hrZone: hrZone(bpm), notes: notes.trim() || null, taste: taste.trim() || null,
        };
        const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const errBody = await res.json().catch(() => ({})); throw new Error(errBody.error || `Request failed (${res.status})`); }
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
        <div className="blob" style={{
          position: 'absolute', top: '-10%', right: '-15%',
          width: '60vw', height: '60vw', maxWidth: 800, maxHeight: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${moodColor}55, transparent 60%)`,
          filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* Two-column: signals + reading */}
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
              ) : <span style={{ color: INK_SOFT }}>fetching…</span>}
            </Cell>
            {weather && (
              <>
                <Cell label="Wind" top><Mono><Wind size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: 6 }} />{Math.round(weather.wind_speed_10m)} mph</Mono></Cell>
                <Cell label="Humidity" top border><Mono>{weather.relative_humidity_2m}%</Mono></Cell>
              </>
            )}
          </div>

          <SectionLabel n="02" label="Body" />
          <div style={{ border: `1px solid ${INK}`, padding: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Heart size={16} fill={AMBER} stroke={AMBER} style={{ animation: `pulse ${60 / bpm * 1.2}s ease-in-out infinite` }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_SOFT }}>Heart rate</span>
              </div>
              <div>
                <span style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 36, lineHeight: 1 }}>{bpm}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: INK_SOFT, marginLeft: 6 }}>BPM</span>
              </div>
            </div>
            <input type="range" min="40" max="160" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="amber" style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Mono>40</Mono>
              <Mono style={{ color: AMBER }}>{hrZone(bpm)}</Mono>
              <Mono>160</Mono>
            </div>
          </div>

          <SectionLabel n="03" label="What's on your mind" />
          <NotesSelector selected={selectedPresets} setSelected={setSelectedPresets} customNote={customNote} setCustomNote={setCustomNote} otherOpen={otherOpen} setOtherOpen={setOtherOpen} />

          <SectionLabel n="04" label="What you like to listen to" />
          <TasteSelector taste={taste} setTaste={setTaste} />

          <button
            onClick={analyze} disabled={analyzing}
            style={{ width: '100%', background: INK, color: PAPER, border: 'none', padding: '20px 24px', fontFamily: "'Fraunces', serif", fontSize: 22, fontStyle: 'italic', letterSpacing: '-0.01em', cursor: analyzing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'transform 0.15s ease' }}
            onMouseDown={(e) => !analyzing && (e.currentTarget.style.transform = 'translateY(2px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {analyzing ? (<><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />Listening…</>) : (<><Sparkles size={18} fill={AMBER} stroke={AMBER} />{reading ? 'Re-tune' : 'Tune in'}</>)}
          </button>
          <ModeToggle mode={mode} setMode={setMode} />
        </section>

        {/* RIGHT: READING (mood + text + strategy only) */}
        <section style={{ minHeight: 400, position: 'relative' }}>
          {!reading && !analyzing && !error && <EmptyState />}
          {analyzing && (
            <div style={{ paddingTop: 80, textAlign: 'center', color: INK_SOFT }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontStyle: 'italic', marginBottom: 16, minHeight: 36 }}>{ANALYZING_STEPS[analyzingStep]}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {ANALYZING_STEPS.map((_, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === analyzingStep ? AMBER : 'transparent', border: `1px solid ${i === analyzingStep ? AMBER : INK_SOFT}`, transition: 'background 0.3s ease, border-color 0.3s ease' }} />
                ))}
              </div>
            </div>
          )}
          {error && (
            <div style={{ border: `1px solid ${INK}`, padding: 24 }}>
              <Mono style={{ color: AMBER, marginBottom: 8 }}>ERROR</Mono>
              <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 18 }}>{error}</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={analyze} style={errBtn}><RefreshCw size={12} style={{ display: 'inline', marginRight: 6 }} />Try again</button>
                {mode === 'ai' && <button onClick={() => { setMode('demo'); setError(null); }} style={errBtn}>Switch to demo mode</button>}
              </div>
            </div>
          )}
          {reading && <ReadingCard data={reading} moodColor={moodColor} />}
        </section>
      </div>

      {/* FULL-WIDTH: TRACKS + RADIO */}
      {reading && (
        <div style={{ marginTop: 40, position: 'relative', zIndex: 1 }}>
          <TrackSection tracks={reading.tracks} moodColor={moodColor} readingText={reading.reading} strategyName={reading.strategy?.name} />
        </div>
      )}
    </>
  );
}

// ─── Reading card (no tracks) ───────────────────────────────────────────────

function ReadingCard({ data, moodColor }) {
  const { mood, reading, strategy } = data;
  const [copied, setCopied] = useState(false);

  function share() {
    const lines = [
      `Attune · ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`,
      '', `${mood.primary}, ${mood.secondary}`,
      `Intensity ${Math.round((mood.intensity || 0) * 10)}/10 · Valence: ${mood.valence}`,
      '', reading, '',
      `Strategy: ${strategy.name} — ${strategy.rationale}`,
      '', 'Prescription:',
      ...(data.tracks || []).map((t, i) => `${i + 1}. ${t.title} — ${t.artist}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="rise" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <Mono style={{ display: 'block' }}>THE READING</Mono>
        <button onClick={share} style={{ background: 'transparent', border: `1px solid ${copied ? AMBER : INK}`, cursor: 'pointer', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: copied ? AMBER : INK_SOFT, textTransform: 'uppercase', transition: 'color 0.2s ease, border-color 0.2s ease' }}>
          {copied ? <Check size={10} /> : <Copy size={10} />}{copied ? 'Copied' : 'Share'}
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(40px, 6vw, 64px)', fontStyle: 'italic', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariationSettings: "'opsz' 144, 'SOFT' 80" }}>
          <span style={{ color: moodColor }}>{mood.primary}</span>
          <span style={{ color: INK_SOFT }}>, </span>
          <span>{mood.secondary}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Meter value={mood.intensity} color={moodColor} />
          <Mono>VALENCE · {mood.valence?.toUpperCase()}</Mono>
        </div>
      </div>

      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 19, lineHeight: 1.5, fontStyle: 'italic', margin: '18px 0 28px', color: INK }}>{reading}</p>

      <div style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: '14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Mono>STRATEGY</Mono>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontStyle: 'italic' }}>
              <span style={{ color: moodColor }}>↳</span> {strategy.name}
            </div>
          </div>
          <div style={{ fontSize: 13, color: INK_SOFT, maxWidth: 320, lineHeight: 1.5 }}>{strategy.rationale}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Track Section (full-width, manages radio state) ─────────────────────────

function TrackSection({ tracks, moodColor, readingText, strategyName }) {
  const [spotifyIds, setSpotifyIds] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [radioOn, setRadioOn] = useState(false);
  const [radioIdx, setRadioIdx] = useState(-1);   // -1 = intro, 0..N-1 = track, N = outro
  const [radioPhase, setRadioPhase] = useState('idle');  // 'speaking' | 'music'
  const [speechText, setSpeechText] = useState('');
  const [preloadIdx, setPreloadIdx] = useState(null); // track iframe to mount during speech for overlap
  const timerRef = useRef(null);
  const overlapTimerRef = useRef(null);
  const radioIdxRef = useRef(-1);
  const radioPhaseRef = useRef('idle');
  const radioOnRef = useRef(false);
  const advanceCallbackRef = useRef(null);
  const audioRef = useRef(null);      // ElevenLabs TTS speech
  const musicAudioRef = useRef(null); // Spotify preview music

  // Keep refs in sync so async callbacks always read current values
  useEffect(() => { radioIdxRef.current = radioIdx; }, [radioIdx]);
  useEffect(() => { radioPhaseRef.current = radioPhase; }, [radioPhase]);
  useEffect(() => { radioOnRef.current = radioOn; }, [radioOn]);

  useEffect(() => {
    if (!tracks?.length) return;
    setSpotifyIds({});
    tracks.forEach((t, i) => {
      fetch(`/api/spotify-search?q=${encodeURIComponent(`${t.title} ${t.artist}`)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.id) setSpotifyIds(prev => ({ ...prev, [i]: d.id }));
          if (d?.preview_url) setPreviewUrls(prev => ({ ...prev, [i]: d.preview_url }));
        })
        .catch(() => {});
    });
  }, [tracks]);

  useEffect(() => {
    return () => {
      stopAudio();
      clearTimeout(timerRef.current);
      clearTimeout(overlapTimerRef.current);
    };
  }, []);

  // Listen for Spotify iframe playback_update events to auto-advance at track end
  useEffect(() => {
    function handleMessage(e) {
      if (e.origin !== 'https://open.spotify.com') return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.type !== 'playback_update') return;
        const { duration, position, is_paused } = data.payload || {};
        if (!radioOnRef.current || radioPhaseRef.current !== 'music') return;
        if (duration && position && !is_paused && duration - position < 3000) {
          const cb = advanceCallbackRef.current;
          if (cb) {
            advanceCallbackRef.current = null;
            clearTimeout(timerRef.current);
            cb();
          }
        }
      } catch {}
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
      musicAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  // Speak text via ElevenLabs, then call onEnd.
  // If nextIdx is given, starts the next track's iframe ~4 s before the speech ends.
  async function speak(text, onEnd, nextIdx) {
    stopAudio();
    clearTimeout(overlapTimerRef.current);

    let overlapScheduled = false;
    function scheduleOverlap(durationMs) {
      if (overlapScheduled) return;
      if (nextIdx !== undefined && nextIdx !== null && nextIdx < tracks.length) {
        const overlapAt = Math.max(800, durationMs - 4000);
        overlapTimerRef.current = setTimeout(() => setPreloadIdx(nextIdx), overlapAt);
        overlapScheduled = true;
      }
    }

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`speak API ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        if (isFinite(audio.duration)) scheduleOverlap(audio.duration * 1000);
      });
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        clearTimeout(overlapTimerRef.current);
        onEnd();
      });
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        onEnd();
      });

      await audio.play();
      // If duration already known (cached), schedule overlap now
      if (isFinite(audio.duration) && audio.duration > 0) {
        scheduleOverlap(audio.duration * 1000);
      } else {
        // Estimate from word count as a fallback
        const words = text.trim().split(/\s+/).length;
        scheduleOverlap((words / 114) * 60000);
      }
    } catch (e) {
      console.warn('ElevenLabs speak failed, falling back to browser TTS', e);
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.88;
      utt.pitch = 0.95;
      const words = text.trim().split(/\s+/).length;
      const estimatedMs = (words / 114) * 60000;
      const overlapAt = Math.max(800, estimatedMs - 4000);
      if (nextIdx !== undefined && nextIdx !== null && nextIdx < tracks.length) {
        utt.onstart = () => {
          overlapTimerRef.current = setTimeout(() => setPreloadIdx(nextIdx), overlapAt);
        };
      }
      utt.onend = () => { clearTimeout(overlapTimerRef.current); onEnd(); };
      window.speechSynthesis.speak(utt);
    }
  }

  function startRadio() {
    clearTimeout(timerRef.current);
    clearTimeout(overlapTimerRef.current);
    setPreloadIdx(null);
    setRadioOn(true);
    setRadioIdx(-1);
    setRadioPhase('speaking');
    const first = tracks[0];
    const intro = `${readingText} Here is your first track — ${first.title} by ${first.artist}. ${first.why}`;
    setSpeechText(intro);
    speak(intro, () => advanceTo(0), 0);
  }

  function advanceTo(idx) {
    setPreloadIdx(null);
    advanceCallbackRef.current = null;
    if (idx >= tracks.length) {
      const outro = `That was your Attune session. The strategy was ${strategyName}. Hope this brought you a little closer to yourself.`;
      setRadioIdx(tracks.length);
      setRadioPhase('speaking');
      setSpeechText(outro);
      speak(outro, () => { setRadioOn(false); setRadioIdx(-1); setRadioPhase('idle'); setSpeechText(''); });
      return;
    }
    setRadioIdx(idx);
    setRadioPhase('music');
    setSpeechText('');

    function doAdvance() {
      stopAudio();
      const next = tracks[idx + 1];
      const between = idx + 1 < tracks.length
        ? `Up next — ${next.title} by ${next.artist}. ${next.why}`
        : `And that brings us to the final track.`;
      setRadioPhase('speaking');
      setSpeechText(between);
      speak(between, () => advanceTo(idx + 1), idx + 1);
    }

    advanceCallbackRef.current = doAdvance;

    // Play the 30-second Spotify preview — auto-advances when it ends
    const previewUrl = previewUrls[idx];
    if (previewUrl) {
      const music = new Audio(previewUrl);
      musicAudioRef.current = music;
      music.volume = 0.85;
      music.addEventListener('ended', () => {
        musicAudioRef.current = null;
        clearTimeout(timerRef.current);
        const cb = advanceCallbackRef.current;
        if (cb) { advanceCallbackRef.current = null; cb(); }
      });
      music.play().catch(e => console.warn('preview play failed', e));
    }

    // Fallback: 4 minutes if preview_url was missing or never ended
    timerRef.current = setTimeout(() => {
      const cb = advanceCallbackRef.current;
      if (cb) { advanceCallbackRef.current = null; cb(); }
    }, 240000);
  }

  function skipCurrent() {
    clearTimeout(timerRef.current);
    clearTimeout(overlapTimerRef.current);
    advanceCallbackRef.current = null;
    stopAudio();
    setPreloadIdx(null);
    const next = tracks[radioIdx + 1];
    const between = radioIdx + 1 < tracks.length
      ? `Skipping ahead — ${next.title} by ${next.artist}. ${next.why}`
      : `And that's the end of the session.`;
    setRadioPhase('speaking');
    setSpeechText(between);
    speak(between, () => advanceTo(radioIdx + 1), radioIdx + 1);
  }

  function stopRadio() {
    stopAudio();
    clearTimeout(timerRef.current);
    clearTimeout(overlapTimerRef.current);
    advanceCallbackRef.current = null;
    setRadioOn(false);
    setRadioIdx(-1);
    setRadioPhase('idle');
    setSpeechText('');
    setPreloadIdx(null);
  }

  if (!tracks?.length) return null;

  if (radioOn) {
    return (
      <RadioView
        tracks={tracks}
        spotifyIds={spotifyIds}
        moodColor={moodColor}
        radioIdx={radioIdx}
        radioPhase={radioPhase}
        speechText={speechText}
        preloadIdx={preloadIdx}
        onSkip={skipCurrent}
        onStop={stopRadio}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Mono>THE PRESCRIPTION · {tracks.length} TRACKS</Mono>
        <div style={{ flex: 1, borderBottom: `1px solid ${INK}` }} />
        <button onClick={startRadio} style={{ background: INK, color: PAPER, border: 'none', padding: '8px 18px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Radio size={12} /> DJ Mode
        </button>
      </div>
      {/* border-top/left on container + border-right/bottom on each cell = clean grid borders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 0, borderTop: `1px solid ${INK}`, borderLeft: `1px solid ${INK}`, background: PAPER }}>
        {tracks.map((t, i) => <TrackCard key={i} t={t} i={i} accent={moodColor} spotifyId={spotifyIds[i]} />)}
      </div>
    </div>
  );
}

// ─── Radio View ────────────────────────────────────────────────────────────
// The Spotify iframe is always rendered at the SAME position in the DOM tree
// so React never remounts it when we transition from speaking→music. This lets
// the music that started under the DJ's voice continue playing seamlessly.

function RadioView({ tracks, spotifyIds, moodColor, radioIdx, radioPhase, speechText, preloadIdx, onSkip, onStop }) {
  // Which track's iframe should be shown (preload during speech, or current during music)
  const iframeTrackIdx = preloadIdx !== null ? preloadIdx : (radioIdx >= 0 && radioIdx < tracks.length ? radioIdx : null);
  const currentTrack = radioIdx >= 0 && radioIdx < tracks.length ? tracks[radioIdx] : null;
  const iframeTrack = iframeTrackIdx !== null ? tracks[iframeTrackIdx] : null;
  const spotifyId = iframeTrackIdx !== null ? spotifyIds[iframeTrackIdx] : null;
  const showIframe = iframeTrackIdx !== null && (radioPhase === 'music' || preloadIdx !== null);

  return (
    <div style={{ border: `1px solid ${INK}` }}>
      {/* Header bar */}
      <div style={{ background: INK, color: PAPER, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Attune Radio · On Air
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={onStop} style={{ background: 'transparent', color: `${PAPER}99`, border: `1px solid ${PAPER}33`, padding: '4px 12px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Square size={9} fill="currentColor" /> Stop
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px' }}>
        {/* Main panel */}
        <div style={{ padding: 28, minHeight: 300, borderRight: `1px solid ${INK}` }}>

          {/* Speaking phase content */}
          {radioPhase === 'speaking' && (
            <div style={{ marginBottom: showIframe ? 24 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24, marginBottom: 18 }}>
                {[0.55, 1, 0.7, 0.85, 0.6, 0.95, 0.75].map((h, i) => (
                  <div key={i} style={{ width: 4, height: 20, background: AMBER, transformOrigin: 'bottom', animation: `soundbar ${0.5 + (i % 3) * 0.12}s ease-in-out infinite`, animationDelay: `${i * 0.07}s` }} />
                ))}
                <Mono style={{ marginLeft: 12, alignSelf: 'center' }}>The DJ is speaking…</Mono>
              </div>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontStyle: 'italic', lineHeight: 1.6, color: INK, maxWidth: 520, margin: 0 }}>
                {speechText}
              </p>
            </div>
          )}

          {/* Music phase: track title + skip button */}
          {radioPhase === 'music' && currentTrack && (
            <div style={{ marginBottom: 20 }}>
              <Mono style={{ display: 'block', marginBottom: 14 }}>
                NOW PLAYING · {String(radioIdx + 1).padStart(2, '0')} / {String(tracks.length).padStart(2, '0')}
              </Mono>
              <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>
                {currentTrack.title}
              </div>
              <div style={{ fontSize: 14, color: INK_SOFT, marginBottom: 20 }}>by {currentTrack.artist}</div>
            </div>
          )}

          {/* Overlap indicator: music starting under DJ voice */}
          {radioPhase === 'speaking' && preloadIdx !== null && iframeTrack && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
                {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                  <div key={i} style={{ width: 3, height: `${h * 12}px`, background: moodColor, transformOrigin: 'bottom', animation: `soundbar ${0.4 + i * 0.08}s ease-in-out infinite`, animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
              <Mono style={{ color: moodColor }}>♪ {iframeTrack.title} · starting…</Mono>
            </div>
          )}

          {/* The iframe — always at this exact DOM position. React key = track index,
              so it never remounts when speaking→music, letting music continue seamlessly. */}
          {spotifyId ? (
            <div style={{ overflow: 'hidden', transition: 'height 0.6s ease', height: radioPhase === 'music' ? 152 : 80, display: showIframe ? 'block' : 'none' }}>
              <iframe
                key={`spotify-${iframeTrackIdx}`}
                src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                width="100%" height="152" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                style={{ border: 'none', display: 'block' }}
              />
            </div>
          ) : showIframe ? (
            <div style={{ height: radioPhase === 'music' ? 152 : 80, background: `${INK}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: INK_SOFT }} />
            </div>
          ) : null}

          {radioPhase === 'music' && (
            <div style={{ marginTop: 20 }}>
              <button onClick={onSkip} style={{ background: 'transparent', border: `1px solid ${INK}`, padding: '8px 18px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_SOFT, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <SkipForward size={12} /> Skip
              </button>
            </div>
          )}

          {radioPhase !== 'speaking' && radioPhase !== 'music' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 60 }}>
              <Mono>One moment…</Mono>
            </div>
          )}
        </div>

        {/* Track list sidebar */}
        <div>
          {tracks.map((t, i) => {
            const isPast = i < radioIdx;
            const isCurrent = i === radioIdx || i === preloadIdx;
            return (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < tracks.length - 1 ? `1px solid ${INK}22` : 'none', background: isCurrent ? `${moodColor}18` : 'transparent', opacity: isPast ? 0.35 : 1, transition: 'opacity 0.4s ease, background 0.4s ease' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: isCurrent ? moodColor : INK_SOFT, marginBottom: 3, letterSpacing: '0.08em' }}>
                  {String(i + 1).padStart(2, '0')} {isPast ? '✓' : isCurrent ? '▶' : ''}
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, lineHeight: 1.3, color: isCurrent ? INK : INK_SOFT }}>{t.title}</div>
                <div style={{ fontSize: 11, color: INK_SOFT }}>{t.artist}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Track card (grid view) ───────────────────────────────────────────────

function TrackCard({ t, i, accent, spotifyId }) {
  const q = encodeURIComponent(`${t.title} ${t.artist}`);
  return (
    <div style={{ padding: 20, background: PAPER, borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accent, letterSpacing: '0.1em', marginBottom: 5 }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontStyle: 'italic', lineHeight: 1.15, letterSpacing: '-0.01em' }}>{t.title}</div>
          <div style={{ fontSize: 13, color: INK_SOFT, marginTop: 2 }}>by {t.artist}</div>
        </div>
        <a href={`https://open.spotify.com/search/${q}`} target="_blank" rel="noreferrer" style={linkBtn}>
          Open <ExternalLink size={10} />
        </a>
      </div>
      <div style={{ fontSize: 13, color: INK_SOFT, lineHeight: 1.55, marginBottom: 12 }}>{t.why}</div>
      {spotifyId ? (
        <iframe src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ border: 'none', display: 'block' }} />
      ) : (
        <div style={{ height: 80, background: `${INK}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: INK_SOFT }} />
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────

function ModeToggle({ mode, setMode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: INK_SOFT, textTransform: 'uppercase' }}>
      <span>Inference:</span>
      <button onClick={() => setMode('demo')} style={modeBtn(mode === 'demo')}>
        <span style={{ ...dotStyle, background: mode === 'demo' ? INK_SOFT : 'transparent', border: `1px solid ${INK_SOFT}` }} />Demo
      </button>
      <button onClick={() => setMode('ai')} style={modeBtn(mode === 'ai')}>
        <span style={{ ...dotStyle, background: mode === 'ai' ? AMBER : 'transparent', border: `1px solid ${AMBER}` }} />AI · Claude
      </button>
    </div>
  );
}
const dotStyle = { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' };
function modeBtn(active) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', color: active ? INK : INK_SOFT, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0 };
}

const errBtn = { background: 'transparent', border: `1px solid ${INK}`, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: INK };

const NOTE_PRESETS = ["Can't focus", 'Stressed', 'Anxious', 'Tired but wired', 'Feeling down', 'Bored', 'Missing someone', 'Restless', 'Overwhelmed', 'Feeling good', 'Lonely', 'Excited'];

function NotesSelector({ selected, setSelected, customNote, setCustomNote, otherOpen, setOtherOpen }) {
  function toggle(p) { setSelected(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; }); }
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: otherOpen ? 10 : 0 }}>
        {NOTE_PRESETS.map(p => {
          const active = selected.has(p);
          return (
            <button key={p} onClick={() => toggle(p)} style={{ background: active ? INK : 'transparent', color: active ? PAPER : INK, border: `1px solid ${active ? INK : INK_SOFT}`, padding: '7px 14px', fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease' }}>{p}</button>
          );
        })}
        <button onClick={() => setOtherOpen(o => !o)} style={{ background: otherOpen ? AMBER : 'transparent', color: otherOpen ? PAPER : INK_SOFT, border: `1px solid ${otherOpen ? AMBER : INK_SOFT}`, padding: '7px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease' }}>Other…</button>
      </div>
      {otherOpen && (
        <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="A thought you can't shake…" rows={3} autoFocus
          style={{ width: '100%', background: 'transparent', border: `1px solid ${INK}`, padding: 14, fontSize: 15, color: INK, resize: 'vertical', outline: 'none', fontStyle: 'italic', fontFamily: "'Fraunces', serif", boxSizing: 'border-box', marginTop: 2 }} />
      )}
    </div>
  );
}

const TASTE_PRESETS = ['Pop', 'R&B / Soul', 'Hip-Hop', 'Rock', 'Indie', 'Jazz', 'Classical / Piano', 'Electronic', 'Folk / Acoustic', 'Country', 'Latin', 'Metal'];

function TasteSelector({ taste, setTaste }) {
  const [custom, setCustom] = useState('');

  function toggle(p) {
    setTaste(prev => {
      const parts = prev.split(',').map(s => s.trim()).filter(Boolean);
      const idx = parts.findIndex(s => s.toLowerCase() === p.toLowerCase());
      if (idx >= 0) {
        parts.splice(idx, 1);
      } else {
        parts.push(p);
      }
      return parts.join(', ');
    });
  }

  function isActive(p) {
    return taste.split(',').map(s => s.trim().toLowerCase()).includes(p.toLowerCase());
  }

  function handleCustomKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && custom.trim()) {
      e.preventDefault();
      setTaste(prev => {
        const parts = prev.split(',').map(s => s.trim()).filter(Boolean);
        parts.push(custom.trim());
        return parts.join(', ');
      });
      setCustom('');
    }
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {TASTE_PRESETS.map(p => {
          const active = isActive(p);
          return (
            <button key={p} onClick={() => toggle(p)} style={{ background: active ? INK : 'transparent', color: active ? PAPER : INK, border: `1px solid ${active ? INK : INK_SOFT}`, padding: '7px 14px', fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease' }}>{p}</button>
          );
        })}
      </div>
      <input
        type="text" value={custom}
        onChange={e => setCustom(e.target.value)}
        onKeyDown={handleCustomKey}
        placeholder="Or type an artist / genre and press Enter…"
        style={{ width: '100%', background: 'transparent', border: `1px solid ${INK}`, padding: 14, fontSize: 15, color: INK, outline: 'none', fontFamily: "'Fraunces', serif", fontStyle: 'italic', boxSizing: 'border-box' }}
      />
      {taste && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: INK_SOFT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Selected:</span>
          {taste.split(',').map(s => s.trim()).filter(Boolean).map(s => (
            <span key={s} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, border: `1px solid ${AMBER}`, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {s}
              <button onClick={() => setTaste(prev => prev.split(',').map(t => t.trim()).filter(t => t.toLowerCase() !== s.toLowerCase()).join(', '))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: AMBER, padding: 0, lineHeight: 1, fontSize: 12 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <div style={{ padding: 14, borderTop: top ? `1px solid ${INK}` : 'none', borderLeft: border ? `1px solid ${INK}` : 'none' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Mono({ children, style }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.05em', color: INK_SOFT, ...style }}>{children}</span>;
}

function Meter({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Mono>INTENSITY</Mono>
      <div style={{ display: 'flex', gap: 3 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{ width: 8, height: 14, background: i < Math.round(value * 10) ? color : 'transparent', border: `1px solid ${INK}` }} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ paddingTop: 60 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontStyle: 'italic', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        Every feeling is a <span style={{ color: AMBER }}>signal</span>—<br/>from outside, and from in.
      </div>
      <div style={{ marginTop: 18, fontSize: 15, color: INK_SOFT, maxWidth: 420, lineHeight: 1.55 }}>
        Tell Attune what's around you and what's inside you. It will read the constellation of signals and prescribe a sound to meet you where you are—and walk you a step toward brighter.
      </div>
      <div style={{ marginTop: 28, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: INK_SOFT, letterSpacing: '0.15em' }}>↙ &nbsp; START ON THE LEFT</div>
    </div>
  );
}

const linkBtn = { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: INK, textDecoration: 'none', border: `1px solid ${INK}`, padding: '5px 9px', display: 'inline-flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', background: 'transparent', whiteSpace: 'nowrap' };
