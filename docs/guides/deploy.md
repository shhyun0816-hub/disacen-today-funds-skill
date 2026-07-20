# 가이드: 배포 · 운영 (Render / Docker)

puppeteer(Chromium)를 사용하므로 **Docker 런타임**으로 배포합니다.
저장소에 [Dockerfile](../../Dockerfile) 과 [render.yaml](../../render.yaml) 이 이미 있어 연결만 하면 됩니다.

> 단계별 최초 배포 절차(스크린샷 수준의 상세 안내)는 [DEPLOY-RENDER.md](../../DEPLOY-RENDER.md) 를 참고하세요.
> 이 문서는 배포 구성이 **어떻게 동작하는지**와 운영 시 알아야 할 점을 정리합니다.

## Render Blueprint 구성

[render.yaml](../../render.yaml) 이 정의하는 서비스:

| 항목 | 값 | 비고 |
|------|-----|------|
| `runtime` | `docker` | Chromium 의존성 때문에 필수 |
| `plan` | `free` | 테스트용. 실서비스 전 **starter 승격 권장** (아래 참고) |
| `region` | `singapore` | 한국에서 가까운 리전 |
| `healthCheckPath` | `/healthz` | 헬스체크 |
| `autoDeploy` | `true` | main 브랜치 푸시 시 자동 배포 |
| `CACHE_TTL_MS` | `1800000` | 펀드 데이터 캐시 30분 |

**`BASE_URL` 은 설정하지 않아도 됩니다.** [server.js:18](../../server.js#L18) 이
Render 가 주입하는 `RENDER_EXTERNAL_URL` 을 자동으로 사용합니다.
커스텀 도메인을 붙일 때만 `BASE_URL` 을 명시적으로 지정하세요 (끝에 `/` 없이).

## Dockerfile 이 하는 일

[Dockerfile](../../Dockerfile) 은 `node:20-slim` 위에 Chromium 실행에 필요한 것들을 설치합니다.

- **시스템 라이브러리**: `libnss3`, `libgbm1`, `libatk-*`, `libxkbcommon0`, `libasound2` 등
- **한글 폰트**: `fonts-noto-cjk` — 웹폰트 CDN 이 실패해도 한글이 깨지지 않도록 하는 보험
- `PUPPETEER_CACHE_DIR=/app/.cache/puppeteer` — Chromium 을 이미지 안에 고정 포함
- `npm install --omit=dev` 로 의존성 설치 (postinstall 에서 Chromium 다운로드)

> Chromium 포함이라 **첫 빌드는 5~10분** 걸립니다. 이후 빌드는 레이어 캐시로 빨라집니다.

## 배포 후 확인 절차

```bash
# 1) 헬스체크 — baseUrl 이 https 공개 도메인인지
curl https://<render주소>/healthz

# 2) 섬네일 (브라우저로 열어 이미지 확인)
open https://<render주소>/thumb/top_return.png

# 3) 스킬 응답 — imageUrl / webLinkUrl 이 모두 https://<render주소> 인지
curl -X POST https://<render주소>/skill/today-funds
```

세 가지가 모두 정상이면 오픈빌더 연결로 넘어갑니다 → [kakao-openbuilder.md](./kakao-openbuilder.md)

## 무료 플랜의 콜드스타트

Render 무료 플랜은 유휴 시 서비스가 잠들고, 다음 요청에서 깨어납니다(수십 초 소요).
이 프로젝트는 그 상황을 다음과 같이 완화합니다:

1. **부팅 예열** — 서버 시작 직후 4개 카테고리의 데이터·섬네일을 **순차로** 미리 렌더
   ([server.js:80](../../server.js#L80)). 깨어난 직후 카카오가 섬네일 4장을 동시에 요청해도 캐시 히트.
2. **동시 렌더 방지** — 같은 이미지에 대한 동시 요청은 하나의 렌더를 공유
   ([src/thumbnail.js:59](../../src/thumbnail.js#L59)). Chromium 중복 실행으로 인한 메모리 초과 방지.

그래도 첫 응답 지연은 남습니다. **실서비스에서는 대시보드에서 starter 플랜으로 승격**하는 것을
권장합니다 (render.yaml 의 `plan` 주석에도 명시되어 있습니다).

## 재배포가 필요한 변경

| 변경 내용 | 재배포 필요? | 이유 |
|-----------|--------------|------|
| 펀드 데이터 갱신 (매일) | 아니오 | 30분 TTL 캐시가 자동 갱신, 섬네일도 `collected_date` 로 자동 재렌더 |
| 카테고리 추가·순서 변경 ([src/config.js](../../src/config.js)) | **예** | 서버 코드이므로 |
| 섬네일·페이지 디자인 수정 ([src/render.js](../../src/render.js)) | **예** | 코드 변경이며, 동시에 배포ID 가 바뀌어야 카카오 이미지 캐시가 무효화됨 |
| 환경변수 변경 | **예** (재시작) | Render 대시보드에서 변경 후 재시작 |

`autoDeploy: true` 이므로 main 브랜치에 푸시하면 자동으로 배포됩니다.

## 운영 시 참고

- **메모리**: Chromium 인스턴스 1개를 재사용하고 섬네일은 순차 렌더합니다. 무료/저사양 플랜에서
  메모리 초과가 나면 [troubleshooting.md](./troubleshooting.md) 참고.
- **아웃바운드 네트워크 필요**: 펀드 API 호출과 Spoqa 웹폰트 CDN 로드에 필요합니다.
- **로그**: 섬네일 렌더는 `[thumb] <cat> 렌더링 시작/완료(ms, bytes)`, 데이터 폴백은
  `[fund-data] <cat> 재요청 실패, 캐시 사용` 형태로 남습니다.
- **다른 플랫폼에 배포**할 때도 Docker 이미지를 그대로 쓸 수 있습니다. 이 경우
  `BASE_URL` 을 반드시 공개 https 도메인으로 직접 지정하세요 (`RENDER_EXTERNAL_URL` 이 없으므로).
