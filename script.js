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
    renderRouteSelects();

  } catch (error) {
    console.error(error);

    stopButtonsArea.innerHTML = `
      <p>時刻表データの読み込みに失敗しました。</p>
      <p>timetable.json が同じ階層にあるか確認してください。</p>
    `;
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
  const departureSelect = document.getElementById("departure-select");
  const arrivalSelect = document.getElementById("arrival-select");
  const resultArea = document.getElementById("route-search-result");

  const departure = departureSelect.value;
  const arrival = arrivalSelect.value;

  if (!departure || !arrival) {
    resultArea.innerHTML = `<p>出発地と到着地を両方選んでください。</p>`;
    return;
  }

  if (departure === arrival) {
    resultArea.innerHTML = `<p>出発地と到着地が同じです。</p>`;
    return;
  }

  const data = timetable[departure];

  if (!data) {
    resultArea.innerHTML = `<p>出発地の時刻表データがありません。</p>`;
    return;
  }

  let html = `
    <h4>検索結果</h4>
    <p><strong>${departure}</strong> から <strong>${arrival}</strong> 方面を確認します。</p>
    <p class="current-time">現在時刻：${getCurrentTimeText()}</p>
  `;

  for (let route in data) {
    for (let direction in data[route]) {
      html += createNextBusHtml(route, direction, data[route][direction]);
    }
  }

  html += `
    <p style="font-size:12px; color:#666;">
      ※現在は出発地の次のバス候補を表示します。到着地に合う路線判定は次の段階で追加します。
    </p>
  `;

  resultArea.innerHTML = html;
}

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

function escapeSingleQuote(text) {
  return text.replace(/'/g, "\\'");
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

function createNextBusHtml(routeName, directionName, timeArray) {
  const nextBus = getNextBusInfo(timeArray);
  const directionClass = getDirectionClass(directionName);
  const guide = getDirectionGuide(routeName, directionName);

  if (nextBus.finished) {
    return `
      <div class="search-result-card finished ${directionClass}">
        <p><strong>${routeName} / ${directionName}</strong></p>
        ${guide ? `<p>${guide}</p>` : ""}
        <p>本日の運行は終了しました</p>

        <div class="all-times-box">
          <p class="all-times-title">全時刻</p>
          <p class="all-times-list">${timeArray.join(" / ")}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="search-result-card ${directionClass}">
      <p><strong>${routeName} / ${directionName}</strong></p>
      ${guide ? `<p>${guide}</p>` : ""}
      <p style="font-size:20px; font-weight:bold;">次のバス：${nextBus.nextTime}</p>
      <p>あと ${nextBus.diffMinutes} 分</p>

      <div class="all-times-box">
        <p class="all-times-title">全時刻</p>
        <p class="all-times-list">${timeArray.join(" / ")}</p>
      </div>
    </div>
  `;
}

function showTimetable(stopName) {
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
  `;

  for (let route in data) {
    for (let direction in data[route]) {
      html += createNextBusHtml(route, direction, data[route][direction]);
    }
  }

  area.innerHTML = html;
}

loadTimetable();