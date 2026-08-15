(() => {
  /* ── Throttled activity ping (unchanged) ── */
  const THROTTLE_MS = 5000;
  let lastSentAt = 0;

  function sendActivity() {
    const now = Date.now();
    if (now - lastSentAt < THROTTLE_MS) return;
    lastSentAt = now;
    try {
      chrome.runtime.sendMessage({ type: "userActivity", ts: now });
    } catch {
      /* extension reload */
    }
  }

  /* ── Motivator quotes ── */
  const QUOTES = [
    "\u041d\u0435 \u043d\u0443\u0436\u0435\u043d \u043d\u0430\u043c \u0441\u0435\u0433\u043e\u0434\u043d\u044f \u044d\u0442\u043e\u0442 \u0441\u0430\u0439\u0442, \u043b\u0443\u0447\u0448\u0435 \u0440\u0435\u0448\u0438\u043c \u0435\u0449\u0451 \u043f\u0430\u0440\u0443 \u0437\u0430\u0434\u0430\u0447",
    "\u041a\u0430\u0436\u0434\u0430\u044f \u043c\u0438\u043d\u0443\u0442\u0430 \u0437\u0434\u0435\u0441\u044c \u2014 \u0443\u043a\u0440\u0430\u0434\u0435\u043d\u043d\u0430\u044f \u043c\u0438\u043d\u0443\u0442\u0430 \u0443 \u0442\u0432\u043e\u0438\u0445 \u0446\u0435\u043b\u0435\u0439",
    "\u0422\u044b \u043f\u0440\u0438\u0448\u0451\u043b \u0437\u0434\u0435\u0441\u044c \u0437\u0430 \u043c\u043e\u0442\u0438\u0432\u0430\u0446\u0438\u0435\u0439 \u2014 \u0432\u043e\u0442 \u043e\u043d\u0430: \u0437\u0430\u043a\u0440\u043e\u0439 \u0432\u043a\u043b\u0430\u0434\u043a\u0443 \u0438 \u0440\u0430\u0431\u043e\u0442\u0430\u0439",
    "\u041b\u0435\u043d\u0442\u0430 \u043d\u0435 \u0434\u043e\u0436\u0434\u0451\u0442\u0441\u044f, \u0430 \u0434\u0435\u0434\u043b\u0430\u0439\u043d \u0441\u0430\u043c \u0441\u0435\u0431\u044f \u043d\u0435 \u0440\u0435\u0448\u0438\u0442",
    "\u0421\u0435\u0439\u0447\u0430\u0441 \u043b\u0443\u0447\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f \u043d\u0430\u0447\u0430\u0442\u044c. \u0427\u0435\u043c \u0440\u0430\u043d\u044c\u0448\u0435 \u2014 \u0442\u0435\u043c \u043b\u0443\u0447\u0448\u0435",
    "\u041f\u043e\u0441\u043b\u0435 \u044d\u0442\u043e\u0433\u043e \u0441\u043a\u0440\u043e\u043b\u043b\u0430 \u0442\u044b \u043d\u0435 \u0441\u0442\u0430\u043d\u0435\u0448\u044c \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0438\u0432\u043d\u0435\u0435. \u041d\u043e \u0437\u0430\u0434\u0430\u0447\u0430 \u2014 \u0434\u0430",
    "\u041a\u0442\u043e \u0432\u043b\u0430\u0434\u0435\u0435\u0442 \u0441\u043e\u0431\u043e\u0439 \u2014 \u0442\u043e\u0442 \u0432\u043b\u0430\u0434\u0435\u0435\u0442 \u043c\u0438\u0440\u043e\u043c. \u041d\u043e \u0441\u043d\u0430\u0447\u0430\u043b\u0430 \u2014 \u0432\u043a\u043b\u0430\u0434\u043a\u043e\u0439",
    "\u0418\u0434\u0435\u0430\u043b\u044c\u043d\u044b\u0439 \u043c\u043e\u043c\u0435\u043d\u0442 \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f, \u043a\u043e\u0433\u0434\u0430 \u0442\u044b \u043d\u0430\u0447\u043d\u0451\u0448\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u043e\u0432\u0430\u0442\u044c",
    "\u0424\u043e\u043a\u0443\u0441 \u2014 \u044d\u0442\u043e \u0441\u043a\u0440\u044b\u0442\u0430\u044f \u0441\u0443\u043f\u0435\u0440\u0441\u0438\u043b\u0430. \u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439 \u0435\u0451 \u0437\u0434\u0435\u0441\u044c",
    "\u041e\u0442\u043a\u0440\u043e\u0439 \u0437\u0430\u043c\u0435\u0442\u043a\u0438 \u0438 \u043f\u043e\u0441\u043c\u043e\u0442\u0440\u0438, \u0447\u0442\u043e \u0442\u044b \u0445\u043e\u0442\u0435\u043b \u0441\u0434\u0435\u043b\u0430\u0442\u044c. \u041f\u043e\u0440\u0430",
    "\u0414\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0430 \u2014 \u044d\u0442\u043e \u043c\u044b\u0448\u0446\u0430 \u043c\u0435\u0436\u0434\u0443 \u0446\u0435\u043b\u044c\u044e \u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u043c",
    "\u0422\u044b \u0443\u0436\u0435 \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u043b \u0432\u0441\u0451, \u0447\u0442\u043e \u043c\u043e\u0433. \u041f\u043e\u0440\u0430 \u0434\u0435\u043b\u0430\u0442\u044c",
  ];

  function pickQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  /* ── Build motivator page ── */
  function buildMotivatorHTML() {
    const q = pickQuote();
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dumb Scroll \u2014 \u0437\u0430\u0433\u043b\u0443\u0448\u043a\u0430</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0f0f12;--surface:#1a1a21;--text:#e8e6e3;--muted:#8a8580;
    --accent:#6ee7b7;--accent-dim:#34d399;--accent-glow:rgba(110,231,183,.12);
    --warn:#fbbf24;--bad:#f87171;--radius:16px;
    --font:"Segoe UI",system-ui,-apple-system,sans-serif;
  }
  html,body{height:100%}
  body{
    font-family:var(--font);color:var(--text);background:var(--bg);
    display:flex;align-items:center;justify-content:center;
    overflow:hidden;
  }

  /* animated bg blobs */
  .blob{
    position:fixed;border-radius:50%;filter:blur(100px);opacity:.25;
    animation:drift 18s ease-in-out infinite alternate;
    pointer-events:none;z-index:0;
  }
  .blob-1{width:420px;height:420px;background:#6ee7b7;top:-10%;left:-8%;animation-delay:0s}
  .blob-2{width:340px;height:340px;background:#34d399;bottom:-12%;right:-6%;animation-delay:-6s}
  .blob-3{width:260px;height:260px;background:#059669;top:50%;left:55%;animation-delay:-12s}
  @keyframes drift{
    0%{transform:translate(0,0) scale(1)}
    33%{transform:translate(40px,-30px) scale(1.08)}
    66%{transform:translate(-20px,50px) scale(.95)}
    100%{transform:translate(30px,20px) scale(1.04)}
  }

  /* grain overlay */
  body::after{
    content:"";position:fixed;inset:0;z-index:1;pointer-events:none;
    opacity:.035;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:180px;
  }

  .card{
    position:relative;z-index:2;
    max-width:480px;width:90%;
    padding:48px 40px 40px;
    background:rgba(26,26,33,.82);
    border:1px solid rgba(255,255,255,.06);
    border-radius:var(--radius);
    backdrop-filter:blur(24px) saturate(1.2);
    -webkit-backdrop-filter:blur(24px) saturate(1.2);
    box-shadow:0 32px 80px rgba(0,0,0,.45),0 0 0 1px rgba(110,231,183,.06);
    text-align:center;
    animation:cardIn .6s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes cardIn{
    from{opacity:0;transform:translateY(28px) scale(.97)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }

  .icon{
    width:64px;height:64px;margin:0 auto 24px;
    background:var(--accent-glow);
    border:2px solid rgba(110,231,183,.2);
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    animation:pulse 3s ease-in-out infinite;
  }
  @keyframes pulse{
    0%,100%{box-shadow:0 0 0 0 rgba(110,231,183,.18)}
    50%{box-shadow:0 0 0 16px rgba(110,231,183,0)}
  }
  .icon svg{width:30px;height:30px;stroke:var(--accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

  .label{
    font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;
    color:var(--accent);margin-bottom:20px;
    animation:fadeUp .5s .15s both;
  }

  .quote{
    font-size:20px;line-height:1.55;font-weight:600;
    letter-spacing:-.01em;
    color:var(--text);
    min-height:62px;
    animation:fadeUp .5s .25s both;
  }

  .sub{
    margin-top:24px;font-size:13px;color:var(--muted);line-height:1.5;
    animation:fadeUp .5s .35s both;
  }

  .btn-row{
    margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;
    animation:fadeUp .5s .45s both;
  }

  .btn{
    padding:12px 24px;font-size:14px;font-weight:600;font-family:var(--font);
    border:none;border-radius:10px;cursor:pointer;transition:all .2s;
    text-decoration:none;
  }
  .btn-primary{
    background:var(--accent);color:#042f2e;
  }
  .btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
  .btn-ghost{
    background:transparent;color:var(--muted);border:1px solid rgba(255,255,255,.1);
  }
  .btn-ghost:hover{color:var(--text);border-color:rgba(255,255,255,.2)}

  .footer{
    margin-top:28px;font-size:11px;color:var(--muted);opacity:.6;
    animation:fadeUp .5s .55s both;
  }

  @keyframes fadeUp{
    from{opacity:0;transform:translateY(12px)}
    to{opacity:1;transform:translateY(0)}
  }

  @media(max-width:420px){
    .card{padding:36px 24px 28px}
    .quote{font-size:17px}
  }
</style>
</head>
<body>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="blob blob-3"></div>

  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
    </div>
    <div class="label">Dumb Scroll</div>
    <div class="quote">${q}</div>
    <p class="sub">\u0417\u0430\u043a\u0440\u043e\u0439 \u044d\u0442\u0443 \u0432\u043a\u043b\u0430\u0434\u043a\u0443 \u0438 \u0432\u0435\u0440\u043d\u0438\u0441\u044c \u043a \u0434\u0435\u043b\u0430\u043c. \u0422\u044b \u0441\u043f\u0440\u0430\u0432\u0438\u0448\u044c\u0441\u044f.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="about:blank" id="goWork">\u0417\u0430 \u0434\u0435\u043b\u043e</a>
      <button class="btn btn-ghost" id="newQuote">\u0414\u0440\u0443\u0433\u0430\u044f \u0446\u0438\u0442\u0430\u0442\u0430</button>
    </div>
    <div class="footer">\u041c\u043e\u0442\u0438\u0432\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u0440\u0435\u0436\u0438\u043c \u2014 Dumb Scroll</div>
  </div>

  <script>
    const ALL = ${JSON.stringify(QUOTES)};
    document.getElementById('newQuote').addEventListener('click', () => {
      const qEl = document.querySelector('.quote');
      qEl.style.opacity = '0';
      qEl.style.transform = 'translateY(8px)';
      setTimeout(() => {
        qEl.textContent = ALL[Math.floor(Math.random() * ALL.length)];
        qEl.style.opacity = '1';
        qEl.style.transform = 'translateY(0)';
      }, 200);
      qEl.style.transition = 'opacity .2s, transform .2s';
    });
  </script>
</body>
</html>`;
  }

  /* ── Replace page with motivator ── */
  function showMotivator() {
    document.open();
    document.write(buildMotivatorHTML());
    document.close();
  }

  /* ── Init: ask background if we should block ── */
  const url = location.href;
  if (url && url.startsWith("http")) {
    try {
      chrome.runtime.sendMessage({ type: "shouldBlock", url }, (resp) => {
        if (chrome.runtime.lastError || !resp?.block) {
          /* Not blocking — set up normal activity listeners */
          const events = ["scroll", "wheel", "mousemove", "keydown", "touchstart", "click"];
          for (const eventName of events) {
            window.addEventListener(eventName, sendActivity, { passive: true });
          }
          sendActivity();
          return;
        }
        showMotivator();
      });
    } catch {
      /* Fallback: just track activity */
      const events = ["scroll", "wheel", "mousemove", "keydown", "touchstart", "click"];
      for (const eventName of events) {
        window.addEventListener(eventName, sendActivity, { passive: true });
      }
      sendActivity();
    }
  } else {
    const events = ["scroll", "wheel", "mousemove", "keydown", "touchstart", "click"];
    for (const eventName of events) {
      window.addEventListener(eventName, sendActivity, { passive: true });
    }
    sendActivity();
  }
})();
