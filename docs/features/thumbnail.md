# 섬네일 렌더링 (`src/thumbnail.js` + `src/render.js`)

케러셀 카드에 들어가는 **800×800 PNG 섬네일**은 HTML 을 puppeteer(헤드리스 Chromium)로
스크린샷 캡처해서 만듭니다. 디자인은 HTML/CSS 로 관리하므로 이미지 편집 도구가 필요 없습니다.

## 파이프라인

```
GET /thumb/:cat.png
  → getRanking(cat)            랭킹 데이터 (보통 캐시 히트)
  → renderThumb(cfg, data)     캐시 확인 → 없으면 렌더
      → thumbHTML(cfg, data)   TOP3 카드 HTML 문자열 생성 (render.js)
      → puppeteer 800×800 스크린샷
      → Buffer 로 변환 후 메모리 캐시
  → PNG 응답 (cache-control: public, max-age=3600)
```

## 섬네일 디자인 (`thumbHTML`)

[src/render.js:174](../../src/render.js#L174) 에서 생성합니다. TOP3 만 노출합니다.

- **헤더** (오렌지 그라디언트): 브랜드 라벨 · `thumbTitle` · 기준일 · 우상단 `TOP 3` 배지
- **본문**: 순위 카드 3장 — 순위 숫자(1위는 오렌지) / 펀드명 / 자산·설명 태그 · 위험등급 배지 / 3개월 수익률(대) + 6개월 수익률(소)
- 수익률 색상: 양수 = 오렌지 `#F58220`, 음수 = 블루 `#0d5bb5`
- 위험등급 배지 색상은 전체보기 페이지와 CSS 를 공유 (`RISK_BADGE_CSS`, [src/render.js:16](../../src/render.js#L16))

> 디자인을 손볼 때는 [preview/thumb.html](../../preview/thumb.html) 을 브라우저로 열어
> 서버 실행 없이 레이아웃을 확인할 수 있습니다.

## Chromium 인스턴스 관리

메모리 절약을 위해 **Chromium 프로세스 1개를 재사용**합니다 ([src/thumbnail.js:8](../../src/thumbnail.js#L8)).

```js
puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})
```

- `--no-sandbox` — 컨테이너 환경에서 필요
- `--font-render-hinting=none` — 폰트 렌더링 일관성 확보
- **실패한 launch promise 는 캐시하지 않음** — 한 번 실패해도 다음 요청에서 재시도 가능
- 페이지(`page`)는 렌더마다 새로 열고 `finally` 에서 반드시 닫음

## 렌더링 시 대기 전략

[src/thumbnail.js:31](../../src/thumbnail.js#L31) 의 `doRender`:

| 단계 | 설정 | 이유 |
|------|------|------|
| `setContent` | `waitUntil: 'load'`, timeout 20초 | `networkidle0` 은 CDN keep-alive 때문에 멈출 수 있음 |
| 웹폰트 대기 | `document.fonts.ready` vs **3초 타임아웃** 경쟁 | 폰트 CDN 이 느려도 3초 뒤 대체서체로 진행 (무한 대기 방지) |
| 스크린샷 | `clip: {0,0,800,800}` | 정확한 정사각 캡처 |
| 후처리 | `Buffer.from(shot)` | 최신 puppeteer 는 `Uint8Array` 반환 → Buffer 변환 필요 |

## 캐시와 동시성 제어

```js
const cache = new Map();     // key -> Buffer
const inflight = new Map();  // key -> Promise<Buffer>
const key = `${cfg.cat}:${data.collected_date || data.base_date}`;
```

- **캐시 키에 수집일 포함** → 데이터가 갱신된 날 첫 요청에서만 재렌더, 이후는 캐시 히트
- **`inflight` 로 중복 렌더 방지** ([src/thumbnail.js:59](../../src/thumbnail.js#L59)):
  같은 이미지를 동시에 여러 요청이 부르면 **하나의 렌더를 공유**합니다.
  콜드스타트 시 카카오가 4장을 동시에 요청하는 상황에서 Chromium 이 중복 실행되어
  메모리가 터지는 것을 막는 장치입니다.

## 부팅 예열

서버 시작 직후 4개 카테고리를 **순차로**(병렬이 아님) 렌더해 캐시를 채웁니다
([server.js:80](../../server.js#L80)). 순차 처리는 무료 플랜의 제한된 메모리에서
Chromium 페이지가 동시에 여러 개 뜨는 것을 피하기 위한 선택입니다.
예열이 실패해도 경고만 남기고 서버는 계속 동작합니다(요청 시 실시간 렌더로 폴백).

## 디스크로 미리 렌더 (선택)

```bash
npm run prerender   # public/thumb/*.png
```

[scripts/prerender-thumbs.js](../../scripts/prerender-thumbs.js) 는 데이터를 강제 갱신한 뒤
4장을 디스크에 저장하고 `closeBrowser()` 로 Chromium 을 종료합니다.
CDN·정적 호스팅에 올리고 싶을 때 cron 으로 실행하는 용도이며, 서버 운영에 필수는 아닙니다.

## 문제가 생기면

한글 깨짐, 렌더 타임아웃, 메모리 부족 등은 [../guides/troubleshooting.md](../guides/troubleshooting.md) 참고.
