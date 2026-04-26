/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* JavaScript基本メモ（初心者向け） */
/* JavaScript = HTMLで置いた部品に「動き」を付けるファイル */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*
【let】
あとから中身を変更できる変数。

【const】
あとから中身を変更しない変数。

【function】
処理をまとめる書き方。
同じ処理を何度も使える。

【async / await】
データ読み込みなど、少し時間がかかる処理を順番に書くための仕組み。

【fetch】
外部ファイルやURLからデータを読み込む。

【try / catch】
エラーが起きる可能性がある処理を書く。
失敗した時に catch 側で対応できる。

【document】
HTML全体をJavaScriptから操作する入口。

【getElementById】
id を指定してHTML部品を1つ探す。

【querySelectorAll】
条件に合うHTML部品をすべて探す。

【classList.add】
HTML部品に class を追加する。

【classList.remove】
HTML部品から class を削除する。

【innerHTML】
HTML部品の中身を書き換える。

【Object.keys】
オブジェクトのキー名だけを一覧にする。

【map】
配列の中身を1つずつ変換する。

【filter】
条件に合うものだけを残す。

【join】
配列を文字列につなげる。

【includes】
文字が含まれているか調べる。

【return】
関数の結果を返す。

【new Date()】
現在の日付や時刻を取得する。
*/


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】共通データ入れ物 */
/* timetable.json から読み込んだデータを保存する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*
【timetable】
停留所ごとの時刻表データを入れる。

【routeGuides】
路線・方面ごとの補足説明を入れる。

最初は空の {} にしておき、
loadTimetable() で timetable.json から読み込んだ内容を入れる。
*/

let timetable = {};
let routeGuides = {};


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】画面切り替え */
/* メニューを押したときに、表示する画面を切り替える */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*==============================*/
/* 【中項目】指定した画面だけ表示する */
/* index.html の onclick="showSection('bus')" などから呼び出される */
/*==============================*/

function showSection(sectionId) {
  /*
    【引数】
    sectionId:
    表示したい section の id。
    例：home / bus / routeMap / kurataku / places

    【処理内容】
    1. class="content-section" の画面を全部取得
    2. 全画面から active を外して非表示にする
    3. 指定された画面だけ active を付けて表示する
  */

  const sections = document.querySelectorAll(".content-section");

  sections.forEach(section => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻表データ読み込み */
/* timetable.json を読み込んで、アプリ内で使える形にする */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*==============================*/
/* 【中項目】timetable.json を読み込む */
/* ページを開いたときに最初に実行される重要処理 */
/*==============================*/

async function loadTimetable() {
  /*
    【処理内容】
    1. 停留所ボタン表示エリアを取得
    2. timetable.json を読み込む
    3. 読み込みに失敗したらエラーにする
    4. JSONデータに変換する
    5. stops を timetable に入れる
    6. routeGuides を routeGuides に入れる
    7. 停留所ボタンを表示する

    【重要】
    GitHub Pages で使う場合、
    timetable.json が index.html と同じ階層に必要。
  */

  const stopButtonsArea = document.getElementById("stop-buttons");

  try {
    const response = await fetch("timetable.json");

    if (!response.ok) {
      throw new Error("timetable.json を読み込めませんでした");
    }

    const data = await response.json();

    timetable = data.stops || {};
    routeGuides = data.routeGuides || {};

    renderStopButtons();

  } catch (error) {
    console.error(error);

    stopButtonsArea.innerHTML = `
      <p>時刻表データの読み込みに失敗しました。</p>
      <p>timetable.json が同じ階層にあるか確認してください。</p>
    `;
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】停留所ボタン生成 */
/* 読み込んだ時刻表データから、停留所ボタンを自動で作る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*==============================*/
/* 【中項目】停留所ボタンを表示する */
/* 検索欄に入力された文字で停留所を絞り込む */
/*==============================*/

function renderStopButtons() {
  /*
    【処理内容】
    1. 停留所ボタン表示エリアを取得
    2. 検索欄の文字を取得
    3. timetable の停留所名を一覧にする
    4. 検索文字を含む停留所だけ残す
    5. ボタンHTMLを作る
    6. stop-buttons の中身を書き換える
  */

  const stopButtonsArea = document.getElementById("stop-buttons");
  const searchInput = document.getElementById("stop-search");

  const keyword = searchInput ? searchInput.value.trim() : "";

  const stopNames = Object.keys(timetable).filter(stopName => {
    return keyword === "" || stopName.includes(keyword);
  });

  if (stopNames.length === 0) {
    stopButtonsArea.innerHTML = `<p>該当する停留所がありません。</p>`;
    return;
  }

  stopButtonsArea.innerHTML = stopNames.map(stopName => `
    <button class="stop-button" onclick="showTimetable('${escapeSingleQuote(stopName)}')">
      ${stopName}
    </button>
  `).join("");
}


/*==============================*/
/* 【中項目】シングルクォート対策 */
/* 停留所名に ' が入っても onclick が壊れないようにする */
/*==============================*/

function escapeSingleQuote(text) {
  /*
    【例】
    O'Brien という文字がある場合、
    onclick の中でエラーにならないようにする。
  */

  return text.replace(/'/g, "\\'");
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻計算 */
/* 現在時刻とバス時刻を比較するための処理 */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*==============================*/
/* 【中項目】時刻を分に変換する */
/* "7:20" → 440 のように計算しやすい形にする */
/*==============================*/

function timeToMinutes(timeStr) {
  /*
    【処理内容】
    "7:20" を ":" で分ける
    hour = 7
    minute = 20

    7 * 60 + 20 = 440
  */

  const [hour, minute] = timeStr.split(":").map(Number);

  return hour * 60 + minute;
}


/*==============================*/
/* 【中項目】現在時刻を分で取得する */
/* 例：8時30分 → 510 */
/*==============================*/

function getCurrentMinutes() {
  /*
    【目的】
    バス時刻と現在時刻を比較しやすくする。
  */

  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
}


/*==============================*/
/* 【中項目】現在時刻を文字で取得する */
/* 例：8時5分 → "08:05" */
/*==============================*/

function getCurrentTimeText() {
  /*
    【padStart(2, "0")】
    1桁の数字を2桁にする。
    例：8 → 08
  */

  const now = new Date();

  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${hour}:${minute}`;
}


/*==============================*/
/* 【中項目】次のバスを探す */
/* 現在時刻以降で、一番近いバスを返す */
/*==============================*/

function getNextBusInfo(timeArray) {
  /*
    【引数】
    timeArray:
    ある路線・方面の時刻一覧。
    例：["7:20", "9:20", "11:20"]

    【戻り値】
    次のバスがある場合：
    {
      nextTime: "9:20",
      diffMinutes: 15,
      finished: false
    }

    本日の運行が終了している場合：
    {
      nextTime: null,
      diffMinutes: null,
      finished: true
    }
  */

  const currentMinutes = getCurrentMinutes();

  for (let time of timeArray) {
    const busMinutes = timeToMinutes(time);

    if (busMinutes >= currentMinutes) {
      const diff = busMinutes - currentMinutes;

      return {
        nextTime: time,
        diffMinutes: diff,
        finished: false
      };
    }
  }

  return {
    nextTime: null,
    diffMinutes: null,
    finished: true
  };
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】方面案内 */
/* 東回り・西回りの色分けと補足説明を扱う */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*==============================*/
/* 【中項目】方面名からCSS用class名を決める */
/* 東回り → east / 西回り → west */
/*==============================*/

function getDirectionClass(directionName) {
  /*
    【目的】
    CSSで色分けするための class 名を返す。

    東を含む → east
    西を含む → west
    それ以外 → 空文字
  */

  if (directionName.includes("東")) {
    return "east";
  }

  if (directionName.includes("西")) {
    return "west";
  }

  return "";
}


/*==============================*/
/* 【中項目】方面の補足説明を取得する */
/* routeGuides から「どちら方面か」の説明を探す */
/*==============================*/

function getDirectionGuide(routeName, directionName) {
  /*
    【例】
    routeGuides["市街地循環線"]["東回り"]
    のように補足説明を取得する。

    データがない場合は空文字を返す。
  */

  if (routeGuides[routeName] && routeGuides[routeName][directionName]) {
    return routeGuides[routeName][directionName];
  }

  return "";
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】次のバス表示HTML作成 */
/* 次のバスカードをHTML文字列として作る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*==============================*/
/* 【中項目】次のバスカードを作る */
/* 運行終了なら終了表示、次の便があれば時刻と残り分を表示 */
/*==============================*/

function createNextBusHtml(routeName, directionName, timeArray) {
  /*
    【処理内容】
    1. 次のバス情報を取得
    2. 東回り・西回りのclass名を取得
    3. 方面の補足説明を取得
    4. HTML文字列を作って返す
  */

  const nextBus = getNextBusInfo(timeArray);
  const directionClass = getDirectionClass(directionName);
  const guide = getDirectionGuide(routeName, directionName);

  if (nextBus.finished) {
    return `
      <div class="next-bus-card finished ${directionClass}">
        <p class="next-bus-route">${routeName} / ${directionName}</p>
        ${guide ? `<p class="next-bus-guide">${guide}</p>` : ""}
        <p class="next-bus-text">本日の運行は終了しました</p>
      </div>
    `;
  }

  return `
    <div class="next-bus-card ${directionClass}">
      <p class="next-bus-route">${routeName} / ${directionName}</p>
      ${guide ? `<p class="next-bus-guide">${guide}</p>` : ""}
      <p class="next-bus-time">${nextBus.nextTime}</p>
      <p class="next-bus-text">あと ${nextBus.diffMinutes} 分</p>
    </div>
  `;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻表表示 */
/* 選択した停留所の時刻表を画面に表示する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*==============================*/
/* 【中項目】停留所の時刻表を表示する */
/* 停留所ボタンを押したときに呼び出される */
/*==============================*/

function showTimetable(stopName) {
  /*
    【引数】
    stopName:
    選択された停留所名。

    【処理内容】
    1. 時刻表表示エリアを取得
    2. 選択された停留所のデータを取得
    3. データがなければ「データなし」と表示
    4. 次のバス一覧を作る
    5. 路線ごとの時刻表を作る
    6. timetable-area に表示する
  */

  const area = document.getElementById("timetable-area");
  const data = timetable[stopName];

  if (!data) {
    area.innerHTML = `
      <h3>${stopName}</h3>
      <p>時刻表データがありません。</p>
    `;
    return;
  }

  let html = `
    <h3>${stopName}</h3>
    <p class="current-time">現在時刻：${getCurrentTimeText()}</p>
    <div class="next-bus-summary">
      <h4>次のバス</h4>
  `;

  for (let route in data) {
    for (let direction in data[route]) {
      html += createNextBusHtml(route, direction, data[route][direction]);
    }
  }

  html += `</div>`;

  for (let route in data) {
    html += `<div class="route-block">`;
    html += `<h4>${route}</h4>`;

    for (let direction in data[route]) {
      const directionClass = getDirectionClass(direction);
      const guide = getDirectionGuide(route, direction);

      html += `
        <div class="direction-block ${directionClass}">
          <p class="direction-title">${direction}</p>
          ${guide ? `<p class="direction-guide">${guide}</p>` : ""}
          <p class="time-list">${data[route][direction].join(" / ")}</p>
        </div>
      `;
    }

    html += `</div>`;
  }

  area.innerHTML = html;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】初期実行 */
/* ページを開いたときに時刻表データを読み込む */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

/*
【loadTimetable()】
ページを開いたら最初に実行する。

この1行があることで、
timetable.json を読み込み、
停留所ボタンが自動表示される。
*/

loadTimetable();