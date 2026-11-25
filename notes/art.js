/* Rainbow Notes — sticker art. Soft, round, bold dark outline, flat colours, a shine. */
import { INK, ell, sticker } from '../shared/kit.js';

/* 8 heights, low → high, in rainbow order (the 8th is pink) */
export const NOTE_COL = ['#FF6B6B', '#FF9F45', '#FFD84D', '#7DCB6B', '#5FC8E8', '#4F8EF0', '#A67CE8', '#FF8FC8'];
export const NOTE_DARK = ['#C94848', '#D07422', '#C9A21E', '#4E9C42', '#2E98B8', '#2D62BF', '#7650B8', '#D05F98'];

/* the ♪ symbol, drawn as a shape (white with a dark edge) — centred on 0,0, about s tall */
function glyph(c, s) {
  const p = new Path2D();
  // note head (tilted oval) + stem + soft flag
  p.ellipse(-s * .12, s * .26, s * .2, s * .145, -.42, 0, Math.PI * 2);
  const q = new Path2D();
  q.moveTo(s * .05, s * .24); q.lineTo(s * .05, -s * .4);
  q.bezierCurveTo(s * .2, -s * .3, s * .34, -s * .22, s * .3, -s * .02);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = INK; c.lineWidth = s * .2; c.stroke(q);
  c.fillStyle = INK; c.save(); c.lineWidth = s * .1; c.stroke(p); c.restore();
  c.strokeStyle = '#fff'; c.lineWidth = s * .09; c.stroke(q);
  c.fillStyle = '#fff'; c.fill(p);
}

/* one round note sticker */
function bubble(c, x, y, r, col, lw) {
  // sticker look: thin dark edge → white border → the coloured disc with a fine dark line
  const wb = r * .17;
  sticker(c, ell(x, y, r + wb, r + wb), '#fff', Math.max(2, lw * .75));
  c.save(); c.lineWidth = Math.max(1.5, lw * .45); c.strokeStyle = INK; c.fillStyle = col;
  const d = ell(x, y, r, r); c.fill(d); c.stroke(d); c.restore();
  c.fillStyle = 'rgba(255,255,255,.45)'; c.fill(ell(x - r * .38, y - r * .42, r * .28, r * .15, -.6));
  c.save(); c.translate(x + r * .04, y); glyph(c, r * 1.05); c.restore();
}

/* where the circles of a double / triple note sit (relative to the centre) */
export function clusterOffsets(n, r) {
  if (n <= 1) return [{ x: 0, y: 0, r }];
  const rr = r * .82, step = rr * 1.85;
  return Array.from({ length: n }, (_, i) => ({ x: (i - (n - 1) / 2) * step, y: (i % 2 ? -rr * .22 : rr * .12), r: rr }));
}
/* half-width of a cluster (for hits and placing) */
export const clusterHalfW = (n, r) => (n <= 1 ? r : r * .82 * (1 + .775 * (n - 1))) * 1.17;

/* a note (or a double / triple note). o: {glow 0..1, popped: how many circles already played, alpha, halo colour, wob} */
export function drawNote(c, x, y, r, slot, n, t, o = {}) {
  const col = NOTE_COL[slot], lw = Math.max(2.5, r * .13), offs = clusterOffsets(n, r);
  c.save(); c.globalAlpha *= o.alpha ?? 1;
  if (o.glow) {   // soft glow behind, so it pops out of any room
    const R = clusterHalfW(n, r) + r * .9, g = c.createRadialGradient(x, y, r * .3, x, y, R);
    g.addColorStop(0, hexA(o.halo || col, .55 * o.glow)); g.addColorStop(1, hexA(o.halo || col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
  }
  const pop = o.popped || 0;
  offs.forEach((p, i) => {
    if (i < pop) return;
    const b = Math.sin(t * 3 + i * 1.3 + slot) * r * .05 + (o.wob || 0) * Math.sin(t * 14 + i) * r * .06;
    // shadow
    c.fillStyle = 'rgba(43,33,24,.3)'; c.fill(ell(x + p.x, y + p.y + p.r * .14 + b, p.r * 1.17, p.r * 1.17));
    bubble(c, x + p.x, y + p.y + b, p.r, col, lw);
  });
  if (n > 1 && pop === 0 && !o.noTag) {   // ×2 / ×3 tag
    const tx = x + clusterHalfW(n, r) * .78, ty = y - r * 1.02, fs = Math.max(11, r * .46);
    c.font = `900 ${fs}px Grandstander,Fredoka,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr';
    const w = c.measureText('×' + n).width + fs * .7, p = new Path2D(); p.roundRect(tx - w / 2, ty - fs * .72, w, fs * 1.44, fs * .72);
    sticker(c, p, '#fff', Math.max(2, lw * .7)); c.fillStyle = INK; c.fillText('×' + n, tx, ty + fs * .05);
  }
  c.restore();
}
/* a small note for the song ribbon / previews */
export function drawMiniNote(c, x, y, r, slot, lit = 1) {
  const col = lit ? NOTE_COL[slot] : '#fff';
  c.save(); c.globalAlpha *= lit ? 1 : .75;
  sticker(c, ell(x, y, r, r), col, Math.max(1.6, r * .16));
  if (r > 7) { c.translate(x + r * .04, y); glyph(c, r * 1.05); }
  c.restore();
}

/* a glowing hand: soft light in the player's colour with a bright core and two twinkles */
export function drawHandGlow(c, x, y, r, col, t, hot = 0) {
  c.save();
  const R = r * (1.9 + .15 * Math.sin(t * 5) + hot * .5), g = c.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.28, hexA(col, .85)); g.addColorStop(.62, hexA(col, .32)); g.addColorStop(1, hexA(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
  for (let i = 0; i < 2; i++) {
    const a = t * (1.6 + i * .7) + i * 3, d = r * (.95 + .2 * Math.sin(t * 3 + i)), s = r * (.32 + .1 * Math.sin(t * 6 + i * 2));
    twinkle(c, x + Math.cos(a) * d, y + Math.sin(a) * d, s, '#fff');
  }
  c.restore();
}
export function twinkle(c, x, y, s, col) {
  const p = new Path2D(); p.moveTo(x, y - s);
  p.quadraticCurveTo(x + s * .12, y - s * .12, x + s, y); p.quadraticCurveTo(x + s * .12, y + s * .12, x, y + s);
  p.quadraticCurveTo(x - s * .12, y + s * .12, x - s, y); p.quadraticCurveTo(x - s * .12, y - s * .12, x, y - s);
  c.fillStyle = col; c.fill(p);
}

/* the rainbow ladder on the side of the screen: 8 little soft xylophone bars, one per height.
   active = the height of the note to play now (it glows); bounce[i] = 0..1 a bar that just played */
export function drawLadder(c, x, ys, w, active, bounce, t, flip = false) {
  const h = Math.max(10, Math.min(w * .55, (ys[0] - ys[ys.length - 1]) / (ys.length - 1) * .62));
  ys.forEach((y, i) => {
    const b = bounce[i] || 0, k = i === active ? 1 + .08 * Math.sin(t * 6) : 1, bw = w * (.62 + .38 * (i / 7)) * k * (1 + b * .25);
    const bx = flip ? x - bw : x, p = new Path2D(); p.roundRect(bx, y - h / 2, bw, h, h / 2);
    c.save(); if (i === active) { c.shadowColor = NOTE_COL[i]; c.shadowBlur = 16; }
    c.fillStyle = 'rgba(43,33,24,.3)'; c.fill(ell(bx + bw / 2, y + h * .18, bw / 2, h / 2));
    sticker(c, p, NOTE_COL[i], Math.max(2, h * .16)); c.restore();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.roundRect(bx + bw * .12, y - h * .3, bw * .4, h * .18, h * .1); c.fill();
    // two little pegs, like a real xylophone
    c.fillStyle = INK; c.beginPath(); c.arc(bx + bw * .18, y + h * .08, h * .09, 0, 7); c.arc(bx + bw * .82, y + h * .08, h * .09, 0, 7); c.fill();
  });
}

/* cartoon child, sitting, from the belt up; hands reach to hl / hr (absolute points). Used in the menu and How to play */
export function drawReachKid(c, x, gy, s, col, t, hl, hr, mood = 'happy') {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const lw = Math.max(2.5, s * .07), shY = gy - s * 1.15, hw = s * .52;
  const arm = (sx, sy, h) => {
    const dx = h.x - sx, dy = h.y - sy, L = Math.hypot(dx, dy), M = s * 1.35, k = L > M ? M / L : 1, ex = sx + dx * k, ey = sy + dy * k;
    // elbow bends a little outward
    const mx = (sx + ex) / 2 + (-dy * k) * .12 * Math.sign(sx - x || 1) * -1, my = (sy + ey) / 2 + Math.abs(dx * k) * .08;
    c.strokeStyle = INK; c.lineWidth = s * .28; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = col; c.lineWidth = s * .17; c.stroke();
    sticker(c, ell(ex, ey, s * .15, s * .15), '#F6D3B0', lw);
    return { x: ex, y: ey };
  };
  // body
  const body = new Path2D(); body.moveTo(x - hw * 1.05, gy); body.bezierCurveTo(x - hw * 1.1, shY - s * .05, x - hw * .7, shY - s * .12, x, shY - s * .12);
  body.bezierCurveTo(x + hw * .7, shY - s * .12, x + hw * 1.1, shY - s * .05, x + hw * 1.05, gy); body.closePath();
  sticker(c, body, col, lw);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fill(ell(x - hw * .45, shY + s * .18, s * .12, s * .07, -.5));
  const L = arm(x - hw * .78, shY + s * .08, hl), R = arm(x + hw * .78, shY + s * .08, hr);
  // head
  const hy = shY - s * .55;
  sticker(c, ell(x, hy, s * .5, s * .48), '#F6D3B0', lw);
  const hair = new Path2D(); hair.moveTo(x - s * .5, hy - s * .02); hair.bezierCurveTo(x - s * .52, hy - s * .62, x + s * .52, hy - s * .62, x + s * .5, hy - s * .02);
  hair.bezierCurveTo(x + s * .3, hy - s * .3, x - s * .1, hy - s * .34, x - s * .5, hy - s * .02); sticker(c, hair, '#7A5A44', lw);
  for (const d of [-1, 1]) { c.fillStyle = INK; c.fill(ell(x + d * s * .17, hy + s * .05, s * .06, s * .075)); c.fillStyle = '#fff'; c.fill(ell(x + d * s * .17 + s * .025, hy + s * .02, s * .025, s * .025)); }
  c.fillStyle = 'rgba(255,130,150,.6)'; c.fill(ell(x - s * .3, hy + s * .17, s * .07, s * .05)); c.fill(ell(x + s * .3, hy + s * .17, s * .07, s * .05));
  c.strokeStyle = INK; c.lineWidth = lw * .8; c.beginPath();
  if (mood === 'oh') c.arc(x, hy + s * .22, s * .06, 0, 7); else c.arc(x, hy + s * .13, s * .1, .15 * Math.PI, .85 * Math.PI);
  c.stroke();
  c.restore();
  return { L, R, headY: hy };
}

/* soft music-room backdrop (menu, no camera): pale sky wall, a few round clouds, a wooden floor strip */
export function drawBackdrop(c, W, H, t) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#CDEEFF'); g.addColorStop(1, '#F4FBFF'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const s = Math.min(W, H) * .07;
  [[.14, .2, 1], [.8, .14, 1.2], [.55, .3, .8], [.3, .42, .7], [.9, .45, .9]].forEach(([fx, fy, k], i) => {
    const x = ((fx * W + t * 6 * (i % 2 ? 1 : -1) * k) % (W + s * 4) + W + s * 4) % (W + s * 4) - s * 2, y = fy * H, r = s * k;
    const p = new Path2D(); p.ellipse(x, y, r * 1.5, r * .7, 0, 0, 7); p.ellipse(x - r * .6, y - r * .35, r * .7, r * .6, 0, 0, 7); p.ellipse(x + r * .5, y - r * .45, r * .8, r * .7, 0, 0, 7);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(p);
  });
  const fy = H * .86; c.fillStyle = '#E8C9A0'; c.fillRect(0, fy, W, H - fy); c.fillStyle = INK; c.fillRect(0, fy - 2, W, 4);
  c.strokeStyle = 'rgba(160,110,70,.35)'; c.lineWidth = 2; for (let x = 40; x < W; x += 120) { c.beginPath(); c.moveTo(x, fy + 4); c.lineTo(x - 30, H); c.stroke(); }
}

export function hexA(h, a) {
  const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
