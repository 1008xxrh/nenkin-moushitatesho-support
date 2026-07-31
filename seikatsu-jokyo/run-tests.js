// ADLセクション（現在版・認定日版）のテスト一括実行。
// 使い方：npm install してから node run-tests.js
// tests/配下（fixtures/を除く）の各*.jsファイルを再帰的に探し、Node子プロセスで実行して
// exit codeでpass/failを集計する。本体アプリ（index.html側）のrun-tests.jsと同じ発想の簡易版。

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const testsDir = path.join(__dirname, 'tests');

// tests/ 配下を再帰的に探索し、*.jsファイルの絶対パス一覧を返す（fixtures/は除外）
function findTestFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    if (entry.name === 'fixtures') return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findTestFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  });
  return results;
}

const files = findTestFiles(testsDir).sort();

let pass = 0;
let fail = 0;

files.forEach(full => {
  const label = path.relative(testsDir, full); // 例: genzai/test_hub.js
  try {
    execFileSync('node', [full], { stdio: 'pipe', timeout: 20000 });
    console.log('PASS -', label);
    pass++;
  } catch (err) {
    console.log('FAIL -', label);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.log(err.stderr.toString());
    fail++;
  }
});

console.log('----');
console.log(`${files.length}件中 ${pass}件成功 / ${fail}件失敗`);
process.exit(fail > 0 ? 1 : 0);
