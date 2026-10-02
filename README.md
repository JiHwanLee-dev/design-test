# 염원 念願 — 디자인 시안

스님이 직접 쓰는 부적을 주문하고 제례·기도를 예약하는 플랫폼의 정적 HTML 시안입니다.
[supanova-design-skill](https://github.com/uxjoseph/supanova-design-skill)의 taste · soft · output 스킬을 적용했습니다.

## 실행

빌드 없이 `index.html`을 브라우저로 열면 됩니다.
페이지 사이에서 장바구니(localStorage)가 공유되지 않으면 로컬 서버로 여세요.

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## 페이지

| 파일 | 내용 |
|---|---|
| `index.html` | 메인. 쇼핑몰형(상품 진열) / 브랜드형(이야기 중심)을 dev 패널로 전환 |
| `shop.html?cat=charm` | 상품 목록 (분류 탭 · 세부 분류 · 정렬 · 검색, `cat=all\|charm\|rite\|pray`) |
| `monk.html?id=haewol` | 스님 페이지 (부적 주문, 제례·기도 예약). `&svc=sasipgu`로 의식 미리 선택 |
| `ritual.html?id=sasipgu` | 의식 상세 (절차, 비용, 준비물, 모시는 스님) |
| `charm.html?monk=haewol&id=pyeongan` | 부적 상세 (옵션·담기, 받아 보시기까지, 배송·환불, 후기) |
| `rite.html?monk=haewol&id=sasipgu` | 스님별 의식 예약 (모시는 방식, 예약 위젯, 진행 순서, 후기, 오시는 길) |
| `help.html` | 고객센터 (FAQ, 환불 규정, 1:1 문의) |
| `_preview/palette.html` | 배경색 시안 비교용 |

## 파일 구조

| 파일 | 역할 |
|---|---|
| `assets/data.js` | 스님, 부적, 의식, 후기, FAQ 데이터. 스님 추가는 `EXAMPLE_MONKS` → `MONKS`로 옮기기 |
| `assets/common.js` | 헤더·푸터, 장바구니(스님별 결제), 주문서, dev 패널 |
| `assets/booking.js` | 제례·기도 예약 위젯 (스님 페이지와 의식 예약 페이지가 같이 씀) |
| `assets/theme.js` | Tailwind 설정, 기본 테마 (`DEFAULT_THEME`) |
| `assets/common.css` | 테마별 색 (CSS 변수), 애니메이션 |

## DEV 패널

주소 끝에 `?dev=1`을 붙이면 왼쪽 아래에 패널이 뜹니다. `?dev=0`으로 끕니다.

- 메인 구성: 쇼핑몰형 / 브랜드형 (헤더 메뉴도 함께 바뀜)
- 배경색: 먹색 / 한지 미색 / 새벽 안개
- 메인 의식 카드 클릭: 상세 페이지만 / 상세 + 바로 예약
- 모시는 스님이 없는 의식: 숨김 / 준비 중 표시
- 의식 카드 가격: 숨김 / 표시 (숨기면 소요 시간만, 비용은 의식 상세 페이지에서 안내)
- 스님 페이지에서 부적 클릭: 상세 페이지 / 팝업
- 스님 페이지에서 의식 클릭: 상세 페이지 / 페이지 안 예약

## 참고

- 스님, 사찰, 연락처, 후기, 결제는 모두 예시입니다. 실제 결제는 일어나지 않습니다.
- 의식 상세 문구(`RITUAL_DETAILS`)는 초안입니다. 공개 전 스님 검토가 필요합니다.
