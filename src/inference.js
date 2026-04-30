import { Cloud, CloudRain, CloudSnow, CloudFog, Sun, Moon, Zap } from 'lucide-react';

export const WEATHER = {
  0: { label: 'clear', Icon: Sun, nightIcon: Moon },
  1: { label: 'mainly clear', Icon: Sun, nightIcon: Moon },
  2: { label: 'partly cloudy', Icon: Cloud },
  3: { label: 'overcast', Icon: Cloud },
  45: { label: 'fog', Icon: CloudFog },
  48: { label: 'rime fog', Icon: CloudFog },
  51: { label: 'light drizzle', Icon: CloudRain },
  53: { label: 'drizzle', Icon: CloudRain },
  55: { label: 'dense drizzle', Icon: CloudRain },
  61: { label: 'light rain', Icon: CloudRain },
  63: { label: 'rain', Icon: CloudRain },
  65: { label: 'heavy rain', Icon: CloudRain },
  71: { label: 'light snow', Icon: CloudSnow },
  73: { label: 'snow', Icon: CloudSnow },
  75: { label: 'heavy snow', Icon: CloudSnow },
  80: { label: 'showers', Icon: CloudRain },
  81: { label: 'showers', Icon: CloudRain },
  82: { label: 'violent showers', Icon: CloudRain },
  95: { label: 'thunderstorm', Icon: Zap },
  96: { label: 'thunderstorm', Icon: Zap },
  99: { label: 'thunderstorm', Icon: Zap },
};

export function weatherInfo(code, isDay) {
  const w = WEATHER[code] || { label: 'unknown', Icon: Cloud };
  const Icon = !isDay && w.nightIcon ? w.nightIcon : w.Icon;
  return { label: w.label, Icon };
}

export function hrZone(bpm) {
  if (bpm < 55) return 'deeply relaxed';
  if (bpm < 65) return 'resting';
  if (bpm < 80) return 'calm baseline';
  if (bpm < 95) return 'mildly elevated';
  if (bpm < 115) return 'activated';
  return 'high arousal';
}

// Curated mainstream-only library, organized by mood quadrant.
const TRACK_LIBRARY = {
  energized: [
    { title: 'September', artist: 'Earth, Wind & Fire', why: 'Pure ascending joy — funk that physically moves you forward.' },
    { title: 'Lovely Day', artist: 'Bill Withers', why: 'Sustained sunshine in vocal form, a held note of optimism.' },
    { title: 'Levitating', artist: 'Dua Lipa', why: 'Disco bounce that keeps the upbeat current rolling.' },
    { title: 'Dreams', artist: 'Fleetwood Mac', why: 'Warm steady groove — momentum without overstimulation.' },
    { title: 'Walking on Sunshine', artist: 'Katrina & The Waves', why: 'The platonic ideal of a bright-day song.' },
    { title: 'Good as Hell', artist: 'Lizzo', why: 'Self-celebratory anthem that meets high energy with confidence.' },
    { title: "Don't Stop Me Now", artist: 'Queen', why: 'Maximum velocity exuberance, scientifically rated as the happiest song.' },
    { title: 'Blinding Lights', artist: 'The Weeknd', why: 'Synth-driven propulsion with a hopeful undertow.' },
  ],
  content: [
    { title: 'Here Comes the Sun', artist: 'The Beatles', why: 'Gentle warmth, a thaw — keeps a peaceful state peaceful.' },
    { title: 'Banana Pancakes', artist: 'Jack Johnson', why: 'A lazy-morning song that protects the calm you have found.' },
    { title: 'Harvest Moon', artist: 'Neil Young', why: 'Slow, wide, tender — a soft container for a content mood.' },
    { title: 'Sunday Morning', artist: 'Maroon 5', why: 'Lounging-in-good-light music, no demands made.' },
    { title: 'The Night We Met', artist: 'Lord Huron', why: 'Slow and clear-eyed — wistful but warm.' },
    { title: 'Holocene', artist: 'Bon Iver', why: 'Hushed and spacious; lets the quiet stay quiet.' },
    { title: 'Skinny Love', artist: 'Birdy', why: 'Restrained piano and breath — meditative without sadness.' },
    { title: 'Pink + White', artist: 'Frank Ocean', why: 'Soft warm production, summer-afternoon energy.' },
  ],
  restless: [
    { title: 'Bohemian Rhapsody', artist: 'Queen', why: 'Lets restless energy be theatrical instead of stewing.' },
    { title: 'Mr. Brightside', artist: 'The Killers', why: 'Anxious propulsion turned into catharsis — yelling, in tune.' },
    { title: 'Seven Nation Army', artist: 'The White Stripes', why: 'A monolithic riff to walk through your edge with.' },
    { title: 'Anti-Hero', artist: 'Taylor Swift', why: 'Self-critical thoughts named out loud, gently — turns inward static into a song.' },
    { title: 'Take Me Out', artist: 'Franz Ferdinand', why: 'Tightly wound nerves, given a beat to spend on.' },
    { title: 'Pumped Up Kicks', artist: 'Foster the People', why: 'Bright melody over a darker undertow — matches mixed energy.' },
    { title: 'Somebody That I Used to Know', artist: 'Gotye', why: 'A measured release valve for high-arousal frustration.' },
    { title: 'Heat Waves', artist: 'Glass Animals', why: 'Restless and hazy, but moving — keeps you from getting stuck.' },
  ],
  melancholic: [
    { title: 'Three Little Birds', artist: 'Bob Marley', why: 'The kindest possible reminder, delivered slowly.' },
    { title: 'What a Wonderful World', artist: 'Louis Armstrong', why: 'Old, slow warmth — meets sadness without trying to fix it.' },
    { title: 'Here Comes the Sun', artist: 'The Beatles', why: 'A literal thaw set to music — gentle directional lift.' },
    { title: 'Lovely Day', artist: 'Bill Withers', why: 'Says the title eight hundred times and means it more each time.' },
    { title: 'Put Your Records On', artist: 'Corinne Bailey Rae', why: 'A small, tactile invitation back into the day.' },
    { title: 'Daydream Believer', artist: 'The Monkees', why: "Old-school sweetness that doesn't ask too much of you." },
    { title: 'Vienna', artist: 'Billy Joel', why: 'Permission to slow down, paired with quiet hope.' },
    { title: 'Sunflower', artist: 'Post Malone & Swae Lee', why: 'Modern warmth, easy melody, a small bright thing.' },
  ],
};

// 2-D valence/arousal classifier (the circumplex of affect).
// Returns the same shape as the LLM mode for a uniform render path.
export function ruleBasedInfer(s) {
  let valence = 0;
  let arousal = 0;

  if (s.weather) {
    const code = s.weather.weather_code;
    if (code === 0 || code === 1) valence += 0.30;
    else if (code === 2) valence -= 0.05;
    else if (code === 3 || code === 45 || code === 48) valence -= 0.20;
    else if (code >= 51 && code <= 67) valence -= 0.30;
    else if (code >= 71 && code <= 86) valence -= 0.10;
    else if (code >= 95) valence -= 0.25;

    const t = s.weather.temperature_2m;
    if (t >= 60 && t <= 78) valence += 0.15;
    else if (t < 32 || t > 88) valence -= 0.15;

    if (!s.weather.is_day) arousal -= 0.15;
  }

  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) arousal += 0.20;
  else if (hour >= 11 && hour < 17) arousal += 0.10;
  else if (hour >= 22 || hour < 5) arousal -= 0.30;

  if (s.bpm < 60) arousal -= 0.30;
  else if (s.bpm < 75) arousal += 0.05;
  else if (s.bpm < 90) arousal += 0.25;
  else if (s.bpm < 110) arousal += 0.45;
  else arousal += 0.65;

  const text = (s.notes || '').toLowerCase();
  const lex = {
    negV: ['sad', 'tired', 'exhaust', 'stress', 'anxious', 'worried', 'down', 'frustrat', 'angry', 'overwhelm', 'lonely', 'bored', 'hate', 'awful', 'terrible', 'depress', 'grief', 'cry', 'hurt'],
    posV: ['happy', 'excit', 'great', 'good', 'love', 'grateful', 'peaceful', 'content', 'wonderful', 'amazing', 'joy', 'smile', 'hope', 'blessed', 'calm'],
    highA: ['excit', 'energ', 'pump', 'wired', 'rac', 'panic', 'fast', 'rush', 'urgen'],
    lowA: ['calm', 'peace', 'sleep', 'rest', 'mellow', 'slow', 'quiet', 'still'],
  };
  for (const w of lex.negV) if (text.includes(w)) valence -= 0.30;
  for (const w of lex.posV) if (text.includes(w)) valence += 0.30;
  for (const w of lex.highA) if (text.includes(w)) arousal += 0.20;
  for (const w of lex.lowA) if (text.includes(w)) arousal -= 0.20;

  valence = Math.max(-1, Math.min(1, valence));
  arousal = Math.max(-1, Math.min(1, arousal));

  let quadrant, primary, secondary, color, strategy;
  if (valence >= 0 && arousal >= 0) {
    quadrant = 'energized'; primary = 'energized'; secondary = 'bright';
    color = '#E8A33D';
    strategy = { name: 'sustain', rationale: 'You are running upbeat — these tracks ride that current.' };
  } else if (valence >= 0 && arousal < 0) {
    quadrant = 'content'; primary = 'content'; secondary = 'gentle';
    color = '#7A9B6F';
    strategy = { name: 'soothe', rationale: 'A peaceful state — soft warmth to keep it that way.' };
  } else if (valence < 0 && arousal >= 0) {
    quadrant = 'restless'; primary = 'restless'; secondary = 'wired';
    color = '#C26A3D';
    strategy = { name: 'channel', rationale: 'High energy with a darker tilt — songs to spend the charge on.' };
  } else {
    quadrant = 'melancholic'; primary = 'melancholic'; secondary = 'low';
    color = '#5C7A8F';
    strategy = { name: 'lift', rationale: 'A subdued state — gentle warmth, no whiplash toward forced cheer.' };
  }

  const pool = [...TRACK_LIBRARY[quadrant]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const tracks = pool.slice(0, 5);

  const wText = s.weather ? (s.weather.is_day ? 'daytime' : 'nighttime') : '';
  const skyText = s.weather ? (WEATHER[s.weather.weather_code]?.label || '') : '';
  const reading =
    `The signals point to a ${primary}, ${secondary} state — ` +
    `${s.bpm} bpm ${hrZone(s.bpm)}, ${wText} ${skyText} in ${s.place || 'your area'}. ` +
    `${strategy.rationale}`;

  return {
    mood: {
      primary,
      secondary,
      intensity: Math.min(1, (Math.abs(valence) + Math.abs(arousal)) / 1.6),
      valence: valence > 0.1 ? 'positive' : valence < -0.1 ? 'negative' : 'neutral',
      color,
    },
    reading,
    strategy,
    tracks,
    debug: { valence, arousal, quadrant },
  };
}
