'use strict';

const puppeteer = require('puppeteer');
const { thumbHTML } = require('./render');

// Chromium 인스턴스 1개를 재사용
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
      })
      .catch((err) => {
        browserPromise = null; // 실패한 promise 를 캐시하지 않도록 초기화
        throw err;
      });
  }
  return browserPromise;
}

// collected_date 기준으로 PNG 캐시 (데이터가 바뀌면 자동으로 새 키 → 재렌더)
const cache = new Map(); // `${cat}:${collected_date}` -> Buffer

async function renderThumb(cfg, data) {
  const key = `${cfg.cat}:${data.collected_date || data.base_date}`;
  if (cache.has(key)) return cache.get(key);

  const started = Date.now();
  console.log(`[thumb] ${cfg.cat} 렌더링 시작...`);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 1 });
    // 'load' 로 대기 (networkidle0 은 CDN keep-alive 로 멈출 수 있음)
    await page.setContent(thumbHTML(cfg, data), { waitUntil: 'load', timeout: 20000 });
    // 웹폰트 로딩 대기 — 단, 최대 3초로 제한해 무한 대기 방지 (미로딩 시 대체서체로 렌더)
    await Promise.race([
      page.evaluate(() => document.fonts.ready.then(() => true)),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
    // puppeteer 최신 버전은 Uint8Array 를 반환 → Buffer 로 변환해야
    // Express res.send 가 이미지로 전송(아니면 JSON 직렬화되어 깨짐)
    const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 800, height: 800 } });
    const buf = Buffer.from(shot);
    cache.set(key, buf);
    console.log(`[thumb] ${cfg.cat} 완료 (${Date.now() - started}ms, ${buf.length} bytes)`);
    return buf;
  } finally {
    await page.close();
  }
}

async function closeBrowser() {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      await b.close();
    } catch (_) {
      /* ignore */
    }
    browserPromise = null;
  }
}

module.exports = { renderThumb, closeBrowser };
