// 【2026-07-31・2026-07-31決定】genzai側の tests/genzai/test_hub.js と同じ検証内容を、
// 認定日版(ninteibi)の pages/ninteibi/hub.html に対して行う（対象パス・HANDOFF_KEYのみ変更）。
const fs = require('fs');
const { JSDOM } = require('jsdom');
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }

(async () => {
  const html = fs.readFileSync(__dirname + '/../../pages/ninteibi/hub.html', 'utf-8');

  // ---- ケース1：何も答えていない状態 ----
  const dom1 = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  const doc1 = dom1.window.document;
  await wait(50);

  const backBtn = doc1.getElementById('btnBackToIndex');
  assert(backBtn !== null, '本体（index.html）へ戻るボタンがある');
  assert(backBtn.textContent.includes('申立書サポートに戻る'), 'ボタンの文言が正しい');
  // クリック時の実際の動作検証は、このdoc1を使う以降の検証に影響しないよう、
  // ファイル末尾の専用DOM（dom4）で行う（理由はgenzai/test_hub.js参照）。

  // 2026-07-31追加：現在版・認定日版を見た目で区別するための常時ラベル・アクセントカラー
  // （00_引き継ぎ_最初に読む.md「認定日版(ninteibi)の計画」で合意済みの方針）
  const eraBadge = doc1.querySelector('.era-badge');
  assert(eraBadge !== null && eraBadge.textContent === '認定日（当時）について', 'era-badgeが「認定日（当時）について」と表示される: ' + (eraBadge && eraBadge.textContent));
  const accentVar = dom1.window.getComputedStyle(doc1.documentElement).getPropertyValue('--accent').trim();
  assert(accentVar === '#8087D8', 'アクセントカラーがgenzai側（#5FA98B）と異なる色になっている: ' + accentVar);

  doc1.getElementById('openingBubble').click();
  await wait(3200);

  assert(doc1.body.textContent.includes('認定日ごろ'), 'オープニングが「認定日ごろ」の文脈になっている');

  const links = doc1.querySelectorAll('a.hub-item');
  assert(links.length === 10, '実リンクが10件（全項目）表示されている: ' + links.length);
  const hrefs = Array.from(links).map(a => a.getAttribute('href'));
  assert(hrefs.includes('dressing.html?from=hub') && hrefs.includes('toilet.html?from=hub') && hrefs.includes('eating.html?from=hub') && hrefs.includes('cooking.html?from=hub') && hrefs.includes('cleaning.html?from=hub') && hrefs.includes('washing_face.html?from=hub') && hrefs.includes('bathing.html?from=hub') && hrefs.includes('walking.html?from=hub') && hrefs.includes('laundry.html?from=hub') && hrefs.includes('shopping.html?from=hub'),
    '10件のリンク先が正しい（?from=hub付き）: ' + JSON.stringify(hrefs));

  const disabled = doc1.querySelectorAll('div.hub-item-disabled');
  assert(disabled.length === 0, '10項目すべて実装済みのため、「準備中」表示は0件になっている: ' + disabled.length);

  assert(doc1.body.textContent.includes('10項目中 0項目 完了'), '未回答時は0項目完了と表示される');

  // genzai側と同じ文言（「本体に戻ると取り込める」）は書かれていないことを確認
  // （stepCh5Recognitionとの連携は未実装のため。2026-07-31決定参照）
  assert(!doc1.body.textContent.includes('取り込めます'), '未実装の取り込み機能について書かれていない（2026-07-31決定）');

  // ---- ケース2：ninteibi用のキーで2項目分handoffが埋まっている状態 ----
  const dom2 = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/',
    beforeParse(window){
      window.localStorage.setItem('adl_handoff_ninteibi_v1', JSON.stringify({dressing:'できたが援助が必要だった', toilet:'できないが援助があればできた'}));
    }
  });
  const doc2 = dom2.window.document;
  await wait(50);
  doc2.getElementById('openingBubble').click();
  await wait(3200);

  assert(doc2.body.textContent.includes('10項目中 2項目 完了'), '2項目回答済みのとき、正しく2項目完了と表示される');
  const dressingLink = doc2.querySelector('a.hub-item[data-key="dressing"]');
  assert(dressingLink && dressingLink.textContent.includes('できたが援助が必要だった'), '回答済みの項目には、選んだレベルが表示される');
  const eatingLink = doc2.querySelector('a.hub-item[data-key="eating"]');
  assert(eatingLink && eatingLink.textContent.includes('未着手'), '未回答の項目には未着手と表示される');

  // ---- ケース3：genzai用のキー(adl_handoff_v1)にデータがあっても、ninteibi側には影響しないこと ----
  // （名前空間分離の確認。誤って同じキーを参照していないかのリグレッションテスト）
  const dom3 = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/',
    beforeParse(window){
      window.localStorage.setItem('adl_handoff_v1', JSON.stringify({dressing:'できる', toilet:'できる', eating:'できる'}));
    }
  });
  const doc3 = dom3.window.document;
  await wait(50);
  doc3.getElementById('openingBubble').click();
  await wait(3200);
  assert(doc3.body.textContent.includes('10項目中 0項目 完了'), 'genzai側のhandoffデータに影響されず0項目完了のまま（名前空間分離の確認）');

  // ---- ケース4：戻るボタンをクリックしたとき、例外が起きないことの確認 ----
  // 2026-08-04、「タブを閉じる→失敗時のみindex.htmlへ遷移」という方式に変更したため、
  // 他のケースとは別の使い捨てDOMで検証する（理由はgenzai/test_hub.js参照）。
  const dom4 = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  const doc4 = dom4.window.document;
  await wait(50);
  const backBtn4 = doc4.getElementById('btnBackToIndex');
  let clickThrew = false;
  try { backBtn4.click(); } catch(e){ clickThrew = true; }
  assert(!clickThrew, '戻るボタンをクリックしても例外が起きない（window.close()呼び出し・失敗時のフォールバック含む）');

  console.log(process.exitCode === 1 ? 'NINTEIBI HUB: FAILURES ABOVE' : 'NINTEIBI HUB: ALL PASSED');
  process.exit(process.exitCode||0);
})();
