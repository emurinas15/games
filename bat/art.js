/* Fruit Bat — sticker kawaii art (bold dark outlines, flat colours, shiny eyes, pink cheeks). All drawn in code,
   with soft curves only (no grids, rings of lines or icon sets). */
import { INK, ell, sticker } from '../shared/kit.js';

export const BAT_COL = { fur: '#C98A5E', mane: '#F2C27B', wing: '#7B5A93', wingIn: '#9C7BB3', ear: '#FFB3C1' };
export const BOWS = ['#5FB7F0', '#FF7FA0'];

/* ---------- the fruit bat ----------
   front view, (x,y) = middle of the body, s = body radius.
   mood: 'happy' | 'hungry' (mouth open, eyes on the fruit) | 'yum' (eyes closed, munching) | 'aww' (pout)
   look: -1..1 eyes left/right, lookY: -1..1 up/down. dive: 0..1 wings swept up (diving from the top).
   carry: a fruit kind to hold in the feet (after a grab) */
export function drawBat(c, x, y, s, t, { mood = 'happy', look = 0, lookY = 0, dive = 0, carry = null, tilt = 0, flap = 9, bow = null } = {}) {
  c.save(); c.translate(x, y); c.rotate(tilt);
  const lw = Math.max(2.5, s * .1), f = Math.sin(t * flap);
  // wings (behind the body)
  for (const side of [-1, 1]) {
    c.save(); c.scale(side, 1); c.translate(s * .62, -s * .18);
    const up = -.25 - dive * .9 + f * (.55 - dive * .25);   // flap angle
    c.rotate(up); c.scale(1, .78 + .22 * Math.cos(t * flap));
    const W = s * 1.75, p = new Path2D();
    p.moveTo(0, -s * .12);
    p.quadraticCurveTo(W * .45, -s * .78, W, -s * .5);                         // arm bone up to the wrist
    p.quadraticCurveTo(W * 1.04, -s * .1, W * .98, s * .22);                   // first finger tip
    p.quadraticCurveTo(W * .84, s * .05, W * .7, s * .42);                     // scallops along the back edge
    p.quadraticCurveTo(W * .55, s * .2, W * .4, s * .5);
    p.quadraticCurveTo(W * .22, s * .3, 0, s * .45);
    p.closePath();
    sticker(c, p, BAT_COL.wing, lw);
    c.save(); c.clip(p); c.fillStyle = BAT_COL.wingIn; c.globalAlpha = .55; c.fill(ell(W * .5, s * .05, W * .32, s * .3, -.2)); c.restore();
    c.strokeStyle = 'rgba(43,33,24,.55)'; c.lineWidth = lw * .55; c.lineCap = 'round';
    c.beginPath(); c.moveTo(W * .94, -s * .46); c.quadraticCurveTo(W * .8, s * .0, W * .7, s * .36);
    c.moveTo(W * .9, -s * .44); c.quadraticCurveTo(W * .58, s * .05, W * .42, s * .44); c.stroke();
    sticker(c, ell(W * .98, -s * .52, s * .09, s * .09), BAT_COL.fur, lw * .5);   // little thumb claw
    c.restore();
  }
  // ears
  for (const side of [-1, 1]) {
    c.save(); c.scale(side, 1); c.translate(s * .42, -s * .78); c.rotate(.28 + Math.sin(t * 3 + side) * .05);
    const e = new Path2D(); e.moveTo(-s * .2, s * .12); e.quadraticCurveTo(-s * .16, -s * .5, s * .02, -s * .6); e.quadraticCurveTo(s * .2, -s * .42, s * .22, s * .12); e.closePath();
    sticker(c, e, BAT_COL.fur, lw);
    c.fillStyle = BAT_COL.ear; c.fill(ell(0, -s * .12, s * .09, s * .26)); c.restore();
  }
  // feet (hold the fruit when carrying)
  if (carry) drawFruit(c, 0, s * 1.15, s * .62, carry, t, { mood: 'oh' });
  for (const side of [-1, 1]) sticker(c, ell(side * s * .3, s * .88, s * .14, s * .1), BAT_COL.fur, lw * .7);
  // body + fluffy golden mane
  const body = ell(0, 0, s, s * .95);
  sticker(c, body, BAT_COL.fur, lw);
  const mane = new Path2D(); mane.moveTo(-s * .78, -s * .1);
  for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.05 - i / 6 * 1.1), r = s * (.86 + (i % 2) * .08); mane.lineTo(Math.cos(a) * r * .95, -Math.sin(a) * r * .78 + s * .12); }
  mane.quadraticCurveTo(0, s * .7, -s * .78, -s * .1); mane.closePath();
  c.save(); c.clip(body); c.fillStyle = BAT_COL.mane; c.fill(ell(0, s * .5, s * .62, s * .55)); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill(ell(-s * .35, -s * .55, s * .3, s * .14, -.4)); c.restore();
  c.lineWidth = lw; c.strokeStyle = INK; c.stroke(body);
  if (bow) { c.save(); c.translate(s * .55, -s * .72); c.rotate(.3); for (const d of [-1, 1]) { const b = new Path2D(); b.moveTo(0, 0); b.quadraticCurveTo(d * s * .32, -s * .26, d * s * .34, 0); b.quadraticCurveTo(d * s * .32, s * .26, 0, 0); sticker(c, b, bow, lw * .6); } sticker(c, ell(0, 0, s * .08, s * .08), bow, lw * .6); c.restore(); }
  // face: little fox snout
  const fx = look * s * .08, fy = -s * .12 + lookY * s * .06;
  sticker(c, ell(fx, fy + s * .3, s * .3, s * .2), BAT_COL.mane, lw * .7);
  c.fillStyle = INK; c.fill(ell(fx, fy + s * .2, s * .09, s * .06));
  // eyes
  const ex = s * .32, ey = fy - s * .08;
  if (mood === 'yum') {
    c.strokeStyle = INK; c.lineWidth = lw * .9; c.lineCap = 'round';
    for (const d of [-1, 1]) { c.beginPath(); c.arc(fx + d * ex, ey + s * .04, s * .11, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  } else {
    for (const d of [-1, 1]) {
      const r = s * (mood === 'hungry' ? .17 : .15);
      sticker(c, ell(fx + d * ex, ey, r, r * 1.12), INK, lw * .3);
      c.fillStyle = '#fff'; c.fill(ell(fx + d * ex + look * r * .25 + r * .28, ey - r * .35 + lookY * r * .2, r * .34, r * .34)); c.fill(ell(fx + d * ex - r * .3, ey + r * .35, r * .14, r * .14));
      if (mood === 'aww') { c.strokeStyle = INK; c.lineWidth = lw * .7; c.beginPath(); c.moveTo(fx + d * ex - d * r * .9, ey - r * 1.6); c.lineTo(fx + d * ex + d * r * .5, ey - r * 1.25); c.stroke(); }
    }
  }
  c.fillStyle = 'rgba(255,120,150,.6)'; c.fill(ell(fx - s * .56, fy + s * .22, s * .13, s * .08)); c.fill(ell(fx + s * .56, fy + s * .22, s * .13, s * .08));
  // mouth
  c.strokeStyle = INK; c.lineWidth = lw * .7; c.lineCap = 'round';
  const my = fy + s * .42;
  if (mood === 'hungry') {
    const m = new Path2D(); m.moveTo(fx - s * .14, my - s * .03); m.quadraticCurveTo(fx, my + s * .24, fx + s * .14, my - s * .03); m.closePath();
    sticker(c, m, '#7A2E3A', lw * .6); c.fillStyle = '#FF8FA3'; c.fill(ell(fx, my + s * .09, s * .06, s * .04));
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(fx - s * .1, my - s * .02); c.lineTo(fx - s * .06, my + s * .06); c.lineTo(fx - s * .03, my - s * .02); c.fill();
    c.beginPath(); c.moveTo(fx + s * .1, my - s * .02); c.lineTo(fx + s * .06, my + s * .06); c.lineTo(fx + s * .03, my - s * .02); c.fill();
  } else if (mood === 'yum') {
    const k = Math.abs(Math.sin(t * 14)); c.beginPath(); c.ellipse(fx, my + s * .02, s * .1, s * (.03 + .06 * k), 0, 0, 7); c.fillStyle = '#7A2E3A'; c.fill(); c.stroke();
  } else if (mood === 'aww') {
    c.beginPath(); c.arc(fx, my + s * .12, s * .1, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  } else {
    c.beginPath(); c.moveTo(fx - s * .12, my); c.quadraticCurveTo(fx - s * .06, my + s * .08, fx, my); c.quadraticCurveTo(fx + s * .06, my + s * .08, fx + s * .12, my); c.stroke();
  }
  c.restore();
}

/* ---------- the fruits (each level has its own) ---------- */
export const FRUITS = ['fig', 'banana', 'mango', 'loquat', 'dates', 'guava', 'papaya', 'lychee', 'mulberry', 'peach'];   // what fruit bats really eat
export const FRUIT_NAMES = { en: ['Fig', 'Banana', 'Mango', 'Loquat', 'Dates', 'Guava', 'Papaya', 'Lychee', 'Mulberry', 'Peach'],
  he: ['תאנה', 'בננה', 'מנגו', 'שסק', 'תמרים', 'גויאבה', 'פפאיה', 'ליצ׳י', 'תות עץ', 'אפרסק'] };
const leaf = (c, x, y, s, a, lw, col = '#7DCB6B') => { c.save(); c.translate(x, y); c.rotate(a); const p = new Path2D(); p.moveTo(0, 0); p.quadraticCurveTo(s * .5, -s * .42, s, 0); p.quadraticCurveTo(s * .5, s * .42, 0, 0); sticker(c, p, col, lw); c.restore(); };
const shine = (c, x, y, rx, ry, a = -.5) => { c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(ell(x, y, rx, ry, a)); };
const stem = (c, x0, y0, x1, y1, lw, col = INK) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + lw, (y0 + y1) / 2, x1, y1); c.stroke(); };
/* (x,y) = middle, r = radius. mood: 'happy' | 'oh' (worried, a bat is coming) | 'yay' */
export function drawFruit(c, x, y, r, kind, t, { mood = 'happy', wob = 0 } = {}) {
  c.save(); c.translate(x, y); c.rotate(wob);
  const lw = Math.max(2.2, r * .11);
  let fy = 0;   // where the face goes
  switch (kind) {
    case 'fig': {   // purple teardrop with a little stalk
      stem(c, 0, -r * .85, r * .12, -r * 1.15, lw * 1.2, '#6B8F3A');
      const p = new Path2D(); p.moveTo(0, -r * .9); p.bezierCurveTo(r * .35, -r * .85, r * .4, -r * .4, r * .75, -r * .05); p.bezierCurveTo(r * 1.1, r * .4, r * .75, r * .98, 0, r * .95);
      p.bezierCurveTo(-r * .75, r * .98, -r * 1.1, r * .4, -r * .75, -r * .05); p.bezierCurveTo(-r * .4, -r * .4, -r * .35, -r * .85, 0, -r * .9); p.closePath();
      sticker(c, p, '#8E5BA8', lw);
      c.save(); c.clip(p); c.fillStyle = '#B07CC6'; c.globalAlpha = .6; c.fill(ell(-r * .3, r * .1, r * .45, r * .7)); c.restore();
      leaf(c, r * .1, -r * 1.05, r * .55, -.4, lw * .8); shine(c, -r * .4, r * .05, r * .1, r * .2, .2); fy = r * .3; break; }
    case 'banana': {   // one curved banana lying on the head
      const p = new Path2D(); p.moveTo(-r * 1.1, -r * .35); p.quadraticCurveTo(-r * .2, r * .95, r * 1.1, -r * .35); p.quadraticCurveTo(r * .9, -r * .05, r * .85, -r * .02);
      p.quadraticCurveTo(-r * .1, r * .35, -r * .95, -r * .5); p.closePath();
      const q = new Path2D(); q.moveTo(-r * 1.15, -r * .4); q.quadraticCurveTo(-r * .2, r * 1.0, r * 1.15, -r * .4); q.quadraticCurveTo(r * .95, -r * .55, r * .82, -r * .45);
      q.quadraticCurveTo(-r * .1, r * -.05, -r * .92, -r * .62); q.closePath();
      sticker(c, q, '#FFD84D', lw);
      c.fillStyle = '#7A5A3A'; c.fill(ell(-r * 1.05, -r * .55, r * .1, r * .08)); c.fill(ell(r * 1.08, -r * .45, r * .08, r * .07));
      shine(c, -r * .2, r * .22, r * .3, r * .05, .15); fy = r * .05; r *= .8; break; }
    case 'mango': {
      const p = new Path2D(); p.moveTo(-r * .2, -r * .85); p.bezierCurveTo(r * .7, -r * 1.05, r * 1.15, -r * .1, r * .8, r * .5); p.bezierCurveTo(r * .5, r * 1.0, -r * .6, r * .95, -r * .9, r * .35);
      p.bezierCurveTo(-r * 1.1, -r * .2, -r * .8, -r * .75, -r * .2, -r * .85); p.closePath();
      sticker(c, p, '#FFC23D', lw);
      c.save(); c.clip(p); c.fillStyle = '#FF7A45'; c.globalAlpha = .6; c.fill(ell(r * .6, -r * .4, r * .7, r * .55)); c.restore();
      leaf(c, -r * .15, -r * .86, r * .7, -.9, lw * .8); shine(c, -r * .5, -r * .2, r * .16, r * .09); fy = r * .12; break; }
    case 'loquat': {   // שסק: two small orange ovals on a twig
      stem(c, -r * .3, -r * .45, r * .1, -r * 1.05, lw * 1.1, '#7A5A3A'); stem(c, r * .45, -r * .35, r * .1, -r * 1.05, lw * 1.1, '#7A5A3A');
      leaf(c, r * .1, -r * 1.0, r * .9, -.25, lw * .8, '#5DB760');
      sticker(c, ell(r * .5, r * .2, r * .48, r * .55), '#FFB03D', lw); shine(c, r * .35, -r * .05, r * .09, r * .06); c.fillStyle = 'rgba(122,90,58,.7)'; c.fill(ell(r * .5, r * .74, r * .06, r * .05));
      sticker(c, ell(-r * .35, r * .15, r * .58, r * .66), '#FFA02E', lw); shine(c, -r * .58, -r * .15, r * .11, r * .07);
      c.translate(-r * .35, 0); fy = r * .25; r *= .62; break; }
    case 'dates': {   // a little bunch of three brown dates
      stem(c, 0, -r * .5, 0, -r * 1.05, lw * 1.2, '#E0A94A');
      for (const [dx, dy, a] of [[-.55, .05, .35], [.55, .05, -.35]]) { sticker(c, ell(r * dx, r * dy, r * .32, r * .55, a), '#9A5A2E', lw * .85); shine(c, r * (dx - .1), r * (dy - .25), r * .06, r * .14, a); }
      sticker(c, ell(0, r * .25, r * .45, r * .72), '#A8642F', lw); shine(c, -r * .15, -r * .1, r * .08, r * .2, .1);
      fy = r * .3; r *= .75; break; }
    case 'guava': {   // round green guava with a little crown at the bottom
      sticker(c, ell(0, 0, r * .95, r * .9), '#A9D86B', lw);
      c.save(); c.clip(ell(0, 0, r * .95, r * .9)); c.fillStyle = '#D9EE8E'; c.globalAlpha = .6; c.fill(ell(-r * .3, -r * .3, r * .55, r * .45)); c.restore();
      c.fillStyle = '#7A9A3A'; c.fill(ell(0, r * .88, r * .1, r * .06));
      leaf(c, r * .05, -r * .85, r * .6, -.5, lw * .8, '#5DB760'); shine(c, -r * .45, -r * .35, r * .18, r * .1); fy = r * .08; break; }
    case 'papaya': {   // long, orange-yellow with green blush
      const p = new Path2D(); p.moveTo(0, -r * 1.0); p.bezierCurveTo(r * .55, -r * 1.0, r * .75, -r * .2, r * .72, r * .35); p.bezierCurveTo(r * .7, r * .95, -r * .7, r * .95, -r * .72, r * .35);
      p.bezierCurveTo(-r * .75, -r * .2, -r * .55, -r * 1.0, 0, -r * 1.0); p.closePath();
      sticker(c, p, '#FFB547', lw);
      c.save(); c.clip(p); c.fillStyle = '#8CCB5E'; c.globalAlpha = .55; c.fill(ell(0, -r * .9, r * .7, r * .45)); c.restore();
      shine(c, -r * .35, -r * .1, r * .1, r * .28, .1); fy = r * .25; break; }
    case 'lychee': {   // red, bumpy round
      const p = new Path2D(); const n = 14;
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = r * (.92 + (i % 2) * .07); p[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr * .96); }
      p.closePath(); sticker(c, p, '#F0566A', lw);
      c.fillStyle = 'rgba(160,30,50,.35)'; for (const [sx, sy] of [[.5, .3], [-.4, .5], [.55, -.25], [.1, .65], [-.6, -.1]]) c.fill(ell(r * sx, r * sy, r * .08, r * .06));
      stem(c, 0, -r * .88, r * .1, -r * 1.15, lw * 1.1, '#7A5A3A'); leaf(c, r * .08, -r * 1.08, r * .55, -.4, lw * .8);
      shine(c, -r * .45, -r * .35, r * .17, r * .09); fy = r * .08; break; }
    case 'mulberry': {   // dark purple, made of little round bumps
      stem(c, 0, -r * .85, r * .05, -r * 1.2, lw * 1.1, '#6B8F3A'); leaf(c, r * .05, -r * 1.05, r * .6, -.5, lw * .8);
      const body = ell(0, 0, r * .72, r * .95); sticker(c, body, '#5B2D6E', lw);
      c.save(); c.clip(body); for (const [bx, by] of [[-.35, -.6], [.15, -.65], [.45, -.3], [-.5, -.1], [0, -.2], [.4, .2], [-.3, .35], [.15, .6], [-.1, .9], [.5, .7], [-.55, .7]]) { c.fillStyle = 'rgba(160,100,190,.55)'; c.fill(ell(r * bx, r * by, r * .16, r * .14)); } c.restore();
      c.lineWidth = lw; c.strokeStyle = INK; c.stroke(body);
      shine(c, -r * .3, -r * .4, r * .1, r * .15, .2); fy = r * .1; break; }
    case 'peach': {
      const p = new Path2D(); p.moveTo(0, -r * .82); p.bezierCurveTo(r * .75, -r * 1.05, r * 1.1, -r * .2, r * .9, r * .4); p.bezierCurveTo(r * .7, r * .95, -r * .7, r * .95, -r * .9, r * .4);
      p.bezierCurveTo(-r * 1.1, -r * .2, -r * .75, -r * 1.05, 0, -r * .82); p.closePath();
      sticker(c, p, '#FFB38A', lw);
      c.save(); c.clip(p); c.fillStyle = '#FF8E86'; c.globalAlpha = .55; c.fill(ell(r * .45, r * .1, r * .55, r * .75)); c.restore();
      c.strokeStyle = 'rgba(43,33,24,.5)'; c.lineWidth = lw * .7; c.beginPath(); c.moveTo(0, -r * .78); c.quadraticCurveTo(-r * .3, -r * .2, -r * .05, r * .3); c.stroke();
      leaf(c, 0, -r * .82, r * .6, -.7, lw * .8); shine(c, -r * .55, -r * .25, r * .14, r * .09); fy = r * .2; break; }
  }
  // face
  const eY = fy - r * .05, eX = r * .26, er = r * .1;
  if (mood === 'yay') { c.strokeStyle = INK; c.lineWidth = lw * .8; c.lineCap = 'round'; for (const d of [-1, 1]) { c.beginPath(); c.arc(d * eX, eY + er * .4, er, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
  else for (const d of [-1, 1]) { const rr = mood === 'oh' ? er * 1.3 : er; c.fillStyle = INK; c.fill(ell(d * eX, eY, rr, rr * 1.15)); c.fillStyle = '#fff'; c.fill(ell(d * eX + rr * .35, eY - rr * .4, rr * .38, rr * .38)); }
  c.fillStyle = 'rgba(255,120,150,.55)'; c.fill(ell(-r * .48, fy + r * .14, r * .11, r * .07)); c.fill(ell(r * .48, fy + r * .14, r * .11, r * .07));
  c.strokeStyle = INK; c.lineWidth = lw * .75; c.lineCap = 'round';
  if (mood === 'oh') { c.fillStyle = '#7A2E3A'; c.fill(ell(0, fy + r * .2, r * .07, r * .09)); }
  else { c.beginPath(); c.arc(0, fy + r * .1, r * .13, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
  c.restore();
}

/* ---------- the warning: a round sticker with the bat peeking out; its edge fills up (amber) while the bat gets ready.
   It grows a little as it fills and gives a small wiggle at the end — no blinking (safe for children with epilepsy).
   dir = where the bat will fly: {x,y} unit vector; a soft tail on the badge points that way. */
export function drawWarn(c, x, y, R, k, dir, t) {
  k = Math.max(0, Math.min(1, k));
  const sc = .82 + .22 * k, wig = k > .78 ? Math.sin(t * 22) * .09 * (k - .78) / .22 : 0, lw = Math.max(3, R * .1);
  c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(wig);
  // the tail pointing the flight direction
  const a = Math.atan2(dir.y, dir.x);
  c.save(); c.rotate(a); const tl = new Path2D(); tl.moveTo(R * .6, -R * .5); tl.quadraticCurveTo(R * 1.75, 0, R * .6, R * .5); tl.closePath(); sticker(c, tl, '#FFF3C4', lw); c.restore();
  c.fillStyle = 'rgba(43,33,24,.22)'; c.fill(ell(0, R * .12, R * 1.08, R * 1.08));
  sticker(c, ell(0, 0, R, R), '#FFF3C4', lw);
  // filling edge
  c.lineCap = 'round'; c.lineWidth = R * .2; c.strokeStyle = 'rgba(123,90,147,.18)'; c.beginPath(); c.arc(0, 0, R * .82, 0, 7); c.stroke();
  if (k > .01) { c.strokeStyle = '#FFA63D'; c.beginPath(); c.arc(0, 0, R * .82, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.stroke(); }
  c.lineWidth = lw * .5; c.strokeStyle = INK; c.beginPath(); c.arc(0, 0, R * .7, 0, 7); c.stroke();
  // the bat peeking (face only, wings tucked)
  c.save(); c.beginPath(); c.arc(0, 0, R * .69, 0, 7); c.clip(); c.fillStyle = '#E9DDF5'; c.fillRect(-R, -R, R * 2, R * 2);
  drawBat(c, dir.x * R * .06, R * .2 + dir.y * R * .06, R * .5, t, { mood: k > .6 ? 'hungry' : 'happy', look: dir.x, lookY: dir.y, dive: 1, flap: 4 });
  c.restore();
  c.restore();
}

/* soft lane where the bat will fly: a fuzzy see-through stripe (no hard lines) */
export function drawLane(c, kind, x0, y0, x1, y1, w, k, col = '123,90,147') {
  const a = .08 + .2 * k;
  c.save();
  if (kind === 'h') { const g = c.createLinearGradient(0, y0 - w, 0, y0 + w); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(.5, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(Math.min(x0, x1), y0 - w, Math.abs(x1 - x0), w * 2); }
  else { const g = c.createLinearGradient(x0 - w, 0, x0 + w, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(.5, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x0 - w, y0, w * 2, y1 - y0); }
  c.restore();
}

/* ---------- orchard frame over the camera picture: leafy branches with fruit in the top corners ---------- */
export function drawOrchard(c, W, H, t) {
  c.save(); c.lineCap = 'round';
  const s = Math.min(W, H) * .055;
  // a soft dusk glow at the top
  const g = c.createLinearGradient(0, 0, 0, H * .22); g.addColorStop(0, 'rgba(150,110,200,.28)'); g.addColorStop(1, 'rgba(150,110,200,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * .22);
  c.translate(0, 46);
  for (const side of [0, 1]) {
    c.save(); if (side) { c.translate(W, 0); c.scale(-1, 1); }
    const br = new Path2D(); br.moveTo(-10, s * 1.6); br.bezierCurveTo(W * .07, s * 1.1, W * .12, s * 2.0, W * .2, s * .9);
    c.strokeStyle = INK; c.lineWidth = s * .42; c.stroke(br); c.strokeStyle = '#9A6B4A'; c.lineWidth = s * .26; c.stroke(br);
    for (const [k, a, ly] of [[.02, .7, 1.75], [.07, -.8, 1.2], [.11, .9, 1.7], [.16, -.5, 1.0], [.19, .6, 1.05]]) {
      c.save(); c.translate(W * k, s * ly); c.rotate(a + Math.sin(t * 1.4 + k * 30) * .08); const p = new Path2D(); p.moveTo(0, 0); p.quadraticCurveTo(s * .55, -s * .5, s * 1.3, 0); p.quadraticCurveTo(s * .55, s * .5, 0, 0); sticker(c, p, k * 100 % 2 > 1 ? '#7DCB6B' : '#5DB760', 3); c.restore();
    }
    drawFruit(c, W * .095, s * 2.15 + Math.sin(t * 1.6 + side) * 2, s * .42, side ? 'mango' : 'fig', t, { wob: Math.sin(t * 1.6 + side) * .08 });
    c.restore();
  }
  c.restore();
}

/* ---------- menu / no-camera background: dusk orchard ---------- */
export function drawDusk(c, W, H, t) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#B9A6E8'); g.addColorStop(.55, '#FFC9B5'); g.addColorStop(1, '#FFE6B8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const m = Math.min(W, H) * .09; c.fillStyle = 'rgba(255,250,225,.45)'; c.fill(ell(W * .78, H * .2, m * 1.5, m * 1.5));
  sticker(c, ell(W * .78, H * .2, m, m), '#FFF6D6', 3); c.fillStyle = 'rgba(230,210,160,.6)'; c.fill(ell(W * .78 - m * .3, H * .2 - m * .2, m * .18, m * .14)); c.fill(ell(W * .78 + m * .35, H * .2 + m * .3, m * .12, m * .1));
  // rolling hills
  const hill = (y, a, col) => { const p = new Path2D(); p.moveTo(0, H); p.lineTo(0, y); for (let i = 0; i <= 8; i++) { const x = W * i / 8; p.quadraticCurveTo(x - W / 16, y - a * (i % 2 ? 1 : -.4), x, y); } p.lineTo(W, H); p.closePath(); sticker(c, p, col, 3); };
  hill(H * .74, H * .05, '#9ED38A'); hill(H * .84, H * .04, '#7DCB6B');
  // little fruit trees
  for (const [x, s, f] of [[.1, 1, 'mango'], [.9, .85, 'fig'], [.27, .7, 'peach']]) {
    const tx = W * x, ty = H * .74, S2 = Math.min(W, H) * .1 * s;
    c.strokeStyle = INK; c.lineWidth = S2 * .3; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty + S2 * .3); c.lineTo(tx, ty - S2 * .9); c.stroke(); c.strokeStyle = '#9A6B4A'; c.lineWidth = S2 * .18; c.stroke();
    const cn = new Path2D(); cn.moveTo(tx - S2 * 1.1, ty - S2 * .9);
    cn.bezierCurveTo(tx - S2 * 1.5, ty - S2 * 2.0, tx - S2 * .4, ty - S2 * 2.6, tx, ty - S2 * 2.1); cn.bezierCurveTo(tx + S2 * .5, ty - S2 * 2.7, tx + S2 * 1.6, ty - S2 * 2.0, tx + S2 * 1.1, ty - S2 * .9);
    cn.bezierCurveTo(tx + S2 * .7, ty - S2 * .4, tx - S2 * .7, ty - S2 * .4, tx - S2 * 1.1, ty - S2 * .9); sticker(c, cn, '#5DB760', 3);
    for (const [fx, fy] of [[-.6, -1.4], [.5, -1.6], [.05, -1.0]]) drawFruit(c, tx + S2 * fx, ty + S2 * fy, S2 * .2, f, t);
  }
}

/* a few stars when a bat is dodged */
export function drawPhew(c, x, y, r, k) {
  c.save(); c.globalAlpha = Math.max(0, 1 - k);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .55, d = r * (1.2 + k * 1.6); c.save(); c.translate(x + Math.cos(a) * d, y + Math.sin(a) * d); c.rotate(k * 4 + i);
    const p = new Path2D(); for (let j = 0; j < 10; j++) { const b = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? r * .13 : r * .28; p[j ? 'lineTo' : 'moveTo'](Math.cos(b) * rr, Math.sin(b) * rr); } p.closePath(); sticker(c, p, '#FFD84D', 2); c.restore(); }
  c.restore();
}
