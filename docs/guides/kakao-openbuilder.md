# 가이드: 카카오 i 오픈빌더 연동

디자센 봇의 `시나리오05 > 오늘의 인기펀드` 블록에 이 스킬 서버를 연결하는 절차입니다.

## 사전 조건

- 서버가 **공개 https 도메인**으로 배포되어 있어야 합니다 → [deploy.md](./deploy.md)
- 카카오는 **공개 https URL 만** 이미지·링크로 허용합니다. localhost·http 는 동작하지 않습니다.

배포 주소로 먼저 확인하세요:

```bash
curl https://<도메인>/healthz
# → {"ok":true,"baseUrl":"https://<도메인>"}   ← baseUrl 이 https 여야 함
```

## 연결 절차

1. **오픈빌더 → 디자센 봇 → 스킬 → 스킬 추가**
   - 스킬명: 예) `오늘의 인기펀드`
   - URL: `https://<도메인>/skill/today-funds`
   - 메서드: **POST**

2. **시나리오05 → `오늘의 인기펀드` 블록** 열기
   - 파라미터/스킬: 위에서 만든 스킬 연결
   - 응답: **스킬데이터 사용** 선택
     → 봇이 스킬이 반환한 JSON 을 그대로 케러셀로 출력합니다.

3. **저장 후 봇 테스트**
   - 케러셀 4장이 순서대로 노출되는지 확인:
     **수익률 상위 → 글로벌 MVP → 매수 상위 → 베스트 관심**
   - 각 카드의 섬네일 이미지가 보이고, **[전체보기]** 버튼이 랭킹 페이지를 여는지 확인

## 스킬 응답 직접 확인하기

```bash
curl -X POST https://<도메인>/skill/today-funds
```

체크 포인트:

- `template.outputs[0].carousel.items` 가 **4개**인가
- 각 항목의 `thumbnail.imageUrl` 과 `buttons[0].webLinkUrl` 이 모두
  **`https://<도메인>/...`** 로 시작하는가 (localhost 면 `BASE_URL` 설정 문제)
- `imageUrl` 끝에 `?v=<수집일>-<배포ID>` 캐시버스터가 붙어 있는가

응답 구조 상세는 [../03-endpoints.md](../03-endpoints.md) 와
[../features/kakao-carousel.md](../features/kakao-carousel.md) 참고.

## 카드 구성 규칙 (오픈빌더에서 헷갈리기 쉬운 점)

- **카드 제목이 없습니다.** 제목은 섬네일 이미지 안에 그려져 있어 중복을 피하려고
  응답에서 `title` 을 의도적으로 생략했습니다. 오픈빌더에서 제목이 비어 보이는 것은 정상입니다.
- 카드 설명은 고정 문구 `아래 버튼을 클릭하면 전체 펀드순위를 볼 수 있습니다.` 입니다.
- 이미지는 800×800 정사각이며 `fixedRatio: true` 로 비율이 고정됩니다.
- 카드 순서·문구를 바꾸려면 오픈빌더가 아니라 [src/config.js](../../src/config.js) 를 수정하고
  재배포해야 합니다 → [../features/categories.md](../features/categories.md)

## 이미지가 옛날 것으로 보일 때

카카오는 이미지 URL 을 자체 CDN 에 캐시합니다. 서버는 URL 에
`?v=<collected_date>-<배포ID>` 를 붙여 이를 무효화합니다.

- **데이터가 갱신되면** `collected_date` 가 바뀌어 자동으로 새 이미지가 노출됩니다.
- **디자인만 고쳤다면** 데이터가 그대로라 `collected_date` 는 안 바뀝니다.
  → **재배포**하면 `RENDER_GIT_COMMIT` 이 바뀌어 캐시버스터가 갱신됩니다.
  (즉, 디자인 수정 후에는 반드시 새 커밋으로 배포해야 카카오에 반영됩니다.)

## 장애 시 사용자에게 보이는 것

데이터 조회가 실패하면 서버는 **HTTP 200 + simpleText** 폴백을 반환합니다:

> 오늘의 인기펀드 정보를 불러오지 못했어요.
> 잠시 후 다시 시도해 주세요.

챗봇 자체가 오류로 끊기지 않도록 하기 위한 설계입니다 ([../features/kakao-carousel.md](../features/kakao-carousel.md)).
