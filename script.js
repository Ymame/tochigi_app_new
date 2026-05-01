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

function changeTimeMode() {
  const timeMode = getCheckedRadioValue("time-mode", "now");
  const timeInput = document.getElementById("time-input");

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

function searchRoute() {
  const departure = document.getElementById("departure-select").value;
  const arrival = document.getElementById("arrival-select").value;
  const resultArea = document.getElementById("route-search-result");

  const timeMode = getCheckedRadioValue("time-mode", "now");
  const sortType = getCheckedRadioValue("sort-type", "departure");
  const timeInputValue = document.getElementById("time-input").value;
  const showAllResults = document.getElementById("show-all-results").checked;

  if (!departure || !arrival) {
    resultArea.innerHTML = `<p>出発地と到着地を両方選んでください。</p>`;
    return;
  }

  if (departure === arrival) {
    resultArea.innerHTML = `<p>出発地と到着地が同じです。</p>`;
    return;
  }

  if (timeMode !== "now" && !timeInputValue) {
    resultArea.innerHTML = `<p>時間を指定してください。</p>`;
    return;
  }

  const departureData = timetable[departure];
  const arrivalData = timetable[arrival];

  if (!departureData || !arrivalData) {
    resultArea.innerHTML = `<p>検索に必要な時刻表データがありません。</p>`;
    return;
  }

  const baseMinutes = getBaseMinutes(timeMode, timeInputValue);

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
          arrivalTimes,
          baseMinutes,
          timeMode
        )
      );
    }
  }

  plans = sortPlans(plans, sortType, timeMode, baseMinutes);

  renderSearchResults(
    resultArea,
    departure,
    arrival,
    plans,
    timeMode,
    timeInputValue,
    sortType,
    showAllResults
  );
}

function createBusPlanObjects(routeName, directionName, departureTimes, arrivalTimes, baseMinutes, timeMode) {
  const plans = [];
  const currentMinutes = getCurrentMinutes();

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
      untilDepartureMinutes: departureMinutes - currentMinutes,
      departureTimes
    });
  }

  return plans;
}

function sortPlans(plans, sortType, timeMode, baseMinutes) {
  return plans.sort((a, b) => {
    if (timeMode === "arrival") {
      return b.arrivalMinutes - a.arrivalMinutes;
    }

    if (sortType === "duration") {
      return a.durationMinutes - b.durationMinutes;
    }

    if (sortType === "arrival") {
      return a.arrivalMinutes - b.arrivalMinutes;
    }

    return a.departureMinutes - b.departureMinutes;
  });
}

function renderSearchResults(resultArea, departure, arrival, plans, timeMode, timeInputValue, sortType, showAllResults) {
  let conditionText = "現在時刻から探す";

  if (timeMode === "departure") {
    conditionText = `${timeInputValue} 以降に出発`;
  }

  if (timeMode === "arrival") {
    conditionText = `${timeInputValue} までに到着`;
  }

  let html = `
    <h4>検索結果</h4>
    <p><strong>${departure}</strong> から <strong>${arrival}</strong></p>
    <p class="current-time">現在時刻：${getCurrentTimeText()}</p>
    <p class="result-note">検索条件：${conditionText}</p>
    <p class="result-note">並び順：${getSortLabel(sortType, timeMode)}</p>
  `;

  if (plans.length === 0) {
    html += `
      <p>条件に合うバスが見つかりませんでした。</p>
      <p style="font-size:12px; color:#666;">
        時間・出発地・到着地を変えて検索してください。
      </p>
    `;

    resultArea.innerHTML = html;
    return;
  }

  const displayPlans = showAllResults ? plans : plans.slice(0, 1);

  html += displayPlans.map(plan => createBusPlanHtml(plan)).join("");

  if (!showAllResults && plans.length > 1) {
    html += `
      <p class="result-note">
        他にも ${plans.length - 1} 件あります。必要な場合は「すべて表示する」にチェックしてください。
      </p>
    `;
  }

  resultArea.innerHTML = html;
}

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
      <p class="plan-info">出発まで：${formatUntilDeparture(plan.untilDepartureMinutes)}</p>

      <div class="all-times-box">
        <p class="all-times-title">出発地の全時刻</p>
        <p class="all-times-list">${plan.departureTimes.join(" / ")}</p>
      </div>
    </div>
  `;
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

function getBaseMinutes(timeMode, timeInputValue) {
  if (timeMode === "now") {
    return getCurrentMinutes();
  }

  return timeToMinutes(timeInputValue);
}

function getDirectionGuide(routeName, directionName) {
  if (routeGuides[routeName] && routeGuides[routeName][directionName]) {
    return routeGuides[routeName][directionName];
  }

  return "";
}

function getCheckedRadioValue(name, defaultValue) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);

  if (!checked) {
    return defaultValue;
  }

  return checked.value;
}

function getSortLabel(sortType, timeMode) {
  if (timeMode === "arrival") {
    return "指定した到着時間に近い順";
  }

  if (sortType === "duration") {
    return "所要時間順";
  }

  if (sortType === "arrival") {
    return "到着時間順";
  }

  return "出発時間順";
}

function formatUntilDeparture(minutes) {
  if (minutes < 0) {
    return "現在時刻より前";
  }

  if (minutes === 0) {
    return "まもなく";
  }

  return `${minutes} 分`;
}

loadTimetable();