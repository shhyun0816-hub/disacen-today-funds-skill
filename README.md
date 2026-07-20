# 디자센 · 오늘의 인기펀드 스킬

카카오 챗봇 **디자센**의 `시나리오05 > 오늘의 인기펀드` 블록에 연결하는 스킬 서버입니다.
미래에셋생명 펀드 랭킹 API를 매일 자동으로 불러와 **케러셀 4장**으로 응답합니다.

| # | 카드 | API 카테고리 | 정렬 |
|---|------|--------------|------|
| 1 | 수익률 상위 펀드 | `top_return` | 수익률순 |
| 2 | 글로벌 MVP 포트폴리오 랭킹 | `mvp` | 수익률순 |
| 3 | 매수 상위 펀드 | `top_purchase` | 판매순 |
| 4 | 베스트 관심 펀드 | `best_interest` | 관심순 |

각 카드는 **800×800 섬네일(TOP3)** + **[전체보기]** 버튼으로 구성되며,
전체보기 클릭 시 해당 카테고리의 전체 랭킹 페이지(자산필터·정렬 지원)가 열립니다.

> 📚 **상세 문서는 [docs/](./docs/README.md) 에 기능별·사용별로 정리되어 있습니다.**
> [개요·아키텍처](./docs/01-overview.md) · [설치·환경변수](./docs/02-setup.md) · [엔드포인트](./docs/03-endpoints.md) ·
> [오픈빌더 연동](./docs/guides/kakao-openbuilder.md) · [배포](./docs/guides/deploy.md) · [문제 해결](./docs/guides/troubleshooting.md)

---

## 1. 구성

```
kakao-skill/
├─ server.js                 Express 앱 (스킬/페이지/섬네일 엔드포인트)
├─ src/
│  ├─ config.js              카테고리·순서·정렬 정의
│  ├─ fund-data.js           4개 API fetch + 캐시(기본 30분)
│  ├─ render.js              전체보기 페이지 + 800x800 섬네일 HTML
│  ├─ thumbnail.js           puppeteer 로 섬네일 PNG 렌더링(+캐시)
│  └─ kakao.js               케러셀 응답 JSON 빌더
├─ scripts/prerender-thumbs.js   (선택) 섬네일 4장을 디스크로 미리 렌더
├─ sample-response.json      스킬 응답 예시(구조 확인용)
├─ .env.example              환경변수 예시
└─ preview/thumb.html        섬네일 디자인 프리뷰(정적, 배포 불필요)
```

## 2. 설치 · 실행

```bash
cd kakao-skill
npm install                 # express, puppeteer(크로미움 다운로드), dotenv
cp .env.example .env        # BASE_URL 을 실제 공개 도메인으로 수정
npm start                   # http://localhost:3000
```

- **Node.js 18 이상** 필요 (전역 `fetch` 사용).
- puppeteer 가 Chromium 을 자동 내려받습니다. 서버(리눅스)에서는 폰트·라이브러리 의존성이 필요할 수 있습니다 → 아래 [배포] 참고.

### 로컬 확인
```bash
# 스킬 응답(케러셀 JSON)
curl -X POST http://localhost:3000/skill/today-funds
# 섬네일 미리보기
open http://localhost:3000/thumb/top_return.png
# 전체보기 페이지
open http://localhost:3000/page/top_purchase
```

## 3. 엔드포인트

| 메서드 | 경로 | 용도 |
|--------|------|------|
| POST | `/skill/today-funds` | **카카오 스킬 URL** — 케러셀 응답 |
| GET | `/page/:cat` | 전체보기 페이지 (`cat` = 위 4개) |
| GET | `/thumb/:cat.png` | 800×800 섬네일 PNG |
| GET | `/healthz` | 헬스체크 |

## 4. 카카오 i 오픈빌더 연동

1. **서버를 공개 https 도메인으로 배포**하고 `.env` 의 `BASE_URL` 을 그 주소로 설정
   (카카오는 공개 https URL 만 이미지/링크로 허용).
2. 오픈빌더 → **디자센 봇** → 스킬 → **스킬 추가**
   - URL: `https://<도메인>/skill/today-funds` (POST)
3. `시나리오05` → **오늘의 인기펀드** 블록 →
   - 파라미터/스킬: 위 스킬 연결
   - 응답: **스킬데이터 사용**(봇이 스킬 JSON 을 그대로 케러셀로 출력)
4. 저장 후 봇 테스트에서 케러셀 4장이 순서대로(수익률→MVP→매수→관심) 노출되는지 확인.

> 섬네일 URL 에는 `?v=<collected_date>` 가 붙어, 데이터가 갱신되면 카카오 이미지 캐시가 자동 무효화됩니다.

## 5. 데이터 갱신

- 펀드 API 응답은 서버에서 **30분 캐시**(`CACHE_TTL_MS`)됩니다.
- 섬네일 PNG 는 `collected_date` 기준으로 캐시되어, 데이터가 바뀐 날 첫 요청 때 자동 재렌더링됩니다.
- 실시간 렌더링 대신 **미리 렌더**해 CDN 에 올리고 싶다면:
  ```bash
  npm run prerender      # public/thumb/*.png 생성 → 매일 cron 으로 실행
  ```

## 6. 배포 메모

- **puppeteer 실행 의존성**(Debian/Ubuntu 예):
  `ca-certificates fonts-liberation libatk-bridge2.0-0 libgbm1 libnss3 libxkbcommon0 libasound2` 등.
  한글이 깨지면 한글 폰트 패키지(`fonts-noto-cjk`) 설치 — 단, 섬네일은 웹폰트(Spoqa)를 CDN 로드하므로 서버에 아웃바운드 네트워크가 필요합니다.
- 컨테이너라면 `puppeteer` 대신 `puppeteer-core` + 시스템 Chromium 조합도 가능.
- 메모리 절약을 위해 Chromium 인스턴스는 1개를 재사용합니다(`src/thumbnail.js`).

## 7. 참고

- 정렬 규칙: `top_return`·`mvp` 는 수익률순, `top_purchase`·`best_interest` 는 원본 순위(판매/관심) 기본 + 3·6개월 토글.
- 위험등급 배지: 1~6등급 색상 지원. 자산유형 칩: API 에 등장하는 유형을 자동 노출.
- 브랜드: 미래에셋 오렌지 `#F58220` / 블루 `#043B72`, 서체 Spoqa Han Sans(대체 맑은고딕).
