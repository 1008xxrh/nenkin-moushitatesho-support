const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../../pages/genzai/eating.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
const { window } = dom;
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }
(async () => {
  const doc = window.document;
  await wait(200); // 少し打たれた状態でタップ
  doc.getElementById('openingBubble').click();
  await wait(30);
  const t = doc.getElementById('openingText').innerHTML.replace(/<br>/g,'');
  assert(t.includes('見つけていけます。'), 'タップで即座に全文表示: ' + t.slice(-20));
  assert(doc.getElementById('openingStartBtn').style.display === 'block', 'タップ後もはじめるボタンが出る');
  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'ALL PASSED (tap-skip)');
})();
