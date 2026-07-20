# 카테고리 · 정렬 체계 (`src/config.js`)

[src/config.js](../../src/config.js) 는 이 프로젝트의 "메뉴판"입니다.
케러셀 카드 4장의 **순서·문구·정렬 방식**이 전부 여기서 결정되며,
서버·섬네일·전체보기 페이지가 모두 이 정의를 공유합니다.

## 카테고리 정의 (`RAW`)

| 필드 | 용도 |
|------|------|
| `cat` | API 경로 및 URL 파라미터 키 (`/thumb/:cat.png`, `/page/:cat`) |
| `cardTitle` | 전체보기 페이지 헤더 제목 |
| `thumbTitle` | 섬네일 이미지 안의 제목 (길이 제약으로 별도 관리) |
| `brand` | 섬네일·페이지 상단의 브랜드 라벨 (예: `미래에셋생명 · 변액보험 펀드`) |
| `unit` | 정렬 기준 라벨 (`수익률순` / `판매순` / `관심순`) |
| `mode` | **정렬 모드** — `return` 또는 `rank` (아래 참고) |

정의된 4개 카테고리 ([src/config.js:8](../../src/config.js#L8)):

| 순서 | `cat` | 제목 | `mode` |
|------|-------|------|--------|
| 1 | `top_return` | 수익률 상위 펀드 | `return` |
| 2 | `mvp` | 글로벌 MVP 포트폴리오 랭킹 | `return` |
| 3 | `top_purchase` | 매수 상위 펀드 | `rank` |
| 4 | `best_interest` | 베스트 관심 펀드 | `rank` |

> **케러셀 카드 순서 = `RAW` 배열 순서**입니다. 순서를 바꾸려면 배열 순서만 바꾸면 됩니다.

## 정렬 모드 2종

`decorate()` ([src/config.js:44](../../src/config.js#L44)) 가 `mode` 에 따라
전체보기 페이지의 기본 정렬과 정렬 버튼을 파생합니다.

### `mode: 'return'` — 수익률 기준 (top_return, mvp)

- 기본 정렬: `m3` (3개월 수익률 높은순)
- 정렬 버튼: **3개월순 / 6개월순** (2개)

### `mode: 'rank'` — 원본 인기 순위 기준 (top_purchase, best_interest)

- 기본 정렬: `rank` (API 가 준 판매/관심 순위 그대로)
- 정렬 버튼: **판매순(또는 관심순) / 3개월순 / 6개월순** (3개)
- `countWord`: 목록 개수 옆 라벨 — `판매 많은순` / `관심 많은순` (unit 에서 자동 파생)

## 파생 필드 요약

| 파생 필드 | `return` 모드 | `rank` 모드 |
|-----------|---------------|-------------|
| `defaultSort` | `'m3'` | `'rank'` |
| `sortButtons` | 3개월순 · 6개월순 | {unit} · 3개월순 · 6개월순 |
| `countWord` | `''` | `판매 많은순` / `관심 많은순` |

## 내보내는 것

```js
module.exports = { API_BASE, CATEGORIES, getConfig };
```

- `API_BASE` — 펀드 랭킹 API 베이스 URL. `process.env.API_BASE` 로 오버라이드 가능
- `CATEGORIES` — decorate 적용이 끝난 카테고리 배열 (케러셀 순서)
- `getConfig(cat)` — 키로 단건 조회. 없으면 `null` → 라우터에서 404 처리

## 카테고리를 추가/수정하려면

1. `RAW` 배열에 항목 추가 (API 가 해당 `cat` 경로를 지원해야 함)
2. `mode` 를 `return` / `rank` 중 선택 — 나머지 정렬 UI 는 자동 파생
3. 서버 재시작(또는 재배포)만 하면 스킬 응답·섬네일·페이지에 모두 반영됨

다른 파일을 수정할 필요가 없습니다. 케러셀 카드 수는 `CATEGORIES` 길이를 그대로 따릅니다.
