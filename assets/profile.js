// 염원 念願 — 스님 소개(프로필) 섹션
// 별도 페이지(monk-profile.html)와 스님 페이지의 옆 패널이 같은 내용을 그리도록 섹션별 HTML을 만든다.
// compact: 패널처럼 좁은 곳에 넣을 때 (사진 · 글씨를 작게, 한 줄로)

(() => {
  const { D, won, monkUrl, photo, esc } = YW;
  const profileUrl = id => `monk-profile.html?id=${encodeURIComponent(id)}`;

  const eyebrow = t => `<span class="inline-block rounded-full px-3 py-1 text-[11px] tracking-[0.15em] font-medium bg-cinnabar/10 text-cinnabar-soft">${t}</span>`;

  // 걸어온 길: 넓은 곳은 가로, 좁은 곳은 세로 타임라인
  function history(m, { compact = false } = {}) {
    if (!m.history || !m.history.length) return '';
    if (compact) return `
      <ol class="relative border-l border-edge/15 ml-2 space-y-5">
        ${m.history.map(h => `<li class="pl-5 relative"><span class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-cinnabar"></span><b class="font-serif text-cinnabar">${h.year}</b><p class="mt-0.5 text-sm text-fg2">${h.text}</p></li>`).join('')}
      </ol>`;
    return `
      <ol class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4">
        ${m.history.map((h, i) => `
          <li class="reveal relative" style="--index:${i}">
            <span class="block font-serif font-extrabold text-3xl md:text-4xl ${i === m.history.length - 1 ? 'text-cinnabar' : 'text-edge/25'}">${h.year}</span>
            <span class="mt-3 block h-px bg-gradient-to-r from-cinnabar/60 to-transparent"></span>
            <p class="mt-3 text-sm text-fg2 leading-relaxed">${h.text}</p>
          </li>`).join('')}
      </ol>`;
  }

  // 스님의 말 (묻고 답하기)
  function interview(m, { compact = false } = {}) {
    if (!m.interview || !m.interview.length) return '';
    return `<div class="${compact ? 'space-y-6' : 'space-y-10'}">${m.interview.map((x, i) => `
      <div class="reveal" style="--index:${i}">
        <p class="text-sm font-semibold text-cinnabar-soft">Q. ${x.q}</p>
        <p class="mt-2 font-serif font-extrabold ${compact ? 'text-base' : 'text-xl md:text-2xl'} leading-relaxed text-fg">“${x.a}”</p>
      </div>`).join('')}</div>`;
  }

  // 이렇게 모십니다 (의식별 진행 방식)
  function ways(m, { compact = false } = {}) {
    const list = m.services.filter(s => s.way && s.way.length);
    if (!list.length) return '';
    return `<div class="grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-4">${list.map((s, i) => {
      const t = D.SERVICE_TYPES[s.id];
      return `
      <a href="${YW.riteUrl(m.id, s.id)}" class="reveal group flex gap-4 rounded-[1.5rem] bg-surface ring-1 ring-edge/10 p-4 ${compact ? '' : 'md:p-5'} ease-spring hover:ring-cinnabar/50" style="--index:${i % 2}">
        <span class="relative ${compact ? 'w-16 h-16' : 'w-20 h-20'} shrink-0 rounded-2xl overflow-hidden">${photo(YW.ritualImg(s.id), t.name, 'absolute inset-0 w-full h-full object-cover ease-spring group-hover:scale-110')}</span>
        <span class="flex-1 min-w-0">
          <b class="flex items-center justify-between gap-2">${t.name}<iconify-icon icon="solar:arrow-right-linear" width="16" class="text-subtle ease-spring group-hover:translate-x-1 group-hover:text-cinnabar"></iconify-icon></b>
          <ul class="mt-1.5 space-y-1 text-sm text-muted">${s.way.map(w => `<li class="flex gap-1.5"><span class="text-cinnabar">·</span>${w}</li>`).join('')}</ul>
        </span>
      </a>`;
    }).join('')}</div>`;
  }

  // 사찰 풍경 갤러리
  function gallery(m, { compact = false } = {}) {
    if (!m.gallery || !m.gallery.length) return '';
    if (compact) return `<div class="grid grid-cols-3 gap-2">${m.gallery.map(g => `<figure class="relative aspect-square rounded-xl overflow-hidden">${photo(g.src, g.cap, 'absolute inset-0 w-full h-full object-cover')}</figure>`).join('')}</div>`;
    const spans = ['col-span-2 row-span-2 md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-4', 'md:col-span-4', 'col-span-2 md:col-span-4'];
    return `<div class="grid grid-cols-2 md:grid-cols-12 auto-rows-[10rem] md:auto-rows-[13rem] gap-3 md:gap-4">${m.gallery.map((g, i) => `
      <figure class="reveal group relative overflow-hidden rounded-[1.5rem] ring-1 ring-edge/10 ${spans[i] || 'md:col-span-4'}" style="--index:${i % 3}">
        ${photo(g.src, g.cap, 'absolute inset-0 w-full h-full object-cover ease-spring group-hover:scale-105')}
        <span class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 ease-spring"></span>
        <figcaption class="absolute left-4 bottom-3 text-sm text-white font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 ease-spring">${g.cap}</figcaption>
      </figure>`).join('')}</div>`;
  }

  // 사찰 안내 (주소 · 오시는 길 · 시간)
  function templeInfo(m) {
    const row = (icon, k, v) => v ? `<div class="flex gap-4"><iconify-icon icon="${icon}" width="20" class="text-cinnabar shrink-0 mt-0.5"></iconify-icon><div><dt class="text-xs text-subtle">${k}</dt><dd class="mt-1 text-sm text-fg2 leading-relaxed">${v}</dd></div></div>` : '';
    return `<dl class="space-y-5">${row('solar:map-point-linear', '주소', m.address)}${row('solar:delivery-linear', '오시는 길', m.directions)}${row('solar:clock-circle-linear', '참배 · 상담 시간', m.hours)}</dl>`;
  }

  // 한 줄 소개 (소속 · 직함 · 출가)
  const metaLine = m => [m.sect, m.role || m.temple, `출가 ${m.years}년`].filter(Boolean).join(' · ');

  YW.profile = { profileUrl, eyebrow, history, interview, ways, gallery, templeInfo, metaLine };
})();
