/* Bamboo Physio — "How to play" cartoon.
   A small button under Play on the start card. Tapping it opens a short looping cartoon of the game, drawn in code
   with the game's own art: 3–4 steps, each a few seconds, a big picture and very few words (built for a 5-year-old;
   the words are for the grown-up reading along). Play inside the cartoon closes it and starts the game.

   API
     setupHowTo({
       lang: () => 'en' | 'he',
       steps: [ { dur: 2.6, cap: { en: 'Raise a hand ✋', he: '…' }, draw(c, w, h, t, k) } ],   // t = seconds into the step, k = t / dur
       play: () => {},            // what the Play button in the cartoon does (usually the game's play())
       before: '#play'            // the button goes right after this element (default: the Play button)
     })
   Each draw() paints the whole step on c (a 2D context sized w × h CSS px; background already cleared). */

import { INK, sticker, ell } from './kit.js';

const TXT = { en: { btn: '▶ How to play', play: 'Play' }, he: { btn: '▶ איך משחקים', play: 'שחקו' } };
let css = false;
function addCss() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `
.ht-btn{display:block;margin:10px auto 0;background:#FFF6D6;border:3px solid var(--ink,#2b2118);border-radius:999px;padding:7px 20px;font:700 17px Fredoka,sans-serif;color:var(--ink,#2b2118);box-shadow:0 3px 0 var(--ink,#2b2118);cursor:pointer}
.ht-btn:active{transform:translateY(3px);box-shadow:0 0 0 var(--ink,#2b2118)}
.ht{position:fixed;inset:0;z-index:50;background:rgba(43,33,24,.55);display:flex;align-items:center;justify-content:center;padding:10px}
.ht[hidden]{display:none!important}
.ht-box{position:relative;background:#FFF8EC;border:4px solid var(--ink,#2b2118);border-radius:26px;box-shadow:0 6px 0 var(--ink,#2b2118);padding:10px;width:min(96vw,760px);max-height:96vh;display:flex;flex-direction:column;gap:8px}
.ht-box canvas{width:100%;flex:1;min-height:0;border-radius:18px;background:#DDF3FF;display:block}
.ht-row{display:flex;align-items:center;gap:10px}
.ht-dots{display:flex;gap:7px;flex:1;justify-content:center}
.ht-dots i{width:13px;height:13px;border-radius:50%;border:2.5px solid var(--ink,#2b2118);background:#fff}
.ht-dots i.on{background:#FFD84D}
.ht-x{position:absolute;top:-14px;right:-14px;width:42px;height:42px;border-radius:50%;border:3px solid var(--ink,#2b2118);background:#fff;font:900 20px Fredoka,sans-serif;box-shadow:0 3px 0 var(--ink,#2b2118);cursor:pointer}
.ht-play{border:3px solid var(--ink,#2b2118);border-radius:999px;background:var(--leaf,#5CB85C);color:#fff;font:900 20px Grandstander,Fredoka,sans-serif;padding:6px 22px;box-shadow:0 3px 0 var(--ink,#2b2118);cursor:pointer;-webkit-text-stroke:1px var(--ink,#2b2118);paint-order:stroke fill}`;
  document.head.appendChild(s);
}

export function setupHowTo(o) {
  addCss();
  const lang = () => (o.lang && o.lang()) || 'en';
  const after = typeof o.before === 'string' ? document.querySelector(o.before) : (o.before || document.getElementById('play'));
  const btn = document.createElement('button'); btn.className = 'ht-btn'; btn.type = 'button';
  after.insertAdjacentElement('afterend', btn);
  // 20 Nov (Edgar): the start card shows the How-to-play button without scrolling — it grows just enough to fit it
  const card = btn.closest('.card.home');
  if (card) { const fit = () => { if (card.hidden) return; card.style.setProperty('--ht-need', Math.ceil(btn.offsetTop + btn.offsetHeight + 26) + 'px'); };
    requestAnimationFrame(fit); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit);
    new MutationObserver(() => requestAnimationFrame(fit)).observe(card, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true, characterData: true }); }
  const ov = document.createElement('div'); ov.className = 'ht'; ov.hidden = true;
  ov.innerHTML = '<div class="ht-box"><button class="ht-x" aria-label="close">✕</button><canvas></canvas><div class="ht-row"><div class="ht-dots"></div><button class="ht-play"></button></div></div>';
  document.body.appendChild(ov);
  const cv = ov.querySelector('canvas'), c = cv.getContext('2d'), dots = ov.querySelector('.ht-dots'), pb = ov.querySelector('.ht-play');
  o.steps.forEach(() => dots.appendChild(document.createElement('i')));
  const total = o.steps.reduce((a, s) => a + s.dur, 0);
  let t0 = 0, raf = 0, w = 0, h = 0;

  function label() { btn.textContent = TXT[lang()]?.btn || TXT.en.btn; pb.textContent = TXT[lang()]?.play || TXT.en.play; }
  label(); new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  function size() {
    const box = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    w = box.width; h = Math.min(box.width * .62, innerHeight * .96 - 90);
    cv.style.height = h + 'px'; cv.width = w * d; cv.height = h * d; c.setTransform(d, 0, 0, d, 0, 0);
  }
  function caption(txt) {
    const fs = Math.max(16, Math.min(28, w * .045));
    c.save(); c.font = `700 ${fs}px Fredoka,sans-serif`; c.direction = lang() === 'he' ? 'rtl' : 'ltr'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const tw = Math.min(w * .92, c.measureText(txt).width + fs * 1.4), bh = fs * 1.8, y = fs * 1.3;
    const p = new Path2D(); p.roundRect(w / 2 - tw / 2, y - bh / 2, tw, bh, bh / 2); c.fillStyle = INK; c.translate(0, 3); c.fill(p); c.translate(0, -3);
    sticker(c, p, '#fff', 3); c.fillStyle = INK; c.fillText(txt, w / 2, y + 1, w * .88); c.restore();
  }
  function loop(now) {
    if (ov.hidden) return;
    let t = ((now - t0) / 1000) % total, i = 0;
    while (t > o.steps[i].dur) { t -= o.steps[i].dur; i++; }
    const st = o.steps[i];
    c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#CDEEFF'); g.addColorStop(1, '#F1FAFF'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.save(); st.draw(c, w, h, t, t / st.dur); c.restore();
    // fade between steps
    const fade = Math.min(t / .25, (st.dur - t) / .25, 1); if (fade < 1) { c.fillStyle = `rgba(255,248,236,${1 - fade})`; c.fillRect(0, 0, w, h); }
    if (st.cap) caption(st.cap[lang()] || st.cap.en);
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    raf = requestAnimationFrame(loop);
  }
  const open = () => { ov.hidden = false; size(); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
  const close = () => { ov.hidden = true; cancelAnimationFrame(raf); };
  btn.onclick = open;
  ov.querySelector('.ht-x').onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };
  pb.onclick = () => { close(); o.play && o.play(); };
  addEventListener('resize', () => { if (!ov.hidden) size(); });
  return { open, close };
}

/* little helpers the games' cartoons share */
export const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
export const seg = (k, a, b) => ease((k - a) / (b - a));          // 0..1 while k goes from a to b
export function tapHand(c, x, y, s, press = 0) {                   // a cartoon pointing finger (for touch / menu hints)
  c.save(); c.translate(x, y + press * s * .12); c.rotate(-.35);
  const p = new Path2D(); p.roundRect(-s * .13, -s * .05, s * .26, s * .55, s * .13); sticker(c, p, '#F6D3B0', 3);
  const q = new Path2D(); q.roundRect(-s * .22, s * .25, s * .44, s * .42, s * .16); sticker(c, q, '#F6D3B0', 3); c.restore();
}
export function bigStar(c, x, y, r, rot = 0, col = '#FFD84D') {
  c.save(); c.translate(x, y); c.rotate(rot); const p = new Path2D();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .5 : r; p[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
  p.closePath(); sticker(c, p, col, 3); c.restore();
}
export function shadow(c, x, y, r) { c.fillStyle = 'rgba(43,33,24,.18)'; c.fill(ell(x, y, r, r * .25)); }
