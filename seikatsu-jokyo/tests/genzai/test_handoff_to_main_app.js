// 「流し込みテスト」：eating.html（探索画面）→ index.html本体、への
// 受け渡し（案B）が実際に機能するかを検証する。
//
// 本体index.htmlはまだ書き換えていない。このテストは
//   1. パイロット側が本当にhandoffデータを書き込むか
//   2. 試作コネクタ(handoff_connector.js)が、本体の実ソース（スナップショット）の
//      state.adl へ正しく・安全に反映できるか
// の2点を、本体の実コード（tests/fixtures/index_main_snapshot.html。GitHubリポジトリ
// 1008xxrh/nenkin-moushitatesho-support の index.html を取得した日付時点のスナップショット）
// に対して検証する。本体側に将来組み込む前の、事前確認という位置付け。

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }

(async () => {
  // ---- ① パイロット側：食事を最後まで進めて「とじる」を押し、handoffが書かれるか ----
  const pilotHtml = fs.readFileSync(__dirname + '/../../pages/genzai/eating.html', 'utf-8');
  const pilotDom = new JSDOM(pilotHtml, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  const pdoc = pilotDom.window.document;

  await wait(50);
  pdoc.getElementById('openingBubble').click(); await wait(3200);
  pdoc.getElementById('openingStartBtn').click(); await wait(20);
  function next(){ const b = pdoc.getElementById('btn-next'); if(b) b.click(); }
  next(); // -> group1
  for (let g=1; g<=7; g++){
    pdoc.querySelectorAll('.item-row')[0].click();
    next();
  }
  next(); // reveal -> evaluate
  const chosenLevel = '援助があれば';
  const levelIndex = ['できる','まあできる','援助があれば','できない'].indexOf(chosenLevel);
  pdoc.querySelectorAll('.option[data-level]')[levelIndex].click();
  next(); // evaluate -> complete

  assert(pilotDom.window.localStorage.getItem('adl_handoff_v1') === null,
    'とじる前はまだhandoffが書かれていない');

  pdoc.getElementById('btn-close').click(); // とじる
  await wait(20);

  const handoffRaw = pilotDom.window.localStorage.getItem('adl_handoff_v1');
  assert(handoffRaw !== null, 'とじった後、handoffキーが書き込まれている');
  let handoffData = null;
  try{ handoffData = JSON.parse(handoffRaw); }catch(e){}
  assert(handoffData && handoffData.eating === chosenLevel,
    'handoffの中身が選択したレベルと一致している: ' + JSON.stringify(handoffData));
  assert(Object.keys(handoffData||{}).length === 1,
    'handoffには食事の最終レベル1つだけが入っている（気づいたことリスト等は含まれない）: ' + JSON.stringify(handoffData));

  // ---- ② 本体側：試作コネクタが、本体の実ソースのstate.adlへ正しく反映するか ----
  const snapshotPath = path.join(__dirname, '..', 'fixtures', 'index_main_snapshot.html');
  let mainHtml = fs.readFileSync(snapshotPath, 'utf-8');
  const connectorCode = fs.readFileSync(__dirname + '/../../src/genzai/handoff_connector.js', 'utf-8');

  // テスト用のブリッジのみ（本体にもコネクタにも含まれない、Node側から結果を覗くための配線）。
  const testBridge = "\nwindow.__applyAdlHandoff = applyAdlHandoff;\n" +
    "window.__getStateAdl = function(){ return state.adl; };\n";

  const bootMarker = "resetState();\ncurrent = 'start';";
  assert(mainHtml.indexOf(bootMarker) !== -1, '本体スナップショットに起動コードの目印が見つかる（本体側の変更で目印がズレていないか確認）');
  mainHtml = mainHtml.replace(bootMarker, connectorCode + '\n' + testBridge + '\n' + bootMarker);

  const mainDom = new JSDOM(mainHtml, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  await wait(800); // 本体は5000行超の初期化があるので少し長めに待つ

  assert(typeof mainDom.window.__applyAdlHandoff === 'function', '試作コネクタ(applyAdlHandoff)が本体スコープ内で呼べる');
  assert(JSON.stringify(mainDom.window.__getStateAdl()) === '{}', '受け渡し前、本体のstate.adlはまだ空');

  // 実際にパイロットが書いたhandoffを、本体側のlocalStorageへ渡す
  // （同一オリジンで動かした場合、実際のブラウザではこのlocalStorageは自動的に共有される）
  mainDom.window.localStorage.setItem('adl_handoff_v1', handoffRaw);

  const applyResult = mainDom.window.__applyAdlHandoff();
  assert(applyResult.applied.length === 1 && applyResult.applied[0] === 'eating',
    'コネクタが食事のデータを適用した: ' + JSON.stringify(applyResult));
  assert(applyResult.skipped.length === 0, '無視されたキーはない: ' + JSON.stringify(applyResult));

  const adlAfter = mainDom.window.__getStateAdl();
  assert(adlAfter.eating === chosenLevel,
    '本体のstate.adl.eatingが、パイロットで選んだレベルと一致した: ' + JSON.stringify(adlAfter));

  // ---- ③ 安全性の確認：不正なキー・値、既存データの非破壊 ----
  mainDom.window.localStorage.setItem('adl_handoff_v1', JSON.stringify({
    cooking: 'できる',           // 将来追加される正当な項目（今はまだ実体が無いキー）
    存在しない項目: 'できない',   // ADL_ITEMSに無いキー → 無視されるべき
    dressing: 'でたらめな値'      // ADL_LEVEL_TO_NUMに無い値 → 無視されるべき
  }));
  const applyResult2 = mainDom.window.__applyAdlHandoff();
  assert(applyResult2.applied.length === 1 && applyResult2.applied[0] === 'cooking',
    '正当な新規キー(cooking)だけが適用される: ' + JSON.stringify(applyResult2));
  assert(applyResult2.skipped.length === 2,
    '不正なキー・不正な値の2件は無視される: ' + JSON.stringify(applyResult2));

  const adlAfter2 = mainDom.window.__getStateAdl();
  assert(adlAfter2.eating === chosenLevel, '2回目の適用後も、既存のeatingのデータは破壊されていない');
  assert(adlAfter2.cooking === 'できる', '新規キー(cooking)が正しく追加されている');
  assert(adlAfter2.dressing === undefined, '不正な値だったdressingは反映されていない');
  assert(!('存在しない項目' in adlAfter2), 'ADL_ITEMSに無いキーは反映されていない');

  console.log(process.exitCode === 1 ? 'FAILURES ABOVE' : 'HANDOFF TO MAIN APP: ALL PASSED');
  process.exit(process.exitCode||0);
})();
