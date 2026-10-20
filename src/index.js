/* PIN-gates the whole site: every request must carry a valid signed session cookie, set by
   entering the PIN at /pin, before it's allowed through to the static assets. Mirrors the book
   engine's PIN/session scheme (same HMAC-signed-expiry cookie, same D1 pin_attempts rate limit,
   same textbook-db database via the D1 binding below) but keeps its own separate cookie/session,
   since this is a separate Worker from the engine. */

// One hour per PIN entry. The cookie name changed when sessions went hourly, so older long-lived
// sessions stop working. site_exp (readable by the page) tells the app when to reload.
const SESSION_COOKIE = "site_session_h";
const EXP_COOKIE = "site_exp";
const SESSION_MS = 3600000;
const PIN_WINDOW_MS = 3600000;
const PIN_MAX_ATTEMPTS = 8;

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
}

async function makeSessionCookie(env) {
  const expiry = Date.now() + SESSION_MS;
  const sig = await hmac(env.SESSION_SECRET, String(expiry));
  const value = `${expiry}.${sig}`;
  const age = Math.round(SESSION_MS / 1000);
  return [
    `${SESSION_COOKIE}=${value}; Max-Age=${age}; Path=/; Secure; HttpOnly; SameSite=Lax`,
    `${EXP_COOKIE}=${expiry}; Max-Age=${age}; Path=/; Secure; SameSite=Lax`,
  ];
}

async function validSession(request, env) {
  const value = getCookie(request, SESSION_COOKIE);
  if (!value) return false;
  const [expiry, sig] = value.split(".");
  if (!expiry || !sig) return false;
  if (Number(expiry) < Date.now()) return false;
  const expected = await hmac(env.SESSION_SECRET, expiry);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

function loginPage(error) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign in</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#0b0e1a; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#e6e8f0; }
  form { background:#141829; border:1px solid #262b40; border-radius:16px; padding:32px 28px; width:280px; box-shadow:0 30px 70px -24px rgba(0,0,0,.9); }
  h1 { font-size:1.1rem; margin:0 0 18px; text-align:center; font-weight:650; }
  input { width:100%; box-sizing:border-box; padding:12px 14px; border-radius:10px; border:1px solid #2c3350; background:#1b2036; color:#e6e8f0; font-size:1.1rem; letter-spacing:.15em; text-align:center; outline:none; }
  input:focus { border-color:#8b9cff; box-shadow:0 0 0 3px rgba(139,156,255,.15); }
  button { width:100%; margin-top:14px; padding:11px; border:none; border-radius:10px; background:#8b9cff; color:#0b0e1a; font-weight:650; font-size:.95rem; cursor:pointer; }
  button:hover { filter:brightness(1.08); }
  .err { color:#f87171; font-size:.82rem; text-align:center; margin-top:10px; }

  /* Nova mode: CodeSlots, shown instead of the plain input when this device's last choice
     (localStorage "bv:uiMode", same key the main app uses) was Nova. Self-contained — this
     page is served before authentication, so it can't fetch assets/nova.css or nova-components.js. */
  body.pin-nova form { background:linear-gradient(165deg, rgba(139,92,246,.08), transparent 55%), #141829; border-color:rgba(151,125,255,.3); }
  body.pin-nova .classic-input { display:none; }
  .codeslots { display:none; gap:8px; justify-content:center; position:relative; }
  body.pin-nova .codeslots { display:inline-flex; }
  .codeslots__slot {
    position:relative; width:38px; height:48px; border-radius:10px;
    border:1px solid #2c3350; background:#1b2036; display:grid; place-items:center;
    font-size:20px; font-weight:650; color:#e6e8f0; font-variant-numeric:tabular-nums;
    transition:transform 220ms cubic-bezier(.34,1.56,.64,1), border-color 180ms ease, box-shadow 180ms ease;
  }
  .codeslots__slot[data-filled] { transform:translateY(-2px); border-color:#8b5cf6; box-shadow:0 0 0 3px rgba(139,92,246,.18); }
  .codeslots__slot[data-active] { border-color:#8b5cf6; box-shadow:0 0 0 3px rgba(139,92,246,.22); }
  .codeslots[data-status='error'] .codeslots__slot { border-color:#ef4444; background:rgba(239,68,68,.08); animation:codeslots-shake 360ms ease; }
  @keyframes codeslots-shake { 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} 100%{transform:translateX(0)} }
  .codeslots__hidden { position:absolute; inset:0; opacity:0; border:0; padding:0; margin:0; font-size:20px; letter-spacing:1em; }
  body.pin-nova button { background:linear-gradient(135deg,#8b5cf6,#22d3ee); color:#050611; }
</style></head>
<body>
<form method="POST" action="/pin" id="pinForm">
  <h1>Enter the PIN</h1>
  <input class="classic-input" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" autocomplete="off">
  <div class="codeslots" id="codeslots" data-status="${error ? "error" : "idle"}">
    <div class="codeslots__slot" data-i="0"></div>
    <div class="codeslots__slot" data-i="1"></div>
    <div class="codeslots__slot" data-i="2"></div>
    <div class="codeslots__slot" data-i="3"></div>
    <div class="codeslots__slot" data-i="4"></div>
    <div class="codeslots__slot" data-i="5"></div>
    <input class="codeslots__hidden" id="codeslotsInput" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" aria-label="PIN">
  </div>
  <button type="submit">Unlock</button>
  ${error ? `<div class="err">${error}</div>` : ""}
</form>
<script>
(function () {
  try {
    var mode = JSON.parse(localStorage.getItem('bv:uiMode') || '"classic"');
    if (mode === 'nova') document.body.classList.add('pin-nova');
  } catch (e) {}

  var classic = document.querySelector('.classic-input');
  var group = document.getElementById('codeslots');
  var hidden = document.getElementById('codeslotsInput');
  var slots = Array.prototype.slice.call(group.querySelectorAll('.codeslots__slot'));
  var form = document.getElementById('pinForm');

  function render() {
    var v = hidden.value.replace(/[^0-9]/g, '');
    slots.forEach(function (slot, i) {
      var ch = v[i];
      slot.textContent = ch || '';
      slot.toggleAttribute('data-filled', !!ch);
      slot.toggleAttribute('data-active', i === v.length);
    });
    classic.value = v;
  }
  hidden.addEventListener('input', function () {
    hidden.value = hidden.value.replace(/[^0-9]/g, '').slice(0, 6);
    render();
    group.dataset.status = 'idle';
    if (hidden.value.length === 6) form.requestSubmit ? form.requestSubmit() : form.submit();
  });
  group.addEventListener('click', function () { hidden.focus(); });
  render();
  if (document.body.classList.contains('pin-nova')) { hidden.focus(); }
  else { classic.focus(); }
})();
</script>
</body></html>`;
}

function htmlResponse(body, status) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } });
}

async function handlePinPost(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const row = await env.DB.prepare("SELECT attempts, window_start FROM pin_attempts WHERE ip = ?").bind(ip).first();
  let attempts = 0;
  if (row && now - row.window_start < PIN_WINDOW_MS) attempts = row.attempts;
  if (attempts >= PIN_MAX_ATTEMPTS) return htmlResponse(loginPage("Too many attempts. Try again later."), 429);

  const form = await request.formData().catch(() => null);
  const given = String((form && form.get("pin")) || "");
  const expected = env.PIN_CODE || "";
  const ok = given && expected && given.length === expected.length &&
    given.split("").reduce((d, c, i) => d | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0;

  if (!ok) {
    const windowStart = row && now - row.window_start < PIN_WINDOW_MS ? row.window_start : now;
    await env.DB.prepare(
      "INSERT INTO pin_attempts (ip, attempts, window_start) VALUES (?, ?, ?) ON CONFLICT(ip) DO UPDATE SET attempts = ?, window_start = ?"
    ).bind(ip, attempts + 1, windowStart, attempts + 1, windowStart).run();
    return htmlResponse(loginPage("Wrong PIN."), 401);
  }

  await env.DB.prepare("DELETE FROM pin_attempts WHERE ip = ?").bind(ip).run();
  const cookies = await makeSessionCookie(env);
  const res = new Response(null, { status: 303, headers: { Location: "/" } });
  for (const c of cookies) res.headers.append("Set-Cookie", c);
  return res;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/pin" && request.method === "POST") return handlePinPost(request, env);
    if (await validSession(request, env)) return env.ASSETS.fetch(request);
    return htmlResponse(loginPage(), 401);
  },
};
