/* Bee & Flowers — sticker kawaii art (bold dark outlines, flat colours, shiny eyes, pink cheeks). All drawn in code. */
import { INK, ell, sticker } from '../shared/kit.js';

export const PETALS = { high: ['#FF9FB0', '#FFD1DA'], mid: ['#FFB547', '#FFE08A'], low: ['#B79CF2', '#DCCBFF'] };
export const BOWS = ['#5FB7F0', '#FF7FA0'];

/* the bee. (x,y) = middle of the body, s = body half-length. dir = 1 faces right, -1 left.
   mood: 'happy' | 'sip' (eyes closed, big smile) | 'sad'. bow: colour of the little bow (2 players) or null */
export function drawBee(c, x, y, s, t, { dir = 1, mood = 'happy', bow = null, tilt = 0 } = {}) {
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(dir, 1);
  const flap = Math.sin(t * 55) * .5 + .5, lw = Math.max(2.5, s * .13);
  // wings (behind), see-through
  c.save(); c.globalAlpha = .8;
  for (const [wx, k] of [[-s * .25, 1], [s * .15, .85]]) {
    c.save(); c.translate(wx, -s * .55); c.rotate(-.5 + flap * .7 * k);
    const p = ell(-s * .05, -s * .42, s * .36 * k, s * .55 * k); c.fillStyle = '#EAF8FF'; c.fill(p); c.lineWidth = lw * .8; c.strokeStyle = INK; c.stroke(p);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(ell(-s * .1, -s * .55, s * .1 * k, s * .18 * k)); c.restore();
  }
  c.restore();
  // stinger
  c.fillStyle = INK; c.beginPath(); c.moveTo(-s * 1.02, -s * .1); c.lineTo(-s * 1.35, s * .05); c.lineTo(-s * 1.0, s * .18); c.closePath(); c.fill();
  // body + stripes
  const body = ell(0, 0, s, s * .8);
  c.fillStyle = '#FFD84D'; c.fill(body);
  c.save(); c.clip(body); c.fillStyle = INK;
  for (const sx of [-.55, -.05]) { c.beginPath(); c.ellipse(s * sx, 0, s * .17, s * 1.1, .12, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(ell(-s * .1, -s * .5, s * .55, s * .16, -.1));
  c.restore();
  c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(body);
  // antennae
  c.lineCap = 'round'; c.lineWidth = lw * .8;
  for (const [ax, k] of [[.42, 1], [.62, .8]]) {
    const bx = s * (ax + .28), by = -s * (1.25 + .1 * k) + Math.sin(t * 6 + ax * 9) * s * .04;
    c.beginPath(); c.moveTo(s * ax, -s * .62); c.quadraticCurveTo(s * (ax + .05), -s * 1.1, bx, by); c.stroke();
    sticker(c, ell(bx, by, s * .12, s * .12), INK, lw * .5);
  }
  // face
  const ex = s * .52, ey = -s * .12;
  if (mood === 'sip') {
    c.lineWidth = lw * .8; c.beginPath(); c.arc(ex - s * .12, ey, s * .1, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(ex + s * .22, ey, s * .09, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  } else {
    for (const [px, r] of [[ex - s * .12, s * .14], [ex + s * .22, s * .12]]) {
      c.fillStyle = INK; c.fill(ell(px, ey, r * .85, r));
      c.fillStyle = '#fff'; c.fill(ell(px + r * .3, ey - r * .4, r * .34, r * .34)); c.fill(ell(px - r * .25, ey + r * .35, r * .14, r * .14));
    }
  }
  c.fillStyle = 'rgba(255,120,140,.7)'; c.fill(ell(ex - s * .25, ey + s * .26, s * .13, s * .08)); c.fill(ell(ex + s * .38, ey + s * .24, s * .1, s * .07));
  c.strokeStyle = INK; c.lineWidth = lw * .75; c.beginPath();
  if (mood === 'sad') c.arc(ex + s * .06, ey + s * .42, s * .1, Math.PI * 1.15, Math.PI * 1.85);
  else c.arc(ex + s * .06, ey + s * .2, mood === 'sip' ? s * .16 : s * .12, .15 * Math.PI, .85 * Math.PI);
  c.stroke();
  // bow (2 players)
  if (bow) { c.save(); c.translate(s * .05, -s * .78); for (const d of [-1, 1]) sticker(c, ell(d * s * .2, 0, s * .2, s * .13, d * .3), bow, lw * .6); sticker(c, ell(0, 0, s * .08, s * .08), bow, lw * .6); c.restore(); }
  c.restore();
}

/* a flower with a cute face. open: 0 = closed bud … 1 = fully open. level picks the colours. */
export function drawFlower(c, x, y, s, level, open, t, { happy = true, sway = 0 } = {}) {
  const [pc, pl] = PETALS[level], lw = Math.max(2.5, s * .1), n = 6;
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.6 + x * .01) * .05 + sway);
  const o = Math.max(0, Math.min(1, open));
  if (o < .02) {   // bud
    const p = new Path2D(); p.moveTo(0, -s * .95); p.bezierCurveTo(s * .55, -s * .5, s * .5, s * .3, 0, s * .4); p.bezierCurveTo(-s * .5, s * .3, -s * .55, -s * .5, 0, -s * .95);
    sticker(c, p, pc, lw); c.fillStyle = 'rgba(255,255,255,.45)'; c.fill(ell(-s * .15, -s * .35, s * .08, s * .22, .2));
    sticker(c, ell(-s * .22, s * .32, s * .26, s * .14, .5), '#7DCB6B', lw * .8); sticker(c, ell(s * .22, s * .32, s * .26, s * .14, -.5), '#7DCB6B', lw * .8);
    c.restore(); return;
  }
  const pr = s * (.35 + .4 * o), pd = s * (.25 + .5 * o);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 - Math.PI / 2 + (1 - o) * .4;
    const p = ell(Math.cos(a) * pd, Math.sin(a) * pd, pr, pr * .78, a);
    sticker(c, p, i % 2 ? pl : pc, lw);
  }
  const cr = s * (.32 + .12 * o);
  sticker(c, ell(0, 0, cr, cr), '#FFD84D', lw);
  c.fillStyle = 'rgba(242,163,58,.55)'; for (let i = 0; i < 7; i++) { const a = i * 2.4; c.fill(ell(Math.cos(a) * cr * .6, Math.sin(a) * cr * .6 + cr * .25, cr * .07, cr * .07)); }
  // face
  for (const d of [-1, 1]) { c.fillStyle = INK; c.fill(ell(d * cr * .36, -cr * .12, cr * .12, cr * .15)); c.fillStyle = '#fff'; c.fill(ell(d * cr * .36 + cr * .05, -cr * .19, cr * .05, cr * .05)); }
  c.fillStyle = 'rgba(255,120,140,.65)'; c.fill(ell(-cr * .62, cr * .15, cr * .13, cr * .08)); c.fill(ell(cr * .62, cr * .15, cr * .13, cr * .08));
  c.strokeStyle = INK; c.lineWidth = lw * .7; c.lineCap = 'round'; c.beginPath();
  if (happy) c.arc(0, cr * .12, cr * .2, .15 * Math.PI, .85 * Math.PI); else c.arc(0, cr * .42, cr * .16, 1.15 * Math.PI, 1.85 * Math.PI);
  c.stroke();
  c.restore();
}

/* what holds each flower: a vine hanging from the top (high), a tall stem from the floor (middle), a grass tuft (low) */
export function drawHolder(c, x, y, s, level, floorY, t) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const leaf = (lx, ly, r, a) => { const p = new Path2D(); c.save(); c.translate(lx, ly); c.rotate(a); p.moveTo(0, 0); p.quadraticCurveTo(r * .6, -r * .5, r * 1.4, 0); p.quadraticCurveTo(r * .6, r * .5, 0, 0); sticker(c, p, '#7DCB6B', Math.max(2, s * .08)); c.restore(); };
  if (level === 'high') {
    const sw = Math.sin(t * 1.3) * s * .3;
    c.strokeStyle = INK; c.lineWidth = s * .26; c.beginPath(); c.moveTo(x - s * .2, -10); c.bezierCurveTo(x + s * .6, y * .35, x - s * .6 + sw, y * .7, x, y - s * .5); c.stroke();
    c.strokeStyle = '#5DB760'; c.lineWidth = s * .14; c.stroke();
    for (const k of [.25, .55, .8]) { const ly = y * k - s * .2; leaf(x + (k % .5 > .2 ? s * .15 : -s * .15), ly, s * .45, k % .5 > .2 ? -.4 : Math.PI + .4); }
  } else if (level === 'mid') {
    const top = y + s * .5, bend = Math.sin(t * 1.2) * s * .15;
    c.strokeStyle = INK; c.lineWidth = s * .24; c.beginPath(); c.moveTo(x, floorY); c.quadraticCurveTo(x + s * .4 + bend, (floorY + top) / 2, x, top); c.stroke();
    c.strokeStyle = '#5DB760'; c.lineWidth = s * .12; c.stroke();
    const my = (floorY + top) / 2; leaf(x + s * .1, my, s * .5, -.5); leaf(x + s * .05, my + (floorY - top) * .25, s * .5, Math.PI + .5);
  }
  // a grass tuft on the floor (all three: the spot to stand on)
  if (level !== 'high') {
    const gy = level === 'low' ? y + s * .55 : floorY;
    for (let i = -3; i <= 3; i++) {
      const bx = x + i * s * .22, h = s * (.55 + .25 * Math.cos(i * 1.7)) * (level === 'low' ? 1 : .8), lean = i * .12 + Math.sin(t * 2 + i) * .06;
      const p = new Path2D(); p.moveTo(bx - s * .17, gy); p.quadraticCurveTo(bx + lean * s - s * .08, gy - h * .6, bx + lean * s * 1.8, gy - h); p.quadraticCurveTo(bx + lean * s + s * .12, gy - h * .5, bx + s * .17, gy); p.closePath();
      sticker(c, p, i % 2 ? '#8BD16B' : '#6CC05A', Math.max(1.6, s * .05));
    }
  }
  c.restore();
}

/* soft glowing patch on the floor under the flower: "stand here" */
export function drawSpot(c, x, y, rx, on, t) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  const a = on ? .55 + .15 * Math.sin(t * 8) : .3;
  g.addColorStop(0, on ? `rgba(255,236,140,${a})` : `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, rx * .28, 0, 0, 7); c.fill();
}

/* little cartoon child (no camera / how-to). pose: 'stand' | 'mid' (squat) | 'low' (lying on the tummy). lift = jump height (px) */
export function drawKid(c, x, gy, s, pose, col, t, lift = 0) {
  c.save(); c.translate(x, gy - lift); c.lineCap = 'round'; c.lineJoin = 'round';
  const lw = Math.max(3, s * .07);
  if (pose === 'low') {
    sticker(c, ell(0, -s * .32, s * 1.0, s * .32), col, lw);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(ell(-s * .2, -s * .5, s * .4, s * .08));
    face(c, s * .62, -s * .42, s * .55, lw);
    c.strokeStyle = INK; c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(s * .5, -s * .1); c.lineTo(s * 1.1, -s * .02); c.moveTo(-s * .8, -s * .2); c.lineTo(-s * 1.35, -s * .35); c.stroke();
    c.restore(); return { headY: gy - s * .6 };
  }
  const sq = pose === 'mid' ? .62 : 1, h = s * 2.2 * sq;
  c.strokeStyle = INK; c.lineWidth = lw * 1.6;
  if (pose === 'mid') { c.beginPath(); c.moveTo(-s * .25, -s * .5); c.lineTo(-s * .55, -s * .25); c.lineTo(-s * .3, 0); c.moveTo(s * .25, -s * .5); c.lineTo(s * .55, -s * .25); c.lineTo(s * .3, 0); c.stroke(); }
  else { c.beginPath(); c.moveTo(-s * .22, -s * .6); c.lineTo(-s * .24, 0); c.moveTo(s * .22, -s * .6); c.lineTo(s * .24, 0); c.stroke(); }
  const by = pose === 'mid' ? -s * .5 - h * .42 : -s * .55 - h * .4;
  sticker(c, ell(0, by, s * .52, h * .42), col, lw);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(ell(-s * .2, by - h * .25, s * .12, s * .07, -.5));
  c.strokeStyle = INK; c.lineWidth = lw * 1.4; c.beginPath();
  if (lift > 0 || pose === 'mid') { c.moveTo(-s * .42, by); c.lineTo(-s * .82, by - s * .45); c.moveTo(s * .42, by); c.lineTo(s * .82, by - s * .45); }
  else { c.moveTo(-s * .45, by); c.lineTo(-s * .62, by + s * .4); c.moveTo(s * .45, by); c.lineTo(s * .62, by + s * .4); }
  c.stroke();
  face(c, 0, by - h * .1, s * .6, lw);
  c.restore();
  return { headY: gy - lift + by - h * .42 };
}
function face(c, x, y, s, lw) {
  for (const d of [-1, 1]) { c.fillStyle = INK; c.fill(ell(x + d * s * .28, y, s * .1, s * .12)); c.fillStyle = '#fff'; c.fill(ell(x + d * s * .28 + s * .04, y - s * .05, s * .04, s * .04)); }
  c.fillStyle = 'rgba(255,130,150,.65)'; c.fill(ell(x - s * .48, y + s * .18, s * .1, s * .07)); c.fill(ell(x + s * .48, y + s * .18, s * .1, s * .07));
  c.strokeStyle = INK; c.lineWidth = lw * .8; c.beginPath(); c.arc(x, y + s * .12, s * .14, .15 * Math.PI, .85 * Math.PI); c.stroke();
}

/* garden frame over the camera picture: leafy vines in the top corners, grass along the bottom */
export function drawGarden(c, W, H, t) {
  c.save(); c.lineCap = 'round';
  const s = Math.min(W, H) * .05;
  for (const side of [0, 1]) {
    c.save(); if (side) { c.translate(W, 0); c.scale(-1, 1); }
    c.strokeStyle = INK; c.lineWidth = s * .3; c.beginPath(); c.moveTo(-10, s * .5); c.bezierCurveTo(W * .08, s * 1.4, W * .12, -s * .2, W * .2, s * .6); c.stroke();
    c.strokeStyle = '#5DB760'; c.lineWidth = s * .16; c.stroke();
    for (const [k, a] of [[.03, .9], [.09, -.6], [.15, .8]]) {
      const lx = W * k, ly = s * (.85 + Math.sin(k * 40) * .25);
      c.save(); c.translate(lx, ly); c.rotate(a + Math.sin(t * 1.5 + k * 30) * .08); const p = new Path2D(); p.moveTo(0, 0); p.quadraticCurveTo(s * .5, -s * .45, s * 1.2, 0); p.quadraticCurveTo(s * .5, s * .45, 0, 0); sticker(c, p, '#7DCB6B', 3); c.restore();
    }
    c.restore();
  }
  // grass
  const gh = s * 1.15;
  for (let x = -s * .3, i = 0; x < W + s; x += s * .5, i++) {
    const h = gh * (.6 + .4 * Math.abs(Math.sin(i * 1.9))), lean = Math.sin(i * 2.3) * .3 + Math.sin(t * 1.8 + i * .6) * .08;
    const p = new Path2D(); p.moveTo(x - s * .42, H + 4); p.quadraticCurveTo(x + lean * s - s * .12, H - h * .6, x + lean * s * 1.6, H - h); p.quadraticCurveTo(x + lean * s + s * .2, H - h * .5, x + s * .42, H + 4); p.closePath();
    sticker(c, p, ['#7DCB6B', '#5DB760', '#8BD16B'][i % 3], 2.2);
  }
  c.restore();
}

/* menu background: a sunny meadow */
export function drawMeadow(c, W, H, t) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#CDEEFF'); g.addColorStop(1, '#EAF8FF'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.8)';
  for (const [x, y, k] of [[.15, .14, 1], [.72, .1, .8], [.45, .22, .6]]) { const cx = x * W + Math.sin(t * .1 + x * 9) * 20, cy = y * H, r = Math.min(W, H) * .05 * k; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.arc(cx + r, cy - r * .4, r * 1.2, 0, 7); c.arc(cx + r * 2.1, cy, r * .9, 0, 7); c.fill(); }
  c.fillStyle = '#B9E39A'; c.beginPath(); c.ellipse(W * .78, H * .86, W * .5, H * .2, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#8DD06E'; c.fillRect(0, H * .84, W, H * .16);
  c.fillStyle = '#A3DB82'; c.beginPath(); c.ellipse(W * .3, H * .93, W * .35, H * .05, 0, 0, 7); c.fill();
}
