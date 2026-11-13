/* Bamboo Physio — camera setup guide.
   Before a camera game starts, a see-through avatar shows where the child should be.
   When the child fits the shape and holds still, the avatar fills with green, pops,
   and the game's 3-2-1 countdown begins.

   Two shapes:
     'face'  head + shoulders, head in the middle of the screen (Duck, Marbles, Glow Spots)
     'body'  head in the middle, shoulders, arms and trunk visible (Spider Swat, Copy the Sprout, Freeze & Copy seated)
     'full'  standing, head to toe (Freeze & Copy)

   Margins are deliberately wide: this is "about right", not a measurement.
   Every number that sets the target is in TARGET below so it is easy to tune later.

   API
     const g = makeGuide('face');   g.reset();
     each frame:  g.update(dt, obs, rect)   obs = {x, y, size} in screen px or null
                  face: x,y = middle of the face, size = face width (cheek to cheek)
                  body: x,y = nose,            size = shoulder width (joint to joint)
                  g.draw(ctx, rect, lang)
     g.done -> true once the pose was held. g.hide() removes the "start anyway" button.  */

import { tone, SFX } from './kit.js';

export const TARGET = {
  face: { x: .5, y: .5, size: r => Math.min(r.h * .2, r.w * .42), sizeMin: .6, sizeMax: 1.65, dx: .17, dy: .14 },
  full: { x: .5, y: .17, size: r => Math.min(r.h * .15, r.w * .3), sizeMin: .6, sizeMax: 1.7, dx: .2, dy: .1 },   // standing, head to toe
  body: { x: .5, y: .45, size: r => Math.min(r.w * .22, r.h * .2), sizeMin: .58, sizeMax: 1.75, dx: .18, dy: .15 }
};
const HOLD = 1.5;        // seconds to hold the pose
const POP = .7;          // seconds of the "done" animation
const SKIP_AFTER = 8;    // "start anyway" button appears after this many seconds

const TXT = {
  en: { find: 'Sit in front of the camera', fit: 'Fit into the shape', closer: 'Come a little closer', back: 'Move back a little',
        middle: 'Move to the middle', raise: 'Raise the phone a little', lower: 'Lower the phone a little', hold: 'Hold still…', great: 'Great!', skip: 'Start anyway' },
  he: { find: 'שבו מול המצלמה', fit: 'היכנסו לתוך הצורה', closer: 'התקרבו קצת', back: 'התרחקו קצת',
        middle: 'זוזו לאמצע', raise: 'הרימו קצת את הטלפון', lower: 'הנמיכו קצת את הטלפון', hold: 'להחזיק ככה…', great: 'מעולה!', skip: 'להתחיל בכל זאת' }
};

export function makeGuide(kind, snd = {}) {
  // games with their own sound engine can pass {tick(p), done()}
  const tick = snd.tick || (p => tone({ f0: 520 + p * 500, dur: .08, type: 'sine', vol: .08 }));
  const doneSnd = snd.done || (() => SFX.chime());
  const T = TARGET[kind];
  const g = { kind, done: false, prog: 0, popT: -1, t: 0, inside: false, hintKey: 'find', obs: null, lastTick: 0, btn: null, lang: 'en' };
  const off = document.createElement('canvas'), oc = off.getContext('2d');
  const off2 = document.createElement('canvas'), oc2 = off2.getContext('2d');
  const off3 = document.createElement('canvas'), oc3 = off3.getContext('2d');

  g.reset = () => { Object.assign(g, { done: false, prog: 0, popT: -1, t: 0, inside: false, hintKey: 'find', obs: null, lastTick: 0 }); g.hide(); };
  g.hide = () => { if (g.btn) g.btn.style.display = 'none'; };
  function skipBtn() {
    if (!g.btn) {
      const b = document.createElement('button');
      b.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9;background:#fff;border:3px solid #2b2118;border-radius:22px;padding:8px 16px;font:700 16px Fredoka,sans-serif;color:#2b2118;box-shadow:0 3px 0 #2b2118;cursor:pointer;opacity:.85';
      b.onclick = () => { if (!g.done && g.popT < 0) { g.popT = 0; g.hide(); doneSnd(); } };
      document.body.appendChild(b); g.btn = b;
    }
    g.btn.textContent = (TXT[g.lang] || TXT.en).skip; g.btn.style.display = 'block';
  }

  /* where the avatar sits in this rect */
  function place(r) {
    const s = T.size(r);
    return { x: r.x + r.w * T.x, y: r.y + r.h * T.y, s };
  }

  g.update = (dt, obs, r) => {
    if (g.done) return 'done';
    if (!r || !r.w || !r.h) return 'wait';
    g.t += dt;
    if (g.popT >= 0) { g.popT += dt; if (g.popT >= POP) { g.done = true; g.hide(); } return g.done ? 'done' : 'pop'; }
    if (g.t > SKIP_AFTER) skipBtn();
    const P = place(r);
    if (!obs) { g.inside = false; g.hintKey = 'find'; g.prog = Math.max(0, g.prog - dt * .8); g.obs = null; return 'wait'; }
    // smooth what the camera sees
    if (!g.obs) g.obs = { ...obs }; else { const k = Math.min(1, dt * 10); for (const key of ['x', 'y', 'size']) g.obs[key] += (obs[key] - g.obs[key]) * k; }
    const o = g.obs, grow = g.inside ? 1.15 : 1;          // a little extra room once inside, so it doesn't flicker
    const ratio = o.size / P.s;
    const dx = o.x - P.x, dy = o.y - P.y;
    const tx = (r.w * T.dx + P.s * .3) * grow, ty = (r.h * T.dy + P.s * .3) * grow;
    let key = '';
    if (ratio < T.sizeMin / grow) key = 'closer';
    else if (ratio > T.sizeMax * grow) key = 'back';
    else if (Math.abs(dx) > tx) key = 'middle';
    else if (dy > ty) key = 'lower';          // head too low on the screen -> the phone is aimed too high
    else if (dy < -ty) key = 'raise';
    g.inside = !key;
    if (g.inside) {
      g.prog += dt / HOLD; g.hintKey = 'hold';
      if (g.t - g.lastTick > .3) { g.lastTick = g.t; tick(g.prog); }
      if (g.prog >= 1) { g.prog = 1; g.popT = 0; g.hintKey = 'great'; g.hide(); doneSnd(); }
    } else { g.prog = Math.max(0, g.prog - dt * .6); g.hintKey = key; }   // slips back slowly, not to zero
    return g.popT >= 0 ? 'pop' : (g.inside ? 'hold' : 'wait');
  };

  /* the silhouette, as soft parts drawn into an offscreen canvas. Returns its top and bottom (for the fill). */
  function parts(c, P, r, grow) {
    const s = P.s * grow, x = P.x, y = P.y, bottom = r.y + r.h + 20;
    const blob = (cx, cy, rx, ry) => { c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
    // neck flowing into sloping shoulders, mirrored. n = neck half width, ny = neck top, sw = shoulder half width, sy = shoulder top
    const bust = (n, ny, sw, sy, low, lowW) => {
      c.beginPath(); c.moveTo(x - n, ny);
      c.bezierCurveTo(x - n, sy - (sy - ny) * .15, x - sw * .55, sy - (sy - ny) * .1, x - sw * .85, sy + s * .04);
      c.bezierCurveTo(x - sw * 1.02, sy + s * .1, x - sw, sy + s * .25, x - sw, sy + s * .45);
      c.bezierCurveTo(x - sw, low * .4 + (sy + s * .45) * .6, x - lowW, low * .8 + sy * .2, x - lowW, low);
      if (low < bottom) c.quadraticCurveTo(x, low + s * .18, x + lowW, low); else c.lineTo(x + lowW, low);
      c.bezierCurveTo(x + lowW, low * .8 + sy * .2, x + sw, low * .4 + (sy + s * .45) * .6, x + sw, sy + s * .45);
      c.bezierCurveTo(x + sw, sy + s * .25, x + sw * 1.02, sy + s * .1, x + sw * .85, sy + s * .04);
      c.bezierCurveTo(x + sw * .55, sy - (sy - ny) * .1, x + n, sy - (sy - ny) * .15, x + n, ny);
      c.closePath(); c.fill();
    };
    if (kind === 'face') {
      // s = face width; (x,y) = middle of the face
      blob(x, y - s * .08, s * .64, s * .8);                                     // head (with hair)
      bust(s * .27, y + s * .45, s * 1.62, y + s * 1.12, bottom, s * 1.7);
      return { top: y - s * .9, bot: Math.min(bottom, y + s * 3) };
    }
    // s = shoulder width (joint to joint); (x,y) = nose
    const hr = s * .3, shy = y + s * .55, hw = s * .62, low = shy + s * 1.45;
    if (kind === 'full') {
      const hipY = shy + s * 1.35, footY = hipY + s * 2.35;
      blob(x, y - hr * .2, hr, hr * 1.22);
      bust(s * .13, y + hr * .7, hw, shy, hipY, hw * .75);
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const d of [-1, 1]) {
        c.lineWidth = s * .22; c.beginPath(); c.moveTo(x + d * hw * .93, shy + s * .2); c.quadraticCurveTo(x + d * hw * 1.2, shy + s * .75, x + d * hw * 1.15, hipY + s * .05); c.stroke();
        blob(x + d * hw * 1.15, hipY + s * .12, s * .12, s * .14);                                      // hand
        c.lineWidth = s * .3; c.beginPath(); c.moveTo(x + d * s * .24, hipY - s * .05); c.lineTo(x + d * s * .27, footY - s * .1); c.stroke();   // leg
        blob(x + d * s * .33, footY, s * .2, s * .1);                                                 // foot
      }
      return { top: y - hr * 1.5, bot: footY + s * .12 };
    }
    blob(x, y - hr * .2, hr, hr * 1.22);                                        // head
    bust(s * .13, y + hr * .7, hw, shy, low, hw * .78);                         // neck, shoulders, trunk to the hips
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const d of [-1, 1]) {                                                  // relaxed arms, a little away from the body
      const ax = x + d * hw * .93, ay = shy + s * .22, hx = x + d * hw * 1.18, hy = shy + s * 1.18;
      c.lineWidth = s * .24; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(x + d * hw * 1.25, shy + s * .65, hx, hy); c.stroke();
      blob(hx + d * s * .01, hy + s * .06, s * .13, s * .15);                  // hand
    }
    return { top: y - hr * 1.5, bot: low + s * .2 };
  }

  g.draw = (ctx, r, lang = 'en') => {
    if (g.done) return;
    g.lang = TXT[lang] ? lang : 'en';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.ceil(r.w * dpr), h = Math.ceil(r.h * dpr);
    if (off.width !== w || off.height !== h) { off.width = off2.width = off3.width = w; off.height = off2.height = off3.height = h; }
    const P = place(r);
    const pop = g.popT >= 0 ? Math.min(1, g.popT / POP) : 0;
    const breathe = 1 + Math.sin(g.t * 2.4) * .012 + pop * .08;
    const grow = breathe;
    const prep = c => { c.setTransform(dpr, 0, 0, dpr, -r.x * dpr, -r.y * dpr); c.clearRect(r.x, r.y, r.w, r.h); c.fillStyle = c.strokeStyle = '#fff'; };

    // 1) the shape (opaque mask)
    prep(oc); const ext = parts(oc, P, r, grow);
    // 2) outline = shape nudged in a circle, minus the shape
    oc2.setTransform(1, 0, 0, 1, 0, 0); oc2.clearRect(0, 0, w, h);
    const lw = 3.5 * dpr;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; oc2.drawImage(off, Math.cos(a) * lw, Math.sin(a) * lw); }
    oc2.globalCompositeOperation = 'destination-out'; oc2.drawImage(off, 0, 0); oc2.globalCompositeOperation = 'source-over';
    // 3) what goes inside: see-through white, and green rising with a soft wavy top
    prep(oc3);
    oc3.fillStyle = 'rgba(255,255,255,.24)'; oc3.fillRect(r.x, r.y, r.w, r.h);
    const level = pop ? 1.2 : g.prog;
    if (level > 0) {
      const top = ext.bot - (ext.bot - ext.top) * level;
      oc3.fillStyle = 'rgba(125,203,107,.55)'; oc3.beginPath(); oc3.moveTo(r.x, r.y + r.h);
      for (let i = 0; i <= 24; i++) { const xx = r.x + r.w * i / 24; oc3.lineTo(xx, top + Math.sin(i * .9 + g.t * 5) * 5); }
      oc3.lineTo(r.x + r.w, r.y + r.h); oc3.closePath(); oc3.fill();
    }
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-in'; oc.drawImage(off3, 0, 0); oc.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.globalAlpha = 1 - pop * pop;
    ctx.drawImage(off, r.x, r.y, r.w, r.h);
    // outline: white while searching, green when inside
    oc2.globalCompositeOperation = 'source-in'; oc2.fillStyle = g.inside || pop ? '#7DCB6B' : 'rgba(255,255,255,.95)'; oc2.fillRect(0, 0, w, h); oc2.globalCompositeOperation = 'source-over';
    ctx.drawImage(off2, r.x, r.y, r.w, r.h);
    ctx.restore();

    // sparkles on the pop
    if (pop > 0) {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + .3, d = P.s * (1 + pop * 1.6), sx = P.x + Math.cos(a) * d, sy = P.y + Math.sin(a) * d * .9;
        ctx.save(); ctx.globalAlpha = 1 - pop; ctx.translate(sx, sy); ctx.rotate(pop * 3 + i);
        ctx.fillStyle = i % 2 ? '#FFD84D' : '#9ADB78'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2.5;
        const k = P.s * .09; ctx.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? k * .45 : k, aa = j * Math.PI / 4; ctx[j ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr, Math.sin(aa) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }

    // hint bubble near the top of the picture
    const txt = (TXT[g.lang] || TXT.en)[g.hintKey];
    if (txt) {
      ctx.save();
      const fs = Math.max(17, Math.min(26, r.w * .05));
      ctx.font = `700 ${fs}px Fredoka, sans-serif`; ctx.direction = g.lang === 'he' ? 'rtl' : 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(txt).width, bw = tw + fs * 1.6, bh = fs * 2, bx = r.x + r.w / 2 - bw / 2, by = T.y < .3 ? r.y + r.h * .9 - bh : r.y + Math.max(12, r.h * .06);   // head near the top (standing) -> hint at the bottom
      ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.roundRect(bx, by + 4, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = g.inside || pop ? '#E6F7DE' : '#fff'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b2118'; ctx.fillText(txt, r.x + r.w / 2, by + bh / 2 + 1);
      ctx.restore();
    }
  };
  return g;
}
