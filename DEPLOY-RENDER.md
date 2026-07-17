# Render 배포 가이드 (디자센 · 오늘의 인기펀드 스킬)

puppeteer(Chromium)를 쓰므로 **Docker 런타임**으로 배포합니다. 저장소에 이미 `Dockerfile` 과 `render.yaml` 이 있어 그대로 연결만 하면 됩니다.

---

## A. 로컬에서 한 번 확인 (선택이지만 권장)

```powershell
cd C:\Users\LG\Desktop\claude\kakao-skill
npm install
npm start
```
- 브라우저에서 `http://localhost:3000/thumb/top_return.png` (섬네일)
- `http://localhost:3000/page/top_purchase` (전체보기)
- 확인되면 `Ctrl + C` 로 종료.

---

## B. GitHub 저장소에 올리기 (Render 는 Git 연동으로 배포)

```powershell
cd C:\Users\LG\Desktop\claude\kakao-skill
git init
git add .
git commit -m "feat: 디자센 오늘의 인기펀드 카카오 스킬"
```

그다음 GitHub 에서 **빈 저장소**를 하나 만들고(README 체크 해제), 안내되는 주소로 연결:

```powershell
git branch -M main
git remote add origin https://github.com/<your-id>/disacen-today-funds-skill.git
git push -u origin main
```

> ⚠ `.gitignore` 로 `node_modules`, `.env` 는 올라가지 않습니다(정상).

---

## C. Render 에서 배포

1. https://render.com 로그인 → **New +** → **Blueprint**
2. 방금 만든 GitHub 저장소 선택 → Render 가 `render.yaml` 을 자동 인식
3. **Apply** → Docker 이미지 빌드 시작 (Chromium 포함이라 첫 빌드 5~10분)
4. 완료되면 서비스 주소가 나옵니다: 예) `https://disacen-today-funds-skill.onrender.com`

> Blueprint 대신 수동으로 하려면: **New + → Web Service → 저장소 선택 → Runtime: Docker →
> Health Check Path: `/healthz` → Create**. `BASE_URL` 은 안 넣어도 됩니다(자동 인식).

### 배포 후 확인
- `https://<render주소>/healthz` → `{"ok":true,"baseUrl":"https://..."}` 이고 baseUrl 이 https 인지 확인
- `https://<render주소>/thumb/top_return.png` → 섬네일 이미지
- 스킬 응답:
  ```powershell
  curl.exe -X POST https://<render주소>/skill/today-funds
  ```
  → 케러셀 JSON 의 `imageUrl`, `webLinkUrl` 이 모두 `https://<render주소>/...` 인지 확인.

---

## D. 카카오 i 오픈빌더 연동

1. 오픈빌더 → **디자센** 봇 → **스킬** → 스킬 서버 등록
   - URL: `https://<render주소>/skill/today-funds` (POST)
2. **시나리오05 → '오늘의 인기펀드'** 블록 → 이 스킬 연결
3. 응답: **스킬데이터 사용** 으로 설정
4. 저장 → **봇 테스트**에서 케러셀 4장(수익률→MVP→매수→관심) 확인 → 발행

---

## 주의 / 팁

- **무료 플랜은 유휴 시 잠들어**(spin-down) 첫 요청이 30초~1분 걸립니다. 카카오 스킬 타임아웃은 5초라, 실서비스는 `render.yaml` 의 `plan: starter`(유료, always-on) 권장.
- 섬네일 URL 에는 `?v=<수집일>` 이 붙어 데이터 갱신 시 카카오 이미지 캐시가 자동 무효화됩니다.
- 코드 수정 후 `git push` 하면 Render 가 자동 재배포(autoDeploy)합니다.
- 빌드 실패 시 대부분 puppeteer 시스템 라이브러리 문제 → `Dockerfile` 의 `apt-get` 목록을 확인하세요(이미 필요한 패키지 포함).
