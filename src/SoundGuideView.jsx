import React, { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { INK, INK_SOFT, AMBER, PAPER } from './constants.js';

const SAGE = '#7A9B6F';
const INDIGO = '#5C7A8F';
const RUST = '#C26A3D';

const STRATEGIES = [
  {
    name: 'lift',
    n: '01',
    color: INDIGO,
    when: 'When you\'re low, subdued, or melancholic',
    what: 'Acknowledges the low without amplifying it, then gently pulls upward. No forced cheer — just warmth at the door.',
    genres: ['Warm soul', 'Gentle pop', 'Folk', 'Soft R&B'],
    artists: ['Bill Withers', 'The Beatles', 'Corinne Bailey Rae', 'Post Malone'],
  },
  {
    name: 'sustain',
    n: '02',
    color: AMBER,
    when: 'When you\'re energized, bright, running high',
    what: 'Matches and maintains high-valence energy. These tracks ride the current rather than interrupt it.',
    genres: ['Funk', 'Dance-pop', 'Upbeat rock', 'Disco'],
    artists: ['Earth, Wind & Fire', 'Dua Lipa', 'Queen', 'The Weeknd'],
  },
  {
    name: 'channel',
    n: '03',
    color: RUST,
    when: 'When you\'re restless, wired, or frustrated',
    what: 'High energy with a darker tilt — songs to spend the charge on. Cathartic rather than calming. Turns static into motion.',
    genres: ['Alt-rock', 'Indie rock', 'High-energy pop', 'Garage rock'],
    artists: ['Queen', 'The Killers', 'Taylor Swift', 'Franz Ferdinand'],
  },
  {
    name: 'soothe',
    n: '04',
    color: SAGE,
    when: 'When you\'re content, peaceful, or need calm',
    what: 'Protects a peaceful state from disruption. Soft, unhurried, no demands. Keeps the quiet, quiet.',
    genres: ['Acoustic folk', 'Ambient pop', 'Indie folk', 'Soft rock'],
    artists: ['Jack Johnson', 'Bon Iver', 'Neil Young', 'Frank Ocean'],
  },
  {
    name: 'ground',
    n: '05',
    color: INK,
    when: 'When you\'re scattered, overwhelmed, or spinning',
    what: 'Steady rhythms and predictable structure anchor scattered attention. Gives the nervous system something reliable to hold.',
    genres: ['Steady R&B', 'Slow soul', 'Meditative pop', 'Acoustic'],
    artists: ['Bob Marley', 'Louis Armstrong', 'Billy Joel', 'Birdy'],
  },
];

const QUADRANTS = [
  {
    key: 'energized',
    label: 'Energized',
    desc: 'High arousal · Positive valence',
    color: AMBER,
    strategy: 'sustain',
    tracks: [
      { title: 'September', artist: 'Earth, Wind & Fire' },
      { title: 'Lovely Day', artist: 'Bill Withers' },
      { title: 'Levitating', artist: 'Dua Lipa' },
      { title: 'Dreams', artist: 'Fleetwood Mac' },
      { title: 'Walking on Sunshine', artist: 'Katrina & The Waves' },
      { title: 'Good as Hell', artist: 'Lizzo' },
      { title: "Don't Stop Me Now", artist: 'Queen' },
      { title: 'Blinding Lights', artist: 'The Weeknd' },
    ],
  },
  {
    key: 'content',
    label: 'Content',
    desc: 'Low arousal · Positive valence',
    color: SAGE,
    strategy: 'soothe',
    tracks: [
      { title: 'Here Comes the Sun', artist: 'The Beatles' },
      { title: 'Banana Pancakes', artist: 'Jack Johnson' },
      { title: 'Harvest Moon', artist: 'Neil Young' },
      { title: 'Sunday Morning', artist: 'Maroon 5' },
      { title: 'The Night We Met', artist: 'Lord Huron' },
      { title: 'Holocene', artist: 'Bon Iver' },
      { title: 'Skinny Love', artist: 'Birdy' },
      { title: 'Pink + White', artist: 'Frank Ocean' },
    ],
  },
  {
    key: 'restless',
    label: 'Restless',
    desc: 'High arousal · Negative valence',
    color: RUST,
    strategy: 'channel',
    tracks: [
      { title: 'Bohemian Rhapsody', artist: 'Queen' },
      { title: 'Mr. Brightside', artist: 'The Killers' },
      { title: 'Seven Nation Army', artist: 'The White Stripes' },
      { title: 'Anti-Hero', artist: 'Taylor Swift' },
      { title: 'Take Me Out', artist: 'Franz Ferdinand' },
      { title: 'Pumped Up Kicks', artist: 'Foster the People' },
      { title: 'Somebody That I Used to Know', artist: 'Gotye' },
      { title: 'Heat Waves', artist: 'Glass Animals' },
    ],
  },
  {
    key: 'melancholic',
    label: 'Melancholic',
    desc: 'Low arousal · Negative valence',
    color: INDIGO,
    strategy: 'lift',
    tracks: [
      { title: 'Three Little Birds', artist: 'Bob Marley' },
      { title: 'What a Wonderful World', artist: 'Louis Armstrong' },
      { title: 'Here Comes the Sun', artist: 'The Beatles' },
      { title: 'Lovely Day', artist: 'Bill Withers' },
      { title: 'Put Your Records On', artist: 'Corinne Bailey Rae' },
      { title: 'Daydream Believer', artist: 'The Monkees' },
      { title: 'Vienna', artist: 'Billy Joel' },
      { title: 'Sunflower', artist: 'Post Malone & Swae Lee' },
    ],
  },
];

export default function SoundGuideView() {
  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: 10 }}>
          A reference
        </div>
        <h2 style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 6vw, 64px)',
          fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.03em',
          lineHeight: 1, margin: '0 0 18px',
        }}>
          The Sound Guide.
        </h2>
        <p style={{ fontSize: 16, color: INK_SOFT, maxWidth: 560, lineHeight: 1.65, margin: 0 }}>
          Five strategies. Four mood states. Thirty-two curated tracks. This is the logic Attune uses to match music to where you are — and nudge you toward where you could be.
        </p>
      </div>

      {/* STRATEGIES */}
      <div style={{ marginBottom: 56 }}>
        <SectionDivider label="Strategies" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, background: INK, border: `1px solid ${INK}` }}>
          {STRATEGIES.map(s => <StrategyCard key={s.name} s={s} />)}
        </div>
      </div>

      {/* TRACK LIBRARY */}
      <div>
        <SectionDivider label="Track Library" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {QUADRANTS.map(q => <QuadrantCard key={q.key} q={q} />)}
        </div>
      </div>
    </div>
  );
}

function StrategyCard({ s }) {
  return (
    <div style={{ background: PAPER, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: s.color, letterSpacing: '0.1em' }}>{s.n}</span>
        <span style={{
          fontFamily: "'Fraunces', serif", fontStyle: 'italic',
          fontSize: 28, lineHeight: 1, color: s.color,
        }}>{s.name}</span>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: 10 }}>
        {s.when}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 14px' }}>{s.what}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {s.genres.map(g => (
          <span key={g} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            border: `1px solid ${s.color}`, color: s.color,
            padding: '3px 8px',
          }}>{g}</span>
        ))}
      </div>
      <div style={{ fontSize: 12, color: INK_SOFT, fontStyle: 'italic', fontFamily: "'Fraunces', serif" }}>
        {s.artists.join(' · ')}
      </div>
    </div>
  );
}

function QuadrantCard({ q }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [spotifyIds, setSpotifyIds] = useState({});
  const [loading, setLoading] = useState(null);

  async function handlePlay(i, track) {
    if (openIdx === i) { setOpenIdx(null); return; }
    if (spotifyIds[i]) { setOpenIdx(i); return; }
    setLoading(i);
    try {
      const res = await fetch(`/api/spotify-search?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`);
      if (res.ok) {
        const { id } = await res.json();
        setSpotifyIds(prev => ({ ...prev, [i]: id }));
        setOpenIdx(i);
      } else {
        window.open(`https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}`, '_blank');
      }
    } catch {
      window.open(`https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}`, '_blank');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ border: `1px solid ${INK}` }}>
      <div style={{ background: q.color, padding: '14px 18px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 26, color: PAPER, lineHeight: 1 }}>
          {q.label}
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: `${PAPER}bb`, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>
            {q.desc}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: `${PAPER}bb`, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>
            Strategy: {q.strategy}
          </div>
        </div>
      </div>
      <div>
        {q.tracks.map((t, i) => (
          <div key={i}>
            <div style={{
              display: 'grid', gridTemplateColumns: '24px 1fr auto',
              gap: 12, padding: '12px 18px', alignItems: 'center',
              borderBottom: i < q.tracks.length - 1 || openIdx === i ? `1px solid ${INK}22` : 'none',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: q.color }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.2 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 12, color: INK_SOFT, marginTop: 2 }}>{t.artist}</div>
              </div>
              <button onClick={() => handlePlay(i, t)} disabled={loading === i} style={{
                background: openIdx === i ? INK : 'transparent',
                color: openIdx === i ? PAPER : INK_SOFT,
                border: `1px solid ${openIdx === i ? INK : INK_SOFT + '66'}`,
                padding: '4px 9px', cursor: 'pointer', fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                {loading === i
                  ? <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />
                  : openIdx === i ? '◼' : '▶'}
              </button>
            </div>
            {openIdx === i && spotifyIds[i] && (
              <iframe
                src={`https://open.spotify.com/embed/track/${spotifyIds[i]}?utm_source=generator&theme=0`}
                width="100%" height="80" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" style={{ border: 'none', display: 'block' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, borderBottom: `1px solid ${INK}` }} />
    </div>
  );
}
