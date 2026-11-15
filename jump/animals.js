/* Jump Race — the three animals you race against.
   Every drawing is a pure function of time t (seconds since "Go"; t < 0 = waiting, idle).
   The animal's jump is counted at the moment it LANDS (RACERS[id].land + n * P).

   Panda  (every 3 s): on all fours → rears up on two legs → jumps → heavy landing: the ground trembles
                        and the panda wobbles, almost falls over (cute), then drops back on all fours.
   Duck   (every 2 s): waddles, crouches, jumps flapping its wings fast, lands with a squash.
   Rabbit (every 1 s): quick hops with ears that follow through; now and then an ear (or both)
                        flaps on its own, at random moments.                                          */

import { INK, ell, sticker } from '../shared/kit.js';

export const RACERS = {
  panda:  { P: 3, land: 1.85 },
  duck:   { P: 2, land: 1.4 },
  rabbit: { P: 1, land: .6 }
};
export const jumpsAt = (id, t) => { const R = RACERS[id]; return t < R.land ? 0 : Math.floor((t - R.land) / R.P) + 1; };

const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blink = (t, seed) => { const k = Math.floor(t / 2.7 + seed), f = t / 2.7 + seed - k; return hash(k + seed * 13) < .55 && f > .93 ? .12 : 1; };

/* thick limb with an ink outline (two strokes) */
function limb(c, pts, w, col, lw) {
  const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) c.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else c.lineTo(pts[1][0], pts[1][1]); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  path(); c.strokeStyle = INK; c.lineWidth = w + lw * 2; c.stroke();
  path(); c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
function shadow(c, x, gy, rx, lift) {
  const k = 1 / (1 + lift * 2.2);
  c.fillStyle = `rgba(43,33,24,${.22 * k})`; c.fill(ell(x, gy, rx * (.55 + .45 * k), rx * .16 * (.55 + .45 * k)));
}
function cheeks(c, x, y, dx, r) { c.fillStyle = 'rgba(255,130,150,.65)'; c.fill(ell(x - dx, y, r, r * .62)); c.fill(ell(x + dx, y, r, r * .62)); }
function eye(c, x, y, r, bl) { c.fillStyle = INK; c.fill(ell(x, y, r, r * 1.15 * bl)); if (bl > .5) { c.fillStyle = '#fff'; c.fill(ell(x + r * .35, y - r * .4, r * .38, r * .38)); c.fill(ell(x - r * .3, y + r * .4, r * .16, r * .16)); } }
function dust(c, x, gy, s, k) {   // k: 0 → 1 over the puff's life
  if (k <= 0 || k >= 1) return;
  c.save(); c.globalAlpha = 1 - k;
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
    const px = x + sd * s * (.32 + i * .16 + k * .35), py = gy - s * (.05 + i * .05 + k * .08), r = s * (.09 + i * .02) * (.6 + k * .7);
    sticker(c, ell(px, py, r, r * .8), '#FFFFFF', Math.max(1.5, s * .018));
  }
  c.restore();
}

/* ======================= PANDA ======================= */
function pandaPose(t) {
  if (t < 0) return { up: 0, air: 0, sq: 0, wob: 0, flail: 0, shake: 0, puff: -1, face: 'happy', breathe: Math.sin(t * 2.2) };
  const p = t % 3;
  let up = 0;
  if (p < .6) up = 0; else if (p < 1.1) up = ease((p - .6) / .5); else if (p < 2.55) up = 1; else up = 1 - ease((p - 2.55) / .45);
  let sq = 0, air = 0, wob = 0, flail = 0, shake = 0, face = 'happy', armsUp = 0;
  if (p > 1.1 && p < 1.3) sq = Math.sin((p - 1.1) / .2 * Math.PI) * .14;          // crouch before the jump
  if (p >= 1.3 && p < 1.85) { const k = (p - 1.3) / .55; air = Math.sin(k * Math.PI); armsUp = Math.sin(k * Math.PI); face = 'open'; }
  if (p >= 1.85 && p < 2.6) {                                                      // heavy landing: tremor + wobble, almost falls
    const w = p - 1.85;
    sq = w < .15 ? Math.sin(w / .15 * Math.PI) * .18 : 0;
    wob = .42 * Math.exp(-3.2 * w) * Math.sin(w * 10.5 + .25);
    flail = Math.exp(-2.6 * w);
    shake = w < .45 ? (1 - w / .45) : 0;
    face = w < .55 ? 'oops' : 'happy';
  }
  return { up, air, sq, wob, flail, shake, armsUp, puff: p >= 1.85 ? (p - 1.85) / .55 : -1, face, breathe: Math.sin(t * 2.2) * (up < .1 ? 1 : .4) };
}
export function drawPanda(c, x, gy, s, t) {
  const q = pandaPose(t), lw = Math.max(2, s * .028);
  const shx = q.shake ? Math.sin(t * 95) * s * .025 * q.shake : 0, shy = q.shake ? Math.cos(t * 77) * s * .012 * q.shake : 0;
  const lift = q.air * s * .5;
  c.save(); c.translate(x + shx, gy + shy);
  // tremor lines on the ground
  if (q.shake > 0) { c.save(); c.globalAlpha = q.shake; c.strokeStyle = INK; c.lineWidth = lw; c.lineCap = 'round';
    for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { const r0 = s * (.55 + i * .16); c.beginPath(); c.arc(0, -s * .02, r0, sd < 0 ? Math.PI * .92 : Math.PI * .02, sd < 0 ? Math.PI * .98 : Math.PI * .08); c.stroke(); } c.restore(); }
  shadow(c, 0, 0, s * .55, q.air);
  dust(c, 0, 0, s, q.puff);
  const pv = Math.sign(q.wob || 1) * s * .16;                    // wobble pivots on one foot
  c.translate(pv, 0); c.rotate(q.wob); c.translate(-pv, -lift);
  c.scale(1 + q.sq * .6, 1 - q.sq);
  const u = q.up, a = -u * Math.PI / 2, hh = s * .34, L = s * .5;
  const H = [-s * .26 * (1 - u), -hh + q.breathe * s * .004], S = [H[0] + L * Math.cos(a), H[1] + L * Math.sin(a)];
  const WHITE = '#FFFDF8', BLACK = '#34302F', DARK = '#262222';
  // hind legs (front view when standing, side by side on all fours)
  const ldx = lerp(.06, .15, u) * s;
  for (const sd of [-1, 1]) {
    const col = (u < .5 && sd < 0) ? DARK : BLACK;
    limb(c, [[H[0] + sd * ldx * .7, H[1]], [H[0] + sd * ldx, -s * .07]], s * .2, col, lw);
    sticker(c, ell(H[0] + sd * ldx + (1 - u) * s * .02, -s * .04, s * .12, s * .065), col, lw);
  }
  // body
  const bc = [(H[0] + S[0]) / 2, (H[1] + S[1]) / 2], body = ell(bc[0], bc[1], L / 2 + s * .24, s * (.3 + u * .04), a);
  sticker(c, body, WHITE, lw);
  c.save(); c.clip(body); c.fillStyle = BLACK; c.fill(ell(S[0], S[1], s * .27, s * .34, a)); c.restore();
  c.lineWidth = lw; c.strokeStyle = INK; c.stroke(body);
  c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(ell(bc[0] - s * .1, bc[1] - s * .12 + u * s * .1, s * .1, s * .05, a * .5 - .3));
  // front legs / arms
  for (const sd of [-1, 1]) {
    const sh = [S[0] + sd * s * .17 * u, S[1] + s * .08 * u];
    const ground = [S[0] + sd * s * .05 + s * .03, -s * .05];
    let arm = [S[0] + sd * s * .3, S[1] + s * .3];
    const upA = [S[0] + sd * s * .36, S[1] - s * .22];
    arm = [lerp(arm[0], upA[0], q.armsUp), lerp(arm[1], upA[1], q.armsUp)];
    if (q.flail) { const ang = sd * Math.sin(t * 26 + sd) * .9 * q.flail - sd * .7 * q.flail, dx = arm[0] - sh[0], dy = arm[1] - sh[1];
      arm = [sh[0] + dx * Math.cos(ang) - dy * Math.sin(ang), sh[1] + dx * Math.sin(ang) + dy * Math.cos(ang)]; }
    const paw = [lerp(ground[0], arm[0], u), lerp(ground[1], arm[1], u)];
    const col = (u < .5 && sd < 0) ? DARK : BLACK;
    limb(c, [sh, [(sh[0] + paw[0]) / 2 + sd * s * .04 * u, (sh[1] + paw[1]) / 2], paw], s * .17, col, lw);
    sticker(c, ell(paw[0], paw[1], s * .095, s * .08), col, lw);
  }
  // head
  const hd = [lerp(S[0] + s * .3, S[0], u), lerp(S[1] - s * .14, S[1] - s * .3, u)];
  c.save(); c.translate(hd[0], hd[1]); c.rotate(-q.wob * .5 + Math.sin(t * 2.2) * .03);
  const r = s * .3;
  for (const sd of [-1, 1]) { sticker(c, ell(sd * r * .72, -r * .74, r * .3, r * .28), BLACK, lw); c.fillStyle = '#5A4F4E'; c.fill(ell(sd * r * .72, -r * .72, r * .13, r * .12)); }
  sticker(c, ell(0, 0, r * 1.08, r * .96), WHITE, lw);
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(ell(-r * .45, -r * .5, r * .22, r * .12, -.5));
  const bl = blink(t, .3);
  for (const sd of [-1, 1]) {
    c.fillStyle = BLACK; c.fill(ell(sd * r * .38, -r * .02, r * .26, r * .34, sd * .55));
    if (q.face === 'oops') { c.strokeStyle = '#fff'; c.lineWidth = lw * .9; c.beginPath(); c.arc(sd * r * .37, -r * .02, r * .1, 0, Math.PI * 2); c.stroke(); }
    else { c.fillStyle = '#fff'; c.fill(ell(sd * r * .37, -r * .04, r * .12, r * .14 * bl)); c.fillStyle = INK; c.fill(ell(sd * r * .35, -r * .02, r * .08, r * .1 * bl));
      if (bl > .5) { c.fillStyle = '#fff'; c.fill(ell(sd * r * .32, -r * .08, r * .035, r * .035)); } }
  }
  c.fillStyle = INK; c.fill(ell(0, r * .3, r * .14, r * .09));
  c.strokeStyle = INK; c.lineWidth = lw * .85; c.lineCap = 'round';
  if (q.face === 'open') { sticker(c, ell(0, r * .55, r * .14, r * .15), '#E8607A', lw * .8); }
  else if (q.face === 'oops') { sticker(c, ell(0, r * .56, r * .09, r * .11), '#7A3A3A', lw * .8); }
  else { c.beginPath(); c.moveTo(0, r * .38); c.quadraticCurveTo(-r * .1, r * .55, -r * .2, r * .45); c.moveTo(0, r * .38); c.quadraticCurveTo(r * .1, r * .55, r * .2, r * .45); c.stroke(); }
  cheeks(c, 0, r * .42, r * .7, r * .14);
  // little sweat drop while it wobbles
  if (q.face === 'oops') { const d = new Path2D(); d.moveTo(r * 1.05, -r * .6); d.quadraticCurveTo(r * 1.2, -r * .3, r * 1.05, -r * .22); d.quadraticCurveTo(r * .9, -r * .3, r * 1.05, -r * .6); sticker(c, d, '#9ED8FF', lw * .7); }
  c.restore();
  c.restore();
}

/* ======================= DUCK ======================= */
export function drawDuck(c, x, gy, s, t) {
  const lw = Math.max(2, s * .028);
  let p = t < 0 ? 0 : t % 2, air = 0, sq = 0, flap = 0, sway = 0, face = 'happy', st = 0;
  if (t < 0 || p < .9) sway = Math.sin((t < 0 ? t : p) * Math.PI * 3) * .07;
  if (p >= .9 && p < 1.0) sq = Math.sin((p - .9) / .1 * Math.PI / 2) * .16;
  if (p >= 1.0 && p < 1.4) { const k = (p - 1) / .4; air = Math.sin(k * Math.PI); flap = Math.sin((p - 1) * Math.PI * 2 * 7); face = 'open'; st = air * .08; }
  if (p >= 1.4 && p < 1.55) sq = Math.sin((p - 1.4) / .15 * Math.PI) * .16;
  if (p >= 1.4 && p < 1.9) flap = Math.sin((p - 1.4) * Math.PI * 2 * 4) * .4 * (1 - (p - 1.4) / .5);   // a few settling flaps
  if (p >= .85 && p < 1.0) flap = (p - .85) / .15 * .6;                                                  // wings lift before take-off
  const BODY = '#FFD84D', LIGHT = '#FFF1AA', WING = '#F2BE2E', ORANGE = '#FF9A3C';
  c.save(); c.translate(x, gy);
  shadow(c, 0, 0, s * .45, air);
  dust(c, 0, 0, s * .8, p >= 1.4 ? (p - 1.4) / .4 : -1);
  c.translate(0, -air * s * .55); c.rotate(sway);
  c.scale(1 + sq * .6 - st * .4, 1 - sq + st);
  // feet + legs
  for (const sd of [-1, 1]) {
    c.strokeStyle = INK; c.lineWidth = lw * 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(sd * s * .1, -s * .14); c.lineTo(sd * s * .12, -s * .03); c.stroke();
    c.strokeStyle = ORANGE; c.lineWidth = lw * 1.2; c.stroke();
    const f = new Path2D(), fx = sd * s * .13; f.moveTo(fx, -s * .05);
    f.quadraticCurveTo(fx + sd * s * .14, -s * .06, fx + sd * s * .17, s * .0); f.quadraticCurveTo(fx + sd * s * .1, s * .02, fx + sd * s * .07, -s * .005);
    f.quadraticCurveTo(fx + sd * s * .02, s * .025, fx - sd * s * .03, s * .0); f.closePath(); sticker(c, f, ORANGE, lw);
  }
  // wings (behind the body edge, flapping out and up)
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * s * .3, -s * .46); c.rotate(sd * (-.25 - flap * .9 - (air > 0 ? .4 : 0)));
    const w = new Path2D(); w.moveTo(0, -s * .04); w.bezierCurveTo(sd * s * .2, -s * .02, sd * s * .22, s * .2, sd * s * .08, s * .27);
    w.quadraticCurveTo(sd * s * .02, s * .2, -sd * s * .02, s * .15); w.closePath(); sticker(c, w, WING, lw);
    c.strokeStyle = INK; c.lineWidth = lw * .6; c.beginPath(); c.moveTo(sd * s * .06, s * .1); c.lineTo(sd * s * .13, s * .14); c.moveTo(sd * s * .05, s * .16); c.lineTo(sd * s * .11, s * .2); c.stroke();
    c.restore();
  }
  // body
  const b = new Path2D(); b.moveTo(0, -s * .72);
  b.bezierCurveTo(s * .3, -s * .72, s * .42, -s * .5, s * .38, -s * .3); b.bezierCurveTo(s * .36, -s * .14, s * .2, -s * .1, 0, -s * .1);
  b.bezierCurveTo(-s * .2, -s * .1, -s * .36, -s * .14, -s * .38, -s * .3); b.bezierCurveTo(-s * .42, -s * .5, -s * .3, -s * .72, 0, -s * .72); b.closePath();
  sticker(c, b, BODY, lw);
  c.fillStyle = LIGHT; c.fill(ell(0, -s * .3, s * .22, s * .16)); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(b);
  // head
  c.save(); c.translate(0, -s * .86 + (t < 0 || p < .9 ? Math.abs(Math.sin((t < 0 ? t : p) * Math.PI * 3)) * s * .02 : 0)); c.rotate(-sway * .6);
  const r = s * .26;
  const tuft = new Path2D(); tuft.moveTo(-r * .1, -r * .9); tuft.quadraticCurveTo(-r * .05, -r * 1.5, r * .35, -r * 1.35); tuft.quadraticCurveTo(r * .05, -r * 1.25, r * .15, -r * .9); tuft.closePath();
  sticker(c, tuft, BODY, lw);
  sticker(c, ell(0, 0, r, r * .95), BODY, lw);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(ell(-r * .45, -r * .5, r * .22, r * .12, -.5));
  const bl = blink(t, .7);
  eye(c, -r * .38, -r * .12, r * .13, face === 'open' ? 1 : bl); eye(c, r * .38, -r * .12, r * .13, face === 'open' ? 1 : bl);
  cheeks(c, 0, r * .25, r * .66, r * .14);
  // bill: opens a little in the air
  const op = face === 'open' ? r * .12 : 0;
  sticker(c, ell(0, r * .32 + op * .6, r * .36, r * .12 + op * .5), '#F07E2A', lw);
  sticker(c, ell(0, r * .26, r * .42, r * .15), ORANGE, lw);
  c.fillStyle = 'rgba(43,33,24,.55)'; c.fill(ell(-r * .1, r * .22, r * .03, r * .02)); c.fill(ell(r * .1, r * .22, r * .03, r * .02));
  c.restore();
  c.restore();
}

/* ======================= RABBIT ======================= */
function earFlap(t, side) {       // random ear flaps, a pure function of time
  if (t < -50) return 0; let a = 0;
  const k0 = Math.floor(t / .5);
  for (let k = k0 - 1; k <= k0; k++) {
    const r = hash(k * 3.1 + 7), who = hash(k * 5.7 + 2), start = k * .5 + hash(k + 9) * .3, f = (t - start) / .6;
    if (r > .2 || f < 0 || f > 1) continue;
    const ear = who < .4 ? -1 : who < .8 ? 1 : 0;   // 0 = both
    if (ear !== 0 && ear !== side) continue;
    a += Math.sin(f * Math.PI) * .9 + Math.sin(f * Math.PI * 4) * .35 * (1 - f);
  }
  return a;
}
export function drawRabbit(c, x, gy, s, t) {
  const lw = Math.max(2, s * .028);
  let p = t < 0 ? .9 : t % 1, air = 0, sq = 0, st = 0, face = 'happy', earLag = 0;
  if (t >= 0 && p < .3) { sq = Math.sin(p / .3 * Math.PI / 2) * .14; earLag = -sq * 1.2; }
  if (t >= 0 && p >= .3 && p < .6) { const k = (p - .3) / .3; air = Math.sin(k * Math.PI); st = air * .1; face = 'open'; earLag = k < .5 ? -.35 * (1 - k * 2) : .3 * (k - .5) * 2; }
  if (t >= 0 && p >= .6 && p < .75) { sq = Math.sin((p - .6) / .15 * Math.PI) * .15; earLag = .45 * Math.sin((p - .6) / .15 * Math.PI); }
  if (t >= 0 && p >= .75) earLag = .2 * Math.sin((p - .75) / .25 * Math.PI * 2) * (1 - (p - .75) / .25);
  const FUR = '#FBF5EE', SHADE = '#EADFD2', PINK = '#FFB3C1';
  c.save(); c.translate(x, gy);
  shadow(c, 0, 0, s * .42, air);
  c.translate(0, -air * s * .5); c.scale(1 + sq * .6 - st * .4, 1 - sq + st);
  // feet
  for (const sd of [-1, 1]) sticker(c, ell(sd * s * .19, -s * .05, s * .15, s * .065), FUR, lw);
  // body
  sticker(c, ell(0, -s * .3, s * .3, s * .28), FUR, lw);
  c.fillStyle = '#FFFFFF'; c.fill(ell(0, -s * .24, s * .18, s * .17));
  c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(ell(-s * .15, -s * .44, s * .07, s * .04, -.5));
  // front paws: little mittens tucked against the chest, with toe lines
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * s * .15, -s * .4 - air * s * .05); c.rotate(sd * -.5);
    sticker(c, ell(0, 0, s * .05, s * .075), FUR, lw * .8);
    c.strokeStyle = 'rgba(43,33,24,.5)'; c.lineWidth = lw * .55; c.beginPath(); c.moveTo(-s * .015, s * .05); c.lineTo(-s * .015, s * .068); c.moveTo(s * .015, s * .05); c.lineTo(s * .015, s * .068); c.stroke();
    c.restore();
  }
  // ears
  const hy = -s * .7;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * s * .1, hy - s * .14);
    c.rotate(sd * (.16 + earLag * .5 + earFlap(t, sd)) + earLag * .15);
    const e = ell(0, -s * .2, s * .075, s * .22); sticker(c, e, FUR, lw); c.fillStyle = PINK; c.fill(ell(0, -s * .19, s * .038, s * .16));
    c.restore();
  }
  // head
  c.save(); c.translate(0, hy);
  const r = s * .25;
  sticker(c, ell(0, 0, r * 1.05, r * .92), FUR, lw);
  c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(ell(-r * .45, -r * .45, r * .2, r * .11, -.5));
  c.fillStyle = SHADE; c.fill(ell(0, r * .32, r * .3, r * .2));
  const bl = blink(t, 1.3);
  eye(c, -r * .4, -r * .08, r * .13, face === 'open' ? 1 : bl); eye(c, r * .4, -r * .08, r * .13, face === 'open' ? 1 : bl);
  sticker(c, (() => { const n = new Path2D(); n.moveTo(-r * .09, r * .14); n.lineTo(r * .09, r * .14); n.lineTo(0, r * .25); n.closePath(); return n; })(), '#FF8FA6', lw * .7);
  c.strokeStyle = INK; c.lineWidth = lw * .8; c.lineCap = 'round';
  if (face === 'open') sticker(c, ell(0, r * .42, r * .09, r * .1), '#E8607A', lw * .7);
  else { c.beginPath(); c.moveTo(0, r * .25); c.quadraticCurveTo(-r * .06, r * .38, -r * .15, r * .32); c.moveTo(0, r * .25); c.quadraticCurveTo(r * .06, r * .38, r * .15, r * .32); c.stroke(); }
  cheeks(c, 0, r * .3, r * .66, r * .13);
  c.restore();
  c.restore();
}

export const DRAW = { panda: drawPanda, duck: drawDuck, rabbit: drawRabbit };
