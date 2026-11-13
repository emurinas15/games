/* Bamboo Physio game music: one core melody, arranged in a different style per game.
   32-bar form built from the 4-bar core: A A2 B B2 A3 A2 B end.
   Pure data/functions (no browser APIs) so the note list can be computed anywhere. */

const _ = null;
export const CORE = {
  mel: [76,_,79,76,72,_,74,76, 81,_,79,76,72,_,_,_, 77,_,81,77,72,_,74,77, 79,_,77,74,71,_,74,_],
  ch: [[60,64,67],[57,60,64],[53,57,60],[55,59,62]],
  root: [48,45,41,43]
};
const PLAN = ['A','A2','B','B2','A3','A2','B','end'];
const SCALE = [0,2,4,5,7,9,11];
function scaleStep(m, dir) { // next note of C major up (+1) or down (-1)
  let n = m + dir; while (!SCALE.includes(((n % 12) + 12) % 12)) n += dir; return n;
}
function fill(mel) { // add passing notes into the gaps -> busier variation
  const out = [...mel];
  for (let i = 1; i < out.length; i++) if (out[i] == null && i % 2 === 1) {
    const prev = out[i - 1], next = mel.slice(i + 1).find(x => x != null);
    if (prev != null && next != null && prev !== next) out[i] = scaleStep(prev, next > prev ? 1 : -1);
  }
  return out;
}
function section(name) {
  const c = CORE, tr = (a, k) => a.map(x => x == null ? x : x + k);
  switch (name) {
    case 'A2': return { mel: fill(c.mel), ch: c.ch, root: c.root };
    case 'B': return { mel: tr(c.mel, 5), ch: c.ch.map(x => tr(x, 5)), root: tr(c.root, 5) };
    case 'B2': return { mel: fill(tr(c.mel, 5)), ch: c.ch.map(x => tr(x, 5)), root: tr(c.root, 5) };
    case 'A3': return { mel: c.mel.map((x, i) => x != null && i % 4 === 0 ? x + 12 : x), ch: c.ch, root: c.root };
    case 'end': return { mel: [...c.mel.slice(0, 24), 72,_,_,_,_,_,_,_], ch: [...c.ch.slice(0, 3), [60,64,67]], root: [...c.root.slice(0, 3), 48] };
    default: return c;
  }
}
const SECTIONS = PLAN.map(section);
const minor = m => { const pc = ((m % 12) + 12) % 12; return (pc === 4 || pc === 9 || pc === 11) ? m - 1 : m; }; // C major -> C minor

/* styles: tempo + how each step is played. Events: [instrument, midi, volume, length(s), reverb] */
export const STYLES = {
  /* Marble Plate: elegant baroque — harpsichord melody over a mellow cello */
  baroque: { bpm: 92, play(s) {
    const { mel, ch, root, i } = at(s), ev = [];
    if (mel != null) ev.push(['harpsichord', mel, .3, .7, .3]);
    // mellow cello accompaniment: long low root, then a soft chord tone halfway through the bar
    if (i === 0) ev.push(['cello', root, .2, 2.4, .45]);
    if (i === 4) ev.push(['cello', ch[1] - 12 < root ? ch[1] : ch[1] - 12, .13, 1.8, .45]);
    return ev; } },
  /* Glow Spots: nighttime lullaby — slow celesta, harp arpeggios, soft bass */
  lullaby: { bpm: 64, play(s) {
    const { mel, ch, root, i } = at(s), ev = [];
    if (mel != null) ev.push(['celesta', mel, .24, 1.8, .55]);
    if (i % 2 === 0) ev.push(['orchestral_harp', ch[[0, 1, 2, 1][(i / 2) % 4]], .12, 1.6, .5]);
    if (i === 0) ev.push(['acoustic_bass', root, .16, 2, .2]);
    return ev; } },
  /* Spider Swat: dark, minor, action — pizzicato strings, driving cello, timpani, snare */
  action: { bpm: 126, minor: true, play(s) {
    const { mel, ch, root, i } = at(s), ev = [];
    if (mel != null) ev.push(['pizzicato_strings', mel, .32, .35, .2]);
    ev.push(['cello', i % 4 === 2 ? root : root - 12, .13, .2, .05]);
    if (i === 0 || i === 4) ev.push(['timpani', root - 12 + (i === 4 ? 7 : 0), .3, .9, .2]);
    if (i === 2 || i === 6) ev.push(['~snare', 0, .18, .1, 0]);
    if (i === 0) ev.push(['pizzicato_strings', ch[0] - 12, .12, .3, .2]);
    return ev.map(e => e[0][0] === '~' ? e : [e[0], minor(e[1]), e[2], e[3], e[4]]); } },
  /* Spider Swat: playful Halloween — same major melody on xylophone 'bones', tuba oom-pah, soft ghostly choir */
  spooky: { bpm: 104, play(s) {
    const { mel, ch, root, i } = at(s), ev = [];
    if (mel != null) ev.push(['xylophone', mel, .26, .5, .3]);
    if (i === 0) ev.push(['tuba', root - 12, .26, .35, .1]);
    if (i === 4) ev.push(['tuba', root - 5, .22, .35, .1]);
    if (i === 2 || i === 6) ev.push(['xylophone', ch[2] - 12, .08, .25, .2]);
    if (i === 0) for (const n of [ch[0], ch[2]]) ev.push(['choir_aahs', n, .06, 2.3, .6]);
    return ev; } },
  /* Floor Is Lava: tropical volcano island — bouncy marimba melody, kalimba off-beat chords,
     plucky acoustic bass, a soft timpani 'rumble' at the start of each section */
  island: { bpm: 112, play(s) {
    const { mel, ch, root, i } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 32;
    if (mel != null) ev.push(['marimba', mel, .28, .6, .25]);
    if (i === 2 || i === 6) for (const n of ch.slice(1)) ev.push(['kalimba', n + 12, .07, .5, .35]);
    if (i === 0) ev.push(['acoustic_bass', root, .24, .45, .08]);
    if (i === 3) ev.push(['acoustic_bass', root + 7, .16, .3, .08]);
    if (i === 4) ev.push(['acoustic_bass', root + 12 > 55 ? root : root + 12, .18, .35, .08]);
    if (k === 0) ev.push(['timpani', root - 12, .22, 1.6, .3]);
    return ev; } },
  /* Freeze & Copy: bouncy dance party — xylophone melody, nylon-guitar off-beat chops, hopping acoustic bass, a timpani 'freeze' thump each 2 bars */
  dance: { bpm: 124, play(s) {
    const { mel, ch, root, i } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 32;
    if (mel != null) ev.push(['xylophone', mel, .26, .4, .2]);
    if (i % 2 === 1) for (const n of ch) ev.push(['acoustic_guitar_nylon', n, .06, .22, .15]);
    if (i % 2 === 0) ev.push(['acoustic_bass', i % 4 === 0 ? root : root + 12 > 55 ? root + 7 : root + 12, .22, .3, .05]);
    if (k % 16 === 0) ev.push(['timpani', root - 12, .16, 1, .3]);
    return ev; } },
  /* ---- Spider Swat music options (12 Nov evening) — same melody, spider twists ---- */
  /* A · Sneaky tiptoe: staccato bassoon melody, tiptoeing pizzicato, a little leg-skitter every 2 bars */
  spiderTiptoe: { bpm: 100, play(s) {
    const { mel, ch, root, i } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 32;
    if (mel != null) ev.push(['bassoon', mel - 12, .3, .28, .2]);
    if (i % 2 === 0) ev.push(['pizzicato_strings', i % 4 === 0 ? root : ch[0], .14, .3, .2]);
    if (k % 16 === 14) ev.push(['~skitter', 0, .6, 0, 0]);   // 20% louder (Edgar, 12 Nov)
    return ev; } },
  /* B · Haunted harpsichord: harpsichord melody, slow low cello, a web 'twang' each section, soft choir in the middle */
  spiderHarpsi: { bpm: 96, play(s) {
    const { mel, ch, root, i, sec } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 32;
    if (mel != null) ev.push(['harpsichord', mel, .28, .7, .35]);
    if (i === 0) ev.push(['cello', root, .2, 2.2, .45]);
    if (k === 0) ev.push(['~twang', 0, .6, 0, 0]);
    if (sec[0] === 'B' && i === 0) ev.push(['choir_aahs', ch[2], .06, 2.2, .7]);
    return ev; } },
  /* C · Attic music box: slow music box, celesta sparkle, soft bass, a creaky door now and then */
  spiderBox: { bpm: 80, play(s) {
    const { mel, root, i } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 64;
    if (mel != null) ev.push(['music_box', mel, .3, 1.4, .5]);
    if (i === 0 && mel != null) ev.push(['celesta', mel + 12, .07, 1.2, .6]);
    if (i === 0) ev.push(['acoustic_bass', root, .15, 1.6, .2]);
    if (k === 60) ev.push(['~creak', 0, .5, 0, 0]);
    return ev; } },
  /* D · Spooky swing: swung vibraphone melody, walking bass, soft brushes, a skitter fill */
  spiderSwing: { bpm: 116, play(s) {
    const { mel, ch, root, i } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 32, sw = i % 2 ? .085 : 0;
    if (mel != null) ev.push(['vibraphone', mel, .26, .8, .35, sw]);
    if (i % 2 === 0) { const fit = x => { while (x >= root + 12) x -= 12; while (x < root) x += 12; return x; };
      ev.push(['acoustic_bass', [root, fit(ch[1]), fit(ch[2]), fit(ch[1])][i / 2], .2, .4, .08]); }
    if (i === 2 || i === 6) ev.push(['~brush', 0, .35, 0, 0, sw]);
    if (k === 30) ev.push(['~skitter', 0, .45, 0, 0]);
    return ev; } },
  /* Copy the Sprout: natural, Irish-flute feel — wooden flute with little 'cut' grace notes,
     a soft recorder harmony in the middle sections, fingerpicked nylon guitar, bass */
  natural: { bpm: 88, play(s) {
    const { mel, ch, root, i, sec } = at(s), ev = [];
    if (mel != null) {
      if (i % 4 === 0 && mel < 86) { ev.push(['flute', scaleStep(mel, 1), .1, .07, .3]); ev.push(['flute', mel, .24, 1, .4, .05]); }   // Irish cut
      else ev.push(['flute', mel, .24, 1, .4]);
      if (sec[0] === 'B') ev.push(['recorder', scaleStep(scaleStep(mel, -1), -1), .1, .9, .4]);   // a third below
    }
    ev.push(['acoustic_guitar_nylon', ch[[0, 1, 2, 1, 0, 2, 1, 2][i]], .07, .9, .3]);
    if (i === 0 || i === 4) ev.push(['acoustic_bass', root, .2, 1.1, .1]);
    return ev; } },
  /* Floor Is Lava (13 Nov, Edgar): 80s classic rock, studio (not live) — punchy but friendly, action-packed.
     Straight driving eighths: palm-muted power chords (root+5th+octave) on distortion guitar, open chord stab on each
     bar, overdriven lead melody, pumping electric bass, tight kick/snare (80s roomy snare), hats, tom fill + crash per section */
  lavaRock: { bpm: 132, play(s) {
    const { mel, root, i } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 32;
    const r = root < 45 ? root + 12 : root, fill = k >= 28;
    if (mel != null) ev.push(['overdriven_guitar', mel - 12, .32, .36, .22]);
    if (i === 0) for (const n of [r, r + 7, r + 12]) ev.push(['distortion_guitar', n, .16, .7, .25]);         // open stab
    else for (const n of [r, r + 7]) ev.push(['distortion_guitar', n, .13, .12, .06]);                        // palm-muted chug
    ev.push(['electric_bass_pick', root, i % 2 ? .18 : .24, .2, .02]);
    if (!fill) {
      if (i === 0 || i === 3 || i === 4) ev.push(['~kick', 0, i === 3 ? .6 : 1, 0, 0]);
      if (i === 2 || i === 6) ev.push(['~snare80', 0, 1.5, 0, 0]);
      ev.push(['~hat', 0, i % 2 ? .3 : .5, 0, 0]);
    } else {
      ev.push(['~tom', [220, 190, 165, 145][k - 28], .9, 0, 0]);
      if (k === 31) ev.push(['~snare80', 0, 1.2, 0, 0]);
    }
    if (k === 0) ev.push(['~crash', 0, .8, 0, 0]);
    return ev.map(e => (e[2] *= e[0] === '~kick' ? .42 : .5, e)); } },   // level-matched to the old island track
  /* Copy the Sprout (13 Nov, v2): a cappella in Edgar's own voice at the centre — 'doo'/'dah' scat melody with a
     chromatic scoop, 'bom' bass, a soft 'aah' choir harmony and a recorder third below in the B sections, gentle
     fingerpicked nylon guitar; mouth drums only a whisper; a bubble pop now and then */
  acappella: { bpm: 116, play(s) {
    const { mel, ch, root, i, sec } = at(s), ev = [], k = ((s % STEPS) + STEPS) % STEPS % 64, sw = i % 2 ? .06 : 0;
    if (mel != null) {
      let v = mel - 24; while (v > 62) v -= 12;
      const syl = i % 4 === 0 ? 'voice_dah' : 'voice_doo';
      if (i % 8 === 0) { ev.push([syl, v - 1, .16, .07, .15]); ev.push([syl, v, .4, .32, .2, .07]); }   // goofy scoop up
      else ev.push([syl, v, .36, .26, .2, sw]);
      if (sec[0] === 'B') ev.push(['recorder', scaleStep(scaleStep(mel, -1), -1), .07, .5, .35, sw]);  // a third below
    }
    if (i === 0) ev.push(['voice_bom', root, .3, .3, .1]);
    if (i === 4) ev.push(['voice_bom', root + 7 > 53 ? root - 5 : root + 7, .24, .3, .1]);
    ev.push(['acoustic_guitar_nylon', ch[[0, 1, 2, 1, 0, 2, 1, 2][i]], .06, .8, .3, sw]);
    if (i === 0) for (const n of ch) ev.push(['choir_aahs', n, sec[0] === 'B' ? .07 : .035, 1.9, .5]);
    if (i === 2 || i === 6) ev.push(['voice_k', 60, .07, .2, .05]);
    if (k === 21 || k === 46 || k === 59) ev.push(['~bubble', k === 46 ? 1.25 : 1, .7, 0, 0, sw]);
    return ev.map(e => (e[2] *= 1.4, e)); } }
};
export const STEPS = PLAN.length * 32;   // 256 eighth-notes = 32 bars
function at(s) {
  s = ((s % STEPS) + STEPS) % STEPS;
  const sec = SECTIONS[Math.floor(s / 32)], k = s % 32, bar = Math.floor(k / 8);
  return { mel: sec.mel[k], ch: sec.ch[bar], root: sec.root[bar], i: k % 8, sec: PLAN[Math.floor(s / 32)] };
}
/* every sampled note a style needs: { instrument: [midi...] } */
export function styleNotes(name) {
  const st = STYLES[name], out = {};
  for (let s = 0; s < STEPS; s++) for (const [inst, m] of st.play(s)) if (inst[0] !== '~') (out[inst] = out[inst] || new Set()).add(m);
  for (const k in out) out[k] = [...out[k]].sort((a, b) => a - b);
  return out;
}
