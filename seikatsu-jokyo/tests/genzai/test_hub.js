const fs = require('fs');
const { JSDOM } = require('jsdom');
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }

(async () => {
  const html = fs.readFileSync(__dirname + '/../../pages/genzai/hub.html', 'utf-8');

  // ---- ケース1：何も答えていない状態 ----
  const dom1 = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  const doc1 = dom1.window.document;
  await wait(50);

  // 本体index.htmlへ戻るボタン（2026-07-25追加・2026-07-25にボタン化・2026-07-27に
  // ディレクトリ構成の合意に基づき有効化）
  const backBtn = doc1.getElementById('btnBackToIndex');
  assert(backBtn !== null, '本体（index.html）へ戻るボタンがある');
  assert(backBtn.classList.contains('btn') && backBtn.classList.contains('btn-secondary'),
    'フッターの「戻る」等と同じ.btnボタンの見た目になっている');
  assert(backBtn.disabled !== true, 'ディレクトリ構成が確定したので、有効化されている');
  assert(backBtn.textContent.includes('申立書サポートに戻る'), 'ボタンの文言が正しい');
  // クリックしても例外が起きず、writeHandoffのような副作用も無いことだけ確認する
  // （window.location.hrefの実際のナビゲーションはjsdomでは検証できないため）
  backBtn.click();

  doc1.getElementById('openingBubble').click();
  await wait(3200);

  const links = doc1.querySelectorAll('a.hub-item');
  assert(links.length === 10, '実リンクが10件（全項目）表示されている: ' + links.length);
  const hrefs = Array.from(links).map(a => a.getAttribute('href'));
  assert(hrefs.includes('dressing.html?from=hub') && hrefs.includes('toilet.html?from=hub') && hrefs.includes('eating.html?from=hub') && hrefs.includes('cooking.html?from=hub') && hrefs.includes('cleaning.html?from=hub') && hrefs.includes('washing_face.html?from=hub') && hrefs.includes('bathing.html?from=hub') && hrefs.includes('walking.html?from=hub') && hrefs.includes('laundry.html?from=hub') && hrefs.includes('shopping.html?from=hub'),
    '10件のリンク先が正しい（?from=hub付き。遷移先で「ようこそ」を二重表示しないための印）: ' + JSON.stringify(hrefs));

  const disabled = doc1.querySelectorAll('div.hub-item-disabled');
  assert(disabled.length === 0, '2026-07-28、10項目すべて実装済みのため、「準備中」表示は0件になっている: ' + disabled.length);

  assert(doc1.body.textContent.includes('10項目中 0項目 完了'), '未回答時は0項目完了と表示される');

  // ---- ケース2：2項目分handoffが埋まっている状態 ----
  // jsdomはHTMLパース中にscriptを即実行するため、生成後にlocalStorage.setItemしても
  // 初回render()には間に合わない。beforeParseでscript実行前に仕込む。
  const dom2 = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/',
    beforeParse(window){
      window.localStorage.setItem('adl_handoff_v1', JSON.stringify({dressing:'まあできる', toilet:'援助があれば'}));
    }
  });
  const doc2 = dom2.window.document;
  await wait(50);
  doc2.getElementById('openingBubble').click();
  await wait(3200);

  assert(doc2.body.textContent.includes('10項目中 2項目 完了'), '2項目回答済みのとき、正しく2項目完了と表示される: ' + doc2.querySelector('.progress-note').textContent);
  const dressingLink = doc2.querySelector('a.hub-item[data-key="dressing"]');
  assert(dressingLink && dressingLink.textContent.includes('まあできる'), '回答済みの項目には、選んだレベルが表示される');
  const eatingLink = doc2.querySelector('a.hub-item[data-key="eating"]');
  assert(eatingLink && eatingLink.textContent.includes('未着手'), '未回答の項目には未着手と表示される');

  // 選んだ選択肢の番号（1〜4）が、ステータス文言の左に表示されることの確認
  // （2026-07-25追加。本体index.htmlのADL_LEVEL_TO_NUMと同じ数字：できる=1,まあできる=2,
  // 援助があれば=3,できない=4）
  const dressingNum = dressingLink.querySelector('.hub-item-num');
  assert(dressingNum !== null, '回答済みの項目には番号バッジが表示される');
  assert(dressingNum.textContent === '2', '「まあできる」を選んだ項目には番号2が表示される: ' + dressingNum.textContent);
  const dressingStatus = dressingLink.querySelector('.hub-item-status');
  assert(dressingStatus.textContent === '2まあできる', '番号がステータス文言の左（前）に表示されている: ' + dressingStatus.textContent);
  assert(eatingLink.querySelector('.hub-item-num') === null, '未回答の項目には番号バッジが出ない（選んだ番号が無いため）');
  const toiletLink = doc2.querySelector('a.hub-item[data-key="toilet"]');
  const toiletNum = toiletLink.querySelector('.hub-item-num');
  assert(toiletNum && toiletNum.textContent === '3', '「援助があれば」を選んだ項目には番号3が表示される: ' + (toiletNum && toiletNum.textContent));

  console.log(process.exitCode === 1 ? 'HUB: FAILURES ABOVE' : 'HUB: ALL PASSED');
  process.exit(process.exitCode||0);
})();
