// 오늘의 부적 — 제례 · 기도 예약 위젯 (스님 페이지와 의식 예약 페이지가 같이 씀)
// 사용: const w = YW.mountBooking(rootEl, { monk, serviceId, showDetail: true });  w.setService('sasipgu')
// 한 페이지에 하나만 올리는 것을 전제로 요소 ID(#calGrid 등)를 씁니다.

(() => {
  const { D, $, $$, won, hash } = YW;
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const dKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmt = d => `${d.getMonth() + 1}월 ${d.getDate()}일(${DOW[d.getDay()]})`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const field = 'ease-spring mt-1.5 w-full rounded-xl bg-edge/[0.04] border border-edge/10 px-4 text-sm placeholder:text-faint focus:outline-none focus:border-cinnabar/60 focus:bg-edge/[0.06]';
  const input = field + ' h-12';

  const markup = () => `
    <div id="serviceDetail"></div>
    <div class="mt-8">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-fg2 flex items-center gap-2"><iconify-icon icon="solar:calendar-linear" width="18" class="text-cinnabar"></iconify-icon><span id="dateLabel">날짜</span> 선택</p>
        <div class="flex items-center gap-1">
          <button type="button" id="calPrev" aria-label="이전 달" class="ease-spring w-10 h-10 rounded-full flex items-center justify-center hover:bg-edge/5 disabled:opacity-30 disabled:pointer-events-none"><iconify-icon icon="solar:alt-arrow-left-linear" width="18"></iconify-icon></button>
          <span id="calLabel" class="text-sm font-semibold tabular-nums w-24 text-center"></span>
          <button type="button" id="calNext" aria-label="다음 달" class="ease-spring w-10 h-10 rounded-full flex items-center justify-center hover:bg-edge/5 disabled:opacity-30 disabled:pointer-events-none"><iconify-icon icon="solar:alt-arrow-right-linear" width="18"></iconify-icon></button>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-7 text-center text-[11px] text-subtle font-medium">
        <span class="text-cinnabar-soft">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
      </div>
      <div id="calGrid" class="mt-2 grid grid-cols-7 gap-1"></div>
      <div class="mt-3 flex flex-wrap gap-4 text-[11px] text-subtle">
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-fg2"></span>예약 가능</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-cinnabar"></span>선택됨</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-faint"></span>마감 · 준비 기간</span>
      </div>
      <div id="scheduleNote" class="mt-4"></div>
    </div>
    <div id="slotWrap" class="mt-8">
      <p class="text-sm font-semibold text-fg2 flex items-center gap-2"><iconify-icon icon="solar:clock-circle-linear" width="18" class="text-cinnabar"></iconify-icon> 시간 선택</p>
      <div id="slotGrid" class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2"></div>
    </div>
    <div class="mt-8">
      <p class="text-sm font-semibold text-fg2 flex items-center gap-2"><iconify-icon icon="solar:videocamera-record-linear" width="18" class="text-cinnabar"></iconify-icon> 참여 방식</p>
      <div id="modeGrid" class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2"></div>
    </div>
    <div id="tierWrap" class="mt-8">
      <p class="text-sm font-semibold text-fg2 flex items-center gap-2"><iconify-icon icon="solar:hand-heart-linear" width="18" class="text-cinnabar"></iconify-icon> <span id="tierLabel"></span></p>
      <div id="tierGrid" class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2"></div>
    </div>
    <form id="ritualForm" class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3" novalidate>
      <label class="block"><span class="text-xs text-muted">신청자 성함</span><input name="applicant" autocomplete="name" class="${input}" placeholder="예) 오예린"></label>
      <label class="block"><span class="text-xs text-muted">연락처</span><input name="phone" inputmode="tel" autocomplete="tel" class="${input}" placeholder="010-0000-0000"></label>
      <label class="block deceased-field"><span class="text-xs text-muted">영가 (고인) 성함</span><input name="deceased" class="${input}" placeholder="위패에 올릴 함자"></label>
      <label class="block deceased-field"><span class="text-xs text-muted">고인과의 관계</span>
        <select name="relation" class="${input}">
          <option>부친</option><option>모친</option><option>조부</option><option>조모</option><option>배우자</option><option>자녀</option><option>기타</option>
        </select>
      </label>
      <label class="block sm:col-span-2"><span class="text-xs text-muted" id="memoLabel"></span>
        <textarea name="memo" rows="2" class="${field} py-3 resize-none"></textarea>
      </label>
    </form>
    <div class="mt-8 rounded-2xl bg-edge/[0.03] border border-edge/10 p-5 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
      <div class="text-sm leading-relaxed">
        <p id="ritualSummary" class="text-muted"></p>
        <p class="mt-1 text-2xl font-bold tracking-tight tabular-nums" id="ritualTotal">0원</p>
      </div>
      <button type="button" id="ritualSubmit" class="group ease-spring inline-flex items-center justify-between gap-4 rounded-full bg-cinnabar text-white pl-7 pr-2 py-2 min-h-[56px] text-base font-semibold hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(200,85,61,0.25)] disabled:opacity-40 disabled:pointer-events-none">
        예약 담기
        <span class="ease-spring w-10 h-10 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-1"><iconify-icon icon="solar:arrow-right-linear" width="20"></iconify-icon></span>
      </button>
    </div>
    <p id="ritualError" class="mt-3 text-sm text-cinnabar-soft hidden" role="alert"></p>`;

  // showDetail: 위젯 맨 위에 의식 설명을 보여줄지 (의식 예약 페이지는 페이지 자체가 설명이라 짧게)
  function mountBooking(root, { monk: m, serviceId, showDetail = true }) {
    root.innerHTML = markup();
    const services = m.services.map(s => ({ ...D.SERVICE_TYPES[s.id], id: s.id, price: s.price }));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const first = services.find(s => s.id === serviceId) || services[0];
    const rv = { svc: first, date: null, slot: null, mode: first.modes[0], tier: null, calY: today.getFullYear(), calM: today.getMonth() };
    const resetTier = () => { rv.tier = rv.svc.tiers ? rv.svc.tiers[0].id : null; };
    resetTier();

    const dateStatus = d => YW.dateStatus(m.id, rv.svc.id, d);
    const slotFull = (d, s) => hash(dKey(d), s, m.id, rv.svc.id) % 4 === 0;

    function renderDetail() {
      const s = rv.svc;
      $('#serviceDetail').innerHTML = showDetail ? `
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs text-cinnabar-soft font-medium">${s.dur}</p>
            <h3 class="mt-1 text-2xl md:text-3xl font-bold tracking-tight">${s.name}</h3>
          </div>
          <span class="font-serif font-extrabold text-4xl text-edge/10">${s.hanja}</span>
        </div>
        <p class="mt-3 text-sm text-muted leading-relaxed">${s.desc}</p>
        <a href="${YW.riteUrl(m.id, s.id)}" class="ease-spring mt-2 inline-flex items-center gap-1 text-sm text-cinnabar-soft hover:gap-2">절차 · 준비물 · 후기 자세히 보기 <iconify-icon icon="solar:arrow-right-linear" width="14"></iconify-icon></a>
        ${s.note ? `<p class="mt-3 text-sm text-fg2 flex gap-2"><iconify-icon icon="solar:clock-circle-linear" width="18" class="text-cinnabar shrink-0 mt-0.5"></iconify-icon>${s.note}</p>` : ''}
        <ul class="mt-4 flex flex-wrap gap-2">${s.includes.map(t => `<li class="flex items-center gap-1.5 rounded-full bg-edge/[0.04] border border-edge/10 px-3 py-1.5 text-xs text-fg2"><iconify-icon icon="solar:check-circle-bold" width="14" class="text-cinnabar"></iconify-icon>${t}</li>`).join('')}</ul>`
        : `<div class="flex items-center justify-between gap-4">
            <p class="text-lg font-bold tracking-tight">${s.name} 예약</p>
            <p class="text-sm text-subtle">${m.name} 스님 · ${m.temple}</p>
          </div>
          ${s.note ? `<p class="mt-3 text-sm text-fg2 flex gap-2"><iconify-icon icon="solar:clock-circle-linear" width="18" class="text-cinnabar shrink-0 mt-0.5"></iconify-icon>${s.note}</p>` : ''}`;
      $('#dateLabel').textContent = s.dateLabel;
      $$('.deceased-field', root).forEach(el => el.classList.toggle('hidden', !s.deceased));
      $('#slotWrap').classList.toggle('hidden', !s.slots);
      $('#tierWrap').classList.toggle('hidden', !s.tiers);
      if (s.tiers) $('#tierLabel').textContent = s.tierLabel;
      const f = $('#ritualForm');
      $('#memoLabel').innerHTML = s.deceased ? '요청 사항 <span class="text-faint">(선택)</span>' : '발원 내용 <span class="text-faint">(선택)</span>';
      f.memo.placeholder = s.deceased ? '생전에 즐기시던 음식, 고향 상차림 방식 등을 적어 주세요' : '축원 받으실 분과 바라는 일을 적어 주세요. 예) 아들 한도윤 임용 시험 합격';
    }
    function renderCalendar() {
      const firstDay = new Date(rv.calY, rv.calM, 1);
      const days = new Date(rv.calY, rv.calM + 1, 0).getDate();
      $('#calLabel').textContent = `${rv.calY}. ${String(rv.calM + 1).padStart(2, '0')}`;
      const ahead = (rv.calY - today.getFullYear()) * 12 + rv.calM - today.getMonth();
      $('#calPrev').disabled = ahead <= 0;
      $('#calNext').disabled = ahead >= 3;
      let html = '';
      for (let i = 0; i < firstDay.getDay(); i++) html += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const dt = new Date(rv.calY, rv.calM, d);
        const st = dateStatus(dt);
        const sel = rv.date && dKey(rv.date) === dKey(dt);
        const isToday = dKey(dt) === dKey(today);
        let cls = 'ease-spring relative aspect-square sm:aspect-auto sm:h-11 rounded-xl text-sm tabular-nums flex items-center justify-center ';
        if (sel) cls += 'bg-cinnabar text-white font-semibold';
        else if (st === 'open') cls += `hover:bg-edge/10 ${dt.getDay() === 0 ? 'text-cinnabar-soft' : 'text-fg'}`;
        else cls += 'text-faint cursor-not-allowed';
        html += `<button type="button" ${st !== 'open' ? 'disabled' : ''} data-day="${d}" class="${cls}" aria-label="${rv.calM + 1}월 ${d}일 ${st === 'open' ? '예약 가능' : st === 'full' ? '마감' : '준비 기간'}">
          ${d}${st === 'full' ? '<span class="absolute bottom-1 text-[9px] leading-none text-faint">마감</span>' : ''}${isToday ? '<span class="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-muted"></span>' : ''}
        </button>`;
      }
      $('#calGrid').innerHTML = html;
      renderScheduleNote();
    }
    function renderScheduleNote() {
      const el = $('#scheduleNote');
      if (!rv.date) { el.innerHTML = ''; return; }
      if (rv.svc.id === 'sasipgu') {
        const names = ['초재', '이재', '삼재', '사재', '오재', '육재', '막재'];
        el.innerHTML = `<div class="rounded-2xl bg-edge/[0.03] border border-edge/10 p-4">
          <p class="text-xs text-muted">일곱 번의 재 일정</p>
          <ol class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">${names.map((n, i) => `<li class="rounded-xl px-3 py-2 ${i === 6 ? 'bg-cinnabar/10 text-cinnabar-soft' : 'bg-edge/[0.03] text-fg2'}"><b class="block">${n}</b>${fmt(addDays(rv.date, i * 7))}</li>`).join('')}</ol>
        </div>`;
      } else if (rv.svc.id === 'baegil') {
        el.innerHTML = `<p class="text-sm text-muted">입재 ${fmt(rv.date)} → 회향 <b class="text-fg">${fmt(addDays(rv.date, 99))}</b></p>`;
      } else if (rv.svc.id === 'deung') {
        el.innerHTML = `<p class="text-sm text-muted">입등 ${fmt(rv.date)} → 소등 <b class="text-fg">${fmt(addDays(rv.date, 364))}</b></p>`;
      } else el.innerHTML = '';
    }
    function renderSlots() {
      $('#slotGrid').innerHTML = D.SLOTS.map(s => {
        const full = rv.date ? slotFull(rv.date, s) : false;
        const on = rv.slot === s, disabled = !rv.date || full;
        return `<button type="button" data-slot="${s}" ${disabled ? 'disabled' : ''} class="ease-spring h-12 rounded-xl text-sm font-medium tabular-nums border ${on ? 'bg-cinnabar border-cinnabar text-white' : disabled ? 'border-edge/5 text-faint cursor-not-allowed' : 'border-edge/10 bg-edge/[0.03] hover:bg-edge/[0.08]'}">${s}${full ? ' <span class="text-[11px]">마감</span>' : ''}</button>`;
      }).join('');
    }
    function renderModes() {
      $('#modeGrid').innerHTML = rv.svc.modes.map(k => {
        const md = D.MODES[k], on = rv.mode === k;
        return `<button type="button" data-mode="${k}" class="ease-spring flex items-start gap-3 rounded-xl px-4 py-3 text-left border ${on ? 'border-cinnabar/70 bg-cinnabar/10' : 'border-edge/10 bg-edge/[0.03] hover:bg-edge/[0.06]'}">
          <iconify-icon icon="${md.icon}" width="18" class="mt-0.5 ${on ? 'text-cinnabar' : 'text-subtle'}"></iconify-icon>
          <span><span class="block text-sm font-semibold">${md.name}</span><span class="block text-xs text-subtle mt-0.5">${md.note}${md.add ? ' · +' + won(md.add) : ''}</span></span>
        </button>`;
      }).join('');
    }
    function renderTiers() {
      if (!rv.svc.tiers) { $('#tierGrid').innerHTML = ''; return; }
      $('#tierGrid').innerHTML = rv.svc.tiers.map(t => {
        const on = rv.tier === t.id;
        return `<button type="button" data-tier="${t.id}" class="ease-spring rounded-xl px-4 py-3 text-left border ${on ? 'border-cinnabar/70 bg-cinnabar/10' : 'border-edge/10 bg-edge/[0.03] hover:bg-edge/[0.06]'}">
          <span class="block text-sm font-semibold">${t.name} <span class="font-normal text-xs ${on ? 'text-cinnabar-soft' : 'text-subtle'}">${t.add ? '+' + won(t.add) : '포함'}</span></span>
          <span class="block text-xs text-subtle mt-0.5">${t.note}</span>
        </button>`;
      }).join('');
    }
    const price = () => rv.svc.price + (D.MODES[rv.mode]?.add || 0) + (rv.svc.tiers ? rv.svc.tiers.find(t => t.id === rv.tier).add : 0);
    const ready = () => rv.date && (!rv.svc.slots || rv.slot);
    function renderSummary() {
      const s = rv.svc;
      if (ready()) $('#ritualSummary').innerHTML = `<b class="text-fg">${s.name}</b> · ${s.dateLabel} ${fmt(rv.date)}${rv.slot && s.slots ? ' ' + rv.slot : ''} · ${D.MODES[rv.mode].name}`;
      else $('#ritualSummary').textContent = !rv.date ? `${s.dateLabel}을 선택해 주세요` : '시간을 선택해 주세요';
      $('#ritualTotal').textContent = won(price());
      $('#ritualSubmit').disabled = !ready();
    }
    const renderAll = () => { renderDetail(); renderCalendar(); renderSlots(); renderModes(); renderTiers(); renderSummary(); };

    root.addEventListener('click', e => {
      const day = e.target.closest('[data-day]'), slot = e.target.closest('[data-slot]');
      const mode = e.target.closest('[data-mode]'), tier = e.target.closest('[data-tier]');
      if (day && !day.disabled) {
        rv.date = new Date(rv.calY, rv.calM, +day.dataset.day);
        if (rv.slot && slotFull(rv.date, rv.slot)) rv.slot = null;
        renderCalendar(); renderSlots(); renderSummary();
      } else if (e.target.closest('#calPrev')) { if (--rv.calM < 0) { rv.calM = 11; rv.calY--; } renderCalendar(); }
      else if (e.target.closest('#calNext')) { if (++rv.calM > 11) { rv.calM = 0; rv.calY++; } renderCalendar(); }
      else if (slot && !slot.disabled) { rv.slot = slot.dataset.slot; renderSlots(); renderSummary(); }
      else if (mode) { rv.mode = mode.dataset.mode; renderModes(); renderSummary(); }
      else if (tier) { rv.tier = tier.dataset.tier; renderTiers(); renderSummary(); }
      else if (e.target.closest('#ritualSubmit')) submit();
    });

    async function submit() {
      const f = $('#ritualForm'), err = $('#ritualError'), s = rv.svc;
      const fail = (msg, el) => { err.textContent = msg; err.classList.remove('hidden'); el.focus(); };
      const applicant = f.applicant.value.trim(), phone = f.phone.value.trim();
      if (!applicant) return fail('신청자 성함을 입력해 주세요.', f.applicant);
      if (!YW.phoneOk(phone)) return fail('연락처를 010-0000-0000 형식으로 입력해 주세요.', f.phone);
      if (s.deceased && !f.deceased.value.trim()) return fail('위패에 올릴 영가 성함을 입력해 주세요.', f.deceased);
      err.classList.add('hidden');
      const parts = [`${s.dateLabel} ${rv.date.getFullYear()}.${rv.date.getMonth() + 1}.${rv.date.getDate()}(${DOW[rv.date.getDay()]})${s.slots ? ' ' + rv.slot : ''}`, D.MODES[rv.mode].name];
      if (s.tiers) parts.push(s.tiers.find(t => t.id === rv.tier).name);
      if (s.deceased) parts.push(`${f.relation.value} ${f.deceased.value.trim()} 영가`);
      const ok = await YW.addToCart(m.id, {
        key: 'ritual|' + Date.now(), type: 'ritual', ref: s.id, name: s.name, opts: parts.join(' · '),
        unit: price(), qty: 1, applicant, phone, memo: f.memo.value.trim(),
      });
      if (!ok) return;
      YW.toast(`${s.name} 예약을 담았습니다`);
      rv.slot = null; renderSlots(); renderSummary();
      YW.openCart();
    }

    renderAll();
    return {
      get service() { return rv.svc; },
      setService(id) {
        rv.svc = services.find(s => s.id === id) || rv.svc;
        rv.mode = rv.svc.modes[0]; rv.slot = null; resetTier();
        if (rv.date && dateStatus(rv.date) !== 'open') rv.date = null;
        renderAll();
      },
    };
  }

  YW.mountBooking = mountBooking;
})();
