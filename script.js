/*
  script.js は、画面の動きを担当するJavaScriptファイルです。
  index.htmlで用意したボタン・選択欄・検索結果エリアを操作します。

  このファイルでよく使う考え方:
  - 変数: データを入れておく箱です。例: timetable, routeGuides
  - 関数: 何度も使う処理をまとめたものです。例: showSection(), searchRoute()
  - DOM操作: HTMLの要素をJavaScriptから探して、表示や中身を変えることです。
  - event: クリックや選択変更など、ユーザー操作をきっかけに起きる処理です。
  - async / await: データ読み込みのように時間がかかる処理を待つための書き方です。

  JavaScriptの超基本:
  - const: あとから別の値を入れ直さない変数を作ります。例: const name = "栃木";
  - let: あとから値を変える可能性がある変数を作ります。例: let plans = [];
  - function: 処理に名前を付けて、あとから呼び出せるようにします。
  - if: 「もし○○なら、この処理をする」という条件分岐です。
  - else: ifの条件に当てはまらなかった場合の処理です。
  - for: 同じような処理を何回も繰り返すための書き方です。
  - return: 関数の処理を終わらせたり、結果を呼び出し元へ返したりします。
  - 配列: 複数の値を順番に入れる箱です。例: ["A", "B", "C"]
  - オブジェクト: 名前付きで値をまとめる箱です。例: { name: "栃木駅" }

  HTMLを探したり変えたりする命令:
  - document.getElementById("xxx"): id="xxx" のHTML要素を1つ探します。
  - document.querySelector(".xxx"): CSSセレクタに合うHTML要素を1つ探します。
  - document.querySelectorAll(".xxx"): CSSセレクタに合うHTML要素をすべて探します。
  - forEach: 配列や一覧の中身を、1つずつ順番に処理します。
  - classList.add("xxx"): HTML要素にclassを追加します。
  - classList.remove("xxx"): HTML要素からclassを外します。
  - innerHTML: HTML要素の中身を、文字列でまとめて入れ替えます。
  - `...`: バッククォートで囲む文字列です。${変数名} と書くと、文字の中に変数を差し込めます。
  - push: 配列の最後にデータを追加します。
  - sort: 配列の順番を並び替えます。
  - continue: 繰り返し処理の途中で、次の回へ飛ばします。
*/

// timetable.jsonから読み込んだ停留所・路線・時刻データを入れる変数です。
let timetable = {};

// timetable.jsonから読み込んだ路線案内文を入れる変数です。
let routeGuides = {};

// 画面を切り替える関数です。sectionIdには表示したいsectionのidが入ります。
function showSection(sectionId, clickedButton) {
  // querySelectorAllは、条件に合うHTML要素を「全部」集めます。
  // ここでは class="content-section" が付いた画面をすべて取得します。
  const sections = document.querySelectorAll(".content-section");

  // forEachは、集めた要素を1つずつ取り出して同じ処理をする書き方です。
  // section => { ... } の section には、1つずつ取り出された画面セクションが入ります。
  sections.forEach(section => {
    // classList.removeは、指定したclass名をその要素から外します。
    // activeを外すと、CSSの .content-section.active が効かなくなり非表示になります。
    section.classList.remove("active");
  });

  // getElementByIdは、idが一致するHTML要素を1つ探します。
  // classList.addでactiveを付けると、その画面だけ表示されます。
  document.getElementById(sectionId).classList.add("active");

  // 上部メニューのボタンをすべて取得します。
  const menuButtons = document.querySelectorAll(".menu-button");

  // すべてのメニューボタンからactiveクラスを外して、選択中表示をいったんリセットします。
  menuButtons.forEach(button => {
    // removeは「削除する」という意味です。ここではボタンのactiveクラスだけを削除します。
    button.classList.remove("active");
  });

  // ifは条件分岐です。
  // clickedButtonに値が入っている場合だけ、この中の処理を実行します。
  if (clickedButton) {
    // クリックされたボタンにactiveを付けて、選択中の見た目にします。
    clickedButton.classList.add("active");
  } else {
    // elseは「ifに当てはまらなかった場合」です。
    // ホームカードから移動した場合はclickedButtonがないので、ここで対応するメニューボタンを探します。
    // querySelectorは、条件に合うHTML要素を「最初の1つだけ」探します。
    const targetButton = document.querySelector(`.menu-button[data-section="${sectionId}"]`);

    // targetButtonが見つかった場合だけ、activeを付けます。
    if (targetButton) {
      targetButton.classList.add("active");
    }
  }
}

// 時刻表データを読み込む関数です。ページ読み込み後に一度だけ実行します。
async function loadTimetable() {
  try {
    // timetable.jsonを取得します。fetchは外部ファイルを読み込むための命令です。
    const response = await fetch("timetable.json");

    // 読み込みに失敗した場合は、catchへ進むためにエラーを投げます。
    if (!response.ok) {
      throw new Error("timetable.json を読み込めませんでした");
    }

    // 取得したJSON文字列をJavaScriptのオブジェクトに変換します。
    const data = await response.json();

    // 停留所ごとの時刻データを保存します。データがなければ空のオブジェクトにします。
    timetable = data.stops || {};

    // 路線ごとの案内文を保存します。データがなければ空のオブジェクトにします。
    routeGuides = data.routeGuides || {};

    // 読み込んだ停留所名を使って、出発地・到着地の選択肢を作ります。
    renderRouteSelects();

  } catch (error) {
    // エラーの詳しい内容を開発者ツールに表示します。
    console.error(error);

    // ユーザーには、読み込みに失敗したことをわかりやすく表示します。
    alert("時刻表データの読み込みに失敗しました。");
  }
}

// 出発地と到着地のプルダウンに、停留所名の選択肢を入れる関数です。
function renderRouteSelects() {
  // HTMLから出発地のselect要素を取得します。
  const departureSelect = document.getElementById("departure-select");

  // HTMLから到着地のselect要素を取得します。
  const arrivalSelect = document.getElementById("arrival-select");

  // ! は「ではない」という意味です。
  // ここでは「departureSelectがない、またはarrivalSelectがないなら」という条件です。
  // returnは、この関数をここで終了する命令です。
  if (!departureSelect || !arrivalSelect) return;

  // Object.keysは、オブジェクトの名前部分だけを配列として取り出します。
  // timetableが { "栃木駅": ..., "市役所": ... } なら ["栃木駅", "市役所"] になります。
  const stopNames = Object.keys(timetable);

  // mapは、配列の中身を1つずつ変換して、新しい配列を作る命令です。
  // ここでは停留所名の配列を、optionタグの文字列の配列に変換しています。
  // join("")は、配列を1つの文字列につなげます。
  const optionsHtml = `
    <option value="">選択してください</option>
    ${stopNames.map(stopName => `<option value="${stopName}">${stopName}</option>`).join("")}
  `;

  // 出発地selectの中身を、作成した選択肢に置き換えます。
  departureSelect.innerHTML = optionsHtml;

  // 到着地selectの中身も、同じ選択肢に置き換えます。
  arrivalSelect.innerHTML = optionsHtml;
}

// 検索条件の「現在時刻」「出発時刻指定」「到着時刻指定」を切り替える関数です。
function changeTimeMode() {
  // 選択されているtime-modeの値を取得します。未選択ならnowを使います。
  const timeMode = getCheckedRadioValue("time-mode", "now");

  // 時刻入力欄をHTMLから取得します。
  const timeInput = document.getElementById("time-input");

  // === は「左と右が同じか」を比べます。
  // timeModeが "now" と同じなら、現在時刻検索が選ばれています。
  if (timeMode === "now") {
    timeInput.classList.add("hidden");
    timeInput.value = "";
    // returnでここで関数を終了します。この下の表示処理には進みません。
    return;
  }

  // 出発時刻指定または到着時刻指定の場合は、時刻入力欄を表示します。
  timeInput.classList.remove("hidden");

  // 時刻入力欄が空なら、現在時刻を初期値として入れます。
  if (!timeInput.value) {
    timeInput.value = getCurrentTimeText();
  }
}

// 検索ボタンを押したときに実行される、バス検索の中心となる関数です。
function searchRoute() {
  // 出発地selectで選ばれている値を取得します。
  const departure = document.getElementById("departure-select").value;

  // 到着地selectで選ばれている値を取得します。
  const arrival = document.getElementById("arrival-select").value;

  // 検索結果を表示するエリアを取得します。
  const resultArea = document.getElementById("route-search-result");

  // 検索の基準時刻モードを取得します。
  const timeMode = getCheckedRadioValue("time-mode", "now");

  // 検索結果の並び順を取得します。
  const sortType = getCheckedRadioValue("sort-type", "departure");

  // 時刻入力欄に入力された値を取得します。
  const timeInputValue = document.getElementById("time-input").value;

  // 「すべて表示する」がチェックされているかを取得します。
  const showAllResults = document.getElementById("show-all-results").checked;

  // || は「または」という意味です。
  // !departure は「departureが空なら」という意味です。
  // つまり、出発地または到着地のどちらかが空なら、この中を実行します。
  if (!departure || !arrival) {
    resultArea.innerHTML = `<p>出発地と到着地を両方選んでください。</p>`;
    // 入力不足なので、ここで検索処理を止めます。
    return;
  }

  // 出発地と到着地が同じかどうかを調べます。
  if (departure === arrival) {
    resultArea.innerHTML = `<p>出発地と到着地が同じです。</p>`;
    return;
  }

  // !== は「左と右が同じではないか」を比べます。
  // && は「かつ」という意味です。
  // ここでは「現在時刻検索ではない、かつ、時刻入力が空なら」という条件です。
  if (timeMode !== "now" && !timeInputValue) {
    resultArea.innerHTML = `<p>時間を指定してください。</p>`;
    return;
  }

  // 出発地に関する時刻表データを取り出します。
  const departureData = timetable[departure];

  // 到着地に関する時刻表データを取り出します。
  const arrivalData = timetable[arrival];

  // 必要な時刻表データがなければ、検索できないため処理を止めます。
  if (!departureData || !arrivalData) {
    resultArea.innerHTML = `<p>検索に必要な時刻表データがありません。</p>`;
    return;
  }

  // 検索の基準となる時刻を「0時からの分数」に変換します。
  const baseMinutes = getBaseMinutes(timeMode, timeInputValue);

  // 条件に合うバス候補を入れる配列です。
  let plans = [];

  // for...inは、オブジェクトのキーを1つずつ取り出す繰り返しです。
  // ここでは departureData の中にある路線名を1つずつ取り出します。
  for (let routeName in departureData) {
    // continueは、今の1回分の処理をここでやめて、次の繰り返しへ進む命令です。
    // 到着地に同じ路線がなければ、その路線では行けないのでスキップします。
    if (!arrivalData[routeName]) continue;

    // 同じ路線内の方向名を1つずつ取り出します。
    for (let directionName in departureData[routeName]) {
      // 到着地に同じ方向のデータがなければスキップします。
      if (!arrivalData[routeName][directionName]) continue;

      // 出発地側の時刻一覧を取得します。
      const departureTimes = departureData[routeName][directionName];

      // 到着地側の時刻一覧を取得します。
      const arrivalTimes = arrivalData[routeName][directionName];

      // この路線・方向で条件に合う候補を作り、plansに追加します。
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

  // 作成した候補を、指定された並び順に並べ替えます。
  plans = sortPlans(plans, sortType, timeMode, baseMinutes);

  // 検索結果を画面に表示します。
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

// 1つの路線・方向について、表示用のバス候補データを作る関数です。
function createBusPlanObjects(routeName, directionName, departureTimes, arrivalTimes, baseMinutes, timeMode) {
  // この路線・方向で見つかった候補を入れる配列です。
  const plans = [];

  // 現在時刻を「0時からの分数」に変換しておきます。
  const currentMinutes = getCurrentMinutes();

  // for文は「決まった回数だけ繰り返す」ときによく使います。
  // let i = 0 は、数えるための変数iを0から始めるという意味です。
  // i < departureTimes.length は、iが時刻一覧の数より小さい間だけ繰り返すという意味です。
  // i++ は、1回終わるたびにiを1増やすという意味です。
  for (let i = 0; i < departureTimes.length; i++) {
    // 配列は0番目から数えます。iが0なら最初、iが1なら2番目のデータです。
    // i番目の出発時刻を取得します。
    const departureTime = departureTimes[i];

    // i番目の到着時刻を取得します。出発時刻と同じ順番で対応している前提です。
    const arrivalTime = arrivalTimes[i];

    // 出発または到着の時刻が空なら、この候補は使わずスキップします。
    if (!departureTime || !arrivalTime) continue;

    // 出発時刻を分数に変換します。
    const departureMinutes = timeToMinutes(departureTime);

    // 到着時刻を分数に変換します。
    const arrivalMinutes = timeToMinutes(arrivalTime);

    // 所要時間を計算します。
    const durationMinutes = arrivalMinutes - departureMinutes;

    // 到着が出発より前になるデータは不自然なのでスキップします。
    if (durationMinutes < 0) continue;

    // 現在時刻検索では、すでに出発済みの便をスキップします。
    if (timeMode === "now" && departureMinutes < baseMinutes) continue;

    // 出発時刻指定では、指定時刻より前に出る便をスキップします。
    if (timeMode === "departure" && departureMinutes < baseMinutes) continue;

    // 到着時刻指定では、指定時刻より後に到着する便をスキップします。
    if (timeMode === "arrival" && arrivalMinutes > baseMinutes) continue;

    // pushは、配列の最後に新しいデータを追加する命令です。
    // ここでは、画面表示に必要な情報を1つのオブジェクトにまとめてplansへ追加します。
    plans.push({
      routeName,
      directionName,
      departureTime,
      arrivalTime,
      departureMinutes,
      arrivalMinutes,
      durationMinutes,
      untilDepartureMinutes: departureMinutes - currentMinutes,
      departureTimes,
      timeMode
    });
  }

  // この路線・方向で見つかった候補一覧を返します。
  return plans;
}

// 検索結果を指定された条件で並び替える関数です。
function sortPlans(plans, sortType, timeMode, baseMinutes) {
  // sortは配列そのものを並び替えます。
  // (a, b) は、比較する2つの候補です。
  // returnがマイナスならaが先、プラスならbが先、0なら同じ順番として扱われます。
  return plans.sort((a, b) => {
    // 到着時刻指定の場合は、指定時刻に近い到着時刻を優先します。
    if (timeMode === "arrival") {
      // Math.absは、マイナスをプラスに直して「差の大きさ」だけを見る命令です。
      // 指定時刻との差が小さい候補ほど前に並びます。
      return Math.abs(baseMinutes - a.arrivalMinutes)
           - Math.abs(baseMinutes - b.arrivalMinutes);
    }

    // 所要時間順が選ばれている場合は、短いものを先にします。
    if (sortType === "duration") {
      return a.durationMinutes - b.durationMinutes;
    }

    // 到着時間順が選ばれている場合は、到着が早いものを先にします。
    if (sortType === "arrival") {
      return a.arrivalMinutes - b.arrivalMinutes;
    }

    // それ以外は出発時間順にします。
    return a.departureMinutes - b.departureMinutes;
  });
}

// 検索結果エリアに表示するHTMLを作り、画面へ反映する関数です。
function renderSearchResults(resultArea, departure, arrival, plans, timeMode, timeInputValue, sortType, showAllResults) {
  // 検索条件の説明文を初期値として用意します。
  let conditionText = "現在時刻から探す";

  // 出発時刻指定の場合の説明文です。
  if (timeMode === "departure") {
    conditionText = `${timeInputValue} 以降に出発`;
  }

  // 到着時刻指定の場合の説明文です。
  if (timeMode === "arrival") {
    conditionText = `${timeInputValue} までに到着`;
  }

  // 検索結果の見出し部分のHTMLを作ります。
  let html = `
    <h4>検索結果</h4>
    <p><strong>${departure}</strong> から <strong>${arrival}</strong></p>
    <p class="current-time">現在時刻：${getCurrentTimeText()}</p>
    <p class="result-note">検索条件：${conditionText}</p>
    <p class="result-note">並び順：${getSortLabel(sortType, timeMode)}</p>
  `;

  // 候補が0件の場合は、見つからなかった案内を表示して処理を止めます。
  if (plans.length === 0) {
    html += `
      <p>条件に合うバスが見つかりませんでした。</p>
      <p style="font-size:12px; color:#666;">
        時間・出発地・到着地を変えて検索してください。
      </p>
    `;

    // 作成したHTMLを検索結果エリアに入れます。
    resultArea.innerHTML = html;
    return;
  }

  // ? : は三項演算子と呼ばれる短いif文です。
  // 条件 ? 条件が本当のときの値 : 条件が違うときの値
  // ここでは、showAllResultsがtrueなら全件、falseなら先頭1件だけにします。
  const displayPlans = showAllResults ? plans : plans.slice(0, 1);

  // mapで候補1件ずつをHTML文字列に変換し、join("")で1つの長いHTML文字列にします。
  html += displayPlans.map(plan => createBusPlanHtml(plan)).join("");

  // まだ表示していない候補がある場合は、その件数を案内します。
  if (!showAllResults && plans.length > 1) {
    html += `
      <p class="result-note">
        他にも ${plans.length - 1} 件あります。必要な場合は「すべて表示する」にチェックしてください。
      </p>
    `;
  }

  // 完成したHTMLを検索結果エリアに表示します。
  resultArea.innerHTML = html;
}

// 検索結果1件分のカードHTMLを作る関数です。
function createBusPlanHtml(plan) {
  // 路線と方向に対応する案内文を取得します。
  const guide = getDirectionGuide(plan.routeName, plan.directionName);

  // 路線名から、カードの色分け用CSSクラスを取得します。
  const routeClass = getRouteClassName(plan.routeName);

  // 方向名から、方向バッジ用CSSクラスを取得します。
  const directionClass = getDirectionClassName(plan.directionName);

  // 路線名から、表示するアイコン文字を取得します。
  const routeIcon = getRouteIcon(plan.routeName);

  // ここでも三項演算子を使っています。
  // 条件に合う場合はHTML文字列を入れ、合わない場合は空文字 "" を入れます。
  // && は「かつ」という意味なので、2つの条件を両方満たすときだけ表示します。
  const countdownHtml = plan.timeMode === "now" && plan.untilDepartureMinutes >= 0
    ? `
      <div class="countdown-box">
        <span class="countdown-label">出発まで</span>
        <span class="countdown-value">${formatUntilDeparture(plan.untilDepartureMinutes)}</span>
      </div>
    `
    : "";

  // return `...` は、HTMLを文字列として返しています。
  // ${routeClass} のような部分には、変数の中身が差し込まれます。
  return `
    <div class="search-result-card ${routeClass}">
      <p class="route-title">
        <span class="route-icon">${routeIcon}</span>
        <strong>${plan.routeName}</strong>
        <span class="direction-badge ${directionClass}">${plan.directionName}</span>
      </p>

      ${guide ? `<p class="route-guide">${guide}</p>` : ""}

      <div class="time-display-box">
        <div class="time-item departure-time">
          <span class="time-label">出発</span>
          <span class="time-value">${plan.departureTime}</span>
        </div>

        <div class="time-arrow">→</div>

        <div class="time-item arrival-time">
          <span class="time-label">到着</span>
          <span class="time-value">${plan.arrivalTime}</span>
        </div>
      </div>

      ${countdownHtml}

      <p class="plan-info">所要時間：${plan.durationMinutes} 分</p>

      <div class="all-times-box">
        <p class="all-times-title">出発地の全時刻</p>
        <p class="all-times-list">${plan.departureTimes.join(" / ")}</p>
      </div>
    </div>
  `;
}

// 路線名に応じて、検索結果カードの色分け用CSSクラスを返す関数です。
function getRouteClassName(routeName) {
  // 市街地北部循環線なら緑系のカードにします。
  if (routeName === "市街地北部循環線") {
    return "route-north";
  }

  // 市街地循環線なら青系のカードにします。
  if (routeName === "市街地循環線") {
    return "route-city";
  }

  // それ以外の路線は標準のカードにします。
  return "route-other";
}

// 方向名に応じて、方向バッジの色分け用CSSクラスを返す関数です。
function getDirectionClassName(directionName) {
  // 東回りならオレンジ系のバッジにします。
  if (directionName === "東回り") {
    return "direction-east";
  }

  // 西回りなら青系のバッジにします。
  if (directionName === "西回り") {
    return "direction-west";
  }

  // それ以外の方向は標準のバッジにします。
  return "direction-other";
}

// 路線名に応じて、検索結果に表示するアイコン文字を返す関数です。
function getRouteIcon(routeName) {
  // 市街地北部循環線は緑の丸で表します。
  if (routeName === "市街地北部循環線") {
    return "🟢";
  }

  // 市街地循環線は青の丸で表します。
  if (routeName === "市街地循環線") {
    return "🔵";
  }

  // その他の路線はバスのアイコンで表します。
  return "🚌";
}

// "09:30" のような時刻文字列を、0時からの分数に変換する関数です。
function timeToMinutes(timeStr) {
  // split(":") は、"09:30" を ["09", "30"] のように分けます。
  // map(Number) は、文字の "09" や "30" を数値の 9 や 30 に変換します。
  // [hour, minute] は、配列の1つ目をhour、2つ目をminuteに入れる書き方です。
  const [hour, minute] = timeStr.split(":").map(Number);

  // 時間を分に直して、分を足します。
  return hour * 60 + minute;
}

// 現在時刻を、0時からの分数として返す関数です。
function getCurrentMinutes() {
  // 現在日時を取得します。
  const now = new Date();

  // 現在の時と分から、0時からの分数を計算します。
  return now.getHours() * 60 + now.getMinutes();
}

// 現在時刻を "09:30" のような表示用文字列にして返す関数です。
function getCurrentTimeText() {
  // 現在日時を取得します。
  const now = new Date();

  // 時を2桁の文字列にします。例: 9 -> "09"
  const hour = String(now.getHours()).padStart(2, "0");

  // 分を2桁の文字列にします。例: 5 -> "05"
  const minute = String(now.getMinutes()).padStart(2, "0");

  // "HH:MM" の形で返します。
  return `${hour}:${minute}`;
}

// 検索の基準時刻を、0時からの分数として返す関数です。
function getBaseMinutes(timeMode, timeInputValue) {
  // 現在時刻検索なら、現在時刻を基準にします。
  if (timeMode === "now") {
    return getCurrentMinutes();
  }

  // 時刻指定検索なら、入力された時刻を基準にします。
  return timeToMinutes(timeInputValue);
}

// 路線名と方向名から、案内文を取得する関数です。
function getDirectionGuide(routeName, directionName) {
  // routeGuidesに該当する案内文があれば返します。
  if (routeGuides[routeName] && routeGuides[routeName][directionName]) {
    return routeGuides[routeName][directionName];
  }

  // 案内文がなければ空文字を返します。
  return "";
}

// 指定したnameのラジオボタンで、選択中のvalueを取得する関数です。
function getCheckedRadioValue(name, defaultValue) {
  // name属性が一致し、checkedになっているinputを探します。
  const checked = document.querySelector(`input[name="${name}"]:checked`);

  // 選択中のものが見つからなければ、既定値を返します。
  if (!checked) {
    return defaultValue;
  }

  // 選択中のラジオボタンのvalueを返します。
  return checked.value;
}

// 並び順を、画面に表示する日本語ラベルに変換する関数です。
function getSortLabel(sortType, timeMode) {
  // 到着時刻指定の場合は、指定到着時刻に近い順と表示します。
  if (timeMode === "arrival") {
    return "指定した到着時間に近い順";
  }

  // 所要時間順の場合の表示名です。
  if (sortType === "duration") {
    return "所要時間順";
  }

  // 到着時間順の場合の表示名です。
  if (sortType === "arrival") {
    return "到着時間順";
  }

  // それ以外は出発時間順と表示します。
  return "出発時間順";
}

// 出発までの残り分数を、画面表示用の文字に変換する関数です。
function formatUntilDeparture(minutes) {
  // すでに出発済みの場合は空文字にします。
  if (minutes < 0) {
    return "";
  }

  // 0分なら「まもなく」と表示します。
  if (minutes === 0) {
    return "まもなく";
  }

  // それ以外は「○ 分」の形で表示します。
  return `${minutes} 分`;
}

// ページを開いたときに、最初に時刻表データを読み込みます。
loadTimetable();
