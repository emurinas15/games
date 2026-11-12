/* Bamboo Physio · Big Screen
   Sends the game picture (and sound, if the TV asks for it) from the phone straight to a TV or
   computer that has https://emurinas15.github.io/games/tv/ open. The picture goes phone → screen
   directly over the home Wi-Fi (WebRTC). A free public PeerJS broker only introduces the two
   devices; nothing is recorded or stored anywhere.
   Usage:  import { setupCast } from '../shared/cast.js';
           setupCast({ canvas, button: $('cast'), lang: () => lang, audio: () => S });            */

const TV_URL = 'emurinas15.github.io/games/tv';
const PREFIX = 'bamboophysio-tv-';
const LSK = 'bp-tv-code';
const T = {
  en: { title: 'Show on a big screen', s1: 'On the TV or computer, open:', s2: 'Type the 4 numbers you see there:',
    go: 'Connect', again: 'Connect to screen ', other: 'Another screen', stop: 'Stop showing', close: 'Close',
    connecting: 'Connecting…', on: 'Showing on the big screen ✓', bad: 'No screen with that number. Check the number on the TV.',
    fail: 'Couldn’t reach the screen. Are the phone and the TV on the same Wi-Fi?', need: 'Type 4 numbers',
    mirror: 'Or use your phone’s own screen mirroring', ios: 'iPhone: swipe down from the top-right corner → Screen Mirroring → pick the TV (Apple TV or AirPlay TV).',
    android: 'Android: swipe down twice from the top → Smart View / Cast / Screen cast → pick the TV.',
    tip: '★ Put the phone far away, sideways, where it can see the whole floor. Everyone watches the big screen.', aria: 'Show on a big screen' },
  he: { title: 'הצגה על מסך גדול', s1: 'בטלוויזיה או במחשב, פתחו:', s2: 'הקלידו את 4 הספרות שמופיעות שם:',
    go: 'חיבור', again: 'חיבור למסך ', other: 'מסך אחר', stop: 'הפסקת ההצגה', close: 'סגירה',
    connecting: 'מתחברים…', on: 'מוצג על המסך הגדול ✓', bad: 'אין מסך עם המספר הזה. בדקו את המספר בטלוויזיה.',
    fail: 'לא הצלחנו להגיע למסך. האם הטלפון והטלוויזיה מחוברים לאותה רשת Wi-Fi?', need: 'הקלידו 4 ספרות',
    mirror: 'או השתמשו בשיקוף המסך של הטלפון', ios: 'אייפון: החליקו למטה מהפינה הימנית העליונה ← שיקוף מסך ← בחרו את הטלוויזיה (Apple TV או טלוויזיה עם AirPlay).',
    android: 'אנדרואיד: החליקו פעמיים למטה מלמעלה ← Smart View / Cast / שיקוף מסך ← בחרו את הטלוויזיה.',
    tip: '★ הניחו את הטלפון רחוק, לרוחב, כך שיראה את כל הרצפה. כולם מסתכלים על המסך הגדול.', aria: 'הצגה על מסך גדול' }
};

const CSS = `
.cast-sheet{position:fixed;inset:0;z-index:20;display:flex;align-items:flex-end;justify-content:center;background:rgba(43,33,24,.35)}
.cast-sheet[hidden],.cast-box [hidden]{display:none!important}
.cast-box{width:min(440px,calc(100vw - 20px));margin-bottom:calc(env(safe-area-inset-bottom,0px) + 10px);background:#FFF8EC;border:4px solid #2b2118;border-radius:28px;box-shadow:0 6px 0 #2b2118;padding:14px 16px 12px;max-height:calc(100vh - 30px);overflow:auto;font-family:Andika,Fredoka,sans-serif;color:#2b2118}
.cast-box h2{font:900 24px Grandstander,Fredoka,sans-serif;margin:0 0 8px;text-align:center}
.cast-box p{margin:6px 0;font-size:15px;line-height:1.35}
.cast-url{display:block;text-align:center;font:700 18px Fredoka,sans-serif;background:#fff;border:3px dashed #2b2118;border-radius:16px;padding:6px;margin:4px 0 10px;direction:ltr;user-select:all;-webkit-user-select:all}
.cast-row{display:flex;gap:8px;align-items:center;margin:6px 0}
.cast-code{flex:1;min-width:0;font:900 30px Grandstander,Fredoka,sans-serif;letter-spacing:10px;text-align:center;border:3px solid #2b2118;border-radius:18px;padding:4px 6px;background:#fff;direction:ltr}
.cast-btn{border:4px solid #2b2118;border-radius:999px;background:#5DB760;color:#fff;font:900 20px Grandstander,Fredoka,sans-serif;padding:8px 18px;box-shadow:0 4px 0 #2b2118;cursor:pointer;-webkit-text-stroke:1px #2b2118;paint-order:stroke fill}
.cast-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #2b2118}
.cast-btn.wide{display:block;width:100%;margin:6px 0}
.cast-btn.soft{background:#fff;color:#2b2118;-webkit-text-stroke:0;font:700 16px Fredoka,sans-serif}
.cast-st{text-align:center;font:700 15px Fredoka,sans-serif;min-height:20px;margin:6px 0}
.cast-st.ok{color:#3E8E46}.cast-st.err{color:#C2412D}
.cast-box details{margin-top:8px;border-top:2px dashed #d8cdb8;padding-top:6px}
.cast-box summary{font:700 15px Fredoka,sans-serif;cursor:pointer;list-style:none}
.cast-box summary::-webkit-details-marker{display:none}
.cast-mini{font-size:13px!important;opacity:.85}
.cast-on{background:#FFD84D!important}
`;

let peer = null, call = null, data = null, audioDest = null, localMuted = false;

function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  return new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
    s.onload = () => ok(window.Peer); s.onerror = bad; document.head.appendChild(s); });
}
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export function setupCast({ canvas, button, lang = () => 'en', sound = null, onChange = null }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const sheet = document.createElement('div'); sheet.className = 'cast-sheet'; sheet.hidden = true;
  sheet.innerHTML = `<div class="cast-box" role="dialog" aria-modal="true">
    <h2 data-t="title"></h2>
    <div class="cast-quick"><button class="cast-btn wide" data-a="quick"></button><button class="cast-btn soft wide" data-a="other"></button></div>
    <div class="cast-new"><p data-t="s1"></p><span class="cast-url">${TV_URL}</span>
      <p data-t="s2"></p><div class="cast-row"><input class="cast-code" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="····"><button class="cast-btn" data-a="go"></button></div></div>
    <div class="cast-st"></div>
    <button class="cast-btn soft wide" data-a="stop"></button>
    <p class="cast-mini" data-t="tip"></p>
    <details><summary data-t="mirror"></summary><p class="cast-mini" data-t="ios"></p><p class="cast-mini" data-t="android"></p></details>
    <button class="cast-btn soft wide" data-a="close"></button></div>`;
  document.body.appendChild(sheet);
  const q = s => sheet.querySelector(s), input = q('.cast-code'), stEl = q('.cast-st');
  let status = '', stKind = '', showNew = false;

  function paint() {
    const u = T[lang()] || T.en, saved = lsGet(LSK), live = !!call;
    sheet.querySelector('.cast-box').dir = lang() === 'he' ? 'rtl' : 'ltr';
    sheet.querySelectorAll('[data-t]').forEach(e => e.textContent = u[e.dataset.t]);
    q('[data-a=go]').textContent = u.go; q('[data-a=other]').textContent = u.other; q('[data-a=stop]').textContent = u.stop; q('[data-a=close]').textContent = u.close;
    q('[data-a=quick]').textContent = u.again + (saved || '');
    q('.cast-quick').hidden = live || !saved || showNew; q('.cast-new').hidden = live || (!!saved && !showNew);
    q('[data-a=stop]').hidden = !live;
    stEl.textContent = status ? u[status] || status : ''; stEl.className = 'cast-st ' + stKind;
    if (button) { button.classList.toggle('cast-on', live); button.setAttribute('aria-label', u.aria); }
  }
  const setSt = (s, k = '') => { status = s; stKind = k; paint(); };

  async function connect(code) {
    if (status === 'connecting' || call) return;
    if (!/^\d{4}$/.test(code)) { setSt('need', 'err'); return; }
    setSt('connecting'); lsSet(LSK, code); showNew = false;
    try {
      const Peer = await loadPeer();
      if (!peer || peer.destroyed || peer.disconnected) { if (peer) try { peer.destroy(); } catch (e) {}
        peer = new Peer(window.BP_PEER); await new Promise((ok, bad) => { peer.once('open', ok); peer.once('error', bad); }); }
      peer.on('error', e => { if (e.type === 'peer-unavailable') { lsSet(LSK, ''); hang(); showNew = true; setSt('bad', 'err'); } });
      const stream = canvas.captureStream(30);
      const S = sound && sound();
      if (S && S.AC && S.BUS && S.BUS.master) { if (!audioDest) { audioDest = S.AC.createMediaStreamDestination(); S.BUS.master.connect(audioDest); }
        audioDest.stream.getAudioTracks().forEach(t => stream.addTrack(t)); }
      const id = PREFIX + code;
      call = peer.call(id, stream);
      data = peer.connect(id);
      data.on('data', d => { if (d && d.sound) setLocalMute(d.sound === 'on', S); });
      const timer = setTimeout(() => { if (call && status === 'connecting') { hang(); setSt('fail', 'err'); } }, 15000);
      const pc = call.peerConnection;
      const watch = () => { const s = pc.iceConnectionState;
        if (s === 'connected' || s === 'completed') { clearTimeout(timer); setSt('on', 'ok'); onChange && onChange(true); }
        if (s === 'failed') { clearTimeout(timer); hang(); setSt('fail', 'err'); } };
      if (pc) pc.addEventListener('iceconnectionstatechange', watch);
      call.on('close', () => { clearTimeout(timer); if (call) { hang(); setSt(''); } });
    } catch (e) { hang(); setSt('fail', 'err'); }
  }
  function setLocalMute(m, S) { if (!S || !S.AC || !S.BUS.master || m === localMuted) return; localMuted = m;
    try { if (m) S.BUS.master.disconnect(S.AC.destination); else S.BUS.master.connect(S.AC.destination); } catch (e) {} }
  function hang() {
    const c = call; call = null;
    try { c && c.close(); } catch (e) {} try { data && data.close(); } catch (e) {} data = null;
    setLocalMute(false, sound && sound()); onChange && onChange(false); paint();
  }

  q('[data-a=go]').onclick = () => connect(input.value.trim());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') connect(input.value.trim()); });
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 4); if (input.value.length === 4) connect(input.value); });
  q('[data-a=quick]').onclick = () => connect(lsGet(LSK) || '');
  q('[data-a=other]').onclick = () => { showNew = true; setSt(''); setTimeout(() => input.focus(), 50); };
  q('[data-a=stop]').onclick = () => { hang(); setSt(''); };
  q('[data-a=close]').onclick = () => { sheet.hidden = true; };
  sheet.addEventListener('pointerdown', e => { if (e.target === sheet) sheet.hidden = true; });
  if (button) button.onclick = () => { if (!call && status !== 'connecting') status = ''; showNew = false; paint(); sheet.hidden = false; };
  paint();
  return { paint, open: () => button && button.onclick(), live: () => !!call };
}
