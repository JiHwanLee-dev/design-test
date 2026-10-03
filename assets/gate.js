// 오늘의 부적 — 스님 페이지에 들어올 때 절 문(산문)이 열리는 연출
// temple 프로젝트 components/monk/MonkGate.tsx 를 일반 JavaScript로 옮김
//
// 순서 (전체 약 1.3초)
//   ① closed  : 닫힌 문 앞 (0.2초)
//   ② opening : 문짝 두 개가 안쪽으로 열린다 (0.7초)
//   ③ entering: 문 안으로 걸어 들어가듯 전체가 커지며 사라진다 (0.6초)
// dev 옵션 gate: once(이 탭에서 처음 한 번) | always(매번) | walk(문짝 없이 걸어 들어가기만) | none
//
// - <head>에서 바로 실행해, 그림을 받는 동안 벽 색으로 화면을 덮어 페이지가 먼저 보이지 않게 한다
// - 1.5초 안에 그림을 못 받으면 문 없이 그냥 페이지를 보여 준다
// - 화면을 누르면 바로 건너뛴다. '동작 줄이기'를 켠 분께는 띄우지 않는다
// - 그림(AI 수채화풍 띠살문) 원본 1254×1254를 세 장으로 나눈 것. 문 자리 좌표를 %로 바꿔 화면 크기와 상관없이 맞춘다

(() => {
  const IMAGES = ['assets/images/gate/frame.webp', 'assets/images/gate/door-left.webp', 'assets/images/gate/door-right.webp'];
  const SEEN_KEY = 'yw-gate-seen';
  const LOAD_LIMIT_MS = 1500;
  const OPEN_AT = 200, ENTER_AT = 700, END_AT = 1300, ENTER_MS = 600;
  const pct = n => `${(n / 1254) * 100}%`;
  const DOOR = { top: pct(37), height: pct(1134), width: pct(482), left: pct(146), right: pct(628) };

  let mode = 'once';
  try { mode = (JSON.parse(localStorage.getItem('yw-dev-opts') || '{}').gate) || 'once'; } catch (e) { }
  if (mode === 'none') return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (mode === 'once') { try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch (e) { } }

  const root = document.documentElement;
  root.classList.add('gate-pending'); // 그림 받는 동안 벽 색 덮개 (common.css)

  const load = src => { const img = new Image(); img.src = src; return img.decode(); };
  const loaded = Promise.race([
    Promise.all(IMAGES.map(load)).then(() => true),
    new Promise(res => setTimeout(() => res(false), LOAD_LIMIT_MS)),
  ]).catch(() => false);
  const domReady = new Promise(res => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', res) : res());

  Promise.all([loaded, domReady]).then(([ok]) => {
    if (!ok) { root.classList.remove('gate-pending'); return; }
    const gate = document.createElement('div');
    gate.className = 'yw-gate';
    gate.dataset.phase = 'closed';
    gate.dataset.mode = mode;
    gate.setAttribute('aria-hidden', 'true');
    const door = (side, src) => `<img class="yw-gate-door ${side}" src="${src}" alt="" style="left:${DOOR[side]};top:${DOOR.top};width:${DOOR.width};height:${DOOR.height}">`;
    gate.innerHTML = `<div class="yw-gate-scene"><img class="yw-gate-frame" src="${IMAGES[0]}" alt="">${door('left', IMAGES[1])}${door('right', IMAGES[2])}</div>`;
    document.body.appendChild(gate);
    root.classList.remove('gate-pending');

    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const end = () => { timers.forEach(clearTimeout); gate.remove(); };
    gate.addEventListener('click', end);

    // 한 번 그린 뒤에 단계를 바꿔야 CSS 전환이 일어남
    requestAnimationFrame(() => {
      if (mode === 'walk') {
        later(() => { gate.dataset.phase = 'entering'; }, OPEN_AT);
        later(end, OPEN_AT + ENTER_MS);
        return;
      }
      later(() => {
        gate.dataset.phase = 'opening';
        try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { } // '봤다'는 문이 실제로 열릴 때 남김
      }, OPEN_AT);
      later(() => { gate.dataset.phase = 'entering'; }, ENTER_AT);
      later(end, END_AT);
    });
  });
})();
