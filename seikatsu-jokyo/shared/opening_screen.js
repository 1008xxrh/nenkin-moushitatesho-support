// ---- オープニング（ADLセクション全体の入口。項目ファイルを単体で直接開いたときに
//      表示する「ようこそ」画面）と、チェック画面で使う★アイコン。
//      現在版(genzai)・認定日版(ninteibi)の両方から共有される、文言を一切含まない
//      「動くしくみ」だけを置く（OPENING_MESSAGE自体は各eraのsrc側で定義され、
//      ここでは変数名として参照するだけなので、このファイル自体はどちらのeraでも
//      そのまま使い回せる）。
//      hub.html自身はこのファイルを使わず、独自のrender()で入口を表示している。
//      TODO(将来・未着手): この画面が実際に10項目共通の入口として機能するようになったら、
//      画面下（はじめるボタンの下あたり）に、10項目それぞれの「①はじめに」へ直接飛べる
//      ボタン一覧を置くアイデアあり。今は保留。
//      中身を直すときはこのファイル（shared/opening_screen.js）を編集し、
//      `npm run build`（`npm test`はbuildしてから実行される）で各HTMLに反映すること。 ----
function renderOpening(){
  var root = document.getElementById('screen-root');
  var progress = document.getElementById('progress');
  var footer = document.getElementById('footer-nav');
  progress.textContent = '';
  footer.innerHTML = '';
  root.innerHTML =
    '<div class="opening-wrap">'+
      '<div class="opening-hiyoko">🐥</div>'+
      chickBubbleHtml('opening', OPENING_MESSAGE)+
      '<button class="btn btn-primary opening-start" id="openingStartBtn" style="display:none;">はじめる</button>'+
      '<p class="opening-standalone-note">ほかの生活状況の項目や、この記録の使い方については「← 生活状況の一覧へ戻る」から見られます。</p>'+
    '</div>';
  document.getElementById('openingStartBtn').addEventListener('click', function(){
    step = 0;
    render();
  });
  wireChickBubble('opening', OPENING_MESSAGE, function(){
    var btn = document.getElementById('openingStartBtn');
    if(btn){ btn.style.display = 'block'; }
  });
}

function starSvg(on){
  var fill = on ? 'var(--star-on)' : 'var(--star-off)';
  var ring = on ? '<circle cx="10" cy="10" r="8.5" fill="none" stroke="var(--star-on-ring)" stroke-width="1"/>' : '';
  return '<svg viewBox="0 0 20 20" class="item-star">'+ring+'<circle cx="10" cy="10" r="6" fill="'+fill+'"/></svg>';
}
