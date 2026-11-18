/* Bee & Flowers — body reading, UPPER BODY ONLY (pure functions, no browser APIs → testable in node).

   Edgar, 18 Nov evening: the full-body view needed the phone far away, and a phone leaning back can't see the floor.
   New rule: the camera only needs the upper body (like Jump Race), so a phone or tablet in a normal room works.
   Two movements only:
     JUMP  -> head (nose + ears) and both shoulders rise quickly above the standing height and come back down
              (the Jump Race counter)
     SQUAT -> head and shoulders go well DOWN below the standing height (the game asks to hold it)
   Walking closer to the screen or farther away makes the shoulders wider or narrower in the picture; a squat or a jump
   keeps the shoulder width the same. So when the width changes a lot, the game takes it as "moved", follows the
   child to the new spot, and counts nothing.
   All sizes are in shoulder widths (u). */

export const JUMP_TH = { normal: .22, small: .13 };   // as Jump Race
export const SQUAT_TH = { normal: .85, small: .55 };  // head this far below the standing height = squat
const vis = (p, i, t = .4) => p[i] && p[i].v > t;

export function makeBody() {
  return { B: null, u: 0, seen: -9e9, up: false, upT: 0, lowT: 0, belowT: 0, hiT: 0, last: -9e9,
    pose: 'none', drop: 0, x: 0, head: null, standY: 0 };
}

/* one camera frame for one child. p = landmarks in screen px ({x,y,v}). opt.size = 'normal' | 'small'.
   Returns {pose: 'stand' | 'squat' | 'none', jumped} */
export function stepBody(d, p, now, opt = {}) {
  const size = opt.size || 'normal';
  if (!vis(p, 0, .5)) { d.pose = 'none'; return { pose: 'none', jumped: false }; }
  const sh = vis(p, 11) && vis(p, 12);
  const hs = [0, 7, 8].filter(i => vis(p, i)), yh = hs.reduce((a, i) => a + p[i].y, 0) / hs.length;
  const ys = sh ? (p[11].y + p[12].y) / 2 : null, sw = sh ? Math.hypot(p[11].x - p[12].x, p[11].y - p[12].y) : 0;
  const dt = Math.min(.2, Math.max(0, (now - d.seen) / 1000));
  if (!d.B || now - d.seen > 600) {
    d.seen = now;
    if (!sh) { d.B = null; d.pose = 'none'; return { pose: 'none', jumped: false }; }
    d.B = { s: ys, h: yh }; d.u = sw; d.up = false; d.lowT = now; d.belowT = 0; d.hiT = 0;
  }
  d.seen = now;
  const B = d.B, u = Math.max(1, d.u);
  d.x = sh ? (p[11].x + p[12].x) / 2 : p[0].x;
  d.head = { x: p[0].x, y: yh - u * .5 };          // top of the head ≈ ears − half a shoulder width
  const rh = (B.h - yh) / u, rs = ys != null ? (B.s - ys) / u : rh;   // + = higher than standing
  // walked closer / farther: the shoulder width changed a lot -> follow the child, count nothing
  if (sh && !d.up && (sw / u < .85 || sw / u > 1.18)) {
    const k = Math.min(1, dt * 4); B.s += (ys - B.s) * k; B.h += (yh - B.h) * k; d.u += (sw - d.u) * k;
    d.lowT = now; d.belowT = 0; d.hiT = 0; d.pose = 'stand'; d.drop = 0; d.standY = B.h - d.u * .5;
    return { pose: 'stand', jumped: false };
  }
  const rise = Math.min(rs, rh), drop = Math.min(-rh, -rs);   // both head AND shoulders
  d.drop = drop;
  let pose = 'stand', jumped = false;
  if (!d.up) {
    if (Math.abs(rh) < .08 && Math.abs(rs) < .1) {   // standing: keep the standing height fresh
      const k = Math.min(1, dt * 3); B.h += (yh - B.h) * k; if (ys != null) { B.s += (ys - B.s) * k; d.u += (sw - d.u) * Math.min(1, dt * 1.5); }
      d.lowT = now; d.belowT = 0;
    } else if (rise < 0) {
      d.lowT = now; d.belowT += dt;
      if (d.belowT > 6) { const k = Math.min(1, dt * 2); B.h += (yh - B.h) * k; if (ys != null) B.s += (ys - B.s) * k; }   // sat down for good
    } else d.belowT = 0;
    if (drop > SQUAT_TH[size] - (d.pose === 'squat' ? .1 : 0)) pose = 'squat';
    // jump: clearly ABOVE standing height, head and shoulders together, reached quickly
    if (sh && rise > JUMP_TH[size] && Math.abs(rs - rh) < Math.max(.12, rise * .5) && now - d.lowT < 400) {
      d.hiT += dt; if (d.hiT >= .06) { d.up = true; d.upT = now; d.hiT = 0; }
    } else d.hiT = 0;
  } else if (rise < JUMP_TH[size] * .4) {
    d.up = false; d.lowT = now;
    if (now - d.upT < 900 && now - d.last > 250) { d.last = now; jumped = true; }   // counted on landing
  } else if (now - d.upT > 1200) { d.up = false; if (ys != null) B.s = ys; B.h = yh; d.lowT = now; }   // stayed up: new standing height
  d.standY = B.h - d.u * .5;
  d.pose = pose;
  return { pose, jumped };
}
