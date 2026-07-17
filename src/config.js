'use strict';

// 미래에셋생명 펀드 랭킹 API (mlifefund.com)
const API_BASE = process.env.API_BASE || 'https://mlifefund.com/api/fund-report/rank';

// 케러셀 카드 순서 = 사용자 지정 순서
//   1) 수익률 상위  2) 글로벌 MVP  3) 매수 상위  4) 베스트 관심
const RAW = [
  {
    cat: 'top_return',
    cardTitle: '수익률 상위 펀드',
    thumbTitle: '수익률 상위 펀드',
    brand: '미래에셋생명 · 변액보험 펀드',
    unit: '수익률순',
    mode: 'return', // 수익률 기준 정렬
  },
  {
    cat: 'mvp',
    cardTitle: '글로벌 MVP 포트폴리오 랭킹',
    thumbTitle: '글로벌 MVP 포트폴리오',
    brand: '미래에셋생명 · MVP 포트폴리오',
    unit: '수익률순',
    mode: 'return',
  },
  {
    cat: 'top_purchase',
    cardTitle: '매수 상위 펀드',
    thumbTitle: '매수 상위 펀드',
    brand: '미래에셋생명 · 판매 랭킹',
    unit: '판매순',
    mode: 'rank', // 판매 인기 순위(원본 rank) 기준
  },
  {
    cat: 'best_interest',
    cardTitle: '베스트 관심 펀드',
    thumbTitle: '베스트 관심 펀드',
    brand: '미래에셋생명 · 관심 랭킹',
    unit: '관심순',
    mode: 'rank', // 관심 인기 순위(원본 rank) 기준
  },
];

// mode 에 따라 정렬 버튼 / 기본 정렬 / 라벨을 파생
function decorate(c) {
  if (c.mode === 'rank') {
    return Object.assign({}, c, {
      defaultSort: 'rank',
      countWord: c.unit.replace('순', '') + ' 많은순', // 판매 많은순 / 관심 많은순
      sortButtons: [
        { k: 'rank', l: c.unit },
        { k: 'm3', l: '3개월순' },
        { k: 'm6', l: '6개월순' },
      ],
    });
  }
  return Object.assign({}, c, {
    defaultSort: 'm3',
    countWord: '',
    sortButtons: [
      { k: 'm3', l: '3개월순' },
      { k: 'm6', l: '6개월순' },
    ],
  });
}

const CATEGORIES = RAW.map(decorate);
const BY_CAT = CATEGORIES.reduce((m, c) => ((m[c.cat] = c), m), {});

function getConfig(cat) {
  return BY_CAT[cat] || null;
}

module.exports = { API_BASE, CATEGORIES, getConfig };
