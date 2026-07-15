import React, { useEffect, useRef } from 'react';
import { INK_SOFT } from './constants.js';

// Three-octave playable piano (C3–C6) with a falling-notes song game.
// Sound is synthesized live with the Web Audio API — no samples.

const CSS = `
  .piano-root {
    --lacquer: #16120e;
    --brass: #c9a05c;
    --brass-dim: #7a6339;
    --p-ivory: #f2ead8;
    --p-ivory-shadow: #cfc4ab;
    --felt: #7b1f2b;
    --p-good: #6fae7c;
    font-family: 'JetBrains Mono', monospace;
  }

  .piano-root .modes {
    display: flex; gap: 0.6rem; flex-wrap: wrap;
    margin-bottom: 1.2rem;
  }
  .piano-root .modes button {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #6b5232;
    background: rgba(122,99,57,0.07);
    border: 1px solid rgba(122,99,57,0.45);
    border-radius: 999px;
    padding: 0.5rem 1.1rem;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .piano-root .modes button:hover { background: rgba(122,99,57,0.18); }
  .piano-root .modes button.active {
    background: #1A1611; color: var(--brass); border-color: #1A1611; font-weight: 500;
  }

  .piano-root .piano-shell {
    background: linear-gradient(180deg, #1c1712, var(--lacquer) 30%, #0a0806);
    border: 1px solid rgba(26,22,17,0.6);
    border-radius: 14px;
    padding: 1.1rem 1.1rem 1.5rem;
    box-shadow: 0 30px 60px -24px rgba(26,22,17,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
  }

  .piano-root .lane-wrap { position: relative; overflow: hidden; height: 0; transition: height 0.45s cubic-bezier(0.22,1,0.36,1); }
  .piano-root .lane-wrap.open { height: 280px; }
  .piano-root .lane {
    position: relative; height: 280px;
    background:
      repeating-linear-gradient(0deg, transparent 0 55px, rgba(201,160,92,0.05) 55px 56px),
      linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.1));
    border-bottom: 2px solid var(--brass);
  }
  .piano-root .fall-note {
    position: absolute; border-radius: 5px; will-change: transform;
    background: linear-gradient(180deg, #e8c98a, var(--brass) 60%, #a37f42);
    box-shadow: 0 0 14px rgba(201,160,92,0.35);
  }
  .piano-root .fall-note.sharp {
    background: linear-gradient(180deg, #b25360, var(--felt) 60%, #521219);
    box-shadow: 0 0 14px rgba(123,31,43,0.5);
  }
  .piano-root .fall-note.hit { opacity: 0; transition: opacity 0.18s ease; }
  .piano-root .fall-note.missed { opacity: 0.25; filter: grayscale(1); }

  .piano-root .hud { position: absolute; top: 10px; right: 14px; text-align: right; z-index: 5; pointer-events: none; }
  .piano-root .hud .p-score { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 600; color: var(--p-ivory); line-height: 1; }
  .piano-root .hud .p-combo { font-size: 0.72rem; letter-spacing: 0.2em; color: var(--brass); margin-top: 0.3rem; }
  .piano-root .song-title {
    position: absolute; top: 10px; left: 14px;
    font-family: 'Fraunces', serif; font-style: italic; font-size: 1.05rem;
    color: rgba(242,234,216,0.6); z-index: 5; pointer-events: none;
  }

  .piano-root .judgement {
    position: absolute; left: 50%; bottom: 46px; transform: translateX(-50%);
    font-family: 'Fraunces', serif; font-style: italic; font-size: 1.7rem;
    z-index: 6; pointer-events: none; opacity: 0;
  }
  .piano-root .judgement.pop { animation: p-pop 0.5s ease both; }
  .piano-root .judgement.perfect { color: var(--brass); text-shadow: 0 0 20px rgba(201,160,92,0.6); }
  .piano-root .judgement.good { color: var(--p-good); }
  .piano-root .judgement.miss { color: #a04656; }
  @keyframes p-pop {
    0% { opacity: 0; transform: translateX(-50%) scale(0.7); }
    25% { opacity: 1; transform: translateX(-50%) scale(1.08); }
    70% { opacity: 1; transform: translateX(-50%) scale(1); }
    100% { opacity: 0; transform: translateX(-50%) scale(1); }
  }

  .piano-root .results {
    position: absolute; inset: 0; z-index: 8; display: none;
    flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
    background: rgba(13,11,9,0.88); backdrop-filter: blur(3px); text-align: center;
    color: var(--p-ivory);
  }
  .piano-root .results.show { display: flex; }
  .piano-root .results .r-title { font-family: 'Fraunces', serif; font-style: italic; font-size: 1.6rem; color: var(--brass); }
  .piano-root .results .r-score { font-family: 'Fraunces', serif; font-size: 3rem; font-weight: 600; }
  .piano-root .results .r-detail { font-size: 0.7rem; letter-spacing: 0.2em; color: rgba(242,234,216,0.6); line-height: 2; }
  .piano-root .results button {
    margin-top: 0.6rem; font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase;
    color: #17120b; background: var(--brass); border: none; border-radius: 999px;
    padding: 0.55rem 1.3rem; cursor: pointer;
  }

  .piano-root .felt-strip {
    height: 5px; border-radius: 3px 3px 0 0;
    background: linear-gradient(90deg, #5d1620, var(--felt), #5d1620);
  }

  .piano-root .keys {
    position: relative; display: flex;
    user-select: none; -webkit-user-select: none; touch-action: none;
    width: max-content;
  }
  .piano-root .key.white {
    width: 46px; height: 196px;
    background: linear-gradient(180deg, #fbf6e9 0%, var(--p-ivory) 70%, var(--p-ivory-shadow) 100%);
    border: 1px solid #b8ad93; border-top: none; border-radius: 0 0 6px 6px;
    position: relative; cursor: pointer;
    display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
    padding-bottom: 10px; gap: 5px;
    transition: transform 0.05s ease, background 0.08s ease;
    box-shadow: inset 0 -6px 8px -6px rgba(0,0,0,0.35);
  }
  .piano-root .key.white.down {
    transform: translateY(3px);
    background: linear-gradient(180deg, #efe7d2, #e3d8ba);
    box-shadow: inset 0 4px 10px -4px rgba(0,0,0,0.4);
  }
  .piano-root .key.black {
    width: 29px; height: 118px;
    background: linear-gradient(180deg, #2a2622, #0c0a08 80%);
    border-radius: 0 0 5px 5px;
    position: absolute; top: 0; z-index: 2; cursor: pointer;
    display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
    padding-bottom: 8px;
    transition: transform 0.05s ease;
    box-shadow: 0 6px 10px rgba(0,0,0,0.6), inset 0 -4px 6px -3px rgba(255,255,255,0.12);
  }
  .piano-root .key.black.down {
    transform: translateY(3px);
    background: linear-gradient(180deg, #1c1916, #060504);
  }
  .piano-root .key.flash::after {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    background: rgba(201,160,92,0.45); animation: p-flash 0.25s ease both; pointer-events: none;
  }
  @keyframes p-flash { from { opacity: 1; } to { opacity: 0; } }

  .piano-root .keycap {
    font-size: 0.62rem; font-weight: 500;
    width: 19px; height: 19px; line-height: 17px; text-align: center;
    border-radius: 4px; border: 1px solid rgba(0,0,0,0.25);
    color: #6b6250; background: rgba(0,0,0,0.05);
  }
  .piano-root .keycap:empty { visibility: hidden; }
  .piano-root .key.black .keycap {
    color: var(--brass); border-color: rgba(201,160,92,0.4); background: rgba(201,160,92,0.08);
  }
  .piano-root .notename { font-size: 0.55rem; letter-spacing: 0.06em; color: #a89c80; }

  .piano-root .now-playing {
    height: 1.5rem; margin-top: 1rem;
    font-family: 'Fraunces', serif; font-style: italic; font-size: 1.15rem;
    color: #8a6a35; text-align: center;
    opacity: 0; transition: opacity 0.4s ease;
  }
  .piano-root .now-playing.show { opacity: 1; }

  @media (max-width: 1150px) {
    .piano-root .key.white { width: 36px; height: 160px; }
    .piano-root .key.black { width: 23px; height: 96px; }
    .piano-root .notename { display: none; }
  }
`;

function initPiano(root) {
  const $ = (sel) => root.querySelector(sel);

  // ============ Keyboard (the instrument): C3 (-12) ... C6 (+24) rel C4 ============
  const LO = -12, HI = 24;
  const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const isBlackPc = (pc) => [1,3,6,8,10].includes(pc);
  const noteName = (semi) => {
    const pc = ((semi % 12) + 12) % 12;
    return NAMES[pc] + (4 + Math.floor(semi / 12));
  };
  const freqOf = (semi) => 440 * Math.pow(2, (semi - 9) / 12);

  const KB_ORDER = [
    ['a',0],['w',1],['s',2],['e',3],['d',4],['f',5],['t',6],['g',7],
    ['y',8],['h',9],['u',10],['j',11],['k',12],['o',13],['l',14],['p',15],[';',16],
  ];
  let baseOctave = 4;
  const kbToSemi = (k) => {
    const hit = KB_ORDER.find(([c]) => c === k);
    return hit ? hit[1] + (baseOctave - 4) * 12 : null;
  };

  const keysEl = $('.keys');
  const nowEl = $('.now-playing');
  const keyBySemi = new Map();

  for (let semi = LO; semi <= HI; semi++) {
    const black = isBlackPc(((semi % 12) + 12) % 12);
    const el = document.createElement('div');
    el.className = 'key ' + (black ? 'black' : 'white');
    el.dataset.semi = semi;
    el.innerHTML = '<div class="keycap"></div>' +
                   (black ? '' : `<div class="notename">${noteName(semi)}</div>`);
    keysEl.appendChild(el);
    keyBySemi.set(semi, el);
  }

  function positionBlacks() {
    for (let semi = LO; semi <= HI; semi++) {
      const el = keyBySemi.get(semi);
      if (!el.classList.contains('black')) continue;
      const below = keyBySemi.get(semi - 1);
      el.style.left = (below.offsetLeft + below.offsetWidth - el.offsetWidth / 2) + 'px';
    }
  }
  function renderKeycaps() {
    keyBySemi.forEach((el) => { el.querySelector('.keycap').textContent = ''; });
    KB_ORDER.forEach(([c, off]) => {
      const el = keyBySemi.get(off + (baseOctave - 4) * 12);
      if (el) el.querySelector('.keycap').textContent = c === ';' ? ';' : c.toUpperCase();
    });
  }
  requestAnimationFrame(() => { positionBlacks(); renderKeycaps(); });

  // ============ Web Audio voice ============
  let ctx = null;
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      ctx._out = comp;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const active = new Map();

  function startNote(semi, showLabel = true) {
    if (semi === null || !keyBySemi.has(semi) || active.has(semi)) return;
    const el = keyBySemi.get(semi);
    const c = audio();
    const f = freqOf(semi);
    const t = c.currentTime;

    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(f * 8, t);
    filter.frequency.exponentialRampToValueAtTime(f * 1.6, t + 1.4);
    filter.Q.value = 0.8;

    const partials = [
      { type: 'triangle', mult: 1, gain: 0.55, detune: 0 },
      { type: 'sine',     mult: 2, gain: 0.18, detune: 3 },
      { type: 'sine',     mult: 3, gain: 0.07, detune: -3 },
    ];
    const oscs = partials.map((p) => {
      const o = c.createOscillator();
      o.type = p.type;
      o.frequency.value = f * p.mult;
      o.detune.value = p.detune;
      const g = c.createGain();
      g.gain.value = p.gain;
      o.connect(g).connect(filter);
      o.start(t);
      return o;
    });

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.9, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 3.5);
    filter.connect(gain).connect(c._out);

    active.set(semi, { oscs, gain });
    el.classList.add('down');
    if (showLabel && !game.running) {
      nowEl.textContent = noteName(semi);
      nowEl.classList.add('show');
    }
  }

  function stopNote(semi) {
    const v = active.get(semi);
    if (!v) return;
    const t = ctx.currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(v.gain.gain.value, t);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    v.oscs.forEach((o) => o.stop(t + 0.3));
    active.delete(semi);
    const el = keyBySemi.get(semi);
    if (el) el.classList.remove('down');
    if (active.size === 0) {
      setTimeout(() => { if (active.size === 0) nowEl.classList.remove('show'); }, 600);
    }
  }

  // ============ Songs: [semitone rel C4, beats]; all fit the default window ============
  const SONGS = {
    twinkle: {
      title: 'Twinkle, Twinkle', bpm: 100,
      notes: [
        [0,1],[0,1],[7,1],[7,1],[9,1],[9,1],[7,2],
        [5,1],[5,1],[4,1],[4,1],[2,1],[2,1],[0,2],
        [7,1],[7,1],[5,1],[5,1],[4,1],[4,1],[2,2],
        [7,1],[7,1],[5,1],[5,1],[4,1],[4,1],[2,2],
        [0,1],[0,1],[7,1],[7,1],[9,1],[9,1],[7,2],
        [5,1],[5,1],[4,1],[4,1],[2,1],[2,1],[0,2],
      ],
    },
    mary: {
      title: "Mary's Little Lamb", bpm: 110,
      notes: [
        [4,1],[2,1],[0,1],[2,1],[4,1],[4,1],[4,2],
        [2,1],[2,1],[2,2],[4,1],[7,1],[7,2],
        [4,1],[2,1],[0,1],[2,1],[4,1],[4,1],[4,1],[4,1],
        [2,1],[2,1],[4,1],[2,1],[0,4],
      ],
    },
    ode: {
      title: 'Ode to Joy', bpm: 112,
      notes: [
        [4,1],[4,1],[5,1],[7,1],[7,1],[5,1],[4,1],[2,1],
        [0,1],[0,1],[2,1],[4,1],[4,1.5],[2,0.5],[2,2],
        [4,1],[4,1],[5,1],[7,1],[7,1],[5,1],[4,1],[2,1],
        [0,1],[0,1],[2,1],[4,1],[2,1.5],[0,0.5],[0,2],
      ],
    },
    birthday: {
      title: 'Happy Birthday', bpm: 96,
      notes: [
        [0,0.75],[0,0.25],[2,1],[0,1],[5,1],[4,2],
        [0,0.75],[0,0.25],[2,1],[0,1],[7,1],[5,2],
        [0,0.75],[0,0.25],[12,1],[9,1],[5,1],[4,1],[2,2],
        [10,0.75],[10,0.25],[9,1],[5,1],[7,1],[5,3],
      ],
    },
  };

  // ============ Game ============
  const laneWrap = $('.lane-wrap');
  const lane = $('.lane');
  const scoreEl = $('.p-score');
  const comboEl = $('.p-combo');
  const judgeEl = $('.judgement');
  const songTitleEl = $('.song-title');
  const resultsEl = $('.results');
  const modesEl = $('.modes');

  const LEAD = 2.4;
  const PERFECT = 0.10, GOOD = 0.22, MISS_AFTER = 0.28;

  const game = {
    running: false, songKey: null, notes: [], endAt: 0, startAt: 0,
    score: 0, combo: 0, maxCombo: 0,
    counts: { perfect: 0, good: 0, miss: 0 },
    raf: 0,
  };

  Object.entries(SONGS).forEach(([key, s]) => {
    const b = document.createElement('button');
    b.dataset.song = key;
    b.textContent = '♪ ' + s.title;
    modesEl.appendChild(b);
  });

  modesEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    modesEl.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
    if (b.dataset.song) startGame(b.dataset.song);
    else stopGame();
  });
  $('.r-again').addEventListener('click', () => startGame(game.songKey));

  function buildNotes(songKey) {
    const song = SONGS[songKey];
    const beat = 60 / song.bpm;
    let t = LEAD + 0.6;
    const out = [];
    song.notes.forEach(([semi, beats]) => {
      if (semi !== null) out.push({ semi, t, state: 'wait', el: null });
      t += beats * beat;
    });
    return { notes: out, endAt: t };
  }

  function layoutNotes() {
    game.notes.forEach((n) => {
      if (!n.el) return;
      const key = keyBySemi.get(n.semi);
      const black = key.classList.contains('black');
      n.el.style.width = key.offsetWidth - 6 + 'px';
      n.el.style.left = key.offsetLeft + 3 + 'px';
      n.el.style.height = (black ? 26 : 30) + 'px';
    });
  }

  function startGame(songKey) {
    stopGame(true);
    audio();
    if (baseOctave !== 4) { baseOctave = 4; renderKeycaps(); }
    game.songKey = songKey;
    game.running = true;
    game.score = 0; game.combo = 0; game.maxCombo = 0;
    game.counts = { perfect: 0, good: 0, miss: 0 };
    scoreEl.textContent = '0';
    comboEl.innerHTML = '&nbsp;';
    songTitleEl.textContent = SONGS[songKey].title;
    resultsEl.classList.remove('show');

    const built = buildNotes(songKey);
    game.notes = built.notes;
    game.endAt = built.endAt;
    game.notes.forEach((n) => {
      const el = document.createElement('div');
      el.className = 'fall-note' + (isBlackPc(((n.semi % 12) + 12) % 12) ? ' sharp' : '');
      el.style.transform = 'translateY(-60px)';
      lane.appendChild(el);
      n.el = el;
    });
    layoutNotes();

    laneWrap.classList.add('open');
    game.startAt = performance.now() + 200;
    game.raf = requestAnimationFrame(tick);
  }

  function stopGame(keepLaneOpen = false) {
    game.running = false;
    cancelAnimationFrame(game.raf);
    game.notes.forEach((n) => n.el && n.el.remove());
    game.notes = [];
    resultsEl.classList.remove('show');
    songTitleEl.textContent = '';
    if (!keepLaneOpen) laneWrap.classList.remove('open');
  }

  function songNow() { return (performance.now() - game.startAt) / 1000; }

  function tick() {
    if (!game.running) return;
    const now = songNow();
    const laneH = lane.offsetHeight;
    let unresolved = 0;

    game.notes.forEach((n) => {
      if (n.state === 'wait') {
        unresolved++;
        if (now > n.t + MISS_AFTER) {
          n.state = 'miss';
          n.el.classList.add('missed');
          game.counts.miss++;
          game.combo = 0;
          showJudgement('miss');
          updateHud();
        }
      }
      const y = laneH - (n.t - now) / LEAD * laneH - parseFloat(n.el.style.height);
      n.el.style.transform = `translateY(${y}px)`;
      n.el.style.display = (y < -70 || y > laneH + 10) ? 'none' : 'block';
    });

    if (unresolved === 0 && now > game.endAt) { finishGame(); return; }
    game.raf = requestAnimationFrame(tick);
  }

  function judge(semi) {
    if (!game.running) return;
    const now = songNow();
    let best = null, bestDt = Infinity;
    game.notes.forEach((n) => {
      if (n.state !== 'wait' || n.semi !== semi) return;
      const dt = Math.abs(n.t - now);
      if (dt < bestDt) { bestDt = dt; best = n; }
    });
    if (!best || bestDt > GOOD) return;
    best.state = 'hit';
    best.el.classList.add('hit');
    const perfect = bestDt <= PERFECT;
    game.counts[perfect ? 'perfect' : 'good']++;
    game.combo++;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    game.score += (perfect ? 100 : 50) + game.combo * 2;
    showJudgement(perfect ? 'perfect' : 'good');
    const key = keyBySemi.get(semi);
    key.classList.remove('flash'); void key.offsetWidth; key.classList.add('flash');
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = game.score;
    comboEl.textContent = game.combo > 1 ? game.combo + ' combo' : ' ';
  }

  function showJudgement(kind) {
    judgeEl.textContent = kind === 'perfect' ? 'Perfect' : kind === 'good' ? 'Good' : 'Miss';
    judgeEl.className = 'judgement ' + kind;
    void judgeEl.offsetWidth;
    judgeEl.classList.add('pop');
  }

  function finishGame() {
    game.running = false;
    cancelAnimationFrame(game.raf);
    const { perfect, good, miss } = game.counts;
    const total = perfect + good + miss;
    const acc = total ? Math.round((perfect + good * 0.5) / total * 100) : 0;
    $('.r-title').textContent = acc >= 90 ? 'Bravo!' : acc >= 60 ? 'Nicely played' : 'Keep practicing';
    $('.r-score').textContent = game.score;
    $('.r-detail').innerHTML =
      `${perfect} perfect &middot; ${good} good &middot; ${miss} missed<br>` +
      `accuracy ${acc}% &middot; best combo ${game.maxCombo}`;
    resultsEl.classList.add('show');
  }

  // ============ Input ============
  function shiftOctave(d) {
    if (game.running) return;
    const next = baseOctave + d;
    if (next < 3 || next > 5) return;
    [...active.keys()].forEach(stopNote);
    baseOctave = next;
    renderKeycaps();
    nowEl.textContent = 'keys mapped from C' + baseOctave;
    nowEl.classList.add('show');
    setTimeout(() => { if (active.size === 0) nowEl.classList.remove('show'); }, 1200);
  }

  const onKeydown = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    const k = e.key.toLowerCase();
    if (k === 'z') { shiftOctave(-1); return; }
    if (k === 'x') { shiftOctave(1); return; }
    const semi = kbToSemi(k);
    if (semi === null) return;
    e.preventDefault();
    startNote(semi);
    judge(semi);
  };
  const onKeyup = (e) => {
    const semi = kbToSemi(e.key.toLowerCase());
    if (semi !== null) stopNote(semi);
  };
  const onBlur = () => { [...active.keys()].forEach(stopNote); };
  const onResize = () => { positionBlacks(); layoutNotes(); };

  let mouseDown = false;
  const pointerNotes = new Set();
  const semiOf = (el) => (el ? +el.dataset.semi : null);

  keysEl.addEventListener('pointerdown', (e) => {
    const key = e.target.closest('.key');
    if (!key) return;
    e.preventDefault();
    mouseDown = true;
    const semi = semiOf(key);
    pointerNotes.add(semi);
    startNote(semi);
    judge(semi);
  });
  keysEl.addEventListener('pointerover', (e) => {
    if (!mouseDown) return;
    const key = e.target.closest('.key');
    const semi = semiOf(key);
    if (semi !== null && !pointerNotes.has(semi)) {
      pointerNotes.add(semi);
      startNote(semi);
      judge(semi);
    }
  });
  keysEl.addEventListener('pointerout', (e) => {
    if (!mouseDown) return;
    const semi = semiOf(e.target.closest('.key'));
    if (semi !== null && pointerNotes.has(semi)) {
      pointerNotes.delete(semi);
      stopNote(semi);
    }
  });
  const onPointerup = () => {
    mouseDown = false;
    pointerNotes.forEach(stopNote);
    pointerNotes.clear();
  };

  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
  window.addEventListener('blur', onBlur);
  window.addEventListener('resize', onResize);
  window.addEventListener('pointerup', onPointerup);

  return () => {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointerup', onPointerup);
    stopGame();
    [...active.keys()].forEach(stopNote);
    if (ctx) ctx.close();
  };
}

export default function PianoView() {
  const rootRef = useRef(null);

  useEffect(() => initPiano(rootRef.current), []);

  return (
    <div className="piano-root rise" ref={rootRef}>
      <style>{CSS}</style>

      <div className="modes">
        <button className="active">Free Play</button>
      </div>

      <div className="piano-shell">
        <div className="lane-wrap">
          <div className="lane">
            <div className="song-title"></div>
            <div className="hud">
              <div className="p-score">0</div>
              <div className="p-combo">&nbsp;</div>
            </div>
            <div className="judgement"></div>
            <div className="results">
              <div className="r-title"></div>
              <div className="r-score"></div>
              <div className="r-detail"></div>
              <button className="r-again">Play again</button>
            </div>
          </div>
        </div>
        <div className="felt-strip"></div>
        <div className="keys"></div>
      </div>

      <div className="now-playing">&nbsp;</div>

      <div style={{
        marginTop: 20, fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, letterSpacing: '0.1em', color: INK_SOFT, lineHeight: 2,
      }}>
        White keys A–; · black keys W E T Y U O P · Z/X slide the mapped octave · or click the keys.<br/>
        Pick a song above and hit each note as it reaches the gold line.
      </div>
    </div>
  );
}
