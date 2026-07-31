// 着替え→トイレ→食事の3項目を、実際にブラウザで順番に回した場合と同じ形で連続実行し、
// handoff（adl_handoff_v1）が正しくマージされ、最終的に本体側のstate.adlへ
// 3項目とも反映されることを検証する（案Bが複数項目にスケールすることの確認）。
//
// jsdomの制約上、3つのファイルを同一のlocalStorageで自動的につなぐことはできないため、
// 「1つ前の画面が書いたlocalStorageの値を、次の画面のlocalStorageへ引き継ぐ」ことで、
// 同一オリジンでの実際のブラウザ動作をシミュレートしている（test_handoff_to_main_app.js と同じ手法）。

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }

async function runItem(fileName, groupCount, level, previousHandoffRaw){
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'pages', 'genzai', fileName), 'utf-8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  const doc = dom.window.document;
  if(previousHandoffRaw){ dom.window.localStorage.setItem('adl_handoff_v1', previousHandoffRaw); }

  await wait(50);
  doc.getElementById('openingBubble').click(); await wait(3200);
  doc.getElementById('openingStartBtn').click(); await wait(20);
  function next(){ const b = doc.getElementById('btn-next'); if(b) b.click(); }
  next();
  for (let g=1; g<=groupCount; g++){ doc.querySelectorAll('.item-row')[0].click(); next(); }
  next(); // reveal -> evaluate
  const levelIndex = ['できる','まあできる','援助があれば','できない'].indexOf(level);
  doc.querySelectorAll('.option[data-level]')[levelIndex].click();
  next(); // evaluate -> complete
  doc.getElementById('btn-close').click(); // とじる
  await wait(20);
  return dom.window.localStorage.getItem('adl_handoff_v1');
}

(async () => {
  let handoff = null;
  handoff = await runItem('dressing.html', 6, 'まあできる', handoff);
  handoff = await runItem('toilet.html', 6, '援助があれば', handoff);
  handoff = await runItem('eating.html', 7, 'できない', handoff);

  let data = null;
  try{ data = JSON.parse(handoff); }catch(e){}
  assert(data && data.dressing==='まあできる' && data.toilet==='援助があれば' && data.eating==='できない',
    '3項目を連続で回した後、handoffが正しくマージされている: ' + JSON.stringify(data));
  assert(Object.keys(data||{}).length === 3, 'handoffには3項目分だけが入っている（それ以外は混ざっていない）');

  // ---- 本体への適用も確認 ----
  const snapshotPath = path.join(__dirname, '..', 'fixtures', 'index_main_snapshot.html');
  let mainHtml = fs.readFileSync(snapshotPath, 'utf-8');
  const connectorCode = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'genzai', 'handoff_connector.js'), 'utf-8');
  const testBridge = "\nwindow.__applyAdlHandoff = applyAdlHandoff;\nwindow.__getStateAdl = function(){ return state.adl; };\n";
  const bootMarker = "resetState();\ncurrent = 'start';";
  mainHtml = mainHtml.replace(bootMarker, connectorCode + '\n' + testBridge + '\n' + bootMarker);

  const mainDom = new JSDOM(mainHtml, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' });
  await wait(800);
  mainDom.window.localStorage.setItem('adl_handoff_v1', handoff);
  const result = mainDom.window.__applyAdlHandoff();
  assert(result.applied.length === 3, '本体側で3項目とも適用された: ' + JSON.stringify(result));

  const adl = mainDom.window.__getStateAdl();
  assert(adl.dressing==='まあできる' && adl.toilet==='援助があれば' && adl.eating==='できない',
    '本体のstate.adlに3項目とも正しい値で反映されている: ' + JSON.stringify(adl));

  console.log(process.exitCode === 1 ? 'MULTI ITEM HANDOFF: FAILURES ABOVE' : 'MULTI ITEM HANDOFF: ALL PASSED');
  process.exit(process.exitCode||0);
})();
