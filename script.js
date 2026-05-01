/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】共通データ */
/* timetable.json から読み込んだデータを入れる */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

let timetable = {};
let routeGuides = {};


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】画面切り替え */
/* 上部タブと表示画面を切り替える */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function showSection(sectionId, clickedButton) {
  const sections = document.querySelectorAll(".content-section");

  sections.forEach(section => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");

  const menuButtons = document.querySelectorAll(".menu-button");

  menuButtons.forEach(button => {
    button.classList.remove("active");
  });

  if (clickedButton) {
    clickedButton.classList.add("active");
  } else {
    const targetButton = document.querySelector(`.menu-button[data-section="${sectionId}"]`);

    if (targetButton) {
      targetButton.classList.add("active");
    }
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻表データ読み込み */
/* timetable.json を読み込み、選択欄を作る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

async function loadTimetable() {
  try {
    const response = await fetch("timetable.json");

    if (!response.ok) {
      throw new Error("timetable.json を読み込めませんでした");
    }

    const data = await response.json();

    timetable = data.stops || {};
    routeGuides = data.routeGuides || {};

    renderRouteSelects();

  } catch (error) {
    console.error(error);
    alert("時刻表データの読み込みに失敗しました。");
  }
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】出発地・到着地セレクト生成 */
/* 停留所一覧をselectに入れる */
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
/* 【大項目】ルート検索 */
/* 出発地・到着地・並び順をもとに検索する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function searchRoute() {
  const departure = document.getElementById("departure-select").value;
  const arrival = document.getElementById("arrival-select").value;
  const resultArea = document.getElementById("route-search-result");

  const checkedSort = document.querySelector('input[name="sort-type"]:checked');
  const sortType = checkedSort ? checkedSort.value : "departure";

  if (!departure || !arrival) {
    resultArea.innerHTML = `<p>出発地と到着地を両方選んでください。</p>`;
    return;
  }

  if (departure === arrival) {
    resultArea.innerHTML = `<p>出発地と到着地が同じです。</p>`;
    return;
  }

  const departureData = timetable[departure];
  const arrivalData = timetable[arrival];

  if (!departureData || !arrivalData) {
    resultArea.innerHTML = `<p>検索に必要な時刻表データがありません。</p>`;
    return;
  }

  let plans = [];

  for (let routeName in departureData) {
    if (!arrivalData[routeName]) continue;

    for (let directionName in departureData[routeName]) {
      if (!arrivalData[routeName][directionName]) continue;

      const departureTimes = departureData[routeName][directionName];
      const arrivalTimes = arrivalData[routeName][directionName];

      plans = plans.concat(
        createBusPlanObjects(
          routeName,
          directionName,
          departureTimes,
          arrivalTimes
        )
      );
    }
  }

  plans = sortPlans(plans, sortType);

  let html = `
    <h4>検索結果</h4>
    <p><strong>${departure}</strong> から <strong>${arrival}</strong></p>
    <p class="current-time">現在時刻：${getCurrentTimeText()}</p>
  `;

  if (plans.length === 0) {
    html += `
      <p>同じ路線・同じ方面で到着時刻を計算できる候補がありません。</p>
      <p style="font-size:12px; color:#666;">
        ※今後、乗換や別方面の判定を追加できます。
      </p>
    `;

    resultArea.innerHTML = html;
    return;
  }

  html += plans.map(plan => createBusPlanHtml(plan)).join("");

  resultArea.innerHTML = html;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】検索結果データ作成 */
/* 表示前に、計算しやすい形のデータへ変換する */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function createBusPlanObjects(routeName, directionName, departureTimes, arrivalTimes) {
  const plans = [];
  const currentMinutes = getCurrentMinutes();

  for (let i = 0; i < departureTimes.length; i++) {
    const departureTime = departureTimes[i];
    const arrivalTime = arrivalTimes[i];

    if (!arrivalTime) continue;

    const departureMinutes = timeToMinutes(departureTime);
    const arrivalMinutes = timeToMinutes(arrivalTime);

    if (departureMinutes < currentMinutes) continue;

    const durationMinutes = arrivalMinutes - departureMinutes;

    if (durationMinutes < 0) continue;

    plans.push({
      routeName,
      directionName,
      departureTime,
      arrivalTime,
      departureMinutes,
      arrivalMinutes,
      durationMinutes,
      untilDepartureMinutes: departureMinutes - currentMinutes,
      departureTimes
    });
  }

  return plans;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】検索結果の並び替え */
/* 所要時間・出発時間・到着時間で並び替える */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function sortPlans(plans, sortType) {
  return plans.sort((a, b) => {
    if (sortType === "duration") {
      return a.durationMinutes - b.durationMinutes;
    }

    if (sortType === "arrival") {
      return a.arrivalMinutes - b.arrivalMinutes;
    }

    return a.departureMinutes - b.departureMinutes;
  });
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】検索結果HTML作成 */
/* 1件分の検索結果カードを作る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function createBusPlanHtml(plan) {
  const guide = getDirectionGuide(plan.routeName, plan.directionName);

  return `
    <div class="search-result-card">
      <p><strong>${plan.routeName} / ${plan.directionName}</strong></p>
      ${guide ? `<p>${guide}</p>` : ""}

      <p class="plan-main-time">
        出発 ${plan.departureTime} → 到着 ${plan.arrivalTime}
      </p>

      <p class="plan-info">所要時間：${plan.durationMinutes} 分</p>
      <p class="plan-info">出発まで：${plan.untilDepartureMinutes} 分</p>

      <div class="all-times-box">
        <p class="all-times-title">出発地の全時刻</p>
        <p class="all-times-list">${plan.departureTimes.join(" / ")}</p>
      </div>
    </div>
  `;
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】時刻計算 */
/* "7:20" を分に変換して計算する */
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


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】方面補足 */
/* timetable.json の routeGuides から説明を取る */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

function getDirectionGuide(routeName, directionName) {
  if (routeGuides[routeName] && routeGuides[routeName][directionName]) {
    return routeGuides[routeName][directionName];
  }

  return "";
}


/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/
/* 【大項目】初期実行 */
/* ページを開いたときに時刻表を読む */
/*■■■■■■■■■■■■■■■■■■■■■■■■■■■■*/

loadTimetable();