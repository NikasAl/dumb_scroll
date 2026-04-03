/**
 * Учёт времени на соцсетях: активная вкладка + окно в фокусе, не idle.
 */

const STORAGE_KEYS = {
  DAILY_SECONDS: "dailySecondsByDate",
  SETTINGS: "settings",
};

const DEFAULT_SETTINGS = {
  domains: [
    "vk.com/feed",
    "news.mail.ru",
    "ok.ru",
    "rutube.ru",
    "reddit.com",
    "threads.net",
    "snapchat.com",
    "linkedin.com/feed",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "youtube.com",
  ],
  /** Не считать, если окно браузера не в фокусе */
  requireWindowFocus: true,
};

let settings = { ...DEFAULT_SETTINGS };
let tracking = {
  active: false,
  startedAt: null,
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeHost(host) {
  return (host || "").replace(/^www\./, "").toLowerCase();
}

function urlMatchesSocial(urlStr) {
  if (!urlStr || !urlStr.startsWith("http")) return false;
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    return false;
  }
  const host = normalizeHost(u.hostname);
  const path = u.pathname || "/";

  for (const rule of settings.domains) {
    const ruleLower = rule.toLowerCase().trim();
    if (ruleLower.includes("/")) {
      const [domainPart, ...pathParts] = ruleLower.split("/");
      const pathPrefix = "/" + pathParts.join("/");
      if (normalizeHost(domainPart) === host && path.startsWith(pathPrefix)) return true;
    } else if (normalizeHost(ruleLower) === host) {
      return true;
    }
  }
  return false;
}

async function loadSettings() {
  const { [STORAGE_KEYS.SETTINGS]: s } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  settings = { ...DEFAULT_SETTINGS, ...s };
  if (!Array.isArray(settings.domains) || settings.domains.length === 0) {
    settings.domains = [...DEFAULT_SETTINGS.domains];
  }
}

async function addSeconds(seconds) {
  if (seconds <= 0) return;
  const key = todayKey();
  const { [STORAGE_KEYS.DAILY_SECONDS]: raw = {} } = await chrome.storage.local.get(
    STORAGE_KEYS.DAILY_SECONDS
  );
  const daily = { ...raw };
  daily[key] = (daily[key] || 0) + seconds;
  await chrome.storage.local.set({ [STORAGE_KEYS.DAILY_SECONDS]: daily });
}

async function flushElapsed() {
  if (!tracking.active || !tracking.startedAt) return;
  const now = Date.now();
  const sec = Math.floor((now - tracking.startedAt) / 1000);
  tracking.startedAt = now;
  if (sec > 0) await addSeconds(sec);
}

function startTracking() {
  if (tracking.active) return;
  tracking.active = true;
  tracking.startedAt = Date.now();
}

async function stopTracking() {
  if (!tracking.active) return;
  await flushElapsed();
  tracking.active = false;
  tracking.startedAt = null;
}

async function evaluateTab(tabId) {
  await loadSettings();
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url) {
      await stopTracking();
      return;
    }
    const w = await chrome.windows.get(tab.windowId);
    const windowFocused = w.focused === true;
    if (settings.requireWindowFocus && !windowFocused) {
      await stopTracking();
      return;
    }
    if (tab.active && urlMatchesSocial(tab.url)) {
      startTracking();
    } else {
      await stopTracking();
    }
  } catch {
    await stopTracking();
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.idle.setDetectionInterval(60);
  loadSettings();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.idle.setDetectionInterval(60);
  loadSettings();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await evaluateTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.active) return;
  if (info.status === "loading" || info.status === "complete" || info.url) {
    await evaluateTab(tabId);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await stopTracking();
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (tab?.id) await evaluateTab(tab.id);
});

chrome.idle.onStateChanged.addListener((state) => {
  if (state === "active") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (tabs[0]?.id) void evaluateTab(tabs[0].id);
    });
  } else {
    void stopTracking();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flush") {
    void flushElapsed();
  }
});

chrome.alarms.create("flush", { periodInMinutes: 1 });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEYS.SETTINGS]) {
    loadSettings();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "flushNow") {
    void flushElapsed().then(() => sendResponse({ ok: true }));
    return true;
  }
});

loadSettings().then(() => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs[0]?.id) evaluateTab(tabs[0].id);
  });
});
