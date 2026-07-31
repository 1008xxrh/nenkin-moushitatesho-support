const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../../pages/genzai/cleaning.html', 'utf-8');
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
  doc.querySelectorAll('.option[data-level]')[1].click(); // まあできる
  next();
  assert(doc.querySelector('h1').textContent.includes('「掃除」についてはこれでおわりです'), 'reached complete screen');
  assert(doc.body.textContent.includes('まあできる'), '選んだレベルが完了画面に表示される');

  // 次へすすむ：掃除の次は洗面（本体ADL_ITEMSの並び順）で、2026-07-28、洗面の画面ができたので有効
  const forwardBtn = doc.getElementById('btn-forward');
  assert(forwardBtn !== null && forwardBtn.disabled !== true, '次へすすむが有効になっている（洗面の画面が実在するため）');
  assert(window.NEXT_ITEM_URL === 'washing_face.html', '次へすすむの行き先が洗面の画面になっている');

  // とじる：handoffが正しいキー(cleaning)で書かれるか
  doc.getElementById('btn-close').click();
  await wait(20);
  const handoffRaw = window.localStorage.getItem('adl_handoff_v1');
  let handoffData = null;
  try{ handoffData = JSON.parse(handoffRaw); }catch(e){}
  assert(handoffData && handoffData.cleaning === 'まあできる', 'handoffにcleaningキーで結果が書き込まれている: ' + JSON.stringify(handoffData));

  console.log(process.exitCode === 1 ? 'CLEANING FULL FLOW: FAILURES ABOVE' : 'CLEANING FULL FLOW: ALL PASSED');
  process.exit(process.exitCode||0);
})();
