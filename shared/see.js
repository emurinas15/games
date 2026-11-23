/* Bamboo Physio — "Easy to see" mode for the head-control games (23 Nov 2026, Edgar).
   One switch in Settings ("👁 Easy to see"). Built on the HappenLand Visual Guidelines v5 (CVI, low vision,
   eye-movement disorders, photosensitive epilepsy, limited attention), plus a sound guide for children who
   see very little or nothing.

   When it is on:
   · Calm, flat background in one deep colour; the camera picture of the child is only a faint shadow
     (a busy picture is the hardest thing for CVI). No decoration: no butterflies, pond things, confetti, trails.
   · The thing to watch gets a soft glow in the child's favourite colour (many children with CVI respond best to
     one colour), and that colour is used for nothing else. The thing is drawn bigger.
   · Slower: moving things move at about 80%, and end states are held longer.
   · Nothing flashes or blinks (nothing faster than 3 times a second), no full-screen brightness changes.
   · Bigger, bolder text for messages and the countdown.
   · Sound guide (on by default, can be switched off): a soft beep from the side where the trouble is, faster as
     it gets closer to falling (like a car parking sensor); the game's words (messages, countdown, which spot,
     the result) are spoken in English or Hebrew, if the phone has that voice. While the sound guide is on, the
     music is quieter and the background sounds are off, so only one thing is heard at a time.

   API (game side)
     import { SEE, setupSee } from '../shared/see.js';
     setupSee({ onChange })        adds the rows to Settings; onChange() after any change (re-apply sound levels)
     SEE.on, SEE.guide             booleans
     SEE.color, SEE.rgb            favourite colour '#hex' and 'r,g,b'
     SEE.k                         size factor (1.3 on, 1 off) · SEE.slow  speed factor (.8 on, 1 off)
     SEE.bg(ctx,W,H,col)           flat background
     SEE.ghost(ctx,video,W,H,a)    the camera picture, mirrored, faint
     SEE.halo(ctx,x,y,r)           soft glow in the favourite colour
     SEE.beacon(pan,urgency)       call every frame while playing: pan -1..1, urgency 0..1 (0 = all fine, silent)
     SEE.say(text)                 speak (sound guide only). Messages / countdown / end card are spoken automatically.
     SEE.musicK, SEE.ambK          sound level factors for games with their own mixer */

import { S, applyGains, drawMirroredVideo } from './kit.js';

const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const lang = () => (document.documentElement.lang === 'he' ? 'he' : 'en');

/* favourite colours: bright, so each stands out on the deep backgrounds (all ≥ 4.5:1 on #141B4D) */
export const COLORS = {
  yellow: { c: '#FFD60A', en: 'Yellow', he: 'צהוב' },
  orange: { c: '#FF9F1C', en: 'Orange', he: 'כתום' },
  red:    { c: '#FF5A4F', en: 'Red',    he: 'אדום' },
  pink:   { c: '#FF7AC6', en: 'Pink',   he: 'ורוד' },
  green:  { c: '#4BE36A', en: 'Green',  he: 'ירוק' },
  blue:   { c: '#4FC3F7', en: 'Blue',   he: 'כחול' }
};
const T = {
  en: { see: '👁 Easy to see', col: 'Favourite colour', guide: 'Sound guide', on: 'On', off: 'Off',
    note: 'Easy to see: a calm, plain screen with only the important things, drawn bigger, in the child\'s favourite colour, slower and with nothing flashing — for children with low vision, CVI, eye-movement difficulties, epilepsy or who are easily overwhelmed. Sound guide: a beep from the side where the trouble is (faster = nearly falling) and the game\'s words spoken aloud, so the game can be played with little or no sight. Music is quieter and background sounds are off while the sound guide is on.' },
  he: { see: '👁 קל לראות', col: 'הצבע האהוב', guide: 'מדריך קולי', on: 'פועל', off: 'כבוי',
    note: 'קל לראות: מסך רגוע ופשוט עם הדברים החשובים בלבד, גדולים יותר, בצבע האהוב על הילד, איטי יותר ובלי שום הבהוב — לילדים עם ראייה ירודה, CVI, קושי בתנועות עיניים, אפילפסיה או ילדים שמוצפים בקלות. מדריך קולי: צפצוף מהצד שבו יש בעיה (מהר יותר = כמעט נופל) והמילים של המשחק נאמרות בקול, כך שאפשר לשחק עם מעט ראייה או בלי ראייה. כשהמדריך הקולי פועל המוזיקה שקטה יותר וצלילי הרקע כבויים.' }
};

export const SEE = {
  on: LS.get('bp-see', '0') === '1',
  guide: LS.get('bp-see-guide', '1') === '1',
  colKey: COLORS[LS.get('bp-see-col', 'yellow')] ? LS.get('bp-see-col', 'yellow') : 'yellow',
  get color() { return COLORS[this.colKey].c; },
  get rgb() { const h = this.color; return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(','); },
  get k() { return this.on ? 1.3 : 1; },
  get slow() { return this.on ? .8 : 1; },
  get talk() { return this.on && this.guide; },
  get musicK() { return this.talk ? .4 : 1; },
  get ambK() { return this.talk ? 0 : 1; },
  bg(c, W, H, col = '#141B4D') { c.fillStyle = col; c.fillRect(0, 0, W, H); },
  ghost(c, video, W, H, a = .2) { if (!video || video.readyState < 2) return; c.save(); c.globalAlpha = a; drawMirroredVideo(c, video, W, H); c.restore(); },
  halo(c, x, y, r, a = 1) {   // soft glow, breathing very slowly (0.25 Hz, ±5%) — never a flash
    const t = performance.now() / 1000, rr = r * (1 + .05 * Math.sin(t * 1.6)), g = c.createRadialGradient(x, y, rr * .15, x, y, rr);
    g.addColorStop(0, `rgba(${this.rgb},${.9 * a})`); g.addColorStop(.45, `rgba(${this.rgb},${.55 * a})`); g.addColorStop(1, `rgba(${this.rgb},0)`);
    c.save(); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); c.restore(); },
  beacon(pan, urgency) { B.pan = Math.max(-1, Math.min(1, pan || 0)); B.u = Math.max(0, Math.min(1, urgency || 0)); B.at = performance.now(); },
  say(text, force) { speak(text, force); }
};

/* ---------- sound: own little audio context (works next to any game's mixer) ---------- */
const muted = () => { const b = document.getElementById('snd'); return b && b.getAttribute('aria-pressed') === 'true'; };
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
addEventListener('pointerdown', () => { if (SEE.talk) ac(); }, true);
document.addEventListener('visibilitychange', () => { if (AC) document.hidden ? AC.suspend() : AC.resume(); });
const B = { pan: 0, u: 0, at: -1e9, next: 0 };
function beep(pan, u) {
  const a = ac(); if (!a) return; const t = a.currentTime + .01, f = 420 + u * 520;
  const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
  let out = g; if (a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  o.connect(g); out.connect(a.destination); o.start(t); o.stop(t + .1);
}
setInterval(() => {
  const now = performance.now();
  if (!SEE.talk || muted() || now - B.at > 250 || B.u < .12) return;   // quiet = all is well
  if (now < B.next) return;
  beep(B.pan, B.u); B.next = now + (900 - 780 * B.u);   // 0.9 s apart when it starts, 0.12 s when about to fall
}, 30);

/* ---------- speech ---------- */
let lastSaid = '', lastT = 0;
const clean = s => (s || '').replace(/[\u{1F000}-\u{1FFFF}☀-➿️★⭐✨]/gu, '').replace(/\s+/g, ' ').trim();
function voiceFor(l) { const vs = speechSynthesis.getVoices(); return vs.find(v => v.lang && v.lang.toLowerCase().startsWith(l === 'he' ? 'he' : 'en') && v.localService) || vs.find(v => v.lang && v.lang.toLowerCase().startsWith(l === 'he' ? 'he' : 'en')); }
function speak(text, force) {
  if (!SEE.talk || muted() || !('speechSynthesis' in window)) return;
  const s = clean(text); if (!s) return;
  const now = performance.now(); if (!force && s === lastSaid && now - lastT < 4000) return;
  const l = lang(), v = voiceFor(l); if (!v && l === 'he') return;   // never read Hebrew with an English voice
  lastSaid = s; lastT = now;
  const u = new SpeechSynthesisUtterance(s); if (v) u.voice = v; u.lang = l === 'he' ? 'he-IL' : 'en-US'; u.rate = .92; u.pitch = 1.1;
  if (/^\d+$/.test(s)) speechSynthesis.cancel();   // countdown numbers: say them on time
  speechSynthesis.speak(u);
}
if ('speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); }
function watchWords() {
  const m = document.getElementById('msg'), cnt = document.getElementById('count'), wh = document.getElementById('where'), end = document.getElementById('end');
  if (m) new MutationObserver(() => { if (m.classList.contains('on')) speak(m.textContent); }).observe(m, { attributes: true, childList: true, characterData: true, subtree: true });
  if (cnt) new MutationObserver(() => { if (cnt.textContent) speak(cnt.textContent, true); }).observe(cnt, { childList: true, characterData: true, subtree: true });
  if (wh) new MutationObserver(() => { if (wh.classList.contains('on')) speak(wh.textContent, true); }).observe(wh, { attributes: true, childList: true, subtree: true });
  if (end) new MutationObserver(() => { if (!end.hidden) setTimeout(() => {
      const h = end.querySelector('h1'), f = document.getElementById('final'), sub = end.querySelector('.big-score small'), nb = document.getElementById('newbest');
      speak([h && h.textContent, nb && !nb.hidden ? nb.textContent : '', f && f.textContent, sub && sub.textContent].filter(Boolean).join('. '), true); }, 300); })
    .observe(end, { attributes: true, attributeFilter: ['hidden'] });
}

/* ---------- look ---------- */
function css() {
  const st = document.createElement('style');
  st.textContent = `
.g-row[hidden],.see-cols[hidden]{display:none!important}
html.see .msg{font-size:32px;border-width:4px;padding:16px 26px;max-width:92vw}
html.see .count{font-size:170px;-webkit-text-stroke:7px var(--ink)}
html.see .pill b{font-size:38px}
html.see .where{font-size:30px;border-width:4px}
html.see .toast{font-size:19px}
.see-cols{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;width:100%;margin:2px 0 6px}
.see-cols button{min-width:64px;border:3px solid var(--ink);border-radius:18px;padding:6px 8px 5px;font:700 13px Fredoka,sans-serif;color:var(--ink);box-shadow:0 3px 0 var(--ink);cursor:pointer}
.see-cols button[aria-pressed="true"]{transform:translateY(-2px);box-shadow:0 5px 0 var(--ink);outline:3px solid var(--ink);outline-offset:2px}
.see-cols button[aria-pressed="true"]::before{content:"✓ "}`;
  document.head.appendChild(st);
}

/* ---------- settings rows ---------- */
export function setupSee(o = {}) {
  css();
  const body = document.querySelector('.g-body'); if (!body) return SEE;
  const r1 = document.createElement('div'); r1.className = 'g-row';
  r1.innerHTML = '<span></span><div class="seg"><button data-v="1"></button><button data-v="0"></button></div>';
  const r2 = document.createElement('div'); r2.className = 'g-row'; r2.innerHTML = '<span></span>';
  const cols = document.createElement('div'); cols.className = 'see-cols';
  for (const [k, v] of Object.entries(COLORS)) { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.style.background = v.c; cols.appendChild(b); }
  r2.appendChild(cols);
  const r3 = document.createElement('div'); r3.className = 'g-row';
  r3.innerHTML = '<span></span><div class="seg"><button data-v="1"></button><button data-v="0"></button></div>';
  const note = document.createElement('p');
  const first = body.querySelector('.g-row'); body.insertBefore(r1, first); body.insertBefore(r2, first); body.insertBefore(r3, first); body.insertBefore(note, first);
  const changed = () => { document.documentElement.classList.toggle('see', SEE.on); S.musicK = SEE.musicK; S.ambK = SEE.ambK; try { applyGains(); } catch (e) {}
    if (!SEE.talk && 'speechSynthesis' in window) speechSynthesis.cancel(); o.onChange && o.onChange(); paint(); };
  function paint() {
    const t = T[lang()];
    r1.querySelector('span').textContent = t.see; r2.querySelector('span').textContent = t.col; r3.querySelector('span').textContent = t.guide;
    r1.querySelectorAll('button').forEach(b => { b.textContent = t[b.dataset.v === '1' ? 'on' : 'off']; b.setAttribute('aria-pressed', String((b.dataset.v === '1') === SEE.on)); });
    r3.querySelectorAll('button').forEach(b => { b.textContent = t[b.dataset.v === '1' ? 'on' : 'off']; b.setAttribute('aria-pressed', String((b.dataset.v === '1') === SEE.guide)); });
    cols.querySelectorAll('button').forEach(b => { b.textContent = COLORS[b.dataset.k][lang()]; b.setAttribute('aria-pressed', String(b.dataset.k === SEE.colKey)); });
    r2.hidden = r3.hidden = !SEE.on; note.textContent = t.note; note.className = 'mini'; note.style.textAlign = 'start';
  }
  r1.querySelectorAll('button').forEach(b => b.onclick = () => { SEE.on = b.dataset.v === '1'; LS.set('bp-see', SEE.on ? '1' : '0'); if (SEE.talk) { ac(); speak(T[lang()].see, true); } changed(); });
  r3.querySelectorAll('button').forEach(b => b.onclick = () => { SEE.guide = b.dataset.v === '1'; LS.set('bp-see-guide', SEE.guide ? '1' : '0'); if (SEE.talk) { ac(); beep(0, .5); } changed(); });
  cols.querySelectorAll('button').forEach(b => b.onclick = () => { SEE.colKey = b.dataset.k; LS.set('bp-see-col', b.dataset.k); speak(COLORS[b.dataset.k][lang()], true); changed(); });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  watchWords(); changed();
  return SEE;
}
