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
  // オープニングを飛ばす
  doc.getElementById('openingBubble').click();
  await wait(30);
  doc.getElementById('openingStartBtn').click();
  await wait(30);

  // 新はじめに画面の検証
  assert(doc.querySelector('.doc-note-title').textContent.includes('年金事務所が確認したいこと'), '📄見出しが固定表示されている');
  assert(doc.querySelector('.doc-note-body').textContent.includes('健康を維持できる食生活'), '年金視点の説明が即時表示されている（タイプライターではない）');
  assert(doc.querySelector('.divider') !== null, '区切り線がある');
  assert(doc.getElementById('introChickBubble') !== null, '🐥吹き出しがある');

  // ひよこの一言がタイプライターされ、短く終わる
  await wait(2500);
  const chickText = doc.getElementById('introChickText').textContent;
  assert(chickText === '今日は「食事」について、一緒に進めてみよう。', 'ひよこの一言が正しく完了: ' + chickText);

  // 次へで通常フローに進めるか
  doc.getElementById('btn-next').click();
  await wait(30);
  assert(doc.querySelector('h1').textContent.includes('食べようと思う'), '通常のチェック画面へ進める');

  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'NEW INTRO: ALL PASSED');
})();
