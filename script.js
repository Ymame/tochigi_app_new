/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】共通データ */
/* 【役割】timetable.json から読み込んだデータを保存する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

let timetable = {};
let routeGuides = {};


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】画面切り替え */
/* 【役割】ホーム・バス・路線図などの画面を切り替える */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function showSection(sectionId, clickedButton) {
  const sections = document.querySelectorAll(".content-section");

  sections.forEach(section => {
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(sectionId);

  if (targetSection) {
    targetSection.classList.add("active");
  }

  const menuButtons = document.querySelectorAll(".menu-button");

  menuButtons.forEach(button => {
    button.classList.remove("active");
  });

  if (clickedButton) {
    clickedButton.classList.add("active");
    return;
  }

  const targetButton = document.querySelector(`.menu-button[data-section="${sectionId}"]`);

  if (targetButton) {
    targetButton.classList.add("active");
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻表データ読み込み */
/* 【役割】timetable.json を読み込んで検索に使えるようにする */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

async function loadTimetable() {
  const resultArea = document.getElementById("route-search-result");

  try {
    const response = await fetch("timetable.json");

    if (!response.ok) {
      throw new Error("timetable.json を読み込めませんでした");
    }

    const data = await response.json();

    timetable = data.stops || {};
    routeGuides = data.routeGuides || {};

    renderRouteSelects();

    resultArea.innerHTML = `<p class="message">出発地と到着地を選んで検索してください。</p>`;

  } catch (error) {
    console.error(error);

    resultArea.innerHTML = `
      <p class="error-message">時刻表データの読み込みに失敗しました。</p>
      <p class="message">timetable.json が index.html と同じ場所にあるか確認してください。</p>
    `;
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】出発地・到着地セレクト生成 */
/* 【役割】timetable.json の停留所名から選択欄を作る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function renderRouteSelects() {
  const departureSelect = document.getElementById("departure-select");
  const arrivalSelect = document.getElementById("arrival-select");

  if (!departureSelect || !arrivalSelect) return;

  const stopNames = Object.keys(timetable);

  const optionsHtml = `
    <option value="">選択してください</option>
    ${stopNames.map(stopName => `<option value="${stopName}">${stopName}</option>`).join("")}
  `;

  departureSelect.innerHTML = optionsHtml;
  arrivalSelect.innerHTML = optionsHtml;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時間条件の表示切り替え */
/* 【役割】現在時刻なら time 入力欄を隠し、時間指定なら表示する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function changeTimeMode() {
  const timeInput = document.getElementById("time-input");
  const timeMode = getCheckedValue("time-mode", "now");

  if (timeMode === "now") {
    timeInput.classList.add("hidden");
    timeInput.value = "";
    return;
  }

  timeInput.classList.remove("hidden");

  if (!timeInput.value) {
    timeInput.value = getCurrentTimeText();
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】ルート検索 */
/* 【役割】出発地・到着地・時間条件・並び順から候補を表示する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function searchRoute() {
  const departure = document.getElementById("departure-select").value;
  const arrival = document.getElementById("arrival-select").value;
  const timeMode = getCheckedValue("time-mode", "now");
  const sortType = getCheckedValue("sort-type", "departure");
  const timeInputValue = document.getElementById("time-input").value;
  const resultArea = document.getElementById("route-search-result");

  if (!departure || !arrival) {
    resultArea.innerHTML = `<p class="error-message">出発地と到着地を両方選んでください。</p>`;
    return;
  }

  if (departure === arrival) {
    resultArea.innerHTML = `<p class="error-message">出発地と到着地が同じです。別の停留所を選んでください。</p>`;
    return;
  }

  if (timeMode !== "now" && !timeInputValue) {
    resultArea.innerHTML = `<p class="error-message">指定する時間を入力してください。</p>`;
    return;
  }

  const departureData = timetable[departure];
  const arrivalData = timetable[arrival];

  if (!departureData || !arrivalData) {
    resultArea.innerHTML = `<p class="error-message">検索に必要な時刻表データがありません。</p>`;
    return;
  }

  const baseMinutes = getSearchBaseMinutes(timeMode, timeInputValue);

  let plans = createAllPlans(departureData, arrivalData, baseMinutes, timeMode);

  plans = sortPlans(plans, sortType);

  renderSearchResults({
    resultArea,
    departure,
    arrival,
    plans,
    timeMode,
    timeInputValue,
    sortType
  });
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】候補データ作成 */
/* 【役割】同じ路線・同じ方面で乗れる候補を作る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function createAllPlans(departureData, arrivalData, baseMinutes, timeMode) {
  let plans = [];

  for (let routeName in departureData) {
    if (!arrivalData[routeName]) continue;

    for (let directionName in departureData[routeName]) {
      if (!arrivalData[routeName][directionName]) continue;

      const departureTimes = departureData[routeName][directionName];
      const arrivalTimes = arrivalData[routeName][directionName];

      const routePlans = createBusPlanObjects({
        routeName,
        directionName,
        departureTimes,
        arrivalTimes,
        baseMinutes,
        timeMode
      });

      plans = plans.concat(routePlans);
    }
  }

  return plans;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】1路線分の候補作成 */
/* 【役割】出発時刻・到着時刻・所要時間を計算する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function createBusPlanObjects(params) {
  const plans = [];

  const routeName = params.routeName;
  const directionName = params.directionName;
  const departureTimes = params.departureTimes;
  const arrivalTimes = params.arrivalTimes;
  const baseMinutes = params.baseMinutes;
  const timeMode = params.timeMode;

  for (let i = 0; i < departureTimes.length; i++) {
    const departureTime = departureTimes[i];
    const arrivalTime = arrivalTimes[i];

    if (!departureTime || !arrivalTime) continue;

    const departureMinutes = timeToMinutes(departureTime);
    const arrivalMinutes = timeToMinutes(arrivalTime);
    const durationMinutes = arrivalMinutes - departureMinutes;

    if (durationMinutes < 0) continue;

    if (timeMode === "now" && departureMinutes < baseMinutes) continue;
    if (timeMode === "departure" && departureMinutes < baseMinutes) continue;
    if (timeMode === "arrival" && arrivalMinutes > baseMinutes) continue;

    plans.push({
      routeName,
      directionName,
      departureTime,
      arrivalTime,
      departureMinutes,
      arrivalMinutes,
      durationMinutes,
      untilDepartureMinutes: departureMinutes - getCurrentMinutes()
    });
  }

  return plans;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】検索結果表示 */
/* 【役割】候補がある場合・ない場合の画面表示を作る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function renderSearchResults(params) {
  const resultArea = params.resultArea;
  const departure = params.departure;
  const arrival = params.arrival;
  const plans = params.plans;
  const timeMode = params.timeMode;
  const timeInputValue = params.timeInputValue;
  const sortType = params.sortType;

  let conditionText = "現在時刻から探す";

  if (timeMode === "departure") {
    conditionText = `${timeInputValue} 以降に出発`;
  }

  if (timeMode === "arrival") {
    conditionText = `${timeInputValue} までに到着`;
  }

  let html = `
    <div class="result-summary">
      <p><strong>${departure}</strong> から <strong>${arrival}</strong></p>
      <p>検索条件：${conditionText}</p>
      <p>並び順：${getSortLabel(sortType)}</p>
    </div>
  `;

  if (plans.length === 0) {
    html += `
      <p class="error-message">条件に合うバスが見つかりませんでした。</p>
      <p class="message">時間を変えるか、出発地・到着地を変えて検索してください。</p>
    `;

    resultArea.innerHTML = html;
    return;
  }

  html += plans.map(plan => createBusPlanHtml(plan)).join("");

  resultArea.innerHTML = html;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】検索結果カードHTML作成 */
/* 【役割】1件分の候補を見やすいカードにする */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function createBusPlanHtml(plan) {
  const guide = getDirectionGuide(plan.routeName, plan.directionName);
  const untilText = createUntilDepartureText(plan.untilDepartureMinutes);

  return `
    <div class="search-result-card">
      <span class="badge">${plan.routeName}</span>

      <p class="plan-main-time">
        ${plan.departureTime} → ${plan.arrivalTime}
      </p>

      <p class="plan-info">方面：${plan.directionName}</p>
      <p class="plan-info">所要時間：約${plan.durationMinutes}分</p>
      <p class="plan-info">${untilText}</p>

      ${
        guide
          ? `<p class="plan-info">目安：${guide}</p>`
          : ""
      }
    </div>
  `;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】並び替え */
/* 【役割】出発時刻・到着時刻・所要時間で並べ替える */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function sortPlans(plans, sortType) {
  return plans.sort((a, b) => {
    if (sortType === "arrival") {
      return a.arrivalMinutes - b.arrivalMinutes;
    }

    if (sortType === "duration") {
      return a.durationMinutes - b.durationMinutes;
    }

    return a.departureMinutes - b.departureMinutes;
  });
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】方面案内 */
/* 【役割】routeGuides から補足説明を取り出す */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function getDirectionGuide(routeName, directionName) {
  if (!routeGuides[routeName]) return "";
  if (!routeGuides[routeName][directionName]) return "";

  return routeGuides[routeName][directionName];
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻計算 */
/* 【役割】"7:20" のような時刻を計算しやすい分に変換する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function timeToMinutes(timeStr) {
  const parts = timeStr.split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

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

function getSearchBaseMinutes(timeMode, timeInputValue) {
  if (timeMode === "now") {
    return getCurrentMinutes();
  }

  return timeToMinutes(timeInputValue);
}

function createUntilDepartureText(untilDepartureMinutes) {
  if (untilDepartureMinutes < 0) {
    return "現在時刻より前の便です";
  }

  if (untilDepartureMinutes === 0) {
    return "まもなく出発";
  }

  return `現在時刻から約${untilDepartureMinutes}分後に出発`;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】共通補助 */
/* 【役割】ラジオボタンの選択値などを取得する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function getCheckedValue(name, defaultValue) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);

  if (!checked) {
    return defaultValue;
  }

  return checked.value;
}

function getSortLabel(sortType) {
  if (sortType === "arrival") {
    return "到着時間順";
  }

  if (sortType === "duration") {
    return "所要時間順";
  }

  return "出発時間順";
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】初期実行 */
/* 【役割】ページを開いた時に時刻表を読み込む */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

document.addEventListener("DOMContentLoaded", () => {
  loadTimetable();
});