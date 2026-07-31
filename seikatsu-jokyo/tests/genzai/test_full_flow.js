const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../../pages/genzai/eating.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
const { window } = dom;
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }

(async () => {
  const doc = window.document;
  await wait(50);
  // オープニングを一気に飛ばす（タップ8回：完了→進む を4文分）
  doc.getElementById('openingBubble').click(); await wait(3200);
  doc.getElementById('openingStartBtn').click();
  await wait(20);

  function next(){ const b = doc.getElementById('btn-next'); if(b) b.click(); }
  next(); // -> group1
  for (let g=1; g<=7; g++){
    const rows = doc.querySelectorAll('.item-row');
    rows[0].click();
    next();
  }
  assert(doc.querySelector('h1').textContent.includes('気づいたこと'), 'reached reveal screen via full flow');
  assert(doc.querySelectorAll('.found-item').length === 7, 'found items count correct');
  next();
  doc.querySelectorAll('.option[data-level]')[0].click();
  next();
  assert(doc.querySelector('h1').textContent.includes('これでおわりです'), 'reached complete screen');
  console.log(process.exitCode === 1 ? 'FULL FLOW: FAILURES ABOVE' : 'FULL FLOW: ALL PASSED'); process.exit(process.exitCode||0);
})();
