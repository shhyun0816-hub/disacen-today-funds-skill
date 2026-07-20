# 문서 인덱스

카카오 챗봇 **디자센** · `시나리오05 > 오늘의 인기펀드` 스킬 서버의 문서 모음입니다.
처음이라면 **개요 → 설치 → 엔드포인트** 순서로 읽는 것을 권장합니다.

## 시작하기

| 문서 | 내용 |
|------|------|
| [01-overview.md](./01-overview.md) | 프로젝트 개요 · 전체 아키텍처 · 요청 흐름 |
| [02-setup.md](./02-setup.md) | 설치 · 로컬 실행 · 환경변수 |
| [03-endpoints.md](./03-endpoints.md) | HTTP 엔드포인트 레퍼런스 |

## 기능별 문서 (`features/`)

소스 코드 모듈 단위로 동작 원리를 설명합니다.

| 문서 | 담당 모듈 | 내용 |
|------|-----------|------|
| [categories.md](./features/categories.md) | `src/config.js` | 4개 카테고리 · 정렬 모드 정의 |
| [fund-data.md](./features/fund-data.md) | `src/fund-data.js` | 펀드 API 수집 · 정규화 · 캐시 |
| [kakao-carousel.md](./features/kakao-carousel.md) | `src/kakao.js` | 케러셀 응답 JSON 빌더 · 이미지 캐시 무효화 |
| [thumbnail.md](./features/thumbnail.md) | `src/thumbnail.js`, `src/render.js` | 800×800 섬네일 PNG 렌더링 파이프라인 |
| [ranking-page.md](./features/ranking-page.md) | `src/render.js` | 전체보기 랭킹 페이지 (자산필터 · 정렬) |

## 사용별 가이드 (`guides/`)

목적별 실무 절차를 설명합니다.

| 문서 | 대상 |
|------|------|
| [kakao-openbuilder.md](./guides/kakao-openbuilder.md) | 카카오 i 오픈빌더에 스킬을 연결할 때 |
| [deploy.md](./guides/deploy.md) | Render/Docker 로 배포·운영할 때 |
| [troubleshooting.md](./guides/troubleshooting.md) | 문제가 생겼을 때 (섬네일 깨짐, 콜드스타트 등) |

## 한눈에 보는 구조

```
카카오 챗봇 (디자센)
  │  POST /skill/today-funds
  ▼
server.js (Express)
  ├─ src/config.js      카테고리 4종 정의 (수익률·MVP·매수·관심)
  ├─ src/fund-data.js   mlifefund.com 랭킹 API fetch + 30분 캐시
  ├─ src/kakao.js       basicCard 케러셀 JSON 생성
  ├─ src/render.js      전체보기 페이지 + 섬네일 HTML 템플릿
  └─ src/thumbnail.js   puppeteer 로 섬네일 PNG 캡처 + 캐시
```
