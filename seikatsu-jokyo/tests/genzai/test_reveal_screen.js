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
  function next(){ const b = doc.getElementById('btn-next'); if(b) b.click(); }
  next(); // -> group1
  for (let g=1; g<=7; g++){
    const rows = doc.querySelectorAll('.item-row');
    rows[0].click();
    next();
  }
  assert(doc.querySelector('h1').textContent === '気づいたこと', '見出しが「気づいたこと」に変更: ' + doc.querySelector('h1').textContent);
  assert(doc.querySelector('.lead').textContent.includes('星になって並びます'), '星の説明が先に出る（唐突さの解消）');
  assert(doc.getElementById('revealChickBubble') !== null, '統一された吹き出し部品が使われている');
  assert(doc.querySelector('.found-list').compareDocumentPosition(doc.getElementById('revealChickBubble')) & window.Node.DOCUMENT_POSITION_FOLLOWING, 'ひよこの一言が言葉のリストの後に来ている');

  await wait(3000);
  const chickText = doc.getElementById('revealChickText').textContent;
  assert(chickText === '生活の詰まりは、見えてきましたか？', '疑問形のセリフになっている: ' + chickText);

  // 色が最初の画面（intro）のチックバブルと同じCSSクラスを使っているか確認
  const revealBubbleClass = doc.getElementById('revealChickBubble').className;
  assert(revealBubbleClass === 'opening-bubble', 'reveal画面の吹き出しがopening-bubbleクラスで統一されている: ' + revealBubbleClass);

  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'REVEAL REDESIGN: ALL PASSED'); process.exit(process.exitCode||0);
})();
