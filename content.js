(() => {
  const THROTTLE_MS = 5000;
  let lastSentAt = 0;

  function sendActivity() {
    const now = Date.now();
    if (now - lastSentAt < THROTTLE_MS) return;
    lastSentAt = now;
    try {
      chrome.runtime.sendMessage({ type: "userActivity", ts: now });
    } catch {
      // Ignore when extension reloads.
    }
  }

  const events = ["scroll", "wheel", "mousemove", "keydown", "touchstart", "click"];
  for (const eventName of events) {
    window.addEventListener(eventName, sendActivity, { passive: true });
  }

  // Initial ping so tracking can start without waiting for first event.
  sendActivity();
})();
