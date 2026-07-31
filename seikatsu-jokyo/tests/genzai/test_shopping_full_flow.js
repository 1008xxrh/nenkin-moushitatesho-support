const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../../pages/genzai/shopping.html', 'utf-8');
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
  doc.querySelectorAll('.option[data-level]')[2].click(); // 援助があれば
  next();
  assert(doc.querySelector('h1').textContent.includes('「買物」についてはこれでおわりです'), 'reached complete screen');
  assert(doc.body.textContent.includes('援助があれば'), '選んだレベルが完了画面に表示される');

  // 買物は10項目中の最後。「次の項目がまだ準備中」ではなく「そもそも次が無い」ので、
  // 他の項目と違い、無効化された「次へすすむ」ボタンすら出さない設計になっているはず。
  assert(window.IS_LAST_ITEM === true, 'IS_LAST_ITEMフラグがtrueになっている（10項目の最後のため）');
  assert(window.NEXT_ITEM_URL === null, 'NEXT_ITEM_URLはnull（次の項目自体が存在しないため）');
  const forwardBtn = doc.getElementById('btn-forward');
  assert(forwardBtn === null, '「次へすすむ」ボタン自体が出ない（「準備中」表示にはしない）');
  const closeBtn = doc.getElementById('btn-close');
  assert(closeBtn !== null && closeBtn.textContent.includes('生活状況の一覧へ戻る'), '「生活状況の一覧へ戻る」ボタンは通常どおり出る');

  // とじる：handoffが正しいキー(shopping)で書かれるか
  closeBtn.click();
  await wait(20);
  const handoffRaw = window.localStorage.getItem('adl_handoff_v1');
  let handoffData = null;
  try{ handoffData = JSON.parse(handoffRaw); }catch(e){}
  assert(handoffData && handoffData.shopping === '援助があれば', 'handoffにshoppingキーで結果が書き込まれている: ' + JSON.stringify(handoffData));

  console.log(process.exitCode === 1 ? 'SHOPPING FULL FLOW: FAILURES ABOVE' : 'SHOPPING FULL FLOW: ALL PASSED');
  process.exit(process.exitCode||0);
})();
