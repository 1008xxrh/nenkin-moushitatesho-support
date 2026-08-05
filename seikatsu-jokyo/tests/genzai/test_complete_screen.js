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
    const rows = doc.querySelectorAll('.item-row');
    rows[0].click();
    next();
  }
  next(); // reveal -> evaluate
  doc.querySelectorAll('.option[data-level]')[3].click(); // 「できない」を選択
  next(); // evaluate -> complete

  // --- 完了画面の検証 ---
  assert(doc.querySelector('h1').textContent.includes('これでおわりです'), '完了画面に到達（簡潔な見出しのみ）');

  const bodyText = doc.body.textContent;
  assert(!bodyText.includes('次のステップで検討します'), '開発都合の宙ぶらりん文言が消えている(A)');
  assert(!bodyText.includes('ほかの項目と合わせて'), '存在しない他項目を指すクッション文が無い（再修正で削除）');
  assert(bodyText.includes('保存されています'), '保存・継続の安心感を伝える文言がある(A)');

  const closeBtn = doc.getElementById('btn-close');
  assert(closeBtn !== null, '完了画面に明確な着地ボタンがある(C)');
  assert(closeBtn.textContent === '生活状況の一覧へ戻る', '着地ボタンのラベルが「生活状況の一覧へ戻る」になっている（2026-07-25、行き止まりだった「とじる」から変更）');
  assert(doc.getElementById('btn-back') !== null, '完了画面でも戻るは残っている');

  const forwardBtn = doc.getElementById('btn-forward');
  assert(forwardBtn !== null, '完了画面に「次へすすむ」ボタンがある(3ボタン構成)');
  assert(forwardBtn.disabled !== true, '2026-07-28、炊事の画面ができたので、次へすすむは有効になっている');
  assert(forwardBtn.textContent.trim() === '次へすすむ' && !forwardBtn.textContent.includes('準備中'), '次へすすむのボタン文言に「準備中」は付かない: ' + forwardBtn.textContent);

  assert(doc.body.textContent.includes('おつかれさまでした'), '完了画面自体に労いの一言が表示される（2026-07-25、専用の「とじた後」画面を廃止し、ここに統合した）');

  // --- 2026-08-01：評価画面で選んだ直後にhandoffが書かれることの確認 ---
  // （実機確認でのユーザー指摘。以前は「生活状況の一覧へ戻る」ボタンを押すまで書かれず、
  //   画面上部の常設リンクで先に離脱すると選択結果が失われる不具合があった） ---
  const handoffAfterSelect = window.localStorage.getItem('adl_handoff_v1');
  let handoffAfterSelectData = null;
  try{ handoffAfterSelectData = JSON.parse(handoffAfterSelect); }catch(e){}
  assert(handoffAfterSelectData && handoffAfterSelectData.eating === 'できない', '評価画面でレベルを選んだ直後、完了画面を経由しなくてもhandoffに書き込まれている: ' + JSON.stringify(handoffAfterSelectData));

  // --- 「生活状況の一覧へ戻る」操作：改めて保存してハブへ遷移する ---
  closeBtn.click();
  await wait(20);
  const handoffRaw = window.localStorage.getItem('adl_handoff_v1');
  let handoffData = null;
  try{ handoffData = JSON.parse(handoffRaw); }catch(e){}
  assert(handoffData && handoffData.eating, '押した後も本体への受け渡し用handoffが書き込まれたままである（遷移先の「次へすすむ」と同じパターン）: ' + JSON.stringify(handoffData));

  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'COMPLETE SCREEN: ALL PASSED');
  process.exit(process.exitCode||0);
})();
