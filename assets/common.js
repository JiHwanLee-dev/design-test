// 염원 念願 — 공통 기능: 유틸, 그래픽, 장바구니(스님별 결제), 주문서, 헤더·푸터, 스크롤 애니메이션

window.YW = (() => {
  const D = window.YW_DATA;

  // ---------- 저장소 ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  };

  // ---------- 유틸 ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const won = n => n.toLocaleString('ko-KR') + '원';
  const manwon = n => (n % 10000 === 0 ? (n / 10000).toLocaleString('ko-KR') : (n / 10000).toFixed(1).replace(/\.0$/, '')) + '만 원';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = (...a) => { let h = 2166136261; for (const c of a.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const monkById = id => D.MONKS.find(m => m.id === id);
  const monkUrl = id => `monk.html?id=${encodeURIComponent(id)}`;
  // 의식(부적 포함) 관련
  const ritualUrl = key => `ritual.html?id=${encodeURIComponent(key)}`;
  const offeredBy = key => D.MONKS.filter(m => key === 'charm' ? m.charms.length > 0 : m.services.some(s => s.id === key));
  // 스님별 의식 예약 페이지
  const riteUrl = (monkId, key) => `rite.html?monk=${encodeURIComponent(monkId)}&id=${encodeURIComponent(key)}`;
  // 예약하러 가는 곳: dev 옵션 riteClick이 page면 의식 예약 페이지, inline이면 스님 페이지 안 위젯
  const bookUrl = (m, key) => key === 'charm' ? `${monkUrl(m.id)}#charms`
    : devOpt('riteClick') === 'page' ? `${riteUrl(m.id, key)}#book` : `${monkUrl(m.id)}&svc=${key}#rituals`;
  const serviceReviews = (monkId, key) => D.REVIEWS.filter(r => r.monk === monkId && r.service.startsWith(D.SERVICE_TYPES[key].name));
  const priceAt = (m, key) => key === 'charm' ? m.minCharm : m.services.find(s => s.id === key).price;
  function ritualInfo(key) {
    const c = D.CATEGORIES.find(x => x.key === key), d = D.RITUAL_DETAILS[key];
    if (!c || !d) return null;
    const t = D.SERVICE_TYPES[key] || {};
    const by = offeredBy(key);
    const prices = by.map(m => priceAt(m, key));
    return { ...t, ...d, key, mark: c.hanja, name: c.name, by, active: by.length > 0,
      min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null };
  }
  // 부적 상세 · 장바구니 (팝업과 상세 페이지가 같이 씀)
  const charmUrl = (monkId, charmId) => `charm.html?monk=${encodeURIComponent(monkId)}&id=${encodeURIComponent(charmId)}`;
  const charmSeed = (monkId, charmId) => hash(monkId, charmId) % 997 + 1;
  const charmUnit = (price, material, bless) => price + D.MATERIALS.find(x => x.id === material).add + (bless ? D.BLESS_PRICE : 0);
  function charmCartItem(m, charmId, { material = 'print', bless = false, who = '', qty = 1 }) {
    const c = D.CHARM_TYPES[charmId], ci = m.charms.find(x => x.id === charmId);
    const mat = D.MATERIALS.find(x => x.id === material);
    return {
      key: ['charm', m.id, charmId, material, bless, who].join('|'),
      type: 'charm', ref: charmId, seed: charmSeed(m.id, charmId), name: c.name,
      opts: [mat.name, bless ? '축원 봉인' : null, who ? `축원: ${who}` : null].filter(Boolean).join(' · '),
      unit: charmUnit(ci.price, material, bless), qty,
    };
  }
  // 이 부적의 후기 (후기의 '어떤 의식' 이름에 부적 이름이 들어 있으면)
  const charmReviews = (monkId, charmId) => D.REVIEWS.filter(r => r.monk === monkId && r.service.startsWith(D.CHARM_TYPES[charmId].name));

  // 예약 가능 날짜 규칙 (예약 위젯과 같은 규칙. 시안용으로 '마감'을 무작위처럼 만듦)
  const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function dateStatus(monkId, key, d) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (Math.round((d - today) / 86400000) < 3) return 'prep';
    if (hash(dayKey(d), monkId, key) % 6 === 0) return 'full';
    return 'open';
  }
  function earliestDate(monkId, key) {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 120; i++, d.setDate(d.getDate() + 1)) if (dateStatus(monkId, key, d) === 'open') return new Date(d);
    return null;
  }
  const shortDate = d => `${d.getMonth() + 1}월 ${d.getDate()}일(${'일월화수목금토'[d.getDay()]})`;

  // ---------- 쇼핑몰형: 상품 목록 · 카드 ----------
  const shopUrl = (cat, extra = '') => `shop.html?cat=${cat}${extra}`;
  const groupOf = key => key === 'charm' ? 'charm' : (D.SHOP_CATS.find(c => (c.services || []).includes(key)) || {}).key;
  // 운영 중인 스님들의 부적 · 의식을 상품 하나하나로 펼침
  function shopProducts() {
    const list = [];
    D.MONKS.forEach(m => {
      m.charms.forEach(ci => {
        const c = D.CHARM_TYPES[ci.id];
        list.push({ kind: 'charm', group: 'charm', monk: m, id: ci.id, name: c.name, sub: c.cat, price: ci.price,
          rating: ci.rating ?? m.rating, reviews: ci.reviews ?? 0, url: charmUrl(m.id, ci.id), text: [c.name, c.cat, c.desc].join(' ') });
      });
      m.services.forEach(s => {
        const t = D.SERVICE_TYPES[s.id];
        list.push({ kind: 'rite', group: groupOf(s.id), monk: m, id: s.id, name: t.name, sub: t.dur, price: s.price,
          rating: s.rating ?? m.rating, reviews: s.reviews ?? 0, url: riteUrl(m.id, s.id), text: [t.name, t.desc, D.RITUAL_DETAILS[s.id].summary].join(' ') });
      });
    });
    return list;
  }
  const ratingLine = p => `<span class="flex items-center gap-1 text-xs"><iconify-icon icon="solar:star-bold" width="13" class="text-cinnabar"></iconify-icon><b class="tabular-nums">${p.rating}</b><span class="text-subtle tabular-nums">(${p.reviews.toLocaleString('ko-KR')})</span></span>`;

  // 부적 상품 카드 (쇼핑몰형 진열용, 촘촘하게)
  function charmCard(p, { best = false } = {}) {
    const c = D.CHARM_TYPES[p.id];
    return `
    <article class="group relative flex flex-col">
      <div class="relative">
        <a href="${p.url}" class="block aspect-[4/5] rounded-[1.25rem] bg-deep/60 ring-1 ring-edge/10 overflow-hidden flex items-center justify-center ease-spring group-hover:ring-cinnabar/40" aria-label="${c.name} 자세히 보기">
          <span class="w-[46%] ease-spring group-hover:-translate-y-1 group-hover:-rotate-2 shadow-[0_20px_40px_-18px_var(--drop)] rounded-[0.75rem]">${charmSVG(c, charmSeed(p.monk.id, p.id))}</span>
        </a>
        <div class="absolute left-2.5 top-2.5 flex flex-wrap gap-1 pointer-events-none">
          ${best ? '<span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-cinnabar text-white">BEST</span>' : ''}
          <span class="rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-surface/90 text-fg2 ring-1 ring-edge/10">수기 가능</span>
        </div>
        <button type="button" data-quick-add="${p.monk.id}|${p.id}" aria-label="${c.name} 바로 담기" class="ease-spring absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-surface/95 ring-1 ring-edge/15 text-fg flex items-center justify-center hover:bg-cinnabar hover:text-white hover:ring-cinnabar active:scale-95 shadow-[0_8px_20px_-8px_var(--drop)]"><iconify-icon icon="solar:cart-large-2-linear" width="18"></iconify-icon></button>
      </div>
      <div class="mt-3 px-0.5">
        <p class="text-[11px] text-subtle truncate">${p.monk.name} 스님 · ${p.monk.temple}</p>
        <h3 class="mt-0.5 text-sm sm:text-[15px] font-semibold leading-snug"><a href="${p.url}" class="hover:underline underline-offset-2">${c.name}</a></h3>
        <p class="mt-1 font-bold tabular-nums">${won(p.price)}<span class="ml-0.5 text-[11px] font-normal text-subtle">부터</span></p>
        <div class="mt-1">${ratingLine(p)}</div>
      </div>
    </article>`;
  }

  // 제례 · 기도 상품 카드 (가장 빠른 예약일 포함)
  function riteCard(p) {
    const t = D.SERVICE_TYPES[p.id];
    const early = earliestDate(p.monk.id, p.id);
    return `
    <a href="${p.url}" class="group flex flex-col rounded-[1.5rem] bg-surface ring-1 ring-edge/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] p-5 ease-spring hover:ring-cinnabar/50">
      <div class="flex items-start gap-4">
        <span class="w-14 h-14 shrink-0 rounded-2xl bg-deep/70 ring-1 ring-edge/10 flex items-center justify-center font-serif font-extrabold text-lg text-cinnabar ease-spring group-hover:bg-cinnabar group-hover:text-white">${t.hanja}</span>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] text-subtle truncate">${p.monk.name} 스님 · ${p.monk.temple}</p>
          <h3 class="mt-0.5 font-semibold leading-snug">${t.name}</h3>
          <p class="text-xs text-subtle">${t.dur}</p>
        </div>
      </div>
      <p class="mt-4 font-bold tabular-nums">${won(p.price)}<span class="ml-0.5 text-[11px] font-normal text-subtle">부터</span></p>
      <div class="mt-1">${ratingLine(p)}</div>
      <p class="mt-4 pt-3 border-t border-edge/10 text-xs flex items-center gap-1.5 text-fg2"><iconify-icon icon="solar:calendar-linear" width="15" class="text-cinnabar"></iconify-icon>${early ? `가장 빠른 날 <b>${shortDate(early)}</b>` : '예약 문의'}</p>
    </a>`;
  }

  // 메뉴·목록에 보여줄 의식 (dev 옵션 '준비 중 표시'면 모시는 스님이 없는 의식도 포함)
  const visibleRituals = () => D.CATEGORIES.map(c => ritualInfo(c.key)).filter(r => r && (r.active || devOpt('emptyRitual') === 'soon'))
    .sort((a, b) => b.active - a.active); // 준비 중인 의식은 뒤로

  // dev 옵션 (패널에서 바꾸고, 이 브라우저에 저장)
  const DEV_DEFAULTS = { mainLayout: 'shop', cardLink: 'detail', emptyRitual: 'hide', cardPrice: 'hide', charmClick: 'page', riteClick: 'page' };
  const devOpt = k => { const o = store.get('yw-dev-opts', {}); return o[k] ?? DEV_DEFAULTS[k]; };
  const devHandlers = [];
  const onDevChange = fn => devHandlers.push(fn);

  const phoneOk = v => /^01[016789]-?\d{3,4}-?\d{4}$/.test(v.replace(/\s/g, ''));
  let uidSeq = 0;
  const uid = () => 'u' + (uidSeq++);

  // ---------- 그래픽 ----------
  // 부적 SVG
  function charmSVG(c, seed = 1) {
    const id = uid();
    const r = rng(seed);
    let strokes = '';
    for (let i = 0; i < 5; i++) {
      const x = 54 + i * 23 + (r() - 0.5) * 6;
      let d = `M${x} 222`, y = 222;
      while (y < 268) { const ny = y + 8 + r() * 6; d += ` Q${x + (r() - 0.5) * 22} ${(y + ny) / 2} ${x + (r() - 0.5) * 4} ${ny}`; y = ny; }
      strokes += `<path d="${d}" fill="none" stroke="#a8321f" stroke-width="${2 + r() * 2.5}" stroke-linecap="round"/>`;
    }
    let dots = '';
    for (let i = 0; i < 3; i++) dots += `<circle cx="${70 + i * 30}" cy="${92 + (i % 2) * 6}" r="${2.5 + r() * 2}" fill="#a8321f"/>`;
    return `<svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" class="block w-full h-auto rounded-[1rem]" role="img" aria-label="${esc(c.name)} 문양">
      <defs>
        <filter id="p${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.15  0 0 0 0.28 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
        <filter id="r${id}"><feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>
      </defs>
      <rect width="200" height="320" fill="#ddc791"/>
      <rect width="200" height="320" fill="#ddc791" filter="url(#p${id})"/>
      <g filter="url(#r${id})">
        <rect x="11" y="11" width="178" height="298" fill="none" stroke="#a8321f" stroke-width="3.5"/>
        <rect x="18" y="18" width="164" height="284" fill="none" stroke="#a8321f" stroke-width="1"/>
        <circle cx="100" cy="58" r="24" fill="none" stroke="#a8321f" stroke-width="2.5"/>
        <path d="M86 52 H114 M84 60 H116 M88 68 H112" stroke="#a8321f" stroke-width="2.5" stroke-linecap="round"/>
        ${dots}
        <text x="100" y="190" text-anchor="middle" font-family="'Nanum Myeongjo', serif" font-weight="800" font-size="84" fill="#a8321f">${c.glyph}</text>
        ${strokes}
        <rect x="80" y="274" width="40" height="24" rx="2" fill="#a8321f"/>
        <text x="100" y="291" text-anchor="middle" font-family="'Nanum Myeongjo', serif" font-weight="800" font-size="13" fill="#ddc791">念願</text>
      </g>
    </svg>`;
  }

  // 스님 법명 낙관(도장) 아바타
  function monkAvatar(m, cls = 'w-12 h-12 text-sm') {
    return `<span class="${cls} shrink-0 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 ring-1 ring-edge/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex items-center justify-center font-serif font-extrabold text-hanji tracking-tight" aria-hidden="true">${m.hanja}</span>`;
  }

  // 수묵 산수 배경 (스님마다 다른 모양)
  function landscapeSVG(seed, cls = 'absolute inset-0 w-full h-full') {
    const r = rng(seed * 13 + 5);
    const id = uid();
    const fills = ['var(--ls-m1)', 'var(--ls-m2)', 'var(--ls-m3)', 'var(--ls-m4)'];
    let layers = '';
    fills.forEach((f, i) => {
      const base = 170 + i * 55;
      let d = `M0 400 L0 ${base}`;
      let px = 0, py = base;
      for (let x = 60; x <= 860; x += 60 + r() * 40) {
        const y = base - (r() * (110 - i * 18)) + (i * 6);
        d += ` Q${(px + x) / 2} ${Math.min(py, y) - 25 * r()} ${x} ${y}`;
        px = x; py = y;
      }
      d += ' L860 400 Z';
      layers += `<path d="${d}" style="fill:${f}" opacity="${0.92 - i * 0.04}"/>`;
      if (i < 3) layers += `<rect x="0" y="${base + 10}" width="860" height="40" fill="url(#mist${id})" opacity="${0.5 - i * 0.1}"/>`;
    });
    const mx = 520 + r() * 180, my = 80 + r() * 40;
    return `<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" class="${cls}" aria-hidden="true">
      <defs>
        <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ls-sky1)"/><stop offset="1" style="stop-color:var(--ls-sky2)"/></linearGradient>
        <linearGradient id="mist${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ls-mist)" stop-opacity="0"/><stop offset=".5" style="stop-color:var(--ls-mist)" stop-opacity=".12"/><stop offset="1" style="stop-color:var(--ls-mist)" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#sky${id})"/>
      <circle cx="${mx}" cy="${my}" r="34" fill="#c8553d" opacity="0.85"/>
      ${layers}
    </svg>`;
  }


  // ---------- 레이어(모달·드로어) ----------
  const layerStack = [];
  function openLayer(el, panel, hideCls) {
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    layerStack.push({ el, panel, hideCls });
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove(...hideCls)));
  }
  function closeLayer(el) {
    const i = layerStack.findIndex(l => l.el === el);
    if (i < 0) return;
    const { panel, hideCls } = layerStack[i];
    layerStack.splice(i, 1);
    panel.classList.add(...hideCls);
    setTimeout(() => { el.classList.add('hidden'); if (!layerStack.length) document.body.style.overflow = ''; }, 350);
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const top = layerStack[layerStack.length - 1];
    if (top && top.el.id === 'ywDialog') resolveDialog(false);
    else if (top) closeLayer(top.el);
    else if ($('#ywMenu') && !$('#ywMenu').classList.contains('hidden')) closeMenu();
  });

  // ---------- 토스트 ----------
  let toastTimer;
  function toast(msg) {
    $('#ywToastText').textContent = msg;
    const t = $('#ywToast');
    t.classList.remove('translate-y-6', 'opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('translate-y-6', 'opacity-0'), 2400);
  }

  // ---------- 확인 대화상자 ----------
  const DLG_HIDE = ['scale-95', 'opacity-0'];
  let dlgResolve = null;
  function confirmDialog({ title, body, ok = '확인', cancel = '취소' }) {
    $('#ywDlgTitle').textContent = title;
    $('#ywDlgBody').innerHTML = body;
    $('#ywDlgOk').textContent = ok;
    $('#ywDlgCancel').textContent = cancel;
    openLayer($('#ywDialog'), $('#ywDlgPanel'), DLG_HIDE);
    return new Promise(res => { dlgResolve = res; });
  }
  function resolveDialog(v) {
    closeLayer($('#ywDialog'));
    if (dlgResolve) { dlgResolve(v); dlgResolve = null; }
  }

  // ---------- 장바구니 (한 번에 한 스님만) ----------
  let cart = store.get('yw-cart', { monkId: null, items: [] });
  if (!cart || !Array.isArray(cart.items)) cart = { monkId: null, items: [] };
  const saveCart = () => { if (!cart.items.length) cart.monkId = null; store.set('yw-cart', cart); renderCartCount(); };

  async function addToCart(monkId, item) {
    if (cart.items.length && cart.monkId !== monkId) {
      const prev = monkById(cart.monkId);
      const next = monkById(monkId);
      const ok = await confirmDialog({
        title: '다른 스님의 장바구니가 있습니다',
        body: `결제는 스님별로 따로 진행됩니다. 장바구니에 담긴 <b class="text-fg">${esc(prev ? prev.name + ' 스님' : '이전')}</b>의 항목 ${cart.items.length}개를 비우고 <b class="text-fg">${esc(next.name)} 스님</b>의 항목을 담을까요?`,
        ok: '비우고 담기', cancel: '그대로 두기',
      });
      if (!ok) return false;
      cart = { monkId: null, items: [] };
    }
    cart.monkId = monkId;
    const ex = item.type === 'charm' && cart.items.find(x => x.key === item.key);
    if (ex) ex.qty = Math.min(9, ex.qty + item.qty);
    else cart.items.push(item);
    saveCart();
    return true;
  }

  const calc = () => {
    const charmSum = cart.items.filter(i => i.type === 'charm').reduce((a, i) => a + i.unit * i.qty, 0);
    const ritualSum = cart.items.filter(i => i.type === 'ritual').reduce((a, i) => a + i.unit * i.qty, 0);
    const ship = charmSum > 0 && charmSum < 50000 ? 3000 : 0;
    return { charmSum, ritualSum, ship, total: charmSum + ritualSum + ship, hasCharm: charmSum > 0 };
  };

  function renderCartCount() {
    const n = cart.items.reduce((a, i) => a + i.qty, 0);
    $$('[data-cart-count]').forEach(el => { el.textContent = n; });
    const head = $('#ywCartHeadCount'); if (head) head.textContent = n ? `${n}개` : '';
  }

  const CART_HIDE = ['translate-x-full'];
  function renderCart() {
    const m = monkById(cart.monkId);
    if (!cart.items.length || !m) {
      $('#ywCartMonk').innerHTML = '';
      $('#ywCartItems').innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center py-20">
          <span class="font-serif text-6xl font-extrabold text-edge/10">空</span>
          <p class="mt-6 font-semibold">장바구니가 비어 있습니다</p>
          <p class="mt-2 text-sm text-subtle leading-relaxed">스님 페이지에서 부적이나 제례를 담아 보세요.<br>결제는 스님별로 따로 진행됩니다.</p>
          <a href="index.html#monks" class="ease-spring mt-8 h-12 px-6 rounded-full bg-edge/5 border border-edge/10 text-sm font-semibold flex items-center gap-2 hover:bg-edge/10">스님 만나보기<iconify-icon icon="solar:arrow-right-linear" width="16"></iconify-icon></a>
        </div>`;
      $('#ywCartFoot').innerHTML = '';
      return;
    }
    $('#ywCartMonk').innerHTML = `
      <a href="${monkUrl(m.id)}" class="ease-spring flex items-center gap-3 rounded-2xl bg-edge/[0.03] border border-edge/10 px-4 py-3 hover:bg-edge/[0.06]">
        ${monkAvatar(m, 'w-10 h-10 text-xs')}
        <span class="flex-1 text-sm leading-snug"><b class="block">${m.name} 스님</b><span class="text-subtle">${m.temple} · ${m.area}</span></span>
        <span class="text-[11px] text-subtle">스님별 결제</span>
      </a>`;
    $('#ywCartItems').innerHTML = cart.items.map((it, idx) => {
      const charm = it.type === 'charm' ? D.CHARM_TYPES[it.ref] : null;
      const svc = it.type === 'ritual' ? D.SERVICE_TYPES[it.ref] : null;
      return `
      <div class="flex gap-4 py-5 border-b border-edge/5 last:border-0">
        <div class="w-16 shrink-0">${charm ? charmSVG(charm, it.seed) : `<div class="aspect-[5/8] rounded-xl bg-cinnabar/10 border border-cinnabar/20 flex items-center justify-center font-serif font-extrabold text-cinnabar text-base [writing-mode:vertical-rl]">${svc.hanja}</div>`}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-[11px] text-cinnabar-soft font-medium">${it.type === 'charm' ? '부적' : '제례 · 기도 예약'}</p>
              <p class="font-semibold leading-snug">${esc(it.name)}</p>
            </div>
            <button data-remove="${idx}" aria-label="삭제" class="ease-spring w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-subtle hover:text-cinnabar-soft hover:bg-edge/5"><iconify-icon icon="solar:trash-bin-trash-linear" width="18"></iconify-icon></button>
          </div>
          <p class="mt-1 text-xs text-subtle leading-relaxed">${esc(it.opts)}</p>
          <div class="mt-3 flex items-center justify-between">
            ${it.type === 'charm' ? `
              <div class="flex items-center gap-1 rounded-full bg-edge/[0.04] border border-edge/10 p-0.5">
                <button data-dec="${idx}" aria-label="수량 줄이기" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-edge/10"><iconify-icon icon="solar:minus-circle-linear" width="16"></iconify-icon></button>
                <span class="w-5 text-center text-sm tabular-nums">${it.qty}</span>
                <button data-inc="${idx}" aria-label="수량 늘리기" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-edge/10"><iconify-icon icon="solar:add-circle-linear" width="16"></iconify-icon></button>
              </div>` : `<span class="text-xs text-subtle">신청자 ${esc(it.applicant)}</span>`}
            <p class="font-semibold tabular-nums">${won(it.unit * it.qty)}</p>
          </div>
        </div>
      </div>`;
    }).join('');
    const c = calc();
    $('#ywCartFoot').innerHTML = `
      ${c.charmSum ? `<div class="flex justify-between text-muted"><span>부적</span><span class="tabular-nums">${won(c.charmSum)}</span></div>` : ''}
      ${c.ritualSum ? `<div class="flex justify-between text-muted"><span>제례 · 기도</span><span class="tabular-nums">${won(c.ritualSum)}</span></div>` : ''}
      ${c.hasCharm ? `<div class="flex justify-between text-muted"><span>등기 배송비</span><span class="tabular-nums">${c.ship ? won(c.ship) : '무료'}</span></div>` : ''}
      ${c.hasCharm && c.ship ? `<p class="text-xs text-cinnabar-soft">부적을 ${won(50000 - c.charmSum)} 더 담으시면 배송비가 무료입니다</p>` : ''}
      <div class="flex justify-between items-end pt-3 mt-1 border-t border-edge/10"><span class="font-semibold">결제 예정 금액</span><span class="text-2xl font-bold tracking-tight tabular-nums">${won(c.total)}</span></div>
      <button id="ywGoCheckout" class="group ease-spring mt-4 w-full inline-flex items-center justify-between gap-4 rounded-full bg-cinnabar text-white pl-8 pr-2 py-2 min-h-[56px] text-base font-semibold hover:scale-[1.02] active:scale-[0.98]">
        ${m.name} 스님께 주문하기
        <span class="ease-spring w-10 h-10 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-1"><iconify-icon icon="solar:arrow-right-linear" width="20"></iconify-icon></span>
      </button>`;
  }
  function openCart() { renderCart(); openLayer($('#ywCart'), $('#ywCartPanel'), CART_HIDE); }

  // ---------- 주문서 ----------
  const CO_HIDE = ['translate-y-8', 'opacity-0'];
  const PAY = [
    { id: 'card', name: '신용 · 체크카드', icon: 'solar:card-linear' },
    { id: 'kakao', name: '카카오페이', icon: 'solar:wallet-linear' },
    { id: 'bank', name: '무통장 입금', icon: 'solar:bill-list-linear' },
  ];
  function openCheckout() {
    const c = calc();
    const m = monkById(cart.monkId);
    const firstRitual = cart.items.find(i => i.type === 'ritual');
    const field = (name, label, ph, extra = '') => `
      <label class="block ${extra}">
        <span class="text-xs text-muted">${label}</span>
        <input name="${name}" placeholder="${ph}" class="ease-spring mt-1.5 w-full h-12 rounded-xl bg-edge/[0.04] border border-edge/10 px-4 text-sm placeholder:text-faint focus:outline-none focus:border-cinnabar/60">
      </label>`;
    $('#ywCoBody').innerHTML = `
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-bold tracking-tight">주문서</h3>
        <button data-close aria-label="닫기" class="ease-spring w-10 h-10 rounded-full bg-edge/5 flex items-center justify-center hover:bg-edge/10"><iconify-icon icon="solar:close-circle-linear" width="22"></iconify-icon></button>
      </div>
      <div class="mt-5 flex items-center gap-3 rounded-2xl bg-edge/[0.03] border border-edge/10 px-4 py-3">
        ${monkAvatar(m, 'w-10 h-10 text-xs')}
        <p class="text-sm leading-snug"><b>${m.name} 스님</b> <span class="text-subtle">· ${m.temple}</span><br><span class="text-subtle text-xs">결제 금액은 봉행·발송이 끝난 뒤 스님께 정산됩니다</span></p>
      </div>
      <form id="ywCoForm" class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3" novalidate>
        ${field('name', '주문자 성함', '예) 하윤서')}
        ${field('phone', '연락처', '010-0000-0000')}
        ${c.hasCharm ? field('addr', '부적 받으실 주소', '도로명 주소와 상세 주소', 'sm:col-span-2') : ''}
        <fieldset class="sm:col-span-2 mt-3">
          <legend class="text-xs text-muted">결제 수단</legend>
          <div class="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            ${PAY.map((p, i) => `
              <label class="ease-spring cursor-pointer flex items-center gap-2 rounded-xl border border-edge/10 bg-edge/[0.03] px-4 h-12 text-sm has-[:checked]:border-cinnabar/70 has-[:checked]:bg-cinnabar/10">
                <input type="radio" name="pay" value="${p.id}" ${i === 0 ? 'checked' : ''} class="sr-only">
                <iconify-icon icon="${p.icon}" width="18" class="text-muted"></iconify-icon>${p.name}
              </label>`).join('')}
          </div>
        </fieldset>
        <label class="sm:col-span-2 mt-3 flex items-start gap-3 text-sm text-muted cursor-pointer">
          <input type="checkbox" name="agree" class="mt-1 w-4 h-4 accent-[#c8553d]">
          <span>주문 내용과 환불 규정을 확인했으며, 부적과 제례·기도가 특정 결과를 보장하지 않는다는 점에 동의합니다.</span>
        </label>
      </form>
      <div class="mt-6 rounded-2xl bg-edge/[0.03] border border-edge/10 p-5 text-sm space-y-2">
        ${cart.items.map(i => `<div class="flex justify-between gap-4"><span class="text-muted truncate">${esc(i.name)}${i.qty > 1 ? ' × ' + i.qty : ''}</span><span class="tabular-nums shrink-0">${won(i.unit * i.qty)}</span></div>`).join('')}
        ${c.hasCharm ? `<div class="flex justify-between gap-4"><span class="text-muted">배송비</span><span class="tabular-nums">${c.ship ? won(c.ship) : '무료'}</span></div>` : ''}
        <div class="flex justify-between items-end pt-3 border-t border-edge/10"><span class="font-semibold">총 결제 금액</span><span class="text-2xl font-bold tracking-tight tabular-nums">${won(c.total)}</span></div>
      </div>
      <p id="ywCoError" class="mt-3 text-sm text-cinnabar-soft hidden" role="alert"></p>
      <button id="ywCoSubmit" class="group ease-spring mt-5 w-full inline-flex items-center justify-between gap-4 rounded-full bg-cinnabar text-white pl-8 pr-2 py-2 min-h-[56px] text-base font-semibold hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(200,85,61,0.25)]">
        ${won(c.total)} 결제하기
        <span class="ease-spring w-10 h-10 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-1"><iconify-icon icon="solar:arrow-right-linear" width="20"></iconify-icon></span>
      </button>
      <p class="mt-3 text-center text-xs text-faint">시안용 화면입니다. 실제 결제는 이루어지지 않습니다.</p>`;
    if (firstRitual) { const f = $('#ywCoForm'); f.name.value = firstRitual.applicant || ''; f.phone.value = firstRitual.phone || ''; }
    openLayer($('#ywCheckout'), $('#ywCoPanel'), CO_HIDE);
  }
  function submitCheckout() {
    const f = $('#ywCoForm'), err = $('#ywCoError');
    const fail = (msg, el) => { err.textContent = msg; err.classList.remove('hidden'); if (el) el.focus(); };
    if (!f.name.value.trim()) return fail('주문자 성함을 입력해 주세요.', f.name);
    if (!phoneOk(f.phone.value.trim())) return fail('연락처를 010-0000-0000 형식으로 입력해 주세요.', f.phone);
    if (f.addr && !f.addr.value.trim()) return fail('부적을 받으실 주소를 입력해 주세요.', f.addr);
    if (!f.agree.checked) return fail('주문 내용 확인에 동의해 주세요.', f.agree);
    const c = calc();
    const m = monkById(cart.monkId);
    const now = new Date();
    const no = `YW-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = f.name.value.trim();
    const pay = PAY.find(p => p.id === f.pay.value).name;
    const hasRitual = cart.items.some(i => i.type === 'ritual');
    cart = { monkId: null, items: [] }; saveCart();
    $('#ywCoBody').innerHTML = `
      <div class="text-center py-6">
        <div class="mx-auto w-16 h-16 rounded-full bg-cinnabar/15 flex items-center justify-center"><iconify-icon icon="solar:check-circle-bold" width="34" class="text-cinnabar"></iconify-icon></div>
        <h3 class="mt-6 text-2xl font-bold tracking-tight">${esc(name)} 님, 주문이 접수되었습니다</h3>
        <p class="mt-3 text-sm text-muted leading-relaxed">${m.name} 스님께서 사연을 확인한 뒤 확인 전화를 드립니다.${hasRitual ? '<br>영상 참여 링크는 봉행 30분 전에 문자로 보내 드립니다.' : ''}</p>
        <dl class="mt-8 rounded-2xl bg-edge/[0.03] border border-edge/10 p-5 text-sm text-left space-y-2">
          <div class="flex justify-between"><dt class="text-subtle">주문 번호</dt><dd class="font-semibold tabular-nums">${no}</dd></div>
          <div class="flex justify-between"><dt class="text-subtle">담당 스님</dt><dd>${m.name} 스님 · ${m.temple}</dd></div>
          <div class="flex justify-between"><dt class="text-subtle">결제 수단</dt><dd>${pay}</dd></div>
          <div class="flex justify-between"><dt class="text-subtle">결제 금액</dt><dd class="font-semibold tabular-nums">${won(c.total)}</dd></div>
        </dl>
        <button data-close class="ease-spring mt-8 h-12 px-8 rounded-full bg-edge/5 border border-edge/10 text-sm font-semibold hover:bg-edge/10 active:scale-[0.98]">확인</button>
      </div>`;
  }

  // ---------- 헤더 · 메뉴 · 푸터 · 오버레이 ----------
  function closeMenu() { const mm = $('#ywMenu'); mm.classList.add('hidden'); mm.classList.remove('menu-open'); document.body.style.overflow = layerStack.length ? 'hidden' : ''; }

  // 헤더의 '의식 안내' 목록 (드롭다운 + 모바일 메뉴)
  function renderNavRituals() {
    const list = visibleRituals();
    const soon = '<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] bg-edge/5 border border-edge/10 text-subtle">준비 중</span>';
    if ($('#ywRitualList')) $('#ywRitualList').innerHTML = list.map(r => `
      <a href="${ritualUrl(r.key)}" class="ease-spring flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-edge/5 ${r.active ? '' : 'opacity-70'}">
        <span class="font-serif font-extrabold text-xl w-8 text-center ${r.active ? 'text-cinnabar' : 'text-faint'}">${r.mark}</span>
        <span class="flex-1 min-w-0"><b class="block text-sm text-fg">${r.name}</b><span class="block text-xs text-subtle truncate">${r.summary}</span></span>
        ${r.active ? '' : soon}
      </a>`).join('');
    if ($('#ywMenuRituals')) $('#ywMenuRituals').innerHTML = list.map(r => `
      <a href="${ritualUrl(r.key)}" class="flex items-center gap-3 py-2 text-lg font-semibold ${r.active ? 'text-fg' : 'text-subtle'}">
        <span class="font-serif font-extrabold w-7 text-cinnabar">${r.mark}</span>${r.name}${r.active ? '' : soon}
      </a>`).join('');
  }

  function mountShell({ active = '' } = {}) {
    const single = D.MONKS.length === 1;
    const monkHref = single ? monkUrl(D.MONKS[0].id) : 'index.html#monks';
    const navCls = on => `ease-spring px-3 py-2 rounded-full ${on ? 'text-fg bg-edge/5' : 'hover:text-fg hover:bg-edge/5'}`;
    // 메인 구성 dev 옵션: shop이면 상품 분류 중심 메뉴
    const shop = devOpt('mainLayout') === 'shop';
    const here = (() => {
      const q = new URLSearchParams(location.search), page = location.pathname.split('/').pop();
      if (page === 'shop.html') return q.get('cat') || 'charm';
      if (page === 'charm.html') return 'charm';
      if (page === 'rite.html' || page === 'ritual.html') return groupOf(q.get('id')) || 'charm';
      if (page === 'monk.html') return 'monk';
      if (page === 'help.html') return 'help';
      return '';
    })();
    const brandNav = `          <div class="hidden md:flex items-center gap-1 text-sm text-muted">
            <div class="relative" id="ywRitualWrap">
              <button id="ywRitualBtn" aria-expanded="false" aria-controls="ywRitualMenu" class="${navCls(active === 'ritual')} flex items-center gap-1">
                의식 안내 <iconify-icon icon="solar:alt-arrow-down-linear" width="14" class="ease-spring" id="ywRitualChev"></iconify-icon>
              </button>
              <div id="ywRitualMenu" class="hidden absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[22rem] rounded-[1.5rem] p-1.5 bg-surface/95 backdrop-blur-xl ring-1 ring-edge/10 shadow-[0_30px_60px_-20px_var(--drop)]">
                <div id="ywRitualList" class="flex flex-col"></div>
                <a href="index.html#services" class="ease-spring mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-xs text-subtle border-t border-edge/10 hover:text-fg">의식 한눈에 보기 <iconify-icon icon="solar:arrow-right-linear" width="14"></iconify-icon></a>
              </div>
            </div>
            <a href="${monkHref}" class="${navCls(active === 'monk')}">스님</a>
            <a href="index.html#how" class="${navCls(false)}">이용 방법</a>
            <a href="help.html" class="${navCls(active === 'help')}">고객센터</a>
          </div>
`;
    const shopNav = `
          <div class="hidden md:flex items-center gap-1 text-sm text-muted">
            ${D.SHOP_CATS.map(c => `<a href="${shopUrl(c.key)}" class="${navCls(here === c.key)}">${c.name}</a>`).join('')}
            <a href="${monkHref}" class="${navCls(here === 'monk')}">스님</a>
            <a href="help.html" class="${navCls(here === 'help')}">고객센터</a>
            <span class="w-px h-4 bg-edge/15 mx-1"></span>
            <a href="shop.html?cat=all&search=1" aria-label="상품 검색" class="${navCls(false)} flex items-center"><iconify-icon icon="solar:magnifer-linear" width="18"></iconify-icon></a>
            <button type="button" data-order-lookup aria-label="주문 조회" class="${navCls(false)} flex items-center gap-1.5"><iconify-icon icon="solar:bill-list-linear" width="18"></iconify-icon><span class="hidden lg:inline">주문 조회</span></button>
          </div>
`;
    const header = `
      <header class="fixed top-4 inset-x-0 z-40 px-4">
        <nav class="mx-auto w-full md:w-max flex items-center justify-between md:justify-start gap-2 md:gap-8 rounded-full pl-5 pr-2 py-2 backdrop-blur-xl bg-deep/60 border border-edge/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" aria-label="주 메뉴">
          <a href="index.html" class="flex items-center gap-2 shrink-0" aria-label="염원 홈">
            <span class="font-serif text-lg font-extrabold text-cinnabar">念願</span>
            <span class="text-sm font-semibold tracking-tight text-fg">염원</span>
          </a>
${shop ? shopNav : brandNav}          <div class="flex items-center gap-1">
            <button data-open-cart aria-label="장바구니 열기" class="ease-spring relative flex items-center gap-2 rounded-full bg-fg text-page pl-4 pr-3 h-11 text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar">
              <iconify-icon icon="solar:bag-4-linear" width="18"></iconify-icon>
              <span class="hidden sm:inline">장바구니</span>
              <span data-cart-count class="min-w-[1.4rem] h-[1.4rem] px-1 rounded-full bg-cinnabar text-white text-[11px] font-bold flex items-center justify-center">0</span>
            </button>
            <button id="ywMenuBtn" aria-label="메뉴 열기" class="md:hidden ease-spring w-11 h-11 rounded-full flex items-center justify-center text-fg hover:bg-edge/5">
              <iconify-icon icon="solar:hamburger-menu-linear" width="22"></iconify-icon>
            </button>
          </div>
        </nav>
      </header>
      <div id="ywMenu" class="fixed inset-0 z-50 hidden backdrop-blur-3xl bg-page/90">
        <div class="flex flex-col h-full px-6 pt-6 pb-10 overflow-y-auto">
          <div class="flex items-center justify-between">
            <span class="font-serif text-xl font-extrabold text-cinnabar">念願</span>
            <button id="ywMenuClose" aria-label="메뉴 닫기" class="w-11 h-11 rounded-full flex items-center justify-center bg-edge/5 text-fg"><iconify-icon icon="solar:close-circle-linear" width="24"></iconify-icon></button>
          </div>
          ${shop ? `
          <a href="shop.html?cat=all&search=1" class="mt-10 flex items-center gap-3 h-12 px-4 rounded-full bg-edge/5 border border-edge/10 text-subtle menu-link" style="--index:0"><iconify-icon icon="solar:magnifer-linear" width="18"></iconify-icon>부적, 의식 이름으로 찾기</a>
          <div class="mt-10 flex flex-col gap-5 text-3xl font-bold tracking-tight">
            ${D.SHOP_CATS.map((c, i) => `<a href="${shopUrl(c.key)}" class="menu-link flex items-center gap-3" style="--index:${i + 1}"><span class="font-serif text-cinnabar text-2xl w-8">${c.hanja}</span>${c.name}</a>`).join('')}
            <a href="${monkHref}" class="menu-link" style="--index:4">스님</a>
            <a href="help.html" class="menu-link" style="--index:5">고객센터</a>
            <button type="button" data-order-lookup class="menu-link text-left" style="--index:6">주문 조회</button>
          </div>` : `
          <p class="mt-12 text-xs tracking-[0.15em] text-subtle menu-link" style="--index:0">의식 안내</p>
          <div id="ywMenuRituals" class="mt-3 flex flex-col menu-link" style="--index:1"></div>
          <div class="mt-10 flex flex-col gap-5 text-3xl font-bold tracking-tight">
            <a href="${monkHref}" class="menu-link" style="--index:2">스님</a>
            <a href="index.html#how" class="menu-link" style="--index:3">이용 방법</a>
            <a href="help.html" class="menu-link" style="--index:4">고객센터</a>
          </div>`}
          <p class="mt-auto pt-10 text-sm text-subtle menu-link" style="--index:5">고객센터 1644-3071 · 매일 09:00 – 21:00</p>
        </div>
      </div>`;

    const footer = `
      <footer class="border-t border-edge/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div class="md:col-span-5">
            <p class="flex items-center gap-2"><span class="font-serif text-2xl font-extrabold text-cinnabar">念願</span><span class="font-semibold">염원</span></p>
            <p class="mt-4 text-sm text-subtle leading-relaxed max-w-[44ch]">사찰과 승적을 확인한 스님이 부적을 쓰고 제례와 기도를 모시는 곳입니다. 스님 페이지에서 바로 주문하고 예약하세요.</p>
          </div>
          <div class="md:col-span-3 text-sm">
            <p class="font-semibold text-fg2">바로가기</p>
            <ul class="mt-4 space-y-2 text-subtle">
              <li><a href="index.html#services" class="ease-spring hover:text-fg">의식 안내</a></li>
              <li><a href="index.html#monks" class="ease-spring hover:text-fg">모시는 스님</a></li>
              <li><a href="index.html#how" class="ease-spring hover:text-fg">이용 방법</a></li>
              <li><a href="help.html" class="ease-spring hover:text-fg">고객센터 · 자주 묻는 질문</a></li>
              <li><a href="help.html#refund" class="ease-spring hover:text-fg">환불 규정</a></li>
              <li><a href="index.html#join" class="ease-spring hover:text-fg">스님 입점 문의</a></li>
            </ul>
          </div>
          <div class="md:col-span-4 text-sm text-subtle space-y-2">
            <p class="font-semibold text-fg2">고객센터</p>
            <p class="pt-2 flex items-center gap-2"><iconify-icon icon="solar:phone-linear" width="16"></iconify-icon>1644-3071 · 매일 09:00 – 21:00</p>
            <p class="flex items-center gap-2"><iconify-icon icon="solar:letter-linear" width="16"></iconify-icon>help@yeomwon.example</p>
          </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 md:pb-12 text-xs text-faint leading-relaxed space-y-2">
          <p>염원은 통신판매중개자이며, 부적 제작과 제례·기도 봉행의 당사자는 각 스님입니다. 부적과 제례·기도는 신앙과 전통에 바탕을 둔 서비스로, 특정한 결과를 보장하지 않습니다.</p>
          <p>이 사이트는 디자인 시안입니다. 스님, 사찰, 연락처, 후기, 결제 기능은 모두 예시입니다.</p>
          <p>© 2026 염원. All rights reserved.</p>
        </div>
      </footer>`;

    const overlays = `
      <div id="ywCart" class="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true" aria-label="장바구니">
        <div class="absolute inset-0 bg-scrim/50 backdrop-blur-md" data-close></div>
        <aside id="ywCartPanel" class="ease-spring absolute right-0 top-0 h-full w-full max-w-md bg-surface border-l border-edge/10 flex flex-col translate-x-full">
          <div class="flex items-center justify-between px-6 h-20 border-b border-edge/10 shrink-0">
            <p class="text-lg font-bold">장바구니 <span id="ywCartHeadCount" class="text-subtle font-medium text-sm"></span></p>
            <button data-close aria-label="닫기" class="ease-spring w-10 h-10 rounded-full bg-edge/5 flex items-center justify-center hover:bg-edge/10"><iconify-icon icon="solar:close-circle-linear" width="22"></iconify-icon></button>
          </div>
          <div id="ywCartMonk" class="px-6 pt-4 shrink-0"></div>
          <div id="ywCartItems" class="flex-1 overflow-y-auto px-6 py-2"></div>
          <div id="ywCartFoot" class="border-t border-edge/10 px-6 py-6 space-y-2 text-sm shrink-0 empty:hidden"></div>
        </aside>
      </div>

      <div id="ywCheckout" class="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true" aria-label="주문서">
        <div class="absolute inset-0 bg-scrim/50 backdrop-blur-md" data-close></div>
        <div class="relative h-full overflow-y-auto flex items-end md:items-center justify-center md:p-6">
          <div id="ywCoPanel" class="ease-spring relative w-full max-w-xl rounded-t-[2rem] md:rounded-[2rem] p-1.5 bg-edge/5 ring-1 ring-edge/10 translate-y-8 opacity-0">
            <div id="ywCoBody" class="rounded-t-[calc(2rem-0.375rem)] md:rounded-[calc(2rem-0.375rem)] bg-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] p-6 md:p-10"></div>
          </div>
        </div>
      </div>

      <div id="ywDialog" class="fixed inset-0 z-50 hidden" role="alertdialog" aria-modal="true" aria-labelledby="ywDlgTitle">
        <div class="absolute inset-0 bg-scrim/50 backdrop-blur-md" data-dlg="0"></div>
        <div class="relative h-full flex items-center justify-center p-4">
          <div id="ywDlgPanel" class="ease-spring w-full max-w-md rounded-[2rem] p-1.5 bg-edge/5 ring-1 ring-edge/10 scale-95 opacity-0">
            <div class="rounded-[calc(2rem-0.375rem)] bg-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] p-7">
              <iconify-icon icon="solar:bag-4-linear" width="28" class="text-cinnabar"></iconify-icon>
              <h3 id="ywDlgTitle" class="mt-4 text-xl font-bold tracking-tight"></h3>
              <p id="ywDlgBody" class="mt-3 text-sm text-muted leading-relaxed"></p>
              <div class="mt-7 grid grid-cols-2 gap-2">
                <button id="ywDlgCancel" data-dlg="0" class="ease-spring h-12 rounded-full bg-edge/5 border border-edge/10 text-sm font-semibold hover:bg-edge/10 active:scale-[0.98]"></button>
                <button id="ywDlgOk" data-dlg="1" class="ease-spring h-12 rounded-full bg-cinnabar text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.98]"></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="ywToast" class="fixed z-50 left-1/2 bottom-24 md:bottom-8 -translate-x-1/2 translate-y-6 opacity-0 pointer-events-none ease-spring">
        <div class="flex items-center gap-3 rounded-full bg-fg text-page pl-4 pr-5 py-3 text-sm font-semibold shadow-[0_20px_50px_-15px_var(--drop)] whitespace-nowrap">
          <iconify-icon icon="solar:check-circle-bold" width="20" class="text-cinnabar"></iconify-icon>
          <span id="ywToastText"></span>
        </div>
      </div>`;

    $('[data-shell=header]').outerHTML = header;
    $('[data-shell=footer]').outerHTML = footer;
    document.body.insertAdjacentHTML('beforeend', overlays);

    // 이벤트
    document.addEventListener('click', e => { if (e.target.closest('[data-open-cart]')) openCart(); });
    $('#ywMenuBtn').addEventListener('click', () => { const mm = $('#ywMenu'); mm.classList.remove('hidden'); mm.classList.add('menu-open'); document.body.style.overflow = 'hidden'; });
    $('#ywMenuClose').addEventListener('click', closeMenu);
    $('#ywMenu').addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });

    // 의식 안내 드롭다운
    const setRitualMenu = open => {
      $('#ywRitualMenu').classList.toggle('hidden', !open);
      $('#ywRitualBtn').setAttribute('aria-expanded', open);
      $('#ywRitualChev').classList.toggle('rotate-180', open);
    };
    if ($('#ywRitualBtn')) {
      $('#ywRitualBtn').addEventListener('click', e => { e.stopPropagation(); setRitualMenu($('#ywRitualMenu').classList.contains('hidden')); });
      document.addEventListener('click', e => { if (!e.target.closest('#ywRitualWrap')) setRitualMenu(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setRitualMenu(false); });
    }

    // 목록에서 바로 담기 (기본 옵션: 한지 인쇄본, 1개)
    document.addEventListener('click', async e => {
      const q = e.target.closest('[data-quick-add]');
      if (q) {
        const [mid, cid] = q.dataset.quickAdd.split('|');
        const m = monkById(mid);
        if (await addToCart(mid, charmCartItem(m, cid, {}))) toast(`${D.CHARM_TYPES[cid].name}(한지 인쇄본)을 담았습니다`);
      }
      if (e.target.closest('[data-order-lookup]')) toast('시안에서는 주문 조회가 열리지 않습니다');
    });
    renderNavRituals();

    $('#ywCart').addEventListener('click', e => {
      if (e.target.closest('[data-close]')) return closeLayer($('#ywCart'));
      const rm = e.target.closest('[data-remove]'), inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
      if (rm) cart.items.splice(+rm.dataset.remove, 1);
      else if (inc) cart.items[+inc.dataset.inc].qty = Math.min(9, cart.items[+inc.dataset.inc].qty + 1);
      else if (dec) { const it = cart.items[+dec.dataset.dec]; it.qty > 1 ? it.qty-- : cart.items.splice(+dec.dataset.dec, 1); }
      else if (e.target.closest('#ywGoCheckout')) { closeLayer($('#ywCart')); setTimeout(openCheckout, 200); return; }
      else return;
      saveCart(); renderCart();
    });
    $('#ywCheckout').addEventListener('click', e => {
      if (e.target.closest('[data-close]')) return closeLayer($('#ywCheckout'));
      if (e.target.closest('#ywCoSubmit')) submitCheckout();
    });
    $('#ywDialog').addEventListener('click', e => { const b = e.target.closest('[data-dlg]'); if (b) resolveDialog(b.dataset.dlg === '1'); });

    // 다른 탭에서 장바구니가 바뀌면 반영
    window.addEventListener('storage', e => { if (e.key === 'yw-cart') { cart = store.get('yw-cart', { monkId: null, items: [] }); renderCartCount(); } });

    renderCartCount();
    devPanel();
  }

  // ---------- 개발용 테마 패널 (?dev=1 로 켜고 ?dev=0 으로 끔) ----------
  const THEMES = [
    { id: 'hanji', name: '한지 미색', sw: ['#f1ebe0', '#faf6ef', '#2a2420', '#b4472f'] },
    { id: 'dawn', name: '새벽 안개', sw: ['#e8e2dc', '#f5f1ec', '#2b2528', '#b0503a'] },
    { id: 'dark', name: '먹색 (이전)', sw: ['#0c0a09', '#1c1917', '#f5f5f4', '#c8553d'] },
  ];
  function setTheme(id) {
    document.documentElement.dataset.theme = id;
    try { localStorage.setItem('yw-theme', id); } catch (e) { } // theme.js가 그대로 읽도록 JSON이 아닌 문자열로 저장
    $$('#ywDev [data-theme-id]').forEach(b => b.setAttribute('aria-pressed', b.dataset.themeId === id));
  }
  const DEV_OPTIONS = [
    { key: 'mainLayout', label: '메인 구성 (헤더 포함)', choices: [['shop', '쇼핑몰형'], ['brand', '브랜드형']] },
    { key: 'cardLink', label: '메인 의식 카드 클릭', choices: [['detail', '상세 페이지만'], ['both', '상세 + 바로 예약']] },
    { key: 'emptyRitual', label: '모시는 스님이 없는 의식', choices: [['hide', '숨김'], ['soon', '준비 중 표시']] },
    { key: 'cardPrice', label: '의식 카드 가격', choices: [['hide', '숨김'], ['show', '표시']] },
    { key: 'charmClick', label: '스님 페이지에서 부적 클릭', choices: [['page', '상세 페이지'], ['modal', '팝업']] },
    { key: 'riteClick', label: '스님 페이지에서 의식 클릭', choices: [['page', '상세 페이지'], ['inline', '페이지 안 예약']] },
  ];
  function setDevOpt(key, val) {
    const o = store.get('yw-dev-opts', {}); o[key] = val; store.set('yw-dev-opts', o);
    $$(`#ywDev [data-opt="${key}"]`).forEach(b => b.setAttribute('aria-pressed', b.dataset.val === val));
    renderNavRituals();
    // 페이지가 직접 다시 그리지 못하면 새로고침
    if (devHandlers.length) devHandlers.forEach(fn => fn(key, val)); else location.reload();
  }
  function devPanel() {
    const dev = new URLSearchParams(location.search).get('dev');
    try {
      if (dev === '1') localStorage.setItem('yw-dev', '1');
      if (dev === '0') localStorage.removeItem('yw-dev');
      if (localStorage.getItem('yw-dev') !== '1') return;
    } catch (e) { if (dev !== '1') return; }
    const current = document.documentElement.dataset.theme;
    const btn = 'ease-spring rounded-xl text-left hover:bg-[#ffffff0f] aria-pressed:bg-[#ffffff1a] aria-pressed:ring-1 aria-pressed:ring-[#c8553d]';
    const collapsed = store.get('yw-dev-collapsed', false);
    // 패널은 어떤 테마에서도 읽히도록 색을 고정
    document.body.insertAdjacentHTML('beforeend', `
      <div id="ywDev" class="fixed left-4 bottom-24 md:bottom-4 z-[70] w-64 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl p-3 text-[13px] text-[#f5f5f4] bg-[#1c1917]/95 backdrop-blur-xl border border-[#ffffff1a] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
        <div class="flex items-center justify-between px-1">
          <p class="font-semibold tracking-tight">DEV 패널</p>
          <div class="flex">
            <button id="ywDevFold" aria-label="접기/펼치기" class="w-7 h-7 rounded-full flex items-center justify-center text-[#a8a29e] hover:text-white hover:bg-[#ffffff14]"><iconify-icon icon="solar:alt-arrow-down-linear" width="16" class="ease-spring ${collapsed ? 'rotate-180' : ''}"></iconify-icon></button>
            <button id="ywDevClose" aria-label="패널 끄기" title="패널 끄기 (?dev=1로 다시 켜기)" class="w-7 h-7 rounded-full flex items-center justify-center text-[#a8a29e] hover:text-white hover:bg-[#ffffff14]"><iconify-icon icon="solar:close-circle-linear" width="18"></iconify-icon></button>
          </div>
        </div>
        <div id="ywDevBody" class="${collapsed ? 'hidden' : ''}">
          <p class="mt-3 px-1 text-[11px] text-[#a8a29e]">배경색</p>
          <div class="mt-1 flex flex-col gap-1">
            ${THEMES.map(t => `
              <button data-theme-id="${t.id}" aria-pressed="${t.id === current}" class="${btn} flex items-center gap-3 px-2.5 py-2">
                <span class="flex -space-x-1.5">${t.sw.map(c => `<span class="w-5 h-5 rounded-full ring-2 ring-[#1c1917]" style="background:${c}"></span>`).join('')}</span>
                <span class="flex-1">${t.name}</span>
              </button>`).join('')}
          </div>
          ${DEV_OPTIONS.map(o => `
            <p class="mt-3 px-1 text-[11px] text-[#a8a29e]">${o.label}</p>
            <div class="mt-1 grid grid-cols-2 gap-1">
              ${o.choices.map(([val, name]) => `<button data-opt="${o.key}" data-val="${val}" aria-pressed="${devOpt(o.key) === val}" class="${btn} px-2.5 py-2 text-center text-[12px]">${name}</button>`).join('')}
            </div>`).join('')}
          <p class="mt-3 px-1 text-[11px] text-[#78716c] leading-relaxed">고른 값은 이 브라우저에 저장되어 다른 페이지에서도 유지됩니다.</p>
        </div>
      </div>`);
    $('#ywDev').addEventListener('click', e => {
      const t = e.target.closest('[data-theme-id]'); if (t) return setTheme(t.dataset.themeId);
      const o = e.target.closest('[data-opt]'); if (o) return setDevOpt(o.dataset.opt, o.dataset.val);
    });
    $('#ywDevFold').addEventListener('click', () => {
      const body = $('#ywDevBody'); const hide = !body.classList.contains('hidden');
      body.classList.toggle('hidden', hide); $('#ywDevFold iconify-icon').classList.toggle('rotate-180', hide);
      store.set('yw-dev-collapsed', hide);
    });
    $('#ywDevClose').addEventListener('click', () => { try { localStorage.removeItem('yw-dev'); } catch (e) { } $('#ywDev').remove(); });
  }

  // ---------- 스크롤 등장 · 카운터 ----------
  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const observeReveals = () => $$('.reveal:not(.in)').forEach(el => revealIO.observe(el));

  const counterIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, to = parseFloat(el.dataset.to), dec = +(el.dataset.decimals || 0);
    const t0 = performance.now(), dur = 1600;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
      el.textContent = (to * k).toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step); counterIO.unobserve(el);
  }), { threshold: 0.6 });
  const observeCounters = () => $$('.counter').forEach(el => counterIO.observe(el));

  // 히어로가 화면에서 사라지면 모바일 하단 바 표시
  function stickyBar(barSel, heroSel) {
    const bar = $(barSel), hero = $(heroSel);
    if (!bar || !hero) return;
    new IntersectionObserver(([en]) => {
      bar.classList.toggle('translate-y-full', en.isIntersecting);
      bar.classList.toggle('opacity-0', en.isIntersecting);
    }, { threshold: 0.1 }).observe(hero);
  }

  function renderFaq(el, faqs) {
    el.innerHTML = faqs.map((f, i) => `
      <div class="faq reveal" style="--index:${i}">
        <button class="faq-btn w-full flex items-center justify-between gap-6 py-6 text-left" aria-expanded="false">
          <span class="text-base md:text-lg font-semibold">${f.q}</span>
          <span class="faq-icon ease-spring w-10 h-10 shrink-0 rounded-full bg-edge/5 flex items-center justify-center"><iconify-icon icon="solar:alt-arrow-down-linear" width="18"></iconify-icon></span>
        </button>
        <div class="faq-body"><div class="overflow-hidden"><p class="pb-6 pr-14 text-muted leading-relaxed">${f.a}</p></div></div>
      </div>`).join('');
    if (el.dataset.faqBound) return; // 다시 그려도 클릭 이벤트는 한 번만
    el.dataset.faqBound = '1';
    el.addEventListener('click', e => {
      const b = e.target.closest('.faq-btn'); if (!b) return;
      b.setAttribute('aria-expanded', b.parentElement.classList.toggle('faq-open'));
    });
  }

  function stars(n, size = 14) {
    const full = Math.round(n);
    return ('<iconify-icon icon="solar:star-bold" width="' + size + '"></iconify-icon>').repeat(full)
      + ('<iconify-icon icon="solar:star-bold" width="' + size + '" class="text-faint"></iconify-icon>').repeat(5 - full);
  }

  return {
    D, $, $$, won, manwon, esc, hash, rng, monkById, monkUrl, phoneOk,
    ritualUrl, ritualInfo, visibleRituals, offeredBy, bookUrl, priceAt, devOpt, onDevChange,
    charmUrl, charmSeed, charmUnit, charmCartItem, charmReviews, calc, riteUrl, serviceReviews,
    dateStatus, earliestDate, shortDate, shopUrl, charmCard, riteCard, shopProducts,
    charmSVG, monkAvatar, landscapeSVG, stars,
    openLayer, closeLayer, toast, confirmDialog,
    addToCart, openCart, openCheckout, mountShell, observeReveals, observeCounters, stickyBar, renderFaq,
  };
})();
