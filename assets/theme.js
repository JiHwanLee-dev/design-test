// 오늘의 부적 — 테마 설정
// 색은 assets/common.css 의 CSS 변수로 정의하고, 클래스는 bg-page / text-muted 처럼 역할 이름으로 씁니다.
// 기본 테마를 바꾸려면 DEFAULT_THEME 값만 바꾸면 됩니다. (dark | hanji | dawn | white)

(() => {
  const DEFAULT_THEME = 'dark';
  let theme = DEFAULT_THEME;
  try { theme = localStorage.getItem('yw-theme') || DEFAULT_THEME; } catch (e) { }
  document.documentElement.dataset.theme = theme;
  // 후기 · 평점 표시 (dev 옵션 reviews, 기본 숨김). 숨김이면 .yw-review 요소를 CSS로 가림
  let reviews = 'hide';
  try { reviews = JSON.parse(localStorage.getItem('yw-dev-opts') || '{}').reviews || 'hide'; } catch (e) { }
  document.documentElement.dataset.reviews = reviews;

  const v = name => `rgb(var(--c-${name}) / <alpha-value>)`;
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
          serif: ['"Nanum Myeongjo"', 'serif'],
        },
        colors: {
          page: v('page'),       // 페이지 바탕
          surface: v('surface'), // 카드 안쪽
          deep: v('deep'),       // 번갈아 쓰는 섹션 바탕
          fg: v('fg'),           // 본문 제목
          fg2: v('fg2'),         // 강조 본문
          muted: v('muted'),     // 일반 설명
          subtle: v('subtle'),   // 보조 정보
          faint: v('faint'),     // 비활성 · 플레이스홀더
          edge: v('edge'),       // 테두리 · 반투명 면 (어두운 테마는 흰색, 밝은 테마는 먹색)
          scrim: v('scrim'),     // 모달 뒤 어둡게 깔리는 막
          cinnabar: { DEFAULT: v('cin'), soft: v('cin-soft'), deep: '#9f3b28' },
          hanji: '#e6d3a3',
        },
      },
    },
  };
})();
