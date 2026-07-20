# 가이드: 문제 해결

증상별로 원인과 확인 지점을 정리했습니다.

## 카카오에서 이미지가 안 보인다

| 확인 | 방법 |
|------|------|
| BASE_URL 이 https 인가 | `curl https://<도메인>/healthz` → `baseUrl` 확인 |
| 스킬 응답의 URL 이 https 인가 | `curl -X POST .../skill/today-funds` → `imageUrl` 확인 |
| 섬네일 자체가 뜨는가 | 브라우저로 `https://<도메인>/thumb/top_return.png` 열기 |

- `baseUrl` 이 `http://localhost:3000` 이면 → `BASE_URL` 미설정. Render 라면 보통 자동 감지되지만,
  다른 플랫폼이면 직접 지정해야 합니다 ([../02-setup.md](../02-setup.md)).
- 섬네일 URL 이 502 를 반환하면 → 아래 "섬네일 렌더 실패" 참고.
- 카카오는 **공개 https URL 만** 허용합니다. http·사설망 주소는 무조건 실패합니다.

## 이미지가 옛날 데이터로 보인다

카카오 CDN 캐시입니다. URL 의 `?v=<collected_date>-<배포ID>` 로 무효화합니다.

- 데이터가 갱신되면 자동 해결됩니다(`collected_date` 변경).
- **디자인만 수정했다면 재배포**하세요. 커밋이 바뀌어야 `RENDER_GIT_COMMIT` 기반 배포ID 가
  갱신됩니다 ([../features/kakao-carousel.md](../features/kakao-carousel.md)).
- 무료 플랜의 잠들었다 깨어나는 것만으로는 캐시버스터가 바뀌지 않습니다(같은 커밋).

## 섬네일 한글이 깨진다 (□□□)

섬네일은 Spoqa Han Sans **웹폰트를 CDN 에서 로드**합니다.

- **서버에 아웃바운드 네트워크가 있는지** 확인하세요. 없으면 웹폰트 로드 실패 →
  3초 뒤 대체서체로 렌더됩니다 ([src/thumbnail.js:41](../../src/thumbnail.js#L41)).
- 그 대체서체마저 없으면 네모로 깨집니다. Docker 이미지에는 `fonts-noto-cjk` 가 설치되어 있어
  이를 방지합니다 ([Dockerfile](../../Dockerfile)). 직접 만든 이미지라면 한글 폰트를 설치하세요.
- 로컬 macOS/Windows 는 시스템 한글 폰트가 있어 보통 문제되지 않습니다.

## 섬네일 렌더 실패 (502)

로그에서 `[thumb] 실패:` 메시지를 확인합니다.

| 원인 | 대응 |
|------|------|
| Chromium 실행 라이브러리 누락 | Docker 로 배포 (Dockerfile 에 의존성 포함). 직접 설치 시 `libnss3`, `libgbm1`, `libatk-bridge2.0-0`, `libxkbcommon0`, `libasound2` 등 필요 |
| 메모리 부족 (OOM) | 플랜 승격. 이 프로젝트는 이미 Chromium 1개 재사용 + 순차 예열 + 동시 렌더 방지로 최소화되어 있음 |
| `setContent` 타임아웃 (20초) | 폰트 CDN 지연 가능성. 반복되면 네트워크·CDN 상태 확인 |

`launch` 가 한 번 실패해도 실패 promise 를 캐시하지 않으므로
([src/thumbnail.js:15](../../src/thumbnail.js#L15)) 다음 요청에서 자동 재시도됩니다.

## 데이터가 갱신되지 않는다

- 서버는 펀드 API 응답을 **30분 캐시**합니다(`CACHE_TTL_MS`). 즉시 반영이 필요하면
  환경변수를 낮추거나 서버를 재시작하세요(재시작 시 캐시가 비워지고 예열이 다시 채웁니다).
- 로그에 `[fund-data] <cat> 재요청 실패, 캐시 사용` 이 보이면 **원본 API 장애**입니다.
  서버는 의도적으로 만료된 캐시라도 반환해 화면이 죽지 않게 합니다
  ([../features/fund-data.md](../features/fund-data.md)).

## 챗봇이 "정보를 불러오지 못했어요" 만 보여준다

데이터 조회가 **캐시조차 없는 상태에서** 실패했다는 뜻입니다(폴백 응답).

1. 서버 로그에서 `[skill] 실패:` 메시지 확인
2. 원본 API 직접 확인: `curl https://mlifefund.com/api/fund-report/rank/top_return`
3. 서버에서 외부 네트워크가 막혀 있지 않은지 확인 (타임아웃 8초)

## 첫 응답이 매우 느리다

Render **무료 플랜의 콜드스타트**입니다. 유휴 시 잠들었다 깨어나며 수십 초가 걸립니다.
부팅 예열로 완화하지만 완전히 없앨 수는 없습니다 → **starter 플랜 승격**을 권장합니다
([deploy.md](./deploy.md)).

## 전체보기 페이지가 404 / 502

| 코드 | 의미 |
|------|------|
| 404 `알 수 없는 카테고리입니다.` | `:cat` 이 4개 키(`top_return`·`mvp`·`top_purchase`·`best_interest`) 밖 |
| 502 | 데이터 조회 실패 (캐시 없음). 위 "데이터가 갱신되지 않는다" 절차로 확인 |

## 로컬에서 `npm install` 이 오래 걸리거나 실패한다

puppeteer 가 Chromium(수백 MB)을 내려받기 때문입니다. 네트워크·디스크 여유를 확인하세요.
설치를 건너뛰고 섬네일 **디자인만** 보려면 [preview/thumb.html](../../preview/thumb.html) 을
브라우저로 직접 열면 됩니다.

## 로그 읽는 법

| 로그 | 의미 |
|------|------|
| `데이터 · 섬네일 예열 완료` | 부팅 예열 정상 완료 |
| `[warm] <cat> 예열 실패` | 예열 실패(서버는 계속 동작, 요청 시 실시간 렌더) |
| `[thumb] <cat> 렌더링 시작` / `완료 (Nms, N bytes)` | 섬네일 렌더 — 캐시 미스일 때만 출력 |
| `[fund-data] <cat> 재요청 실패, 캐시 사용` | 원본 API 장애 → 이전 데이터로 서비스 유지 |
| `⚠ BASE_URL 이 localhost 입니다.` | 카카오 연동 불가 상태 — 공개 https 도메인 설정 필요 |
