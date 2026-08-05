// 【2026-07-31・2026-07-31決定】genzai側の tests/genzai/test_laundry_full_flow.js と同じ検証内容を、
// 認定日版(ninteibi)の pages/ninteibi/laundry.html に対して行う（対象パス・HANDOFF_KEYのみ変更）。
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../../pages/ninteibi/laundry.html', 'utf-8');
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
  doc.querySelectorAll('.option[data-level]')[1].click();
  next();
  assert(doc.querySelector('h1').textContent.includes('「洗濯」についてはこれでおわりです'), 'reached complete screen');
  assert(doc.body.textContent.includes('できたが援助が必要だった'), '選んだレベルが完了画面に表示される');

  const forwardBtn = doc.getElementById('btn-forward');
  assert(forwardBtn !== null && forwardBtn.disabled !== true, '次へすすむが有効になっている（次の項目の画面が実在するため）');
  assert(window.NEXT_ITEM_URL === 'shopping.html', '次へすすむの行き先が正しい');

  // とじる：handoffが正しいキー(laundry)・正しい名前空間(adl_handoff_ninteibi_v1)で書かれるか
  doc.getElementById('btn-close').click();
  await wait(20);
  const handoffRaw = window.localStorage.getItem('adl_handoff_ninteibi_v1');
  let handoffData = null;
  try{ handoffData = JSON.parse(handoffRaw); }catch(e){}
  assert(handoffData && handoffData.laundry, 'ninteibi用handoffにlaundryキーで結果が書き込まれている: ' + JSON.stringify(handoffData));
  // genzai側のキー('adl_handoff_v1')には書き込まれない（名前空間が別であることの確認）
  const genzaiHandoffRaw = window.localStorage.getItem('adl_handoff_v1');
  assert(genzaiHandoffRaw === null, 'genzai側のhandoffキー(adl_handoff_v1)には書き込まれていない（名前空間分離の確認）');

  console.log(process.exitCode === 1 ? 'NINTEIBI LAUNDRY FULL FLOW: FAILURES ABOVE' : 'NINTEIBI LAUNDRY FULL FLOW: ALL PASSED');
  process.exit(process.exitCode||0);
})();
