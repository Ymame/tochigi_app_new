let timetable = {};
let routeGuides = {};

function showSection(sectionId) {
  const sections = document.querySelectorAll(".content-section");

  sections.forEach(section => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");
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
  } catch (error) {
    console.error(error);
    stopButtonsArea.innerHTML = `
      <p>時刻表データの読み込みに失敗しました。</p>
      <p>timetable.json が同じ階層にあるか確認してください。</p>
    `;
  }
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

function getDirectionClass(directionName) {
  if (directionName.includes("東")) {
    return "east";
  }

  if (directionName.includes("西")) {
    return "west";
  }

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

loadTimetable();