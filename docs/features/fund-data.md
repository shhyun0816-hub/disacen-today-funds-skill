# 펀드 데이터 수집 · 캐시 (`src/fund-data.js`)

[src/fund-data.js](../../src/fund-data.js) 는 미래에셋생명 펀드 랭킹 API 를 호출해
화면에서 쓰기 좋은 형태로 정규화하고, 메모리 캐시로 API 호출을 최소화합니다.

## 데이터 소스

```
GET {API_BASE}/{cat}
기본: https://mlifefund.com/api/fund-report/rank/top_return 등 4종
```

- 원본 데이터는 **하루 1회 갱신**됩니다. 그래서 짧은 TTL 캐시로 충분합니다.
- 요청 타임아웃 **8초** (`AbortController`, [src/fund-data.js:32](../../src/fund-data.js#L32))
- 비 2xx 응답은 예외로 처리

## 정규화 (`normalize`)

API 원본 item 을 화면·섬네일에서 바로 쓰는 슬림 형태로 변환합니다
([src/fund-data.js:10](../../src/fund-data.js#L10)).

| 정규화 필드 | 원본 필드 | 의미 |
|-------------|-----------|------|
| `rank` | `rank` | 원본 순위 (판매/관심 랭킹의 기준) |
| `cd` | `fund_cd` | 펀드 코드 |
| `nm` | `fund_nm` | 펀드명 |
| `asset` | `asset_nm` | 자산유형 (국내주식, 해외채권 등 — 페이지 필터 칩에 사용) |
| `desc` | `asset_desc` | 자산 설명 태그 |
| `grade` | `risk_grade` | 위험등급 1~6 (배지 색상 결정) |
| `risk` | `risk_rate` | 위험률 |
| `m3` | `returns['3개월']` | 3개월 수익률 (없으면 `0`) |
| `m6` | `returns['6개월']` | 6개월 수익률 (없으면 `0`) |

응답 레벨 필드:

| 필드 | 의미 |
|------|------|
| `category` | API 카테고리 |
| `base_date` | 기준일 (화면에 노출) |
| `collected_date` | 수집일 — **섬네일 캐시 키·카카오 캐시버스터의 기준**. 없으면 `base_date` 로 폴백 |

## 캐시 전략 (`getRanking`)

```
getRanking(cat, force?)
  1. 캐시 히트 & TTL 이내 & !force  → 캐시 반환 (API 호출 없음)
  2. 아니면 API 재요청 → 성공 시 캐시 갱신
  3. 재요청 실패 시:
     - 만료된 캐시라도 있으면 → 그 캐시 반환 (가용성 우선, 경고 로그)
     - 캐시조차 없으면 → 예외 전파 (라우터에서 폴백/502 처리)
```

- TTL: `CACHE_TTL_MS` 환경변수, 기본 **30분** ([src/fund-data.js:6](../../src/fund-data.js#L6))
- 캐시 저장소: 프로세스 메모리 `Map` (cat → `{ at, data }`) — 재시작하면 비워지며, 부팅 예열이 다시 채움
- `force=true` 는 [prerender 스크립트](../../scripts/prerender-thumbs.js)가 사용 (매일 cron 갱신 용도)

### 왜 "만료된 캐시 반환"인가

챗봇 특성상 **오래된 데이터라도 보여주는 것**이 에러 메시지보다 낫기 때문입니다.
원본 API 가 일시 장애여도 마지막 성공 데이터로 케러셀·섬네일·페이지가 계속 동작합니다.
완전 무캐시 상태에서의 실패만 상위로 전파되어 폴백 응답([kakao-carousel.md](./kakao-carousel.md) 참고)으로 이어집니다.

## 연관 동작

- **부팅 예열**: 서버 시작 시 4개 카테고리를 순차 조회해 캐시를 미리 채움 ([server.js:80](../../server.js#L80))
- **섬네일 캐시 연동**: `collected_date` 가 바뀌면 섬네일 캐시 키도 바뀌어 자동 재렌더 → [thumbnail.md](./thumbnail.md)
- **카카오 캐시 연동**: `collected_date` 가 섬네일 URL 의 `?v=` 에 포함 → [kakao-carousel.md](./kakao-carousel.md)
