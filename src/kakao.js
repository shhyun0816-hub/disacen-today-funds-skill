'use strict';

const { CATEGORIES } = require('./config');

// 카카오 i 오픈빌더 스킬 응답 (basicCard 케러셀)
// 카드 순서 = config.CATEGORIES 순서 (수익률 → MVP → 매수 → 관심)
function buildCarousel(baseUrl, metaByCat) {
  const items = CATEGORIES.map((cfg) => {
    const d = metaByCat[cfg.cat];
    const ver = d ? d.collected_date || d.base_date : '';
    return {
      title: cfg.cardTitle,
      description: '아래 버튼을 클릭하면 전체 펀드순위를 볼 수 있습니다.',
      // 800x800 정사각 섬네일. ?v=<collected_date> 로 데이터 갱신 시 카카오 이미지 캐시 무효화
      thumbnail: {
        imageUrl: `${baseUrl}/thumb/${cfg.cat}.png?v=${ver}`,
        fixedRatio: true,
      },
      buttons: [
        { action: 'webLink', label: '전체보기', webLinkUrl: `${baseUrl}/page/${cfg.cat}` },
      ],
    };
  });

  return {
    version: '2.0',
    template: { outputs: [{ carousel: { type: 'basicCard', items } }] },
  };
}

// 데이터 로드 실패 시 노출할 안전한 폴백 응답
function fallbackResponse() {
  return {
    version: '2.0',
    template: {
      outputs: [
        { simpleText: { text: '오늘의 인기펀드 정보를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.' } },
      ],
    },
  };
}

module.exports = { buildCarousel, fallbackResponse };
