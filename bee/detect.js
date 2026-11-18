/* Bee & Flowers — body reading (pure functions, no browser APIs, so it can be tested in node).

   Edgar, 18 Nov 2026: the child stands 2–3 m from a big screen, whole body in view.
   Three flower heights, three movements:
     high flower  -> JUMP under it
     middle       -> SQUAT, hold 1.5 s
     low          -> DOWN ON THE FLOOR (all fours / push-up / on the tummy), hold 1.5 s
   The cheat he expected: walking closer to the screen or farther from it instead of moving the body.
   So the height is never read from where the head is in the picture. It is read from the body itself:
     r = (floor − nose) / shoulder width, divided by the same number measured while the child stands.
   Walking closer makes the whole child bigger in the picture, but r stays the same.
     standing r ≈ 1 · squat (or bending over) r ≈ .45–.8 · on the floor r < .4
   floor = the lowest body point the camera sees (feet; or hands and knees when on the floor).
   A jump = the nose AND the feet go up quickly, above the standing level, and come back down within 0.9 s
   (same rules as Jump Race, but with the feet instead of the shoulders).
   All sizes are in shoulder widths, so big and small children, near or far, are read the same way. */

export const LEVEL = { mid: [.40, .80], low: .40 };        // r limits (see above)
export const JUMP_TH = { normal: .24, small: .14 };      // jump height, in shoulder widths
const vis = (p, i, t = .4) => p[i] && p[i].v > t;

export function makeBody() {
  return { R0: 0, RH0: 0, learnN: 0, sw: 0, floor: null, floorT: -9e9, seen: -9e9, pose: 'none', r: 1, rh: 1,
    J: { B: null, seen: -9e9, up: false, upT: 0, lowT: 0, belowT: 0, hiT: 0, last: -9e9 }, x: 0, head: null, feet: false };
}

/* one camera frame for one child. p = landmarks in screen px ({x,y,v}), now = ms, opt.jump = 'normal'|'small',
   opt.learn = true while standing still before the game (countdown).
   Returns {pose, jumped}. pose: 'stand' | 'mid' | 'low' | 'none' (can't tell) */
export function stepBody(b, p, now, opt = {}) {
  const dt = Math.min(.2, Math.max(0, (now - b.seen) / 1000)), gap = now - b.seen > 700; b.seen = now;
  if (!vis(p, 11) || !vis(p, 12) || !vis(p, 0, .3)) { b.pose = 'none'; return { pose: 'none', jumped: false }; }
  const sw = Math.hypot(p[11].x - p[12].x, p[11].y - p[12].y);
  if (!b.sw || gap) b.sw = sw; else b.sw += (sw - b.sw) * Math.min(1, dt * 1.2);   // slow: keeps the scale steady while the pose changes
  const u = Math.max(1, b.sw), nose = p[0];
  const hipsSeen = vis(p, 23) && vis(p, 24), hipY = hipsSeen ? (p[23].y + p[24].y) / 2 : null;
  b.x = hipsSeen ? (p[23].x + p[24].x) / 2 : (p[11].x + p[12].x) / 2;
  b.head = { x: nose.x, y: Math.min(nose.y, (vis(p, 7) ? p[7].y : nose.y), (vis(p, 8) ? p[8].y : nose.y)) - u * .55 };
  // the floor: lowest point seen among the feet, knees and hands
  const footIdx = [27, 28, 29, 30, 31, 32].filter(i => vis(p, i));
  b.feet = footIdx.length >= 2;
  let fl = -1;
  for (const i of [...footIdx, ...[25, 26, 15, 16].filter(i => vis(p, i, .5))]) fl = Math.max(fl, p[i].y);
  if (b.feet || (fl > 0 && b.pose !== 'stand' && b.pose !== 'none')) { b.floor = fl; b.floorT = now; }
  else if (now - b.floorT > 2000) { b.pose = 'none'; return { pose: 'none', jumped: false }; }   // feet out of the picture for too long
  const F = b.floor;
  const R = (F - nose.y) / u, RH = hipsSeen ? (F - hipY) / u : null;
  // learn the standing size (countdown), then keep it fresh while the child stands
  if (opt.learn && b.feet && RH != null) {
    b.learnN++; const k = 1 / Math.min(b.learnN, 20); b.R0 += (R - b.R0) * k; b.RH0 += (RH - b.RH0) * k;
  }
  if (!b.R0) { b.pose = 'none'; return { pose: 'none', jumped: false }; }
  const r = R / b.R0, rh = RH != null && b.RH0 ? RH / b.RH0 : null;
  if (!opt.learn && b.feet && r > .9 && r < 1.12 && b.pose === 'stand') { const k = Math.min(1, dt * .3); b.R0 += (R - b.R0) * k; if (RH != null) b.RH0 += (RH - b.RH0) * k; }
  b.r = r; b.rh = rh;
  // pose, with a little hysteresis so it doesn't flicker at the borders
  const was = b.pose, hy = .04;
  let pose;
  const lowLim = LEVEL.low + (was === 'low' ? hy : 0), midHi = LEVEL.mid[1] + (was === 'mid' ? hy : -0);
  if (r < lowLim && (rh == null || rh < .85)) pose = 'low';
  else if (r < midHi) pose = 'mid';
  else pose = 'stand';
  b.pose = pose;
  // jump (needs the feet)
  let jumped = false;
  if (b.feet) jumped = stepJump(b.J, footIdx.reduce((a, i) => a + p[i].y, 0) / footIdx.length, nose.y, u, now, dt, JUMP_TH[opt.jump || 'normal'], pose === 'stand' || b.J.up);
  return { pose, jumped };
}

/* Jump Race's counter, reading the feet (yf) and the nose (yh) */
function stepJump(d, yf, yh, u, now, dt, th, standing) {
  if (!d.B || now - d.seen > 600) { d.B = { f: yf, h: yh }; d.up = false; d.lowT = now; d.belowT = 0; d.hiT = 0; }
  d.seen = now;
  const B = d.B, rf = (B.f - yf) / u, rh = (B.h - yh) / u, rise = Math.min(rf, rh);
  if (!d.up) {
    // the standing level only follows the child while they stand near it (walking closer/farther moves it slowly);
    // after a squat it moves down only after 1.5 s down low — a quick dip and pop-up can't fake a jump
    if (Math.abs(rise) < .08) { const k = Math.min(1, dt * 3); B.f += (yf - B.f) * k; B.h += (yh - B.h) * k; d.lowT = now; d.belowT = 0; }
    else if (rise < 0) { d.lowT = now; d.belowT += dt; if (d.belowT > 1.5) { const k = Math.min(1, dt * 2); B.f += (yf - B.f) * k; B.h += (yh - B.h) * k; } }
    else d.belowT = 0;
    if (standing && rise > th && now - d.lowT < 450) { d.hiT += dt; if (d.hiT >= .05) { d.up = true; d.upT = now; d.hiT = 0; } }
    else d.hiT = 0;
  } else if (rise < th * .4) {
    d.up = false; d.lowT = now;
    if (now - d.upT < 900 && now - d.last > 250) { d.last = now; return true; }
  } else if (now - d.upT > 1200) { d.up = false; B.f = yf; B.h = yh; d.lowT = now; }   // stayed up (a step back, tiptoes): new level
  return false;
}
