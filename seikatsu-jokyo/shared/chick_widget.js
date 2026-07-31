// ---- 🐥のセリフ吹き出し（共通部品）。枠は最終文の全文サイズで最初から固定し、
//      タイプライター中も枠が動かないようにする。タップで即座に全文表示できる。
//      現在版(genzai)・認定日版(ninteibi)の両方から共有される、文言を一切含まない
//      「動くしくみ」だけを置く（2026-07-25、階層設計の合意により、以前ここにあった
//      OPENING_MESSAGEは各era（genzai/ninteibi）のsrc側に移した。認定日版では
//      「あなたの普段の生活の詰まりを…」ではなく別の文言になるため、文言そのものを
//      shared/に置くと2つのeraで使い回せなくなるため）。
//      中身を直すときはこのファイル（shared/chick_widget.js）を編集し、
//      `npm run build`（`npm test`はbuildしてから実行される）で各HTMLに反映すること。 ----
var chickTyping = false;
var chickInterval = null;

function chickBubbleHtml(idPrefix, message){
  return '<div class="opening-bubble" id="'+idPrefix+'Bubble">'+
      '<div class="opening-sizer" aria-hidden="true">'+message.split('\n').join('<br>')+'</div>'+
      '<div class="opening-text-overlay" id="'+idPrefix+'Text"></div>'+
    '</div>';
}

function wireChickBubble(idPrefix, message, onDone){
  var bubble = document.getElementById(idPrefix+'Bubble');
  var textEl = document.getElementById(idPrefix+'Text');
  bubble.addEventListener('click', function(){
    if(chickTyping){
      clearInterval(chickInterval);
      textEl.innerHTML = message.split('\n').join('<br>');
      chickTyping = false;
      if(onDone){ onDone(); }
    }
  });
  textEl.innerHTML = '';
  var i = 0;
  chickTyping = true;
  chickInterval = setInterval(function(){
    if(i < message.length){
      textEl.innerHTML += (message[i] === '\n' ? '<br>' : message[i]);
      i++;
    } else {
      clearInterval(chickInterval);
      chickTyping = false;
      if(onDone){ onDone(); }
    }
  }, 55);
}
