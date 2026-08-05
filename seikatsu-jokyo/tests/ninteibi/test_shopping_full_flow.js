// 【2026-07-31・2026-07-31決定】genzai側の tests/genzai/test_shopping_full_flow.js と同じ検証内容を、
// 認定日版(ninteibi)の pages/ninteibi/shopping.html に対して行う（対象パス・HANDOFF_KEYのみ変更）。
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../../pages/ninteibi/shopping.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
const { window } = dom;
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }

(async () => {
  const doc = window.document;
  await wait(50);
  doc.getElementById('openingBubble').click(); await wait(3200);
  doc.getElementById('openingStartBtn').click();
  await wait(20);

  function next(){ const b = doc.getElementById('btn-next'); if(b) b.click(); }
  next(); // -> group1
  for (let g=1; g<=6; g++){
    const rows = doc.querySelectorAll('.item-row');
    rows[0].click();
    next();
  }
  assert(doc.querySelector('h1').textContent.includes('気づいたこと'), 'reached reveal screen via full flow');
  assert(doc.querySelectorAll('.found-item').length === 6, 'found items count correct (6グループぶん)');
  next();
  doc.querySelectorAll('.option[data-level]')[2].click(); // できないが援助があればできた
  next();
  assert(doc.querySelector('h1').textContent.includes('「買物」についてはこれでおわりです'), 'reached complete screen');
  assert(doc.body.textContent.includes('できないが援助があればできた'), '選んだレベルが完了画面に表示される');

  // 買物は10項目中の最後。genzai側と同じく「次へすすむ」ボタン自体を出さない設計。
  assert(window.IS_LAST_ITEM === true, 'IS_LAST_ITEMフラグがtrueになっている（10項目の最後のため）');
  assert(window.NEXT_ITEM_URL === null, 'NEXT_ITEM_URLはnull（次の項目自体が存在しないため）');
  const forwardBtn = doc.getElementById('btn-forward');
  assert(forwardBtn === null, '「次へすすむ」ボタン自体が出ない（「準備中」表示にはしない）');
  const closeBtn = doc.getElementById('btn-close');
  assert(closeBtn !== null && closeBtn.textContent.includes('生活状況の一覧へ戻る'), '「生活状況の一覧へ戻る」ボタンは通常どおり出る');

  // とじる：handoffが正しいキー(shopping)・正しい名前空間(adl_handoff_ninteibi_v1)で書かれるか
  closeBtn.click();
  await wait(20);
  const handoffRaw = window.localStorage.getItem('adl_handoff_ninteibi_v1');
  let handoffData = null;
  try{ handoffData = JSON.parse(handoffRaw); }catch(e){}
  assert(handoffData && handoffData.shopping === 'できないが援助があればできた', 'ninteibi用handoffにshoppingキーで結果が書き込まれている: ' + JSON.stringify(handoffData));
  const genzaiHandoffRaw = window.localStorage.getItem('adl_handoff_v1');
  assert(genzaiHandoffRaw === null, 'genzai側のhandoffキー(adl_handoff_v1)には書き込まれていない（名前空間分離の確認）');

  console.log(process.exitCode === 1 ? 'NINTEIBI SHOPPING FULL FLOW: FAILURES ABOVE' : 'NINTEIBI SHOPPING FULL FLOW: ALL PASSED');
  process.exit(process.exitCode||0);
})();
