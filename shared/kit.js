/* Bamboo Physio game kit — shared pieces for the Head Balance games.
   Sound (music, ambience, effects, mute), sticker drawing helpers, cartoon kid,
   playroom backgrounds and on-device face tracking. Nothing is recorded or sent. */

import { STYLES, styleNotes } from './songs.js';
export const INK = '#2b2118';
export const $ = id => document.getElementById(id);
export const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ======================= SOUND ======================= */
export const S = {
  AC: null, BUS: {},
  soundOn: LS.get('bp-sound', '1') === '1',
  musicOn: LS.get('bp-music', '1') === '1',
  sfxOn: LS.get('bp-sfx', '1') === '1',
  ambOn: LS.get('bp-amb', '0') === '1',
  track: 'pond', amb: 'pond', bpm: () => 84,
  mu: { on: false, timer: null, step: 0, next: 0 }, ambNode: null
};

export function audio() {
  if (!S.AC) { try { S.AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (!S.BUS.master) { makeBuses(S.AC); loadSamples(S.AC, SONG_NOTES[S.track] || (STYLES[S.track] ? styleNotes(S.track) : {})); }
  if (S.AC.state === 'suspended') S.AC.resume();
  return S.AC;
}
function makeBuses(a) {
  const B = S.BUS;
  B.master = a.createGain(); B.master.connect(a.destination);
  for (const k of ['sfx', 'music', 'amb']) { B[k] = a.createGain(); B[k].connect(B.master); }
  B.rev = a.createConvolver();
  const len = a.sampleRate * 1.8, b = a.createBuffer(2, len, a.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  B.rev.buffer = b; const rg = a.createGain(); rg.gain.value = .28; B.rev.connect(rg); rg.connect(B.music);
  applyGains(true);
}
export function applyGains(now) {
  const a = S.AC, B = S.BUS; if (!a || !B.master) return; const t = a.currentTime;
  const set = (n, v) => { n.gain.cancelScheduledValues(t); if (now) n.gain.setValueAtTime(v, t); else n.gain.setTargetAtTime(v, t, .08); };
  set(B.master, S.soundOn ? 1 : 0); set(B.sfx, S.sfxOn ? 1 : 0); set(B.music, S.musicOn ? .256 : 0); set(B.amb, S.ambOn ? .6 : 0);
}
document.addEventListener('visibilitychange', () => { if (!S.AC) return; if (document.hidden) S.AC.suspend(); else if (S.mu.on) S.AC.resume(); });

/* simple effect voice */
export function tone({ f0 = 440, f1 = f0, dur = .15, type = 'sine', vol = .25, at = 0, filter = null, q = 1 }) {
  const a = S.AC; if (!a) return; const t = a.currentTime + at;
  const o = a.createOscillator(), g = a.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filter) { const bf = a.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = filter; bf.Q.value = q; o.connect(bf); node = bf; }
  node.connect(g); g.connect(S.BUS.sfx); o.start(t); o.stop(t + dur + .02);
}
export function noise({ dur = .25, freq = 900, vol = .3, type = 'lowpass', at = 0 }) {
  const a = S.AC; if (!a) return; const t = a.currentTime + at;
  const n = a.sampleRate * dur, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(S.BUS.sfx); s.start(t);
}
export const SFX = {
  tick() { tone({ f0: 660, dur: .1, type: 'triangle', vol: .2 }); },
  go() { tone({ f0: 990, dur: .25, type: 'triangle', vol: .24 }); },
  star() { tone({ f0: 880, dur: .18, type: 'triangle', vol: .22 }); tone({ f0: 1320, dur: .3, type: 'triangle', vol: .2, at: .1 }); },
  chime() { [1047, 1319, 1568, 2093].forEach((f, i) => tone({ f0: f, dur: .5, type: 'sine', vol: .14, at: i * .08 })); },
  poof() { noise({ dur: .25, freq: 900, vol: .35 }); },
  boing() { tone({ f0: 180, f1: 520, dur: .22, vol: .25 }); },
  tink(p = 1) { tone({ f0: 2400 * p, dur: .09, type: 'sine', vol: .12 }); tone({ f0: 3600 * p, dur: .05, type: 'sine', vol: .06 }); },
  plunk() { tone({ f0: 500, f1: 1400, dur: .08, vol: .2 }); tone({ f0: 300, f1: 160, dur: .35, vol: .16, at: .06 }); },
  buzz() { tone({ f0: 210, f1: 230, dur: .5, type: 'sawtooth', vol: .07, filter: 600, q: 2 }); },
  sparkle() { [1568, 2093, 2637].forEach((f, i) => tone({ f0: f, dur: .25, type: 'sine', vol: .08, at: i * .06 })); }
};

/* ---- real acoustic instrument samples (FluidR3_GM soundfont, CC BY 3.0) ----
   One normalized mp3 per note in shared/sounds/<instrument>/<note>.mp3. Falls back to synth if missing. */
const SAMPLE_BASE = new URL('./sounds/', import.meta.url);
const NOTE = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export const noteName = m => NOTE[m % 12] + (Math.floor(m / 12) - 1);
const sampleCache = new WeakMap();
export function loadSamples(ac, list) {
  let c = sampleCache.get(ac); if (!c) { c = {}; sampleCache.set(ac, c); }
  const jobs = [];
  for (const [inst, notes] of Object.entries(list)) for (const m of new Set(notes)) {
    const k = inst + m; if (k in c) continue; c[k] = null;
    jobs.push(fetch(new URL(inst + '/' + noteName(m) + '.mp3', SAMPLE_BASE)).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
      .then(b => new Promise((res, rej) => ac.decodeAudioData(b, res, rej))).then(buf => { c[k] = buf; }).catch(() => {}));
  }
  return Promise.all(jobs);
}
/* plays a note if its sample is loaded; returns the gain node (so callers can add reverb) or null */
export function playSample(ac, inst, m, t, v, dest, len = 2.2) {
  const c = sampleCache.get(ac), buf = c && c[inst + m]; if (!buf) return null;
  const s = ac.createBufferSource(); s.buffer = buf; const g = ac.createGain();
  g.gain.setValueAtTime(v, t); g.gain.setTargetAtTime(0.0001, t + len, .12);
  s.connect(g); g.connect(dest); s.start(t); s.stop(t + len + .8); return g;
}
export const SONG_NOTES = {
  pond: { marimba: [76,79,72,74,81,77,71], acoustic_guitar_nylon: [60,64,67,57,53,55,59,62], acoustic_bass: [48,45,41,43] },
  night: { kalimba: [79,76,72,74,77,81,84,83,86,88], celesta: [76,74,77,71,72,69,67], acoustic_bass: [48,50,43,41] }
};
function sampled(inst, m, t, v, wet) {
  const g = playSample(S.AC, inst, m, t, v / .7, S.BUS.music); if (!g) return false;
  if (wet) { const w = S.AC.createGain(); w.gain.value = wet; g.connect(w); w.connect(S.BUS.rev); }
  return true;
}

/* ---- music: acoustic loops (sampled, synth fallback), tempo set by the game ---- */
const mhz = m => 440 * Math.pow(2, (m - 69) / 12);
function mOut(node, wet, bus) { node.connect(bus || S.BUS.music); if (wet) { const g = S.AC.createGain(); g.gain.value = wet; node.connect(g); g.connect(S.BUS.rev); } }
function mEnv(t, a, d, p) { const g = S.AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(p, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); return g; }
function mOsc(type, f, t, dur) { const o = S.AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + .05); return o; }
function marimba(m, t, v) { if (sampled('marimba', m, t, v, .3)) return; const f = mhz(m); const g1 = mEnv(t, .004, .7, v); mOsc('sine', f, t, .75).connect(g1); mOut(g1, .3); const g2 = mEnv(t, .002, .07, v * .35); mOsc('sine', f * 3.93, t, .1).connect(g2); mOut(g2, .1); }
function uke(m, t, v) { if (sampled('acoustic_guitar_nylon', m, t, v * 1.3, .25)) return; const lp = S.AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const g = mEnv(t, .003, .45, v); mOsc('triangle', mhz(m), t, .5).connect(lp); lp.connect(g); mOut(g, .25); }
function bass(m, t, v, d = .5) { if (sampled('acoustic_bass', m, t, v * 1.2, .1)) return; const g = mEnv(t, .01, d, v); mOsc('sine', mhz(m), t, d + .05).connect(g); mOut(g, .1); }
function celesta(m, t, v) { if (sampled('celesta', m, t, v * 1.4, .5)) return; const f = mhz(m); const g1 = mEnv(t, .003, 1.6, v); mOsc('sine', f, t, 1.7).connect(g1); mOut(g1, .55); const g2 = mEnv(t, .002, .35, v * .35); mOsc('sine', f * 2, t, .4).connect(g2); mOut(g2, .4); }
function kalimba(m, t, v) { if (sampled('kalimba', m, t, v, .45)) return; const f = mhz(m); const g1 = mEnv(t, .002, 1.1, v); mOsc('sine', f, t, 1.2).connect(g1); mOut(g1, .5); const g2 = mEnv(t, .001, .12, v * .4); mOsc('sine', f * 5.4, t, .15).connect(g2); mOut(g2, .2); }
function plip(t, v, bus) { const a = S.AC, o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(1500, t + .06); const g = mEnv(t, .001, .08, v); o.connect(g); mOut(g, bus ? 0 : .45, bus); o.start(t); o.stop(t + .12); }
const _ = null;
const TRACKS = {
  /* Pond Stroll: ukulele + marimba + water plip */
  pond: { spb: 2, len: 32,
    mel: [76,_,79,76,72,_,74,76, 81,_,79,76,72,_,_,_, 77,_,81,77,72,_,74,77, 79,_,77,74,71,_,74,_],
    chords: [[60,64,67],[57,60,64],[53,57,60],[55,59,62]], roots: [48,45,41,43],
    play(s, t) { const b = Math.floor(s / 8), i = s % 8;
      if (this.mel[s]) marimba(this.mel[s], t, .28);
      if ([0,3,4,6].includes(i)) this.chords[b].forEach((n, k) => uke(n, t + k * .018, .07));
      if (i === 0 || i === 4) bass(this.roots[b], t, .22);
      if (i === 2 || i === 6) plip(t, .05); } },
  /* Firefly Waltz: kalimba + celesta, slow 3/4 */
  night: { spb: 2, len: 48,
    mel: [79,_,76,_,72,_, 74,_,77,_,81,_, 79,_,76,_,74,_, 72,_,_,_,_,_,
          76,_,79,_,84,_, 83,_,79,_,74,_, 77,_,76,_,74,_, 72,_,_,_,_,_],
    chords: [[60,64],[62,65],[60,64],[59,62],[60,64],[59,62],[57,60],[55,60]],
    roots: [48,50,48,43,48,43,41,48],
    play(s, t) { const b = Math.floor(s / 6), i = s % 6;
      if (this.mel[s]) kalimba(this.mel[s], t, .22);
      if (i === 0) bass(this.roots[b], t, .18, 1.0);
      if (i === 2 || i === 4) this.chords[b].forEach(n => celesta(n + 12, t, .035)); } }
};
/* little spider effects that can sit inside a music arrangement (and be played on their own) */
export const SPIDER_FX = {
  // eight tiny leg taps running past, left to right
  '~skitter'(t, v, bus) { const a = S.AC;
    for (let k = 0; k < 8; k++) { const tt = t + k * .045 + (k % 2) * .012, o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = 'square'; o.frequency.setValueAtTime(1700 + (k % 3) * 260, tt); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 4;
      g.gain.setValueAtTime(.0001, tt); g.gain.exponentialRampToValueAtTime(.09 * v, tt + .003); g.gain.exponentialRampToValueAtTime(.0001, tt + .03);
      const pn = a.createStereoPanner ? a.createStereoPanner() : null; o.connect(f); f.connect(g);
      if (pn) { pn.pan.value = -.8 + k * .22; g.connect(pn); pn.connect(bus); } else g.connect(bus); o.start(tt); o.stop(tt + .04); } },
  // a plucked, boingy web thread
  '~twang'(t, v, bus) { const a = S.AC, o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(196, t + .5);
    o2.type = 'sine'; o2.frequency.value = 6; const d = a.createGain(); d.gain.value = 14; o2.connect(d); d.connect(o.frequency);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(500, t + .6);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18 * v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + .8);
    o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o2.start(t); o.stop(t + .85); o2.stop(t + .85); },
  // a slow creaky door / old floorboard
  '~creak'(t, v, bus) { const a = S.AC, o = a.createOscillator(), g = a.createGain(), bp = a.createBiquadFilter(), am = a.createOscillator(), ad = a.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(140, t + .7); o.frequency.linearRampToValueAtTime(110, t + 1.1);
    am.type = 'square'; am.frequency.setValueAtTime(18, t); am.frequency.linearRampToValueAtTime(30, t + 1.1); ad.gain.value = .5;
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 5;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.07 * v, t + .15); g.gain.setValueAtTime(.07 * v, t + .9); g.gain.exponentialRampToValueAtTime(.0001, t + 1.2);
    const mod = a.createGain(); mod.gain.value = .5; am.connect(ad); ad.connect(mod.gain);
    o.connect(bp); bp.connect(mod); mod.connect(g); g.connect(bus); o.start(t); am.start(t); o.stop(t + 1.25); am.stop(t + 1.25); },
  // soft jazz brush
  '~brush'(t, v, bus) { const a = S.AC, n = a.sampleRate * .16, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2) * Math.min(1, i / (n * .15));
    const src = a.createBufferSource(); src.buffer = b; const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
    const g = a.createGain(); g.gain.value = .35 * v; src.connect(f); f.connect(g); g.connect(bus); src.start(t); }
};
/* small synth rock kit (Floor Is Lava rock and roll) */
function noiseBuf(a, dur, shape) { const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, shape); const s = a.createBufferSource(); s.buffer = b; return s; }
const DRUM_FX = {
  '~kick'(t, v, bus) { const a = S.AC, o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + .12);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.55 * v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + .35); },
  '~hat'(t, v, bus) { const a = S.AC, s = noiseBuf(a, .05, 4), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = .6 * v; s.connect(f); f.connect(g); g.connect(bus); s.start(t); },
  '~crash'(t, v, bus) { const a = S.AC, s = noiseBuf(a, 1.4, 2.5), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'highpass'; f.frequency.value = 5000; g.gain.value = .3 * v; s.connect(f); f.connect(g); g.connect(bus); s.start(t); }
};
/* one note of a styled arrangement (see songs.js): real sample, or a synth stand-in */
function playEvent([inst, m, v, len, wet, delay], t) {
  if (delay) t += delay;
  if (inst === '~snare') { const a = S.AC, n = a.sampleRate * .12, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
    const src = a.createBufferSource(); src.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .7;
    const g = a.createGain(); g.gain.value = v * 2; src.connect(f); f.connect(g); g.connect(S.BUS.music); src.start(t); return; }
  if (SPIDER_FX[inst]) { SPIDER_FX[inst](t, v, S.BUS.music); return; }
  if (DRUM_FX[inst]) { DRUM_FX[inst](t, v, S.BUS.music); return; }
  const g = playSample(S.AC, inst, m, t, v / .7, S.BUS.music, len);
  if (g) { if (wet) { const w = S.AC.createGain(); w.gain.value = wet; g.connect(w); w.connect(S.BUS.rev); } return; }
  if (m < 55) bass(m, t, v, Math.min(1, len)); else kalimba(m, t, v);
}
function musicTick() {
  const a = S.AC, M = S.mu; if (!M.on || !a) return;
  const style = STYLES[S.track];
  if (style) {
    const sd = 60 / (S.bpmFixed ? S.bpm() : style.bpm) / 2;
    if (M.next < a.currentTime - .5) M.next = a.currentTime + .05;
    while (M.next < a.currentTime + .15) { if (S.musicOn && S.soundOn) for (const e of style.play(M.step)) playEvent(e, M.next); M.step++; M.next += sd; }
    return;
  }
  const tr = TRACKS[S.track], sd = 60 / S.bpm() / tr.spb;
  if (M.next < a.currentTime - .5) M.next = a.currentTime + .05;
  while (M.next < a.currentTime + .15) { if (S.musicOn && S.soundOn) tr.play(M.step % tr.len, M.next); M.step++; M.next += sd; }
}
export function musicStart() { const a = audio(); if (!a || S.mu.on) return; Object.assign(S.mu, { on: true, step: 0, next: a.currentTime + .1 }); S.mu.timer = setInterval(musicTick, 25); syncAmb(); }
export function musicStop() { S.mu.on = false; clearInterval(S.mu.timer); syncAmb(); }

/* ---- ambience: pond (water, frogs, birds) or night (crickets, breeze) ---- */
function syncAmb() { const want = S.mu.on && S.ambOn && S.soundOn; if (want && !S.ambNode) ambStart(); else if (!want && S.ambNode) ambStop(); }
/* pond ambience: lapping water, trickling bubbles, frog ribbits, bird warbles. Returns stop() */
function pondAmb(a,B){
  const len=a.sampleRate*4,buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);
  let l=0;for(let i=0;i<len;i++){l=(l+.04*(Math.random()*2-1))/1.04;d[i]=l*3;}
  const src=a.createBufferSource();src.buffer=buf;src.loop=true;
  const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=450;bp.Q.value=.6;
  const g=a.createGain();g.gain.value=.25;src.connect(bp);bp.connect(g);g.connect(B);src.start();
  const timers=[];let alive=true;
  const swell=()=>{if(!alive)return;g.gain.setTargetAtTime(.12+Math.random()*.28,a.currentTime,.6);timers[0]=setTimeout(swell,700+Math.random()*1200);};swell();
  const bubble=t=>{const o=a.createOscillator(),gg=a.createGain(),f=500+Math.random()*1100;o.type='sine';
    o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*(1.5+Math.random()*.6),t+.02+Math.random()*.02);
    gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(.012+Math.random()*.03,t+.003);gg.gain.exponentialRampToValueAtTime(.0001,t+.045);
    o.connect(gg);gg.connect(B);o.start(t);o.stop(t+.06);};
  const trickle=()=>{if(!alive)return;const t=a.currentTime+.03,n=1+Math.floor(Math.random()*3);for(let k=0;k<n;k++)bubble(t+Math.random()*.12);timers[1]=setTimeout(trickle,90+Math.random()*220);};trickle();
  const ribbit=t=>{const f=170+Math.random()*90;for(let k=0;k<2;k++){const tt=t+k*.16,o=a.createOscillator();o.type='sawtooth';
      o.frequency.setValueAtTime(f*1.05,tt);o.frequency.linearRampToValueAtTime(f*.92,tt+.11);
      const am=a.createGain();am.gain.value=.5;const lfo=a.createOscillator();lfo.type='square';lfo.frequency.value=32+Math.random()*10;
      const dep=a.createGain();dep.gain.value=.5;lfo.connect(dep);dep.connect(am.gain);
      const f2=a.createBiquadFilter();f2.type='bandpass';f2.frequency.value=900;f2.Q.value=2.5;
      const e=a.createGain();e.gain.setValueAtTime(.0001,tt);e.gain.exponentialRampToValueAtTime(.16,tt+.015);e.gain.setValueAtTime(.16,tt+.07);e.gain.exponentialRampToValueAtTime(.0001,tt+.12);
      o.connect(am);am.connect(f2);f2.connect(e);e.connect(B);o.start(tt);lfo.start(tt);o.stop(tt+.14);lfo.stop(tt+.14);}};
  const warble=t=>{const base=2600+Math.random()*900,n=2+Math.floor(Math.random()*3);for(let k=0;k<n;k++){const tt=t+k*.2,o=a.createOscillator();o.type='sine';
      o.frequency.setValueAtTime(base,tt);o.frequency.exponentialRampToValueAtTime(base*(1.2+Math.random()*.3),tt+.08);o.frequency.exponentialRampToValueAtTime(base*.9,tt+.16);
      const v=a.createOscillator();v.frequency.value=22+Math.random()*10;const vd=a.createGain();vd.gain.value=base*.06;v.connect(vd);vd.connect(o.frequency);
      const e=a.createGain();e.gain.setValueAtTime(.0001,tt);e.gain.exponentialRampToValueAtTime(.03,tt+.02);e.gain.exponentialRampToValueAtTime(.0001,tt+.17);
      o.connect(e);e.connect(B);o.start(tt);v.start(tt);o.stop(tt+.2);v.stop(tt+.2);}};
  const life=()=>{if(!alive)return;const t=a.currentTime+.05,r=Math.random();
    if(r<.45){ribbit(t);if(Math.random()<.4)ribbit(t+.6+Math.random()*.4);}else if(r<.8)warble(t);
    timers[2]=setTimeout(life,1500+Math.random()*2500);};timers[2]=setTimeout(life,800);
  return ()=>{alive=false;timers.forEach(clearTimeout);try{src.stop(a.currentTime+.05)}catch(e){}};
}
/* lava: a warm low rumble with slow bloopy bubbles and the odd soft pop */
function lavaAmb(a,B){
  const len=a.sampleRate*4,buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);
  let l=0;for(let i=0;i<len;i++){l=(l+.015*(Math.random()*2-1))/1.015;d[i]=l*5;}
  const src=a.createBufferSource();src.buffer=buf;src.loop=true;
  const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=160;const g=a.createGain();g.gain.value=.5;src.connect(lp);lp.connect(g);g.connect(B);src.start();
  const timers=[];let alive=true;
  const swell=()=>{if(!alive)return;g.gain.setTargetAtTime(.3+Math.random()*.4,a.currentTime,.8);timers[0]=setTimeout(swell,900+Math.random()*1400);};swell();
  const blub=t=>{const f=110+Math.random()*90,o=a.createOscillator(),e=a.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*2.6,t+.14);
    e.gain.setValueAtTime(.0001,t);e.gain.exponentialRampToValueAtTime(.16,t+.02);e.gain.exponentialRampToValueAtTime(.0001,t+.2);o.connect(e);e.connect(B);o.start(t);o.stop(t+.22);};
  const life=()=>{if(!alive)return;const t=a.currentTime+.05,n=1+Math.floor(Math.random()*2);for(let k=0;k<n;k++)blub(t+k*.12);timers[1]=setTimeout(life,500+Math.random()*1300);};life();
  return ()=>{alive=false;timers.forEach(clearTimeout);try{src.stop(a.currentTime+.05)}catch(e){}};
}
function ambStart() {
  const a = S.AC, B = S.BUS.amb;
  if (S.amb === 'none') return;
  if (S.amb === 'lava') { S.ambNode = { stop: lavaAmb(a, B) }; return; }
  if (S.amb !== 'night') { S.ambNode = { stop: pondAmb(a, B) }; return; }
  const len = a.sampleRate * 3, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  let l = 0; for (let i = 0; i < len; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; const g = a.createGain(); g.gain.value = .2;
  src.connect(lp); lp.connect(g); g.connect(B); src.start();
  let alive = true, timer = 0;
  const ev = () => { if (!alive) return; const t = a.currentTime + .05; cricket(t, B); if (Math.random() < .12) owl(t + .4, B); timer = setTimeout(ev, 500 + Math.random() * 900); };
  ev();
  S.ambNode = { stop() { alive = false; clearTimeout(timer); try { src.stop(a.currentTime + .05); } catch (e) {} } };
}
function ambStop() { S.ambNode.stop(); S.ambNode = null; }
function frog(t, B) { const f = 90 + Math.random() * 40, n = 2 + Math.floor(Math.random() * 2);
  for (let k = 0; k < n; k++) { const tt = t + k * .13, lp = S.AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480; const g = mEnv(tt, .01, .09, .09); mOsc('square', f, tt, .12).connect(lp); lp.connect(g); g.connect(B); } }
function bird(t, B) { const base = 2300 + Math.random() * 900, n = 2 + Math.floor(Math.random() * 3);
  for (let k = 0; k < n; k++) { const tt = t + k * .11, o = S.AC.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(base, tt); o.frequency.exponentialRampToValueAtTime(base * 1.45, tt + .07); const g = mEnv(tt, .005, .07, .035); o.connect(g); g.connect(B); o.start(tt); o.stop(tt + .1); } }
function cricket(t, B) { const f = 4200 + Math.random() * 500, n = 3;
  for (let k = 0; k < n; k++) { const tt = t + k * .045, g = mEnv(tt, .004, .03, .025); mOsc('sine', f, tt, .04).connect(g); g.connect(B); } }
function owl(t, B) { [0, .45].forEach((d, k) => { const tt = t + d, o = S.AC.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(420 - k * 20, tt); o.frequency.exponentialRampToValueAtTime(380 - k * 20, tt + .35); const g = mEnv(tt, .06, .3, .05); o.connect(g); g.connect(B); o.start(tt); o.stop(tt + .45); }); }

/* ---- sound controls: speaker button #snd + grown-ups segs #music-seg #amb-seg #sfx-seg ---- */
export function bindSound(getText) {
  const segSet = (id, val) => document.querySelectorAll('#' + id + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === String(val)));
  function sync() {
    const u = getText(), b = $('snd');
    b.textContent = S.soundOn ? '🔊' : '🔇'; b.setAttribute('aria-label', u.mute); b.setAttribute('aria-pressed', !S.soundOn);
    for (const id of ['music-seg', 'amb-seg', 'sfx-seg']) document.querySelectorAll('#' + id + ' button').forEach(x => x.textContent = u[x.dataset.v === '1' ? 'on' : 'off']);
    segSet('music-seg', +S.musicOn); segSet('amb-seg', +S.ambOn); segSet('sfx-seg', +S.sfxOn);
  }
  const after = () => { audio(); applyGains(); syncAmb(); sync(); };
  $('snd').onclick = () => { S.soundOn = !S.soundOn; LS.set('bp-sound', S.soundOn ? '1' : '0'); after(); };
  const bind = (id, key, ls) => document.querySelectorAll('#' + id + ' button').forEach(b => b.onclick = () => { S[key] = b.dataset.v === '1'; LS.set(ls, b.dataset.v); after(); });
  bind('music-seg', 'musicOn', 'bp-music'); bind('amb-seg', 'ambOn', 'bp-amb'); bind('sfx-seg', 'sfxOn', 'bp-sfx');
  return sync;
}

/* ======================= DRAWING ======================= */
export function ell(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); return p; }
export function sticker(c, path, fill, lw) { c.fillStyle = fill; c.fill(path); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(path); }
export function starPath(r) { const p = new Path2D(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .5 : r; p[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } p.closePath(); return p; }

/* playroom (day) or dusk garden (night) */
export function drawRoom(c, W, H, night = false) {
  const g = c.createLinearGradient(0, 0, 0, H);
  if (night) { g.addColorStop(0, '#3B3570'); g.addColorStop(.6, '#5B4E8C'); g.addColorStop(1, '#7E6BA8'); }
  else { g.addColorStop(0, '#CDEEFF'); g.addColorStop(1, '#A9DBF7'); }
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (night) {
    c.fillStyle = 'rgba(255,248,214,.85)';
    for (const [x, y, r] of [[.12,.1,2],[.3,.2,1.5],[.7,.08,2.2],[.88,.22,1.6],[.5,.16,1.3],[.2,.32,1.2],[.82,.38,1.4]]) { c.beginPath(); c.arc(x * W, y * H, r * 1.6, 0, 7); c.fill(); }
    const mr = Math.min(W, H) * .06; sticker(c, ell(W * .82, H * .12, mr, mr), '#FFF1B8', 3);
    c.fillStyle = 'rgba(230,210,140,.55)'; c.fill(ell(W * .8, H * .11, mr * .25, mr * .2)); c.fill(ell(W * .845, H * .14, mr * .15, mr * .12));
    c.fillStyle = '#4A3E78'; c.beginPath(); c.ellipse(W * .2, H * 1.02, W * .6, H * .2, 0, 0, 7); c.ellipse(W * .85, H * 1.04, W * .55, H * .18, 0, 0, 7); c.fill();
    return;
  }
  c.fillStyle = 'rgba(255,255,255,.75)';
  for (const [x, y, s] of [[.18,.2,1],[.8,.3,.8],[.55,.12,.6]]) { const cx = x * W, cy = y * H, r = Math.min(W, H) * .06 * s; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.arc(cx + r, cy - r * .4, r * 1.2, 0, 7); c.arc(cx + r * 2.1, cy, r * .9, 0, 7); c.fill(); }
  const py = H * .9; c.fillStyle = '#7CCBEA'; c.beginPath(); c.ellipse(W / 2, py + H * .08, W * .75, H * .12, 0, 0, 7); c.fill();
}

/* cartoon child (no-camera mode). roll = side tilt; yaw/pitch shift the face. Returns face geometry. */
export function drawKid(c, W, H, cx, neckY, hw, roll, t, yaw = 0, pitch = 0) {
  const lw = Math.max(3, hw * .05);
  const sh = new Path2D(); sh.moveTo(cx - hw * 1.15, H + 10); sh.bezierCurveTo(cx - hw * 1.1, neckY + hw * .2, cx - hw * .6, neckY + hw * .02, cx - hw * .2, neckY + hw * .02);
  sh.quadraticCurveTo(cx, neckY + hw * .16, cx + hw * .2, neckY + hw * .02); sh.bezierCurveTo(cx + hw * .6, neckY + hw * .02, cx + hw * 1.1, neckY + hw * .2, cx + hw * 1.15, H + 10); sh.closePath();
  sticker(c, sh, '#4FB3A9', lw); c.fillStyle = 'rgba(255,255,255,.25)'; c.fill(ell(cx - hw * .55, neckY + hw * .2, hw * .25, hw * .08, -.2));
  c.save(); c.translate(cx, neckY); c.rotate(roll);
  const r = hw * .5, fx = yaw * r * .45, fy = pitch * r * .35;
  sticker(c, ell(0, -r * .15, r * .32, r * .4), '#F2BE94', lw);
  sticker(c, ell(-r * .98 + fx * .3, -r * 1.05, r * .2 * (1 - Math.max(0, yaw) * .5), r * .26), '#F6C9A0', lw);
  sticker(c, ell(r * .98 + fx * .3, -r * 1.05, r * .2 * (1 + Math.min(0, yaw) * .5), r * .26), '#F6C9A0', lw);
  sticker(c, ell(0, -r * 1.1, r, r * 1.02), '#F6C9A0', lw);
  const hair = new Path2D(); hair.moveTo(-r * 1.02, -r * 1.0 + fy * .3); hair.bezierCurveTo(-r * 1.1, -r * 2.3, r * 1.1, -r * 2.3, r * 1.02, -r * 1.0 + fy * .3);
  hair.quadraticCurveTo(r * .6 + fx * .3, -r * 1.55 + fy * .5, r * .1 + fx * .3, -r * 1.42 + fy * .5); hair.quadraticCurveTo(-r * .4 + fx * .3, -r * 1.7 + fy * .5, -r * 1.02, -r * 1.0 + fy * .3); hair.closePath(); sticker(c, hair, '#5B3A29', lw);
  const bl = (Math.sin(t * 1.3) > 0.985) ? .15 : 1;
  for (const s of [-1, 1]) { c.fillStyle = INK; c.fill(ell(s * r * .36 + fx, -r * 1.05 + fy, r * .1, r * .13 * bl)); c.fillStyle = '#fff'; c.fill(ell(s * r * .36 + fx + r * .035, -r * 1.1 + fy, r * .035, r * .035 * bl));
    c.fillStyle = 'rgba(255,130,150,.6)'; c.fill(ell(s * r * .6 + fx, -r * .82 + fy, r * .14, r * .09)); }
  c.fillStyle = '#EFAF85'; c.fill(ell(fx * 1.15, -r * .93 + fy * 1.1, r * .09, r * .07));
  c.lineWidth = lw * .8; c.strokeStyle = INK; c.beginPath(); c.arc(fx, -r * .82 + fy, r * .22, .2 * Math.PI, .8 * Math.PI); c.stroke();
  c.restore();
  const top = -r * 2.02;
  // local face point -> screen
  const to = (lx, ly) => ({ x: cx + Math.cos(roll) * lx - Math.sin(roll) * ly, y: neckY + Math.sin(roll) * lx + Math.cos(roll) * ly });
  return { top: { x: cx + Math.sin(roll) * -top, y: neckY + Math.cos(roll) * top }, r, fx, fy, to };
}

/* ======================= CAMERA / FACE TRACKING ======================= */
export async function startFaceTracker(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocam');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  video.srcObject = stream; await video.play();
  const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
  const files = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  const opts = d => ({ baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: d }, runningMode: 'VIDEO', numFaces: 1 });
  try { return await vision.FaceLandmarker.createFromOptions(files, opts('GPU')); }
  catch (e) { return await vision.FaceLandmarker.createFromOptions(files, opts('CPU')); }
}
export function coverMap(video, W, H) { const vw = video.videoWidth || 640, vh = video.videoHeight || 480, s = Math.max(W / vw, H / vh); return { vw, vh, s, ox: (W - vw * s) / 2, oy: (H - vh * s) / 2 }; }
/* landmarks -> mirrored screen points */
export function faceFrame(tracker, video, now, W, H) {
  let res; try { res = tracker.detectForVideo(video, now); } catch (e) { return null; }
  const lm = res && res.faceLandmarks && res.faceLandmarks[0]; if (!lm) return null;
  const m = coverMap(video, W, H);
  return i => ({ x: m.ox + (1 - lm[i].x) * m.vw * m.s, y: m.oy + lm[i].y * m.vh * m.s });
}
export function drawMirroredVideo(c, video, W, H) {
  const m = coverMap(video, W, H); c.save(); c.translate(W, 0); c.scale(-1, 1);
  c.drawImage(video, W - m.ox - m.vw * m.s, m.oy, m.vw * m.s, m.vh * m.s); c.restore();
}

/* ======================= CAMERA / BODY (POSE) TRACKING ======================= */
export async function startPoseTracker(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocam');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  video.srcObject = stream; await video.play();
  const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
  const files = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  const opts = d => ({ baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: d }, runningMode: 'VIDEO', numPoses: 1 });
  try { return await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); }
  catch (e) { return await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); }
}
/* pose landmarks -> mirrored screen points with visibility (v) */
export function poseFrame(tracker, video, now, W, H) {
  let res; try { res = tracker.detectForVideo(video, now); } catch (e) { return null; }
  const lm = res && res.landmarks && res.landmarks[0]; if (!lm) return null;
  const m = coverMap(video, W, H);
  return i => ({ x: m.ox + (1 - lm[i].x) * m.vw * m.s, y: m.oy + lm[i].y * m.vh * m.s, v: lm[i].visibility ?? 1 });
}
