// ADL探索画面（例：adl_eating_pilot.html） → index.html本体 への受け渡しコネクタ（試作・本体へは未統合）
//
// 役割：
//   探索画面側が保存した localStorage の 'adl_handoff_v1' を読み、
//   本体の state.adl へ、ADL_ITEMSに実在するキー・ADL_LEVEL_TO_NUMに実在する値だけを反映する。
//
// 渡さないもの：
//   気づいたことリストなどのチェック詳細。handoffデータにそもそも含まれないため、扱わない
//   （探索画面側で「本体には渡さない」と決めているため）。
//
// 前提：
//   この関数は index.html 本体のスクリプトと同じ<script>ブロック内で実行される想定。
//   state / ADL_ITEMS / ADL_LEVEL_TO_NUM は、本体側で既に定義されている同名の変数を
//   そのまま参照する（このファイル単体では動かない。本体へ組み込んで初めて動く）。
//
// 本体への組み込みイメージ（未実施・今回はここまで）：
//   resetState() の後、または loadStateFromStorage() の後など、state が使える場所で
//   applyAdlHandoff() を呼ぶ。呼んだ後は本体既存の保存関数（saveDraft等）で保存すれば、
//   次回起動時にも反映済みの状態が復元される。
//
// 安全設計：
//   - ADL_ITEMSに存在しないキー、ADL_LEVEL_TO_NUMに存在しない値は無視する（skippedに集計）。
//   - state.adlの他のキー（他のADL項目の結果）は一切触らない。渡された分だけ上書きする。
//   - JSON.parseに失敗した場合・データが無い場合は何もしない（例外を投げない）。

var ADL_HANDOFF_KEY = 'adl_handoff_v1';

function applyAdlHandoff(){
  var result = {applied:[], skipped:[]};
  var raw;
  try{ raw = localStorage.getItem(ADL_HANDOFF_KEY); }catch(e){ return result; }
  if(!raw) return result;

  var data;
  try{ data = JSON.parse(raw); }catch(e){ return result; }
  if(!data || typeof data !== 'object'){ return result; }

  var validKeys = {};
  ADL_ITEMS.forEach(function(pair){ validKeys[pair[0]] = true; });

  if(!state.adl || typeof state.adl !== 'object'){ state.adl = {}; }

  Object.keys(data).forEach(function(key){
    var level = data[key];
    if(validKeys[key] && Object.prototype.hasOwnProperty.call(ADL_LEVEL_TO_NUM, level)){
      state.adl[key] = level;
      result.applied.push(key);
    } else {
      result.skipped.push(key);
    }
  });
  return result;
}
