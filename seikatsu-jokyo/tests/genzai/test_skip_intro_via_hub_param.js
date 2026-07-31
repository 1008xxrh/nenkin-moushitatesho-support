const fs = require('fs');
const { JSDOM } = require('jsdom');
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function assert(c,m){ if(!c){console.error('FAIL:',m); process.exitCode=1;} else console.log('ok -',m); }

(async () => {
  // ---- ?from=hub 無し：これまで通り「ようこそ」から始まる ----
  const htmlD = fs.readFileSync(__dirname + '/../../pages/genzai/dressing.html', 'utf-8');
  const domPlain = new JSDOM(htmlD, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/dressing.html' });
  await wait(50);
  assert(domPlain.window.document.getElementById('openingBubble') !== null,
    'パラメータ無しで単体アクセスした場合は、従来通り「ようこそ」から始まる');

  // ---- ?from=hub 付き：はじめに画面から直接始まる ----
  const domHub = new JSDOM(htmlD, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/pages/genzai/dressing.html?from=hub' });
  await wait(50);
  const docHub = domHub.window.document;
  assert(docHub.getElementById('openingBubble') === null, '?from=hub付きでは「ようこそ」画面は出ない');
  assert(docHub.getElementById('introChickBubble') !== null, '?from=hub付きでは「はじめに」画面から直接始まる');
  assert(docHub.getElementById('progress').textContent === 'はじめに', 'progress表示も「はじめに」になっている');

  console.log(process.exitCode === 1 ? 'SKIP INTRO VIA HUB PARAM: FAILURES ABOVE' : 'SKIP INTRO VIA HUB PARAM: ALL PASSED');
  process.exit(process.exitCode||0);
})();
