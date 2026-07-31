// 「ハブ → 着替え → トイレ → 食事 → 炊事 → 掃除 → 洗面 → 入浴 → 散歩 → 洗濯 → 買物 →
// 本体index.htmlへの反映」までの通しシミュレーション（10項目すべて）。jsdomは実際の
// ページ遷移（window.location.href）を追従できないため、1画面ごとに新しいJSDOMインスタンス
// を作り、直前の画面が書いたlocalStorageの値を次の画面へ引き継ぐことで、同一オリジンで
// 実際にブラウザ遷移した場合と同じ状態を再現している。

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('  FAIL:',m); process.exitCode=1;} else console.log('  ok -',m); }
function log(m){ console.log(m); }

async function openHub(handoffRaw){
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'hub.html'), 'utf-8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/hub.html',
    beforeParse(window){ if(handoffRaw){ window.localStorage.setItem('adl_handoff_v1', handoffRaw); } }
  });
  const doc = dom.window.document;
  await wait(50);
  doc.getElementById('openingBubble').click();
  await wait(3200);
  return dom;
}

(async () => {
  log('=== ① ハブ画面（誰も何も答えていない状態）===');
  let handoff = null;
  const hub1 = await openHub(handoff);
  assert(hub1.window.document.body.textContent.includes('10項目中 0項目 完了'), '進捗は 0/10');
  assert(hub1.window.document.querySelectorAll('a.hub-item').length === 10, '選べる項目は10つ（全項目）');

  log('\n=== ② ハブから「着替え」へ（?from=hub） ===');
  const dressingHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'dressing.html'), 'utf-8');
  let dom = new JSDOM(dressingHtml, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/dressing.html?from=hub' });
  let doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '「ようこそ」が出ず、はじめにへ直接入った');
  function next(){ const b = doc.getElementById('btn-next'); if(b) b.click(); }
  next();
  for (let g=1; g<=6; g++){ doc.querySelectorAll('.item-row')[0].click(); next(); }
  next();
  doc.querySelectorAll('.option[data-level]')[1].click(); // まあできる
  next();
  assert(doc.querySelector('h1').textContent.includes('着替え'), '着替えの完了画面に到達');
  log('  → 着替え：「まあできる」を選択');
  doc.getElementById('btn-forward').click(); // 次へすすむ（トイレへ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」でトイレへ（handoffに着替えの結果を保存して移動）');

  log('\n=== ③ トイレへ（次へすすむ経由・?from=hub） ===');
  const toiletHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'toilet.html'), 'utf-8');
  dom = new JSDOM(toiletHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/toilet.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, 'トイレも「ようこそ」を飛ばしている');
  const next2 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next2();
  for (let g=1; g<=6; g++){ doc.querySelectorAll('.item-row')[0].click(); next2(); }
  next2();
  doc.querySelectorAll('.option[data-level]')[2].click(); // 援助があれば
  next2();
  log('  → トイレ：「援助があれば」を選択');
  doc.getElementById('btn-forward').click(); // 次へすすむ（食事へ）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で食事へ（handoffに着替え・トイレの結果を保存して移動）');

  log('\n=== ④ 食事へ（次へすすむ経由・?from=hub） ===');
  const eatingHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'eating.html'), 'utf-8');
  dom = new JSDOM(eatingHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/eating.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '食事も「ようこそ」を飛ばしている');
  const next3 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next3();
  for (let g=1; g<=7; g++){ doc.querySelectorAll('.item-row')[0].click(); next3(); }
  next3();
  doc.querySelectorAll('.option[data-level]')[3].click(); // できない
  next3();
  log('  → 食事：「できない」を選択');
  const eatingForwardBtn = doc.getElementById('btn-forward');
  assert(eatingForwardBtn.disabled !== true, '食事の「次へすすむ」は有効になっている（炊事の画面が実在するため）');
  eatingForwardBtn.click(); // 次へすすむ（炊事へ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で炊事へ（handoffに着替え・トイレ・食事の結果を保存して移動）');

  log('\n=== ⑤ 炊事へ（次へすすむ経由・?from=hub） ===');
  const cookingHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'cooking.html'), 'utf-8');
  dom = new JSDOM(cookingHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/cooking.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '炊事も「ようこそ」を飛ばしている');
  const next4 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next4();
  for (let g=1; g<=6; g++){ doc.querySelectorAll('.item-row')[0].click(); next4(); }
  next4();
  doc.querySelectorAll('.option[data-level]')[1].click(); // まあできる
  next4();
  log('  → 炊事：「まあできる」を選択');
  const cookingForwardBtn = doc.getElementById('btn-forward');
  assert(cookingForwardBtn.disabled !== true, '2026-07-28、掃除の画面ができたので、炊事の「次へすすむ」は有効になっている');
  cookingForwardBtn.click(); // 次へすすむ（掃除へ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で掃除へ（handoffに着替え・トイレ・食事・炊事の結果を保存して移動）');

  log('\n=== ⑥ 掃除へ（次へすすむ経由・?from=hub） ===');
  const cleaningHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'cleaning.html'), 'utf-8');
  dom = new JSDOM(cleaningHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/cleaning.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '掃除も「ようこそ」を飛ばしている');
  const next5 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next5();
  for (let g=1; g<=6; g++){ doc.querySelectorAll('.item-row')[0].click(); next5(); }
  next5();
  doc.querySelectorAll('.option[data-level]')[2].click(); // 援助があれば
  next5();
  log('  → 掃除：「援助があれば」を選択');
  const cleaningForwardBtn = doc.getElementById('btn-forward');
  assert(cleaningForwardBtn.disabled !== true, '2026-07-28、洗面の画面ができたので、掃除の「次へすすむ」は有効になっている');
  cleaningForwardBtn.click(); // 次へすすむ（洗面へ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で洗面へ（handoffに着替え・トイレ・食事・炊事・掃除の結果を保存して移動）');

  log('\n=== ⑦ 洗面へ（次へすすむ経由・?from=hub） ===');
  const washingFaceHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'washing_face.html'), 'utf-8');
  dom = new JSDOM(washingFaceHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/washing_face.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '洗面も「ようこそ」を飛ばしている');
  const next6 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next6();
  for (let g=1; g<=5; g++){ doc.querySelectorAll('.item-row')[0].click(); next6(); }
  next6();
  doc.querySelectorAll('.option[data-level]')[0].click(); // できる
  next6();
  log('  → 洗面：「できる」を選択');
  const washingFaceForwardBtn = doc.getElementById('btn-forward');
  assert(washingFaceForwardBtn.disabled !== true, '2026-07-28、入浴の画面ができたので、洗面の「次へすすむ」は有効になっている');
  washingFaceForwardBtn.click(); // 次へすすむ（入浴へ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で入浴へ（handoffに着替え・トイレ・食事・炊事・掃除・洗面の結果を保存して移動）');

  log('\n=== ⑧ 入浴へ（次へすすむ経由・?from=hub） ===');
  const bathingHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'bathing.html'), 'utf-8');
  dom = new JSDOM(bathingHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/bathing.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '入浴も「ようこそ」を飛ばしている');
  const next7 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next7();
  for (let g=1; g<=5; g++){ doc.querySelectorAll('.item-row')[0].click(); next7(); }
  next7();
  doc.querySelectorAll('.option[data-level]')[3].click(); // できない
  next7();
  log('  → 入浴：「できない」を選択');
  const bathingForwardBtn = doc.getElementById('btn-forward');
  assert(bathingForwardBtn.disabled !== true, '2026-07-28、散歩の画面ができたので、入浴の「次へすすむ」は有効になっている');
  bathingForwardBtn.click(); // 次へすすむ（散歩へ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で散歩へ（handoffに着替え・トイレ・食事・炊事・掃除・洗面・入浴の結果を保存して移動）');

  log('\n=== ⑨ 散歩へ（次へすすむ経由・?from=hub） ===');
  const walkingHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'walking.html'), 'utf-8');
  dom = new JSDOM(walkingHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/walking.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '散歩も「ようこそ」を飛ばしている');
  const next8 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next8();
  for (let g=1; g<=6; g++){ doc.querySelectorAll('.item-row')[0].click(); next8(); }
  next8();
  doc.querySelectorAll('.option[data-level]')[1].click(); // まあできる
  next8();
  log('  → 散歩：「まあできる」を選択');
  const walkingForwardBtn = doc.getElementById('btn-forward');
  assert(walkingForwardBtn.disabled !== true, '2026-07-28、洗濯の画面ができたので、散歩の「次へすすむ」は有効になっている');
  walkingForwardBtn.click(); // 次へすすむ（洗濯へ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で洗濯へ（handoffに着替え・トイレ・食事・炊事・掃除・洗面・入浴・散歩の結果を保存して移動）');

  log('\n=== ⑩ 洗濯へ（次へすすむ経由・?from=hub） ===');
  const laundryHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'laundry.html'), 'utf-8');
  dom = new JSDOM(laundryHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/laundry.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '洗濯も「ようこそ」を飛ばしている');
  const next9 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next9();
  for (let g=1; g<=6; g++){ doc.querySelectorAll('.item-row')[0].click(); next9(); }
  next9();
  doc.querySelectorAll('.option[data-level]')[3].click(); // できない
  next9();
  log('  → 洗濯：「できない」を選択');
  const laundryForwardBtn = doc.getElementById('btn-forward');
  assert(laundryForwardBtn.disabled !== true, '2026-07-28、買物の画面ができたので、洗濯の「次へすすむ」は有効になっている');
  laundryForwardBtn.click(); // 次へすすむ（買物へ、?from=hub付き）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「次へすすむ」で買物へ（handoffに着替え・トイレ・食事・炊事・掃除・洗面・入浴・散歩・洗濯の結果を保存して移動）');

  log('\n=== ⑪ 買物へ（次へすすむ経由・?from=hub。10項目中、最後の項目） ===');
  const shoppingHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', 'shopping.html'), 'utf-8');
  dom = new JSDOM(shoppingHtml, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/shopping.html?from=hub',
    beforeParse(window){ window.localStorage.setItem('adl_handoff_v1', handoff); }
  });
  doc = dom.window.document;
  await wait(50);
  assert(doc.getElementById('openingBubble') === null, '買物も「ようこそ」を飛ばしている');
  const next10 = () => { const b = doc.getElementById('btn-next'); if(b) b.click(); };
  next10();
  for (let g=1; g<=6; g++){ doc.querySelectorAll('.item-row')[0].click(); next10(); }
  next10();
  doc.querySelectorAll('.option[data-level]')[0].click(); // できる
  next10();
  log('  → 買物：「できる」を選択');
  assert(doc.getElementById('btn-forward') === null, '買物は最後の項目のため、「次へすすむ」ボタン自体が出ない（「準備中」表示にはしない）');
  doc.getElementById('btn-close').click(); // とじる（生活状況の一覧へ戻る）
  await wait(20);
  handoff = dom.window.localStorage.getItem('adl_handoff_v1');
  log('  → 「生活状況の一覧へ戻る」で終了');

  log('\n=== ⑫ ハブ画面に戻る（10項目すべて終えた状態） ===');
  const hub2 = await openHub(handoff);
  const hubText = hub2.window.document.body.textContent;
  assert(hubText.includes('10項目中 10項目 完了'), '進捗が 10/10（全項目完了）になっている');
  assert(hubText.includes('まあできる') && hubText.includes('援助があれば') && hubText.includes('できない') && hubText.includes('できる'),
    '10項目とも選んだレベルがハブに表示されている');

  log('\n=== ⑬ 本体index.htmlへの反映（試作コネクタ経由） ===');
  const snapshotPath = path.join(__dirname, '..', 'fixtures', 'index_main_snapshot.html');
  let mainHtml = fs.readFileSync(snapshotPath, 'utf-8');
  const connectorCode = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'genzai', 'handoff_connector.js'), 'utf-8');
  const testBridge = "\nwindow.__applyAdlHandoff = applyAdlHandoff;\nwindow.__getStateAdl = function(){ return state.adl; };\nwindow.__getAdlCellMap = function(){ return ADL_CELL_MAP; };\n";
  const bootMarker = "resetState();\ncurrent = 'start';";
  mainHtml = mainHtml.replace(bootMarker, connectorCode + '\n' + testBridge + '\n' + bootMarker);
  const mainDom = new JSDOM(mainHtml, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  await wait(800);
  mainDom.window.localStorage.setItem('adl_handoff_v1', handoff);
  const applyResult = mainDom.window.__applyAdlHandoff();
  assert(applyResult.applied.length === 10, '本体側で10項目とも適用された: ' + JSON.stringify(applyResult));
  const adl = mainDom.window.__getStateAdl();
  assert(adl.dressing==='まあできる' && adl.toilet==='援助があれば' && adl.eating==='できない' && adl.cooking==='まあできる' && adl.cleaning==='援助があれば' && adl.washingFace==='できる' && adl.bathing==='できない' && adl.walking==='まあできる' && adl.laundry==='できない' && adl.shopping==='できる',
    '本体のstate.adlに10項目とも正しく反映された: ' + JSON.stringify(adl));

  const cellMap = mainDom.window.__getAdlCellMap();
  assert(cellMap.dressing && cellMap.toilet && cellMap.eating && cellMap.cooking && cellMap.cleaning && cellMap.washingFace && cellMap.bathing && cellMap.walking && cellMap.laundry && cellMap.shopping,
    '10項目とも、様式のExcelセル位置(ADL_CELL_MAP)が定義済みで、実際の申立書へ出力できる状態');
  log('  → state.adl = ' + JSON.stringify(adl));
  log('  → 様式への出力セル：着替え行'+cellMap.dressing[4]+' / トイレ行'+cellMap.toilet[4]+' / 食事行'+cellMap.eating[4]+' / 炊事行'+cellMap.cooking[4]+' / 掃除行'+cellMap.cleaning[4]+' / 洗面行'+cellMap.washingFace[4]+' / 入浴行'+cellMap.bathing[4]+' / 散歩行'+cellMap.walking[4]+' / 洗濯行'+cellMap.laundry[4]+' / 買物行'+cellMap.shopping[4]);

  log('\n' + (process.exitCode === 1 ? '=== FAILURES ABOVE ===' : '=== 通しシミュレーション：全工程パス（10項目コンプリート） ==='));
  process.exit(process.exitCode||0);
})();
