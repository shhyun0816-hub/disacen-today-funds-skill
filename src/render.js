'use strict';

// JSON 을 <script> 안에 안전하게 삽입 (</script> 및 < 이스케이프)
function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// 미래에셋 브랜드 폰트 (주서체 Spoqa Han Sans → 대체 맑은고딕)
const FONT_LINKS = `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/css/SpoqaHanSans-kr.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/css/SpoqaHanSansNeo.css">`;

const RISK_BADGE_CSS = `
  .g1{color:#a3320b; background:#fbe4da;} .g2{color:#CB6015; background:#fdece0;}
  .g3{color:#F58220; background:#fef2e6;} .g4{color:#0086B8; background:#e6f3f8;}
  .g5{color:#043B72; background:#e6ecf2;} .g6{color:#48535B; background:#eef0f1;}`;

/* ------------------------------------------------------------------ */
/* 전체보기 페이지 (전체 랭킹, 자산필터 + 정렬)                          */
/* ------------------------------------------------------------------ */
function pageHTML(cfg, data) {
  const clientCfg = {
    defaultSort: cfg.defaultSort,
    countWord: cfg.countWord,
  };
  const sortButtons = cfg.sortButtons
    .map((b, i) => `<button data-k="${b.k}"${i === 0 ? ' class="on"' : ''}>${esc(b.l)}</button>`)
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F58220">
<title>${esc(cfg.cardTitle)} | 미래에셋생명</title>
${FONT_LINKS}
<style>
  :root{
    --orange:#F58220; --blue:#043B72; --ink:#48535B; --sub:#84888B; --line:#E5E4E1;
    --bg:#ffffff; --card:#ffffff; --up:#F58220; --down:#0d5bb5;
    --font:'Spoqa Han Sans','Spoqa Han Sans Neo','Malgun Gothic','맑은 고딕',sans-serif;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body{margin:0;padding:0;}
  body{font-family:var(--font); background:var(--bg); color:var(--ink);
    -webkit-font-smoothing:antialiased; padding-bottom:calc(24px + env(safe-area-inset-bottom));
    max-width:520px; margin:0 auto; border-left:1px solid var(--line); border-right:1px solid var(--line);}
  ::selection{background:var(--orange); color:#fff;}
  .hdr{background:linear-gradient(135deg,#F58220 0%,#e8720f 100%); color:#fff;
    padding:calc(16px + env(safe-area-inset-top)) 20px 20px;}
  .hdr .brand{font-size:12px; font-weight:700; letter-spacing:.04em; opacity:.92;}
  .hdr h1{margin:6px 0 2px; font-size:22px; font-weight:700; letter-spacing:-.01em;}
  .hdr .date{font-size:12px; opacity:.9;}
  .controls{position:sticky; top:0; z-index:20; background:#fff; padding:12px 16px 8px; border-bottom:1px solid var(--line);}
  .rowlabel{display:flex; justify-content:space-between; align-items:center; margin:2px 2px 6px; gap:8px; flex-wrap:wrap;}
  .rowlabel span{font-size:11px; color:var(--sub); font-weight:600;}
  .sort{display:inline-flex; background:#e9eaec; border-radius:9px; padding:2px;}
  .sort button{border:0; background:transparent; font-family:inherit; font-size:12px; font-weight:700;
    color:var(--sub); padding:5px 11px; border-radius:7px; cursor:pointer; transition:.15s;}
  .sort button.on{background:#fff; color:var(--blue); box-shadow:0 1px 3px rgba(0,0,0,.12);}
  .chips{display:flex; flex-wrap:wrap; gap:7px; padding:2px 0 2px;}
  .chip{flex:0 0 auto; border:1.5px solid var(--line); background:#fff; color:var(--sub);
    font-family:inherit; font-size:12.5px; font-weight:600; padding:7px 13px; border-radius:20px; cursor:pointer; transition:.15s; white-space:nowrap;}
  .chip.on{background:var(--blue); border-color:var(--blue); color:#fff;}
  .list{padding:6px 16px 0;}
  .count{font-size:11.5px; color:var(--sub); margin:8px 2px 10px;}
  .card{background:var(--card); border:1px solid #eceae7; border-radius:14px; padding:14px; margin-bottom:10px;
    display:flex; gap:12px; align-items:center; box-shadow:0 2px 10px -6px rgba(4,59,114,.14); animation:pop .25s ease both;}
  @keyframes pop{from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:none;}}
  .rank{flex:0 0 40px; text-align:center;}
  .rank b{font-size:20px; font-weight:700; color:var(--blue); line-height:1;}
  .rank.top b{color:var(--orange);}
  .rank span{display:block; font-size:9px; color:var(--sub); margin-top:2px; letter-spacing:.05em;}
  .info{flex:1; min-width:0;}
  .info .nm{font-size:14.5px; font-weight:700; color:var(--ink); line-height:1.3; margin-bottom:5px;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;}
  .tags{display:flex; gap:6px; align-items:center; flex-wrap:wrap;}
  .tag{font-size:10.5px; font-weight:600; color:var(--sub); background:#f1f2f4; padding:2px 7px; border-radius:6px;}
  .risk{font-size:10.5px; font-weight:700; padding:2px 7px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;}
  .risk::before{content:""; width:6px; height:6px; border-radius:50%; background:currentColor;}
${RISK_BADGE_CSS}
  .ret{flex:0 0 74px; text-align:right;}
  .ret .big{font-size:18px; font-weight:800; line-height:1.1; letter-spacing:-.01em;}
  .ret .sub{font-size:10.5px; color:var(--sub); margin-top:3px;}
  .ret .sub b{font-weight:700;}
  .up{color:var(--up);} .down{color:var(--down);}
  .foot{text-align:center; font-size:10.5px; color:var(--sub); line-height:1.6; padding:20px 24px 8px;}
  .foot b{color:#6b7075;}
</style>
</head>
<body>
  <header class="hdr">
    <div class="brand">${esc(cfg.brand)}</div>
    <h1>${esc(cfg.cardTitle)}</h1>
    <div class="date" id="baseDate"></div>
  </header>
  <div class="controls">
    <div class="rowlabel">
      <span>자산유형</span>
      <div class="sort" id="sort">${sortButtons}</div>
    </div>
    <div class="chips" id="chips"></div>
  </div>
  <main class="list">
    <div class="count" id="count"></div>
    <div id="cards"></div>
    <div class="foot">
      본 자료는 <b>미래에셋생명</b> 변액보험 펀드 랭킹 데이터입니다.<br>
      기준일의 과거 운용실적이며 미래 수익률을 보장하지 않습니다.<br>
      투자 전 투자설명서를 반드시 확인하시기 바랍니다.
    </div>
  </main>
<script id="DATA" type="application/json">${safeJson(data)}</script>
<script id="CFG" type="application/json">${safeJson(clientCfg)}</script>
<script>
(function(){
  var DB = JSON.parse(document.getElementById('DATA').textContent);
  var CFG = JSON.parse(document.getElementById('CFG').textContent);
  var items = DB.items;
  var state = { asset:'전체', sort:CFG.defaultSort };
  document.getElementById('baseDate').textContent = '기준일 ' + DB.base_date;

  var order = ['전체','국내주식','해외주식','국내혼합','해외혼합','국내채권','해외채권','대안자산'];
  var present = {}; items.forEach(function(x){present[x.asset]=1;});
  var assets = order.filter(function(a){return a==='전체'||present[a];});
  Object.keys(present).forEach(function(a){ if(assets.indexOf(a)===-1) assets.push(a); });
  var chips = document.getElementById('chips');
  assets.forEach(function(a){
    var b=document.createElement('button'); b.className='chip'+(a==='전체'?' on':''); b.textContent=a;
    b.onclick=function(){ state.asset=a; [].forEach.call(chips.children,function(c){c.classList.toggle('on',c===b);}); render(); };
    chips.appendChild(b);
  });
  var sortEl = document.getElementById('sort');
  [].forEach.call(sortEl.children,function(btn){
    btn.onclick=function(){ state.sort=btn.getAttribute('data-k');
      [].forEach.call(sortEl.children,function(c){c.classList.toggle('on',c===btn);}); render(); };
  });
  function fmt(v){ return (v>=0?'+':'')+v.toFixed(2)+'%'; }
  function esc(s){ return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
  var cardsEl=document.getElementById('cards'), countEl=document.getElementById('count');
  function render(){
    var list=items.filter(function(x){ return state.asset==='전체'||x.asset===state.asset; });
    if(state.sort==='rank') list.sort(function(a,b){return a.rank-b.rank;});
    else list.sort(function(a,b){return b[state.sort]-a[state.sort];});
    countEl.textContent=list.length+'개 펀드 · '+
      (state.sort==='rank'?CFG.countWord:(state.sort==='m3'?'3개월':'6개월')+' 수익률 높은순');
    cardsEl.innerHTML=list.map(function(x,i){
      var isTop=i<3, primary,other,otherLabel;
      if(state.sort==='rank'){ primary=x.m3; other=x.m6; otherLabel='6개월'; }
      else { primary=x[state.sort]; other=(state.sort==='m3'?x.m6:x.m3); otherLabel=(state.sort==='m3'?'6개월':'3개월'); }
      return '<div class="card" style="animation-delay:'+Math.min(i*18,300)+'ms">'
        +'<div class="rank'+(isTop?' top':'')+'"><b>'+(i+1)+'</b><span>'+(x.rank===i+1?'':'전체 '+x.rank)+'</span></div>'
        +'<div class="info"><div class="nm">'+esc(x.nm)+'</div><div class="tags">'
        +'<span class="tag">'+esc(x.asset)+'</span><span class="tag">'+esc(x.desc)+'</span>'
        +'<span class="risk g'+x.grade+'">'+x.grade+'등급</span></div></div>'
        +'<div class="ret"><div class="big '+(primary>=0?'up':'down')+'">'+fmt(primary)+'</div>'
        +'<div class="sub">'+otherLabel+' <b class="'+(other>=0?'up':'down')+'">'+fmt(other)+'</b></div></div></div>';
    }).join('');
  }
  render();
})();
</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* 800 x 800 케러셀 섬네일 (TOP3)                                        */
/* ------------------------------------------------------------------ */
function thumbHTML(cfg, data) {
  const top = (data.items || []).slice(0, 3);
  const fmt = (v) => (v >= 0 ? '+' : '') + Number(v).toFixed(2) + '%';
  const rows = top
    .map(
      (x) => `
      <div class="th-row${x.rank === 1 ? ' top1' : ''}">
        <div class="th-rank"><b>${x.rank}</b></div>
        <div class="th-info">
          <div class="th-nm">${esc(x.nm)}</div>
          <div class="th-tags">
            <span class="th-tag">${esc(x.asset)}</span>
            <span class="th-tag">${esc(x.desc)}</span>
            <span class="th-risk g${x.grade}">${x.grade}등급</span>
          </div>
        </div>
        <div class="th-ret">
          <div class="th-big ${x.m3 >= 0 ? 'up' : 'down'}">${fmt(x.m3)}</div>
          <div class="th-sub">6개월 <b class="${x.m6 >= 0 ? 'up' : 'down'}">${fmt(x.m6)}</b></div>
        </div>
      </div>`
    )
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${FONT_LINKS}
<style>
  :root{--orange:#F58220; --blue:#043B72; --ink:#48535B; --sub:#84888B; --line:#E5E4E1; --up:#F58220; --down:#0d5bb5;}
  *{box-sizing:border-box; margin:0; padding:0;}
  html,body{background:#fff;}
  .thumb{width:800px; height:800px; background:#fff; overflow:hidden;
    font-family:'Spoqa Han Sans','Spoqa Han Sans Neo','Malgun Gothic',sans-serif; color:var(--ink); display:flex; flex-direction:column;}
  .th-head{background:linear-gradient(135deg,#F58220 0%,#e8720f 100%); color:#fff; padding:40px 44px 34px; position:relative;}
  .th-brand{font-size:24px; font-weight:700; opacity:.95;}
  .th-title{font-size:52px; font-weight:700; margin:10px 0 8px; letter-spacing:-.02em; line-height:1.1;}
  .th-date{font-size:23px; opacity:.92;}
  .th-badge{position:absolute; top:44px; right:44px; background:rgba(255,255,255,.2);
    border:2px solid rgba(255,255,255,.55); border-radius:40px; font-size:26px; font-weight:800; padding:9px 24px;}
  .th-list{flex:1; padding:26px 40px 38px; display:flex; flex-direction:column; gap:18px;}
  .th-row{display:flex; align-items:center; gap:22px; flex:1; border:2px solid #eee9e3; border-radius:24px;
    padding:22px 28px; background:#fff; box-shadow:0 4px 16px -10px rgba(4,59,114,.2);}
  .th-rank{flex:0 0 74px; text-align:center;}
  .th-rank b{font-size:66px; font-weight:800; line-height:.9; color:var(--blue);}
  .th-row.top1 .th-rank b{color:var(--orange);}
  .th-info{flex:1; min-width:0;}
  .th-nm{font-size:37px; font-weight:700; color:#333a3f; line-height:1.15; margin-bottom:12px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
  .th-tags{display:flex; flex-wrap:wrap; gap:8px; align-items:center;}
  .th-tag{font-size:20px; font-weight:600; color:var(--sub); background:#f1f2f4; padding:5px 13px; border-radius:10px;}
  .th-risk{font-size:20px; font-weight:700; padding:5px 13px; border-radius:10px; display:inline-flex; align-items:center; gap:8px;}
  .th-risk::before{content:""; width:11px; height:11px; border-radius:50%; background:currentColor;}
${RISK_BADGE_CSS.replace(/\.g/g, '.th-risk.g')}
  .th-ret{flex:0 0 200px; text-align:right;}
  .th-big{font-size:44px; font-weight:800; line-height:1; letter-spacing:-.01em;}
  .th-sub{font-size:22px; color:var(--sub); margin-top:8px;}
  .th-sub b{font-weight:700;}
  .up{color:var(--up);} .down{color:var(--down);}
</style>
</head>
<body>
  <div class="thumb">
    <div class="th-head">
      <div class="th-badge">TOP 3</div>
      <div class="th-brand">${esc(cfg.brand)}</div>
      <div class="th-title">${esc(cfg.thumbTitle)}</div>
      <div class="th-date">기준일 ${esc(data.base_date)}</div>
    </div>
    <div class="th-list">${rows}</div>
  </div>
</body>
</html>`;
}

module.exports = { pageHTML, thumbHTML };
