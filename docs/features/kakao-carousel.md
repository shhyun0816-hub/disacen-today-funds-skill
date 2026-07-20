# 케러셀 응답 빌더 (`src/kakao.js`)

[src/kakao.js](../../src/kakao.js) 는 정규화된 랭킹 데이터를 카카오 i 오픈빌더의
**basicCard 케러셀 응답 JSON** 으로 변환합니다. 카카오 응답 스키마 버전은 `2.0` 입니다.

## `buildCarousel(baseUrl, metaByCat)`

`CATEGORIES` 순서대로 카드 4장을 만듭니다 ([src/kakao.js:11](../../src/kakao.js#L11)).

각 카드 구성:

| 요소 | 값 | 비고 |
|------|-----|------|
| `title` | **생략** | 제목이 섬네일 이미지 안에 이미 있어 중복 제거 |
| `description` | `아래 버튼을 클릭하면 전체 펀드순위를 볼 수 있습니다.` | 고정 문구 |
| `thumbnail.imageUrl` | `{baseUrl}/thumb/{cat}.png?v={수집일}-{배포ID}` | 캐시버스터 포함 |
| `thumbnail.fixedRatio` | `true` | 이미지 비율 고정 (800×800 정사각) |
| `buttons[0]` | `webLink` "전체보기" → `{baseUrl}/page/{cat}` | 전체 랭킹 페이지 |

반환 형태:

```js
{
  version: '2.0',
  template: { outputs: [{ carousel: { type: 'basicCard', items } }] }
}
```

전체 예시는 [sample-response.json](../../sample-response.json) 참고. (샘플에는 `title` 이
남아있지만 현재 코드는 제목을 생략합니다 — 최신 커밋 `style: 카드 제목 삭제` 반영.)

## 이미지 캐시 무효화 (`?v=` 캐시버스터)

카카오는 이미지 URL 을 **자체 CDN 에 캐시**합니다. URL 이 같으면 데이터가 바뀌어도
과거 이미지가 계속 노출될 수 있습니다. 이를 막기 위해 쿼리스트링을 붙입니다:

```
/thumb/top_return.png?v=<collected_date>-<DEPLOY_ID>
                          └ 데이터 갱신 시 변경   └ 재배포 시 변경
```

- `collected_date` — 원본 데이터가 갱신되면(하루 1회) 바뀜 → 새 데이터에 새 이미지
- `DEPLOY_ID` — 커밋마다 바뀜 ([src/kakao.js:7](../../src/kakao.js#L7)). Render 에서는
  `RENDER_GIT_COMMIT` 앞 7자리를 자동 사용, 로컬은 `dev`

> **왜 배포ID 가 필요한가**: 무료 플랜의 spin-down/up 만으로는 커밋이 같아 캐시버스터가
> 그대로입니다. 디자인만 고쳐 재배포한 경우 `collected_date` 는 안 바뀌므로, 배포ID 가
> 있어야 새 섬네일이 카카오에 반영됩니다.

## 폴백 응답 (`fallbackResponse`)

데이터 로드가 완전히 실패했을 때 노출하는 안전 응답입니다 ([src/kakao.js:36](../../src/kakao.js#L36)).

```js
{ version: '2.0', template: { outputs: [{ simpleText: {
  text: '오늘의 인기펀드 정보를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.'
}}]}}
```

- 스킬 핸들러가 예외를 잡아 이 응답을 **HTTP 200 으로** 반환 ([server.js:37](../../server.js#L37))
- 카카오 챗봇이 에러로 중단되지 않고 사용자에게 안내 메시지를 보여줌

## 관련

- 카드 순서·문구의 출처: [categories.md](./categories.md)
- 섬네일 이미지 자체의 렌더링: [thumbnail.md](./thumbnail.md)
- 오픈빌더 연결 절차: [../guides/kakao-openbuilder.md](../guides/kakao-openbuilder.md)
