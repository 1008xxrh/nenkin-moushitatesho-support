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
  doc.getElementById('openingBubble').click(); await wait(30);
  doc.getElementById('openingStartBtn').click(); await wait(30);

  const steps = [...doc.querySelectorAll('.flow-step')].map(e=>e.textContent);
  assert(steps.length === 5, 'flow-stepが5つある: ' + steps.length);
  assert(steps.join(',') === '食べようと思う,何を食べるか考える,準備する,食べる,片付ける', '順番と文言がFLOWデータと一致: ' + steps.join(','));
  const arrows = doc.querySelectorAll('.flow-arrow');
  assert(arrows.length === 4, '矢印は4つ（5項目の間）: ' + arrows.length);
  assert(doc.querySelector('.lead').textContent === '最近1〜2週間で、当てはまることを一つずつ確認していきます。', '短い指示文が独立して表示: ' + doc.querySelector('.lead').textContent);
  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'FLOW LIST: ALL PASSED');
})();
