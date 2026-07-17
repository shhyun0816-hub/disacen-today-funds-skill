'use strict';

try { require('dotenv').config(); } catch (_) { /* dotenv 미설치 시 무시 */ }

const express = require('express');
const { CATEGORIES, getConfig } = require('./src/config');
const { getRanking } = require('./src/fund-data');
const { pageHTML } = require('./src/render');
const { renderThumb } = require('./src/thumbnail');
const { buildCarousel, fallbackResponse } = require('./src/kakao');

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
// 카카오는 공개 https URL 만 이미지/링크로 허용.
// 우선순위: 직접 지정(BASE_URL) → Render 자동 주소(RENDER_EXTERNAL_URL) → 로컬
const BASE_URL = (
  process.env.BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${PORT}`
).replace(/\/+$/, '');

// 헬스체크
app.get('/healthz', (req, res) => res.json({ ok: true, baseUrl: BASE_URL }));

// [카카오 스킬] 시나리오05 > '오늘의 인기펀드' 블록이 호출 → 케러셀 4장 반환
app.post('/skill/today-funds', async (req, res) => {
  try {
    const metaByCat = {};
    await Promise.all(
      CATEGORIES.map(async (cfg) => {
        metaByCat[cfg.cat] = await getRanking(cfg.cat);
      })
    );
    res.json(buildCarousel(BASE_URL, metaByCat));
  } catch (err) {
    console.error('[skill] 실패:', err.message);
    res.json(fallbackResponse());
  }
});

// [전체보기] 카드 버튼 → 해당 카테고리 전체 랭킹 페이지
app.get('/page/:cat', async (req, res) => {
  const cfg = getConfig(req.params.cat);
  if (!cfg) return res.status(404).send('알 수 없는 카테고리입니다.');
  try {
    const data = await getRanking(cfg.cat);
    res.set('content-type', 'text/html; charset=utf-8').send(pageHTML(cfg, data));
  } catch (err) {
    console.error('[page] 실패:', err.message);
    res.status(502).send('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
});

// [섬네일] 800x800 PNG (케러셀 이미지)
app.get('/thumb/:cat.png', async (req, res) => {
  const cfg = getConfig(req.params.cat);
  if (!cfg) return res.status(404).end();
  try {
    const data = await getRanking(cfg.cat);
    const png = await renderThumb(cfg, data);
    res
      .set('content-type', 'image/png')
      .set('cache-control', 'public, max-age=3600')
      .send(png);
  } catch (err) {
    console.error('[thumb] 실패:', err.message);
    res.status(502).end();
  }
});

app.listen(PORT, () => {
  console.log(`디자센 · 오늘의 인기펀드 스킬 서버 실행: ${BASE_URL} (port ${PORT})`);
  if (BASE_URL.startsWith('http://localhost')) {
    console.warn('⚠  BASE_URL 이 localhost 입니다. 카카오 연동 전에 공개 https 도메인으로 설정하세요.');
  }
  // 부팅 시 4개 API 캐시를 미리 데워 첫 스킬 호출(카카오 5초 제한)을 빠르게 함
  Promise.allSettled(CATEGORIES.map((cfg) => getRanking(cfg.cat)))
    .then(() => console.log('데이터 캐시 예열 완료'))
    .catch(() => {});
});
