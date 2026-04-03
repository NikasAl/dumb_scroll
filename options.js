const STORAGE_KEYS = {
  SETTINGS: "settings",
  DAILY_SECONDS: "dailySecondsByDate",
};

const DEFAULT_SETTINGS = {
  domains: [],
  requireWindowFocus: true,
};

async function load() {
  const { [STORAGE_KEYS.SETTINGS]: s } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const merged = { ...DEFAULT_SETTINGS, ...s };
  const domains = Array.isArray(merged.domains) && merged.domains.length
    ? merged.domains
    : [
        "facebook.com",
        "instagram.com",
        "twitter.com",
        "x.com",
        "tiktok.com",
        "vk.com",
        "ok.ru",
        "reddit.com",
        "threads.net",
        "snapchat.com",
        "linkedin.com/feed",
      ];

  document.getElementById("domains").value = domains.join("\n");
  document.getElementById("requireFocus").checked = merged.requireWindowFocus !== false;
}

function parseDomains(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

document.getElementById("save").addEventListener("click", async () => {
  const domains = parseDomains(document.getElementById("domains").value);
  if (domains.length === 0) {
    alert("Добавь хотя бы один домен или путь.");
    return;
  }
  const requireWindowFocus = document.getElementById("requireFocus").checked;
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: { domains, requireWindowFocus },
  });
  const el = document.getElementById("saved");
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 2000);
});

document.getElementById("resetStats").addEventListener("click", async () => {
  if (!confirm("Удалить всю статистику по дням?")) return;
  await chrome.storage.local.remove(STORAGE_KEYS.DAILY_SECONDS);
});

load();
