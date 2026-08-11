// ---- 本体index.html（申立書サポート）の会話形式（決定#54〜57）から、項目別ページへ
//      ?from=chatで来たことを、軽くlocalStorageに記録するだけの共有部品（決定#58〜61）。
//      URLパラメータをファイル間で逐次引き継ぐ方式（?from=chatを次のページにも付け続ける）
//      ではなく、ハブ画面到達時にこのフラグの有無だけを見ればよいようにするための、
//      意図的にシンプルな実装（詳細はADL会話形式化_姉妹アプリ連携_設計案.md 6章「気づきB」）。
//      現在版(genzai)・認定日版(ninteibi)の両方から共有される想定のため、
//      文言を一切含まない「記録するだけ」の処理としてここに置く（バナー文言はhub側で持つ）。
//      中身を直すときはこのファイル（shared/chat_origin.js）を編集し、
//      `npm run build`（`npm test`はbuildしてから実行される）で各HTMLに反映すること。 ----
var CHAT_ORIGIN_KEY = 'adl_chat_origin_v1';
function recordChatOrigin(){
  try{ localStorage.setItem(CHAT_ORIGIN_KEY, '1'); }catch(e){}
}
