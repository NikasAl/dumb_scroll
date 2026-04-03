const STORAGE_KEYS = { DAILY_SECONDS: "dailySecondsByDate" };

function formatDuration(totalSec) {
  const s = Math.floor(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} ч ${m} мин`;
  if (m > 0) return `${m} мин ${sec} с`;
  return `${sec} с`;
}

function dateKey(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function parseKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function weekdayShort(d) {
  const names = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return names[d.getDay()];
}

async function loadDaily() {
  const { [STORAGE_KEYS.DAILY_SECONDS]: raw = {} } = await chrome.storage.local.get(
    STORAGE_KEYS.DAILY_SECONDS
  );
  return raw;
}

function motivationMessage(todaySec, yesterdaySec) {
  if (yesterdaySec === undefined || yesterdaySec === 0) {
    return "Завтра сравним с сегодня — постарайся провести в ленте меньше времени.";
  }
  const diff = todaySec - yesterdaySec;
  const pct = Math.round((diff / yesterdaySec) * 100);
  if (todaySec < yesterdaySec) {
    return `Сегодня ты уже на ${formatDuration(yesterdaySec - todaySec)} меньше, чем вчера. Так держать.`;
  }
  if (todaySec === yesterdaySec) {
    return "Как вчера. Попробуй сегодня чуть раньше закрыть вкладку с лентой.";
  }
  return `Сейчас на ${formatDuration(diff)} больше, чем вчера (${pct > 0 ? "+" : ""}${pct}%). Цель — меньше вчерашнего ${formatDuration(yesterdaySec)}.`;
}

function setProgress(todaySec, yesterdaySec) {
  const fill = document.getElementById("progressFill");
  const bar = document.getElementById("progressBar");
  const label = document.getElementById("progressLabel");

  fill.classList.remove("is-worse", "is-bad");
  fill.style.width = "";

  if (yesterdaySec === undefined || yesterdaySec === 0) {
    label.textContent = "Вчера данных не было — цель: завтра меньше, чем сегодня.";
    fill.style.width = "0%";
    bar.setAttribute("aria-valuenow", "0");
    return;
  }

  const ratio = todaySec / yesterdaySec;
  const pct = Math.min(100, Math.round(ratio * 100));
  fill.style.width = `${pct}%`;
  bar.setAttribute("aria-valuenow", String(pct));

  if (todaySec < yesterdaySec) {
    label.textContent = `Сегодня ${pct}% от вчерашнего дня — пока лучше. Цель: закончить сутки с меньшим временем, чем вчера.`;
  } else if (todaySec === yesterdaySec) {
    label.textContent = "Сейчас как весь вчерашний день. Идеал — не наращивать дальше.";
  } else {
    label.textContent = `Уже на ${formatDuration(todaySec - yesterdaySec)} больше, чем весь вчерашний день.`;
  }

  if (todaySec > yesterdaySec) {
    fill.classList.add("is-worse");
  }
  if (todaySec > yesterdaySec * 1.15) {
    fill.classList.add("is-bad");
  }
}

function renderWeek(daily, todayKeyStr) {
  const container = document.getElementById("weekChart");
  container.innerHTML = "";
  const today = parseKey(todayKeyStr);
  const maxSec = Math.max(
    1,
    ...Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return daily[dateKey(d)] || 0;
    })
  );

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const k = dateKey(d);
    const sec = daily[k] || 0;
    const h = Math.max(4, Math.round((sec / maxSec) * 44));

    const col = document.createElement("div");
    col.className = "bar-col";
    const wrap = document.createElement("div");
    wrap.className = "bar-pillar-wrap";
    const pillar = document.createElement("div");
    pillar.className = "bar-pillar" + (k === todayKeyStr ? " is-today" : "");
    pillar.style.height = `${h}px`;
    pillar.title = formatDuration(sec);
    wrap.appendChild(pillar);
    const lbl = document.createElement("div");
    lbl.className = "bar-label";
    lbl.textContent = weekdayShort(d);
    col.appendChild(wrap);
    col.appendChild(lbl);
    container.appendChild(col);
  }
}

async function refresh() {
  try {
    await chrome.runtime.sendMessage({ type: "flushNow" });
  } catch {
    /* ignore */
  }
  const daily = await loadDaily();
  const todayK = dateKey(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterdayK = dateKey(y);

  const todaySec = daily[todayK] || 0;
  const yesterdaySec = daily[yesterdayK];

  document.getElementById("todayDisplay").textContent = formatDuration(todaySec);

  const compareEl = document.getElementById("compareLine");
  if (yesterdaySec !== undefined && yesterdaySec > 0) {
    const cmp =
      todaySec < yesterdaySec
        ? `Вчера было <strong>${formatDuration(yesterdaySec)}</strong> — сегодня меньше`
        : todaySec > yesterdaySec
          ? `Вчера было <strong>${formatDuration(yesterdaySec)}</strong>`
          : `Как вчера: <strong>${formatDuration(yesterdaySec)}</strong>`;
    compareEl.innerHTML = cmp;
  } else {
    compareEl.textContent = "Вчера данных нет — начни отсчёт с сегодня.";
  }

  setProgress(todaySec, yesterdaySec);

  const mot = document.getElementById("motivation");
  mot.textContent = motivationMessage(todaySec, yesterdaySec);
  mot.className = "motivation";
  if (yesterdaySec === undefined || yesterdaySec === 0) {
    mot.classList.add("is-neutral");
  } else if (todaySec > yesterdaySec) {
    mot.classList.add("is-warn");
  }

  renderWeek(daily, todayK);
}

document.getElementById("optionsLink").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

refresh();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEYS.DAILY_SECONDS]) {
    refresh();
  }
});

const tick = setInterval(refresh, 5000);
window.addEventListener("unload", () => clearInterval(tick));
