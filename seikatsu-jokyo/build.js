// shared/ 配下の共通コードを src/**/*.src.html のテンプレートに差し込んで、
// 実際に開く／本体からリンクする pages/**/*.html を生成するビルドスクリプト。
//
// 使い方: node build.js  または  npm run build
//         npm test は pretest として自動でこれを実行してからテストする。
//
// ルール：
//   - オープニング画面の「動くしくみ」・★アイコンなど、現在版(genzai)・認定日版(ninteibi)
//     の両方で共通の部分            → shared/*.js を編集
//   - オープニング画面・🐥吹き出しなど、上記の見た目（CSS）    → shared/*.css を編集
//   - 各項目固有の内容・文言（チェック項目一覧・LEVELS・OPENING_MESSAGEなど）
//                                    → src/genzai/*.src.html または src/ninteibi/*.src.html を編集
//   - pages/ 配下のファイルを直接編集しない（このスクリプトで上書きされる）
//
// 仕組み：src/**/*.src.html を再帰的に探し、src/ からの相対パスをそのまま pages/ 配下に
// ミラーリングする（例：src/genzai/hub.src.html → pages/genzai/hub.html）。
// 各ファイル内の「// SHARED_JS: <名前>」という行（インデント含む）を shared/<名前>.js の
// 中身で、「/* SHARED_CSS: <名前> */」という行を shared/<名前>.css の中身で、それぞれ
// そのまま置き換える、単純なテキスト差し込み（2026-07-30、CSS重複の解消のため追加）。

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');
const PAGES_DIR = path.join(ROOT, 'pages');
const SHARED_DIR = path.join(ROOT, 'shared');

// マーカー名 -> shared/ 内のファイル名
const SHARED_FILES = {
  chick_widget: 'chick_widget.js',
  opening_screen: 'opening_screen.js',
  chat_origin: 'chat_origin.js'
};

// マーカー名 -> shared/ 内のCSSファイル名（hub.htmlはopening_screen.cssを使わないなど、
// JS側と対応関係が完全に同じとは限らないため、SHARED_FILESとは別に管理する）
const SHARED_CSS_FILES = {
  chick_widget: 'chick_widget.css',
  opening_screen: 'opening_screen.css'
};

function loadShared(fileMap) {
  const content = {};
  Object.keys(fileMap).forEach(key => {
    const filePath = path.join(SHARED_DIR, fileMap[key]);
    content[key] = fs.readFileSync(filePath, 'utf-8').replace(/\n$/, '');
  });
  return content;
}

// src/ 配下を再帰的に探索し、*.src.html の絶対パス一覧を返す
function findSrcFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findSrcFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.src.html')) {
      results.push(full);
    }
  });
  return results;
}

const JS_MARKER_RE = /^([ \t]*)\/\/ SHARED_JS: (\w+)\s*$/;
const CSS_MARKER_RE = /^([ \t]*)\/\* SHARED_CSS: (\w+) \*\/\s*$/;

function buildFile(srcPath, sharedJs, sharedCss) {
  const relFromSrc = path.relative(SRC_DIR, srcPath); // 例: genzai/hub.src.html
  const outRel = relFromSrc.replace(/\.src\.html$/, '.html'); // 例: genzai/hub.html
  const outPath = path.join(PAGES_DIR, outRel);

  const lines = fs.readFileSync(srcPath, 'utf-8').split('\n');
  const outLines = lines.map(line => {
    const jsMatch = line.match(JS_MARKER_RE);
    if (jsMatch) {
      const indent = jsMatch[1];
      const key = jsMatch[2];
      if (!(key in sharedJs)) {
        throw new Error('未知の共有コード名: "' + key + '" (' + relFromSrc + ')。' +
          'shared/ に対応するファイルがあるか、build.jsのSHARED_FILESに登録されているか確認してください。');
      }
      return sharedJs[key].split('\n').map(l => (l ? indent + l : l)).join('\n');
    }
    const cssMatch = line.match(CSS_MARKER_RE);
    if (cssMatch) {
      const indent = cssMatch[1];
      const key = cssMatch[2];
      if (!(key in sharedCss)) {
        throw new Error('未知の共有CSS名: "' + key + '" (' + relFromSrc + ')。' +
          'shared/ に対応する.cssファイルがあるか、build.jsのSHARED_CSS_FILESに登録されているか確認してください。');
      }
      return sharedCss[key].split('\n').map(l => (l ? indent + l : l)).join('\n');
    }
    return line;
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, outLines.join('\n'));
  return outRel;
}

function main() {
  const sharedJs = loadShared(SHARED_FILES);
  const sharedCss = loadShared(SHARED_CSS_FILES);
  const srcFiles = findSrcFiles(SRC_DIR);
  if (srcFiles.length === 0) {
    console.error('src/ 配下に *.src.html が見つかりません。');
    process.exit(1);
  }
  srcFiles.sort().forEach(srcPath => {
    const outRel = buildFile(srcPath, sharedJs, sharedCss);
    console.log('generated:', path.join('pages', outRel));
  });
}

main();
