/* PIN-gates the whole site: every request must carry a valid signed session cookie, set by
   entering the PIN at /pin, before it's allowed through to the static assets. Mirrors the book
   engine's PIN/session scheme (same HMAC-signed-expiry cookie, same D1 pin_attempts rate limit,
   same textbook-db database via the D1 binding below) but keeps its own separate cookie/session,
   since this is a separate Worker from the engine. */

const SESSION_COOKIE = "site_session";
const SESSION_DAYS = 90;
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
  const expiry = Date.now() + SESSION_DAYS * 86400000;
  const sig = await hmac(env.SESSION_SECRET, String(expiry));
  const value = `${expiry}.${sig}`;
  return `${SESSION_COOKIE}=${value}; Max-Age=${SESSION_DAYS * 86400}; Path=/; Secure; HttpOnly; SameSite=Lax`;
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
</style></head>
<body>
<form method="POST" action="/pin">
  <h1>Enter the PIN</h1>
  <input name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" autofocus autocomplete="off">
  <button type="submit">Unlock</button>
  ${error ? `<div class="err">${error}</div>` : ""}
</form>
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
  const cookie = await makeSessionCookie(env);
  const res = new Response(null, { status: 303, headers: { Location: "/" } });
  res.headers.append("Set-Cookie", cookie);
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
