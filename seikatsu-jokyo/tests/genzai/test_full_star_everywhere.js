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
  doc.getElementById('btn-next').click(); await wait(30); // -> group1

  let stars = doc.querySelectorAll('.night-box circle');
  assert(stars.length === 24, 'group1画面でも24個の全体星空が出る: ' + stars.length);

  doc.querySelectorAll('.item-row')[0].click(); // e01
  stars = doc.querySelectorAll('.night-box circle');
  let lit = [...stars].filter(s => s.getAttribute('fill') === 'var(--star-on)');
  assert(lit.length === 1, '1個点灯: ' + lit.length);

  // group2へ進んでもさっきの点灯が保持されているか
  doc.getElementById('btn-next').click(); await wait(20);
  stars = doc.querySelectorAll('.night-box circle');
  lit = [...stars].filter(s => s.getAttribute('fill') === 'var(--star-on)');
  assert(stars.length === 24 && lit.length === 1, 'group2でも24個表示、前の点灯も引き継がれる: total=' + stars.length + ' lit=' + lit.length);

  doc.querySelectorAll('.item-row')[0].click(); // group2の1個目
  stars = doc.querySelectorAll('.night-box circle');
  lit = [...stars].filter(s => s.getAttribute('fill') === 'var(--star-on)');
  assert(lit.length === 2, 'group2でチェックすると2個点灯: ' + lit.length);

  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'FULL STAR EVERYWHERE: ALL PASSED');
  process.exit(process.exitCode||0);
})();
