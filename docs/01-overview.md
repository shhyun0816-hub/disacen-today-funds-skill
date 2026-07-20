# 프로젝트 개요

## 무엇을 하는 서버인가

카카오 챗봇 **디자센**의 `시나리오05 > 오늘의 인기펀드` 블록이 호출하는 **스킬 서버**입니다.
미래에셋생명 펀드 랭킹 API(mlifefund.com)를 매일 자동으로 불러와, 카카오톡에서
**케러셀 카드 4장**(카테고리별 TOP3 섬네일 + 전체보기 버튼)으로 응답합니다.

| # | 카드 | API 카테고리 | 정렬 기준 |
|---|------|--------------|-----------|
| 1 | 수익률 상위 펀드 | `top_return` | 수익률순 |
| 2 | 글로벌 MVP 포트폴리오 랭킹 | `mvp` | 수익률순 |
| 3 | 매수 상위 펀드 | `top_purchase` | 판매순 |
| 4 | 베스트 관심 펀드 | `best_interest` | 관심순 |

## 기술 스택

- **Node.js 18+** (전역 `fetch` 사용) / 배포 이미지는 `node:20-slim`
- **Express 4** — HTTP 서버 ([server.js](../server.js))
- **Puppeteer** — HTML → 800×800 PNG 섬네일 캡처 (Chromium 헤드리스)
- **의존성 3개뿐**: `express`, `puppeteer`, `dotenv` — 빌드 도구·프레임워크 없음
- 배포: **Render (Docker 런타임)** — [render.yaml](../render.yaml), [Dockerfile](../Dockerfile)

## 전체 요청 흐름

### 1) 챗봇 응답 (케러셀)

```
사용자가 블록 실행
  → 카카오 오픈빌더가 POST /skill/today-funds 호출
  → 4개 카테고리 랭킹을 병렬 조회 (fund-data, 30분 캐시)
  → buildCarousel() 이 basicCard 케러셀 JSON 생성 (kakao.js)
  → 카카오가 JSON 의 imageUrl 로 섬네일을 각각 요청
```

- 스킬 핸들러: [server.js:28](../server.js#L28)
- 실패 시 `fallbackResponse()`(simpleText 안내)로 안전하게 응답 → 챗봇이 에러로 죽지 않음

### 2) 섬네일 이미지

```
카카오가 GET /thumb/:cat.png 요청
  → 랭킹 데이터 조회 (캐시 히트가 일반적)
  → thumbHTML() 로 TOP3 카드 HTML 생성 (render.js)
  → puppeteer 가 800×800 스크린샷 → PNG 응답 (thumbnail.js)
  → PNG 는 collected_date 기준으로 메모리 캐시 (같은 날 재렌더 없음)
```

- 섬네일 핸들러: [server.js:57](../server.js#L57)

### 3) 전체보기 페이지

```
사용자가 카드의 [전체보기] 버튼 클릭
  → GET /page/:cat
  → pageHTML() 이 데이터를 JSON 으로 내장한 단일 HTML 응답 (render.js)
  → 자산유형 필터·정렬 토글은 브라우저에서 클라이언트 사이드로 동작 (추가 API 호출 없음)
```

- 페이지 핸들러: [server.js:44](../server.js#L44)

### 4) 부팅 예열 (콜드스타트 대응)

서버 시작 직후 4개 카테고리의 **데이터 + 섬네일을 순차로 미리 렌더**합니다
([server.js:80](../server.js#L80)). Render 무료 플랜은 유휴 시 잠들었다 깨어나는데,
그때 카카오가 섬네일 4장을 동시에 요청해도 캐시 히트로 즉시 응답하기 위한 장치입니다.

## 캐시 계층 (3단)

| 계층 | 위치 | 키 / TTL | 목적 |
|------|------|----------|------|
| 펀드 데이터 | 서버 메모리 | 카테고리별 30분 (`CACHE_TTL_MS`) | API 호출 절감. 실패 시 만료 캐시라도 반환 |
| 섬네일 PNG | 서버 메모리 | `cat:collected_date` (데이터 갱신 시 자동 교체) | puppeteer 재렌더 방지 |
| 카카오 이미지 CDN | 카카오 측 | URL 의 `?v=<수집일>-<배포ID>` 로 무효화 | 데이터 갱신·재배포 시 새 이미지 노출 |

자세한 내용: [fund-data.md](./features/fund-data.md), [thumbnail.md](./features/thumbnail.md), [kakao-carousel.md](./features/kakao-carousel.md)

## 디렉터리 구조

```
├─ server.js                    Express 앱 · 라우팅 · 부팅 예열
├─ src/
│  ├─ config.js                 카테고리·정렬 정의 (기능의 "메뉴판")
│  ├─ fund-data.js              API fetch + 정규화 + TTL 캐시
│  ├─ kakao.js                  케러셀 응답 JSON 빌더 + 폴백
│  ├─ render.js                 HTML 템플릿 2종 (전체보기 페이지 / 섬네일)
│  └─ thumbnail.js              puppeteer 렌더링 + PNG 캐시
├─ scripts/prerender-thumbs.js  (선택) 섬네일을 디스크로 미리 렌더
├─ preview/thumb.html           섬네일 디자인 정적 프리뷰 (배포 무관)
├─ sample-response.json         스킬 응답 구조 예시
├─ Dockerfile / render.yaml     배포 설정
└─ docs/                        이 문서
```

## 브랜드 규칙

- 컬러: 미래에셋 오렌지 `#F58220` / 블루 `#043B72` (수익률 상승 = 오렌지, 하락 = 블루)
- 서체: Spoqa Han Sans (CDN 웹폰트) → 대체 맑은고딕
- 위험등급 배지: 1~6등급 색상 체계 ([render.js:16](../src/render.js#L16))
