'use strict';

const { API_BASE } = require('./config');

// 데이터가 하루 1회 갱신되므로 짧은 TTL 캐시로 API 호출을 줄임
const TTL_MS = Number(process.env.CACHE_TTL_MS || 30 * 60 * 1000); // 기본 30분
const cache = new Map(); // cat -> { at:number, data:object }

// API 원본 item -> 화면/섬네일에서 쓰는 슬림 형태로 정규화
function normalize(raw) {
  const items = (raw.items || []).map((x) => ({
    rank: x.rank,
    cd: x.fund_cd,
    nm: x.fund_nm,
    asset: x.asset_nm,
    desc: x.asset_desc,
    grade: x.risk_grade,
    risk: x.risk_rate,
    m3: (x.returns && x.returns['3개월']) != null ? x.returns['3개월'] : 0,
    m6: (x.returns && x.returns['6개월']) != null ? x.returns['6개월'] : 0,
  }));
  return {
    category: raw.category,
    base_date: raw.base_date,
    collected_date: raw.collected_date || raw.base_date,
    items,
  };
}

async function fetchRanking(cat) {
  const url = `${API_BASE}/${cat}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${cat}`);
    return normalize(await res.json());
  } finally {
    clearTimeout(t);
  }
}

// 캐시 우선. 실패 시 만료된 캐시라도 있으면 그것을 반환(가용성 우선).
async function getRanking(cat, force) {
  const hit = cache.get(cat);
  const fresh = hit && Date.now() - hit.at < TTL_MS;
  if (fresh && !force) return hit.data;
  try {
    const data = await fetchRanking(cat);
    cache.set(cat, { at: Date.now(), data });
    return data;
  } catch (err) {
    if (hit) {
      console.warn(`[fund-data] ${cat} 재요청 실패, 캐시 사용:`, err.message);
      return hit.data;
    }
    throw err;
  }
}

module.exports = { getRanking };
