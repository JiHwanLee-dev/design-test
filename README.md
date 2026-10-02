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
| `index.html` | 메인 랜딩 (신뢰·이야기 중심, 스님 카드에 상품 미리보기). dev 패널에서 쇼핑몰형과 비교 |
| `shop.html?cat=charm` | 전체 상품 목록 (쇼핑몰형 메인에서 사용, 스님이 늘면 비교용) |
| `monk.html?id=haewol` | 스님 페이지 = 가게. 기본 스토어형(짧은 프로필 + 상품 진열·분류·정렬), dev 패널에서 소개형 |
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
| `assets/gate.js` | 스님 페이지에 들어올 때 산문이 열리는 연출 (temple 프로젝트 MonkGate를 옮김) |
| `assets/theme.js` | Tailwind 설정, 기본 테마 (`DEFAULT_THEME`) |
| `assets/common.css` | 테마별 색 (CSS 변수), 애니메이션 |

## 이미지

`assets/images/`의 사진은 `../temple/public/images/`에서 가져와 JPG로 줄인 **임시 이미지**입니다.
스님 사진·표지는 `data.js`의 `photo`, `cover`, `storyPhoto`, `templePhoto`, 의식별 사진은 `RITUAL_IMAGES`, 사찰 풍경 갤러리는 스님별 `gallery`에서 바꿉니다 (스님 페이지에 표시, 없으면 숨김).
사진이 없는 스님은 수묵 그림과 한자 도장으로 자동 대체됩니다.

## DEV 패널

주소 끝에 `?dev=1`을 붙이면 왼쪽 아래에 패널이 뜹니다. `?dev=0`으로 끕니다.

- 메인 히어로 사진: 처마 풍경 / 다실 햇살 / 향 연기
- 메인 구성: 랜딩형 / 쇼핑몰형 (헤더 메뉴도 함께 바뀜)
- 메인 의식 카드 글씨: 사진 위 / 사진 아래
- 스님 페이지 구성: 스토어형 / 소개형
- 스님 페이지 들어갈 때 산문: 처음 한 번 / 매번 / 걸어 들어가기 / 없음
- 배경색: 화이트 / 한지 미색 / 새벽 안개 / 먹색
- 메인 의식 카드 클릭: 상세 페이지만 / 상세 + 바로 예약
- 모시는 스님이 없는 의식: 숨김 / 준비 중 표시
- 의식 카드 가격: 숨김 / 표시 (숨기면 소요 시간만, 비용은 의식 상세 페이지에서 안내)
- (소개형) 부적 클릭: 상세 페이지 / 팝업
- (소개형) 의식 클릭: 상세 페이지 / 페이지 안 예약

## 참고

- 스님, 사찰, 연락처, 후기, 결제는 모두 예시입니다. 실제 결제는 일어나지 않습니다.
- 의식 상세 문구(`RITUAL_DETAILS`)는 초안입니다. 공개 전 스님 검토가 필요합니다.
