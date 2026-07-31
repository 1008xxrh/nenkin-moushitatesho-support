// 「生活状況を選ぶ」画面（⑦生活状況評価）で、何も選ばなくても「次へ」で進めることの確認。
// （2026-07-25：選ばないと押せない仕様だったのを、選ばずに進める仕様に変更した際の回帰テスト）
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
  doc.getElementById('openingBubble').click(); await wait(3200);
  doc.getElementById('openingStartBtn').click();
  await wait(20);

  function next(){ const b = doc.getElementById('btn-next'); if(b) b.click(); }
  next(); // -> group1
  for (let g=1; g<=7; g++){
    next(); // 何もチェックせずに素通り
  }
  next(); // reveal -> evaluate

  // --- 生活状況評価画面：何も選ばない状態 ---
  assert(doc.querySelector('h1').textContent === '生活状況を選ぶ', '生活状況評価画面に到達');
  const nextBtn = doc.getElementById('btn-next');
  assert(nextBtn !== null, '次へボタンが表示されている');
  assert(nextBtn.disabled !== true, '何も選んでいなくても次へボタンは無効化されていない');
  assert(doc.querySelectorAll('.option.selected').length === 0, 'まだどのレベルも選択されていない');

  nextBtn.click();
  await wait(20);

  // --- 完了画面：未選択のまま進んだ場合の表示 ---
  assert(doc.querySelector('h1').textContent.includes('これでおわりです'), '未選択のまま完了画面まで進める');
  assert(doc.body.textContent.includes('未選択'), '完了画面に「未選択」と表示される');

  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'EVALUATE NO SELECTION REQUIRED: ALL PASSED');
  process.exit(process.exitCode||0);
})();
