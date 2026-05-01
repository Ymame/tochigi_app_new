let timetable = {};
let routeGuides = {};

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

function searchRoute() {
  const departure = document.getElementById("departure-select").value;
  const arrival = document.getElementById("arrival-select").value;
  const resultArea = document.getElementById("route-search-result");

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

  let html = `
    <h4>検索結果</h4>
    <p><strong>${departure}</strong> から <strong>${arrival}</strong></p>
    <p class="current-time">現在時刻：${getCurrentTimeText()}</p>
  `;

  let found = false;

  for (let routeName in departureData) {
    if (!arrivalData[routeName]) continue;

    for (let directionName in departureData[routeName]) {
      if (!arrivalData[routeName][directionName]) continue;

      const departureTimes = departureData[routeName][directionName];
      const arrivalTimes = arrivalData[routeName][directionName];

      const plans = createBusPlans(
        routeName,
        directionName,
        departureTimes,
        arrivalTimes
      );

      if (plans.length > 0) {
        found = true;
        html += plans.join("");
      }
    }
  }

  if (!found) {
    html += `
      <p>同じ路線・同じ方面で到着時刻を計算できる候補がありません。</p>
      <p style="font-size:12px; color:#666;">
        ※今後、乗換や別方面の判定を追加できます。
      </p>
    `;
  }

  resultArea.innerHTML = html;
}

function createBusPlans(routeName, directionName, departureTimes, arrivalTimes) {
  const plans = [];

  for (let i = 0; i < departureTimes.length; i++) {
    const departureTime = departureTimes[i];
    const arrivalTime = arrivalTimes[i];

    if (!arrivalTime) continue;

    const departureMinutes = timeToMinutes(departureTime);
    const arrivalMinutes = timeToMinutes(arrivalTime);
    const currentMinutes = getCurrentMinutes();

    if (departureMinutes < currentMinutes) continue;

    const requiredMinutes = arrivalMinutes - departureMinutes;

    if (requiredMinutes < 0) continue;

    plans.push(`
      <div class="search-result-card">
        <p><strong>${routeName} / ${directionName}</strong></p>
        ${getDirectionGuide(routeName, directionName) ? `<p>${getDirectionGuide(routeName, directionName)}</p>` : ""}

        <p style="font-size:20px; font-weight:bold;">
          出発 ${departureTime} → 到着 ${arrivalTime}
        </p>

        <p>所要時間：${requiredMinutes} 分</p>
        <p>出発まで：${departureMinutes - currentMinutes} 分</p>

        <div class="all-times-box">
          <p class="all-times-title">出発地の全時刻</p>
          <p class="all-times-list">${departureTimes.join(" / ")}</p>
        </div>
      </div>
    `);
  }

  return plans;
}

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

function getDirectionGuide(routeName, directionName) {
  if (routeGuides[routeName] && routeGuides[routeName][directionName]) {
    return routeGuides[routeName][directionName];
  }

  return "";
}

loadTimetable();