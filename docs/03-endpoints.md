# HTTP 엔드포인트 레퍼런스

모든 라우트는 [server.js](../server.js) 에 정의되어 있습니다.
`:cat` 은 4개 카테고리 키 중 하나입니다: `top_return` · `mvp` · `top_purchase` · `best_interest`

| 메서드 | 경로 | 용도 | 실패 시 |
|--------|------|------|---------|
| POST | `/skill/today-funds` | **카카오 스킬 URL** — 케러셀 4장 JSON | 200 + 폴백 simpleText |
| GET | `/page/:cat` | 전체보기 랭킹 페이지 (HTML) | 404 / 502 |
| GET | `/thumb/:cat.png` | 800×800 섬네일 PNG | 404 / 502 |
| GET | `/healthz` | 헬스체크 (Render 가 사용) | — |

---

## POST `/skill/today-funds`

카카오 i 오픈빌더가 호출하는 스킬 엔드포인트입니다. 요청 본문은 사용하지 않습니다.
4개 카테고리 랭킹을 병렬 조회한 뒤 basicCard 케러셀 JSON 을 반환합니다.

**응답 예시** (전체 구조는 [sample-response.json](../sample-response.json) 참고):

```json
{
  "version": "2.0",
  "template": {
    "outputs": [{
      "carousel": {
        "type": "basicCard",
        "items": [{
          "description": "아래 버튼을 클릭하면 전체 펀드순위를 볼 수 있습니다.",
          "thumbnail": {
            "imageUrl": "https://<도메인>/thumb/top_return.png?v=20260715-c02fbdd",
            "fixedRatio": true
          },
          "buttons": [{ "action": "webLink", "label": "전체보기",
                        "webLinkUrl": "https://<도메인>/page/top_return" }]
        } /* ... 4장 */ ]
      }
    }]
  }
}
```

- 카드 순서는 [src/config.js](../src/config.js) 의 `CATEGORIES` 순서 그대로: 수익률 → MVP → 매수 → 관심
- 카드 `title` 은 섬네일 이미지 안에 제목이 이미 있어 **의도적으로 생략** ([src/kakao.js:16](../src/kakao.js#L16))
- `?v=<수집일>-<배포ID>` 쿼리는 카카오 이미지 캐시 무효화용 → [kakao-carousel.md](./features/kakao-carousel.md)
- **데이터 조회가 실패해도 HTTP 200** 으로 폴백 메시지를 반환해 챗봇 오류를 방지 ([src/kakao.js:36](../src/kakao.js#L36))

## GET `/page/:cat`

케러셀 카드의 [전체보기] 버튼이 여는 모바일 웹 페이지입니다.
서버가 랭킹 데이터를 JSON 으로 내장한 단일 HTML 을 반환하고, 자산유형 필터·정렬은
브라우저에서 처리합니다. 상세: [ranking-page.md](./features/ranking-page.md)

- `cat` 이 4개 키에 없으면 **404** `알 수 없는 카테고리입니다.`
- 데이터 조회 실패(캐시도 없음) 시 **502** 안내 문구

## GET `/thumb/:cat.png`

케러셀 카드에 노출되는 800×800 PNG 섬네일(해당 카테고리 TOP3)입니다.
puppeteer 가 HTML 템플릿을 스크린샷으로 캡처하며, `collected_date` 기준으로 메모리 캐시됩니다.
상세: [thumbnail.md](./features/thumbnail.md)

- 응답 헤더: `content-type: image/png`, `cache-control: public, max-age=3600`
- `cat` 이 없으면 **404**, 렌더 실패 시 **502** (빈 본문)

## GET `/healthz`

```json
{ "ok": true, "baseUrl": "https://<도메인>" }
```

- [render.yaml](../render.yaml) 의 `healthCheckPath` 로 지정되어 있음
- 배포 후 `baseUrl` 이 **https 공개 도메인**인지 확인하는 용도로도 사용 ([guides/deploy.md](./guides/deploy.md))
