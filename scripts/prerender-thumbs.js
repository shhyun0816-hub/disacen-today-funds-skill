'use strict';

// 섬네일 4장을 public/thumb/*.png 로 미리 렌더링해 디스크에 저장.
// (매일 데이터 갱신 후 cron 으로 돌려 CDN/정적호스팅에 올리는 용도.
//  서버는 /thumb/:cat.png 로 실시간 렌더링도 지원하므로 필수는 아님.)

const fs = require('fs');
const path = require('path');
const { CATEGORIES } = require('../src/config');
const { getRanking } = require('../src/fund-data');
const { renderThumb, closeBrowser } = require('../src/thumbnail');

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'thumb');
  fs.mkdirSync(outDir, { recursive: true });
  for (const cfg of CATEGORIES) {
    const data = await getRanking(cfg.cat, true);
    const png = await renderThumb(cfg, data);
    const file = path.join(outDir, `${cfg.cat}.png`);
    fs.writeFileSync(file, png);
    console.log(`✓ ${cfg.cat}.png  (기준일 ${data.base_date}, ${png.length} bytes)`);
  }
  await closeBrowser();
  console.log('완료: public/thumb/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
