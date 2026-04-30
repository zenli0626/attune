import React, { useState, useEffect } from 'react';
import { FONTS, PAPER, INK, INK_SOFT, AMBER, RULE } from './constants.js';
import InstrumentView from './InstrumentView.jsx';
import ArchitectureView from './ArchitectureView.jsx';
import SoundGuideView from './SoundGuideView.jsx';

export default function App() {
  const [tab, setTab] = useState('app');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // sync to the next minute boundary so the displayed time is always current
    const tick = () => setNow(new Date());
    const msUntilNextMinute = 60000 - (Date.now() % 60000);
    const timeout = setTimeout(() => {
      tick();
      const id = setInterval(tick, 60000);
      return () => clearInterval(id);
    }, msUntilNextMinute);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      style={{
        background: PAPER,
        color: INK,
        minHeight: '100vh',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <style>{FONTS}</style>
      <style>{`
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        body::before {
          content: ''; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.05 0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          opacity: 0.45; pointer-events: none; mix-blend-mode: multiply; z-index: 0;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.6; }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: rise 0.6s ease forwards; opacity: 0; }
        @keyframes drift {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(30px, -20px); }
        }
        .blob { animation: drift 18s ease-in-out infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        input[type=range].amber {
          -webkit-appearance: none; appearance: none; height: 2px; background: ${INK}; outline: none;
        }
        input[type=range].amber::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 18px; height: 18px;
          background: ${AMBER}; border: 2px solid ${INK}; border-radius: 50%; cursor: pointer;
        }
        input[type=range].amber::-moz-range-thumb {
          width: 14px; height: 14px; background: ${AMBER};
          border: 2px solid ${INK}; border-radius: 50%; cursor: pointer;
        }
        textarea, input[type=text] {
          font-family: 'DM Sans', sans-serif;
        }
        textarea::placeholder, input::placeholder {
          color: ${INK_SOFT}; opacity: 0.7; font-style: italic;
        }
        @media (max-width: 600px) {
          .layer-card { grid-template-columns: 1fr !important; gap: 8px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px 64px', position: 'relative', zIndex: 1 }}>
        <header style={{
          borderBottom: `1px solid ${RULE}`, paddingBottom: 18, marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT }}>
              Vol. I &nbsp;·&nbsp; A field guide to your present feeling
            </div>
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(56px, 9vw, 112px)',
              fontWeight: 400,
              fontVariationSettings: "'opsz' 144, 'SOFT' 50",
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              margin: '6px 0 0',
              fontStyle: 'italic',
            }}>
              Attune<span style={{ color: AMBER }}>.</span>
            </h1>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: INK_SOFT, textAlign: 'right' }}>
            {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}<br/>
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </header>

        <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: `1px solid ${INK}` }} role="tablist">
          <TabBtn active={tab === 'app'} onClick={() => setTab('app')}>The Instrument</TabBtn>
          <TabBtn active={tab === 'arch'} onClick={() => setTab('arch')}>Architecture</TabBtn>
          <TabBtn active={tab === 'guide'} onClick={() => setTab('guide')}>Sound Guide</TabBtn>
        </div>

        {tab === 'app' && <InstrumentView />}
        {tab === 'arch' && <ArchitectureView />}
        {tab === 'guide' && <SoundGuideView />}

        <footer style={{
          borderTop: `1px solid ${INK}`, marginTop: 56, paddingTop: 18,
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <span style={mono}>A small instrument for paying attention.</span>
          <span style={mono}>Built with Open-Meteo · BigDataCloud · Claude · ♡</span>
        </footer>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none', padding: '10px 18px 12px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: active ? INK : INK_SOFT,
        cursor: 'pointer',
        borderBottom: `2px solid ${active ? AMBER : 'transparent'}`,
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

const mono = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11, letterSpacing: '0.05em', color: INK_SOFT,
};
