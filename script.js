function showSection(sectionId) {
  const sections = document.querySelectorAll(".content-section");

  sections.forEach(section => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");
}

const timetable = {
  "栃木駅（北口）": {
    "市街地北部循環線": {
      "東回り": ["7:20", "9:20", "11:20", "13:20", "15:20", "17:20"],
      "西回り": ["8:20", "10:20", "12:20", "14:20", "16:20", "18:20"]
    },
    "市街地循環線": {
      "東回り": ["7:55", "10:11", "12:43", "15:15", "17:47"],
      "西回り": ["8:55", "11:27", "13:59", "16:31", "19:03"]
    }
  },

  "市役所前": {
    "市街地北部循環線": {
      "東回り": ["7:24", "9:24", "11:24", "13:24", "15:24", "17:24"],
      "西回り": ["8:54", "10:54", "12:54", "14:54", "16:54", "18:54"]
    },
    "市街地循環線": {
      "東回り": ["8:12", "10:39", "13:11", "15:43", "18:15"],
      "西回り": ["9:06", "11:38", "14:10", "16:42", "19:14"]
    }
  },

  "イオン": {
    "市街地北部循環線": {
      "東回り": ["7:38", "9:38", "11:38", "13:38", "15:38", "17:38"],
      "西回り": ["8:40", "10:40", "12:40", "14:40", "16:40", "18:40"]
    },
    "市街地循環線": {
      "東回り": ["10:30", "13:02", "15:34", "18:06"],
      "西回り": ["9:16", "11:48", "14:20", "16:52"]
    }
  },

  "新栃木駅": {
    "市街地北部循環線": {
      "東回り": ["7:29", "9:29", "11:29", "13:29", "15:29", "17:29"],
      "西回り": ["8:49", "10:49", "12:49", "14:49", "16:49", "18:49"]
    },
    "市街地循環線": {
      "東回り": ["8:06", "10:22", "12:54", "15:26", "17:58"],
      "西回り": ["9:25", "11:57", "14:29", "17:01", "19:21"]
    }
  },

  "とちぎメディカルセンターしもつが": {
    "市街地循環線": {
      "東回り": ["7:48", "10:04", "12:36", "15:08", "17:40"],
      "西回り": ["8:48", "11:20", "13:52", "16:24", "18:56"]
    }
  },

  "ヤオハンアイム前": {
    "市街地北部循環線": {
      "東回り": ["7:32", "9:32", "11:32", "13:32", "15:32", "17:32"],
      "西回り": ["8:46", "10:46", "12:46", "14:46", "16:46", "18:46"]
    },
    "市街地循環線": {
      "東回り": ["8:08", "10:24", "12:56", "15:28", "18:00"],
      "西回り": ["9:22", "11:54", "14:26", "16:58", "19:18"]
    }
  },

  "新栃木駅西": {
    "市街地北部循環線": {
      "東回り": ["7:28", "9:28", "11:28", "13:28", "15:28", "17:28"],
      "西回り": ["8:50", "10:50", "12:50", "14:50", "16:50", "18:50"]
    },
    "市街地循環線": {
      "東回り": ["8:07", "10:23", "12:55", "15:27", "17:59"],
      "西回り": ["9:23", "11:55", "14:27", "16:59", "19:19"]
    }
  }
};

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

function createNextBusHtml(routeName, directionName, timeArray) {
  const nextBus = getNextBusInfo(timeArray);
  const directionClass = getDirectionClass(directionName);

  if (nextBus.finished) {
    return `
      <div class="next-bus-card finished ${directionClass}">
        <p class="next-bus-route">${routeName} / ${directionName}</p>
        <p class="next-bus-text">本日の運行は終了しました</p>
      </div>
    `;
  }

  return `
    <div class="next-bus-card ${directionClass}">
      <p class="next-bus-route">${routeName} / ${directionName}</p>
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

      html += `
        <div class="direction-block ${directionClass}">
          <p class="direction-title">${direction}</p>
          <p class="time-list">${data[route][direction].join(" / ")}</p>
        </div>
      `;
    }

    html += `</div>`;
  }

  area.innerHTML = html;
}