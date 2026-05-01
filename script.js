/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】共通データ */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

let timetable = {};
let routeGuides = {};


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】画面切り替え */
/* タブ選択＋画面表示 */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function showSection(sectionId, clickedButton) {

  /*==============================*/
  /* 全画面を非表示 */
  /*==============================*/

  const sections = document.querySelectorAll(".content-section");

  sections.forEach(section => {
    section.classList.remove("active");
  });

  /*==============================*/
  /* 指定画面だけ表示 */
  /*==============================*/

  document.getElementById(sectionId).classList.add("active");


  /*==============================*/
  /* タブの選択状態を更新 */
  /*==============================*/

  const menuButtons = document.querySelectorAll(".menu-button");

  menuButtons.forEach(button => {
    button.classList.remove("active");
  });

  if (clickedButton) {
    clickedButton.classList.add("active");
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻表読み込み */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

async function loadTimetable() {

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
    `;
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】停留所ボタン */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function renderStopButtons() {

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


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】文字エスケープ */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function escapeSingleQuote(text) {
  return text.replace(/'/g, "\\'");
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻処理 */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function timeToMinutes(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentTimeText() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function getNextBusInfo(timeArray) {

  const currentMinutes = getCurrentMinutes();

  for (let time of timeArray) {
    const busMinutes = timeToMinutes(time);

    if (busMinutes >= currentMinutes) {
      return {
        nextTime: time,
        diffMinutes: busMinutes - currentMinutes,
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


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】方面処理 */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function getDirectionClass(directionName) {

  if (directionName.includes("東")) return "east";
  if (directionName.includes("西")) return "west";

  return "";
}

function getDirectionGuide(routeName, directionName) {

  if (routeGuides[routeName] && routeGuides[routeName][directionName]) {
    return routeGuides[routeName][directionName];
  }

  return "";
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】次のバス表示 */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function createNextBusHtml(routeName, directionName, timeArray) {

  const nextBus = getNextBusInfo(timeArray);
  const directionClass = getDirectionClass(directionName);
  const guide = getDirectionGuide(routeName, directionName);

  if (nextBus.finished) {
    return `
      <div class="next-bus-card finished ${directionClass}">
        <p>${routeName} / ${directionName}</p>
        ${guide ? `<p>${guide}</p>` : ""}
        <p>本日の運行は終了しました</p>
      </div>
    `;
  }

  return `
    <div class="next-bus-card ${directionClass}">
      <p>${routeName} / ${directionName}</p>
      ${guide ? `<p>${guide}</p>` : ""}
      <p>${nextBus.nextTime}</p>
      <p>あと ${nextBus.diffMinutes} 分</p>
    </div>
  `;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻表表示 */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function showTimetable(stopName) {

  const area = document.getElementById("timetable-area");
  const data = timetable[stopName];

  if (!data) {
    area.innerHTML = `<p>データなし</p>`;
    return;
  }

  let html = `
    <h3>${stopName}</h3>
    <p>現在時刻：${getCurrentTimeText()}</p>
  `;

  for (let route in data) {
    for (let direction in data[route]) {
      html += createNextBusHtml(route, direction, data[route][direction]);
    }
  }

  area.innerHTML = html;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【初期処理】 */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

loadTimetable();