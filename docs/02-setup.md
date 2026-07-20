# 설치 · 로컬 실행 · 환경변수

## 요구 사항

- **Node.js 18 이상** (전역 `fetch` 사용 — [package.json](../package.json) 의 `engines` 참고)
- 최초 `npm install` 시 puppeteer 가 **Chromium 을 자동 다운로드**하므로 네트워크와 디스크 여유가 필요
- 섬네일이 Spoqa Han Sans 웹폰트를 CDN 에서 로드하므로 **아웃바운드 네트워크** 필요

## 설치 및 실행

```bash
npm install            # express, puppeteer(Chromium 다운로드), dotenv
cp .env.example .env   # 필요 시 환경변수 수정 (로컬은 기본값으로 충분)
npm start              # http://localhost:3000
```

| 스크립트 | 명령 | 용도 |
|----------|------|------|
| `npm start` | `node server.js` | 서버 실행 |
| `npm run dev` | `node --watch server.js` | 파일 변경 시 자동 재시작 (개발용) |
| `npm run prerender` | `node scripts/prerender-thumbs.js` | 섬네일 4장을 `public/thumb/*.png` 로 미리 렌더 (선택) |

서버는 부팅 직후 4개 카테고리 데이터·섬네일을 예열하므로, 콘솔에
`데이터 · 섬네일 예열 완료` 로그가 뜨면 준비 완료입니다.

## 로컬 동작 확인

```bash
# 1) 헬스체크 — baseUrl 확인
curl http://localhost:3000/healthz

# 2) 스킬 응답 (케러셀 JSON)
curl -X POST http://localhost:3000/skill/today-funds

# 3) 섬네일 PNG (브라우저로 열기)
open http://localhost:3000/thumb/top_return.png

# 4) 전체보기 페이지
open http://localhost:3000/page/top_purchase
```

## 환경변수

[.env.example](../.env.example) 를 복사해 사용합니다. 모두 선택 사항이며 기본값으로 동작합니다.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3000` | 서버 포트. Render 는 자동 주입 |
| `BASE_URL` | (없음) | 케러셀 JSON 의 이미지/링크에 쓰이는 **공개 https 주소**. 끝에 `/` 없이. 미설정 시 `RENDER_EXTERNAL_URL` → `http://localhost:{PORT}` 순으로 폴백 ([server.js:18](../server.js#L18)) |
| `CACHE_TTL_MS` | `1800000` (30분) | 펀드 API 응답 캐시 TTL |
| `API_BASE` | `https://mlifefund.com/api/fund-report/rank` | 펀드 랭킹 API 베이스 오버라이드 ([src/config.js:4](../src/config.js#L4)) |
| `DEPLOY_ID` | `dev` | 섬네일 URL 의 캐시버스터에 쓰이는 배포 식별자. Render 에서는 `RENDER_GIT_COMMIT` 이 자동 사용됨 ([src/kakao.js:7](../src/kakao.js#L7)) |

> **주의**: 카카오는 **공개 https URL 만** 이미지/링크로 허용합니다. `BASE_URL` 이
> localhost 인 상태로는 카카오 연동이 되지 않으며, 서버 부팅 시 경고 로그가 출력됩니다.
> 배포 후 확인 절차는 [guides/deploy.md](./guides/deploy.md) 참고.

## (선택) 섬네일 미리 렌더링

실시간 렌더링 대신 정적 파일로 CDN 에 올리고 싶다면:

```bash
npm run prerender    # public/thumb/{top_return,mvp,top_purchase,best_interest}.png 생성
```

- 데이터를 **강제 갱신**(`force=true`)한 뒤 렌더하므로 cron 으로 매일 실행하는 용도에 적합
- 서버의 `/thumb/:cat.png` 실시간 렌더링과는 독립적이며, 필수 아님
- 스크립트: [scripts/prerender-thumbs.js](../scripts/prerender-thumbs.js)

## 섬네일 디자인만 빠르게 보기

[preview/thumb.html](../preview/thumb.html) 은 정적 프리뷰 파일입니다.
서버 실행 없이 브라우저로 열어 섬네일 레이아웃·스타일을 확인할 수 있습니다 (배포와 무관).
