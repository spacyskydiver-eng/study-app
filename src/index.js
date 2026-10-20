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
  const given = String((form && form.get("pin")) || "").trim();
  const expected = String(env.PIN_CODE || "").trim();
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


/* ------------------------------------------------------------------ Microsoft (Outlook mail + calendar)
   Delegated OAuth against Microsoft Graph, read-only: Mail.Read, Calendars.Read, User.Read,
   offline_access. The refresh token lives only in D1 on this worker; the page only ever sees the
   mail and calendar items it asks for, and only behind a valid PIN session.
   Needs secrets MS_CLIENT_ID and MS_CLIENT_SECRET (and optional MS_TENANT, default "organizations").
   Redirect URI to register: https://<site>/ms/callback */
const MS_SCOPES = "offline_access User.Read Mail.Read Calendars.Read";
const msTenant = env => env.MS_TENANT || "organizations";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

async function msTable(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS ms_tokens (id INTEGER PRIMARY KEY, refresh TEXT, access TEXT, expires INTEGER, account TEXT)").run();
}
async function msSave(env, t, account) {
  await msTable(env);
  const prev = await env.DB.prepare("SELECT account FROM ms_tokens WHERE id = 1").first();
  await env.DB.prepare("INSERT INTO ms_tokens (id, refresh, access, expires, account) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET refresh = excluded.refresh, access = excluded.access, expires = excluded.expires, account = excluded.account")
    .bind(t.refresh_token, t.access_token, Date.now() + (t.expires_in - 120) * 1000, account || (prev && prev.account) || "").run();
}
async function msTokenRequest(env, params) {
  const body = new URLSearchParams({ client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET, scope: MS_SCOPES, ...params });
  const res = await fetch(`https://login.microsoftonline.com/${msTenant(env)}/oauth2/v2.0/token`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || `token ${res.status}`);
  return data;
}
async function msAccess(env) {
  await msTable(env);
  const row = await env.DB.prepare("SELECT refresh, access, expires FROM ms_tokens WHERE id = 1").first();
  if (!row || !row.refresh) return null;
  if (row.access && row.expires > Date.now()) return row.access;
  const t = await msTokenRequest(env, { grant_type: "refresh_token", refresh_token: row.refresh });
  if (!t.refresh_token) t.refresh_token = row.refresh;
  await msSave(env, t);
  return t.access_token;
}
async function graph(env, path, extraHeaders = {}) {
  const token = await msAccess(env);
  if (!token) return { notConnected: true };
  const res = await fetch("https://graph.microsoft.com/v1.0" + path, { headers: { Authorization: `Bearer ${token}`, ...extraHeaders } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.error && data.error.message) || `graph ${res.status}`);
  return data;
}
async function msState(env) { const t = String(Date.now()); return `${t}.${(await hmac(env.SESSION_SECRET, "ms" + t)).slice(0, 32)}`; }
async function msStateOk(env, state) {
  const [t, sig] = String(state || "").split(".");
  if (!t || !sig || Date.now() - Number(t) > 600000) return false;
  return (await hmac(env.SESSION_SECRET, "ms" + t)).slice(0, 32) === sig;
}
function msPage(title, text) {
  return htmlResponse(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#05060d;color:#e6e8ff;font:15px system-ui,sans-serif">
<div style="max-width:460px;padding:28px;border:1px solid rgba(151,125,255,.3);border-radius:18px;background:#0b0c17">
<h2 style="margin:0 0 10px">${title}</h2><p style="color:#a6acd6;line-height:1.5">${text}</p><p><a style="color:#c4b5fd" href="/">Back to the site</a></p></div></body>`, 200);
}
async function handleMs(request, env, url) {
  const p = url.pathname;
  if (!env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) {
    if (p.startsWith("/api/") && env.SYNC_TOKEN) return syncedApi(env, url);
    if (p.startsWith("/api/")) return json({ notConfigured: true });
    return msPage("Outlook is not set up yet", "The Microsoft app details (MS_CLIENT_ID and MS_CLIENT_SECRET) have not been added to this site.");
  }
  const redirect = `${url.origin}/ms/callback`;
  if (p === "/ms/connect") {
    const q = new URLSearchParams({ client_id: env.MS_CLIENT_ID, response_type: "code", redirect_uri: redirect, response_mode: "query", scope: MS_SCOPES, state: await msState(env), prompt: "select_account" });
    return Response.redirect(`https://login.microsoftonline.com/${msTenant(env)}/oauth2/v2.0/authorize?${q}`, 302);
  }
  if (p === "/ms/callback") {
    if (url.searchParams.get("error")) {
      const d = url.searchParams.get("error_description") || url.searchParams.get("error");
      const admin = /admin|AADSTS65001|AADSTS90094|consent/i.test(d);
      return msPage(admin ? "UEA needs to approve this" : "Microsoft sign-in failed", admin
        ? "Your university account only lets IT-approved apps read mail and calendar. The site itself is fine; UEA's settings block the connection. A personal Outlook account, or a calendar subscription link, would work instead."
        : String(d).replace(/[<>&]/g, ""));
    }
    if (!(await msStateOk(env, url.searchParams.get("state")))) return msPage("Sign-in expired", "Start the connection again from the site.");
    try {
      const t = await msTokenRequest(env, { grant_type: "authorization_code", code: url.searchParams.get("code") || "", redirect_uri: redirect });
      let account = "";
      try { const me = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", { headers: { Authorization: `Bearer ${t.access_token}` } }).then(r => r.json()); account = me.mail || me.userPrincipalName || ""; } catch (e) { /* name is optional */ }
      await msSave(env, t, account);
      return Response.redirect(`${url.origin}/`, 303);
    } catch (e) { return msPage("Microsoft sign-in failed", String(e.message).replace(/[<>&]/g, "")); }
  }
  if (p === "/ms/disconnect" && request.method === "POST") {
    await msTable(env); await env.DB.prepare("DELETE FROM ms_tokens WHERE id = 1").run();
    return json({ ok: true });
  }
  try {
    if (p === "/api/ms/status") {
      await msTable(env);
      const row = await env.DB.prepare("SELECT account FROM ms_tokens WHERE id = 1").first();
      return json({ connected: !!row, account: row ? row.account : "" });
    }
    if (p === "/api/ms/calendar") {
      const days = Math.min(14, Math.max(1, Number(url.searchParams.get("days")) || 2));
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + days * 86400000);
      const d = await graph(env, `/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}&$select=subject,start,end,location,isAllDay,webLink,showAs&$orderby=start/dateTime&$top=40`, { Prefer: 'outlook.timezone="Europe/London"' });
      if (d.notConnected) return json({ notConnected: true });
      return json({ events: (d.value || []).map(e => ({ subject: e.subject, start: e.start.dateTime, end: e.end.dateTime, allDay: e.isAllDay, location: (e.location && e.location.displayName) || "", link: e.webLink })) });
    }
    if (p === "/api/ms/mail") {
      const d = await graph(env, "/me/mailFolders/inbox/messages?$top=15&$select=subject,from,receivedDateTime,bodyPreview,isRead,webLink&$orderby=receivedDateTime desc");
      if (d.notConnected) return json({ notConnected: true });
      return json({ messages: (d.value || []).map(m => ({ subject: m.subject, from: (m.from && m.from.emailAddress && (m.from.emailAddress.name || m.from.emailAddress.address)) || "", received: m.receivedDateTime, preview: m.bodyPreview, unread: !m.isRead, link: m.webLink })) });
    }
  } catch (e) { return json({ error: String(e.message) }, 502); }
  return json({ error: "not found" }, 404);
}


/* ------------------------------------------------------------------ Power Automate sync by email
   UEA blocks third-party apps, so two Power Automate flows email the data instead:
     - on each new email: a SYNC mail item; every 30 minutes: a SYNC calendar snapshot
   Mail sent to sync@<domain> reaches this worker through Cloudflare Email Routing. The payload is
   base64 JSON between [[SYNC: and :SYNC]] (base64 survives HTML and quoted-printable untouched).
   Only accepted when the sender matches SYNC_FROM and the subject carries SYNC_TOKEN. */
function qpDecode(s) { return s.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))); }
function b64Text(s) { try { const bin = atob(s.replace(/[^A-Za-z0-9+/=]/g, "")); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); } catch (e) { return ""; } }
function mimeTexts(raw) {
  const out = [raw];
  const bounds = [...raw.matchAll(/boundary="?([^";\r\n]+)"?/gi)].map(m => m[1]);
  for (const b of bounds) {
    for (const part of raw.split("--" + b)) {
      const cut = part.search(/\r?\n\r?\n/); if (cut < 0) continue;
      const head = part.slice(0, cut), body = part.slice(cut).trim();
      const cte = (head.match(/content-transfer-encoding:\s*([\w-]+)/i) || [])[1] || "";
      if (/base64/i.test(cte)) out.push(b64Text(body));
      else if (/quoted-printable/i.test(cte)) out.push(qpDecode(body));
      else out.push(body);
    }
  }
  return out;
}
function syncPayload(raw) {
  for (const t of mimeTexts(raw)) {
    const m = t.replace(/<[^>]*>/g, "").match(/\[\[SYNC:([\s\S]*?):SYNC\]\]/);
    if (m) { try { return JSON.parse(b64Text(m[1].replace(/&#61;|&#x3d;/gi, "="))); } catch (e) { /* try the next part */ } }
  }
  return null;
}
async function syncTables(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS sync_mail (id TEXT PRIMARY KEY, subject TEXT, sender TEXT, received TEXT, preview TEXT, link TEXT, added INTEGER)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS sync_state (k TEXT PRIMARY KEY, v TEXT, at INTEGER)").run();
}
async function handleSyncEmail(message, env) {
  const from = String(message.from || "").toLowerCase();
  const want = String(env.SYNC_FROM || "").trim().toLowerCase();
  const token = String(env.SYNC_TOKEN || "").trim();
  const subject = message.headers.get("subject") || "";
  if (!want || from !== want || !token || !subject.includes(token)) { message.setReject("Not accepted"); return; }
  const raw = await new Response(message.raw).text();
  const data = syncPayload(raw);
  if (!data) return;
  await syncTables(env);
  const now = Date.now();
  if (data.type === "mail") {
    const id = String(data.id || data.received + data.subject).slice(0, 300);
    await env.DB.prepare("INSERT OR REPLACE INTO sync_mail (id, subject, sender, received, preview, link, added) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, String(data.subject || ""), String(data.from || ""), String(data.received || ""), String(data.preview || "").slice(0, 400), String(data.link || ""), now).run();
    await env.DB.prepare("DELETE FROM sync_mail WHERE id NOT IN (SELECT id FROM sync_mail ORDER BY received DESC LIMIT 60)").run();
  } else if (data.type === "calendar") {
    await env.DB.prepare("INSERT OR REPLACE INTO sync_state (k, v, at) VALUES ('calendar', ?, ?)").bind(JSON.stringify(data.events || []), now).run();
  }
  await env.DB.prepare("INSERT OR REPLACE INTO sync_state (k, v, at) VALUES ('last', ?, ?)").bind(String(data.type || ""), now).run();
}
// what the site's /api/ms/* endpoints return when the data comes from the flows
const pick = (o, ...keys) => { for (const k of keys) { const v = k.split(".").reduce((x, y) => (x == null ? x : x[y]), o); if (v != null && v !== "") return v; } return ""; };
async function syncedApi(env, url) {
  await syncTables(env);
  const last = await env.DB.prepare("SELECT at FROM sync_state WHERE k = 'last'").first();
  const p = url.pathname;
  if (p === "/api/ms/status") return json({ connected: !!last, account: last ? "via Power Automate" : "", source: "flow", lastSync: last ? last.at : 0 });
  if (!last) return json({ notConnected: true });
  if (p === "/api/ms/mail") {
    const rows = await env.DB.prepare("SELECT subject, sender, received, preview, link FROM sync_mail ORDER BY received DESC LIMIT 15").all();
    return json({ messages: (rows.results || []).map(r => ({ subject: r.subject, from: r.sender, received: r.received, preview: r.preview, unread: Date.now() - Date.parse(r.received) < 86400000, link: r.link || "https://outlook.office.com/mail/" })) });
  }
  if (p === "/api/ms/calendar") {
    const row = await env.DB.prepare("SELECT v FROM sync_state WHERE k = 'calendar'").first();
    const days = Math.min(14, Math.max(1, Number(url.searchParams.get("days")) || 2));
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = start.getTime() + days * 86400000;
    const evs = (row ? JSON.parse(row.v) : []).map(e => ({
      subject: pick(e, "subject", "Subject"), start: String(pick(e, "start", "start.dateTime", "Start")), end: String(pick(e, "end", "end.dateTime", "End")),
      allDay: !!pick(e, "isAllDay", "IsAllDay"), location: String(pick(e, "location", "location.displayName", "Location")), link: pick(e, "webLink", "WebLink") || "https://outlook.office.com/calendar/",
    })).filter(e => { const t = Date.parse(e.start); return t >= start.getTime() - 86400000 && t < end; }).sort((a, b) => a.start.localeCompare(b.start));
    return json({ events: evs });
  }
  return json({ error: "not found" }, 404);
}

export default {
  async email(message, env) { return handleSyncEmail(message, env); },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/pin" && request.method === "POST") return handlePinPost(request, env);
    if (await validSession(request, env)) {
      if (url.pathname.startsWith("/ms/") || url.pathname.startsWith("/api/ms/")) return handleMs(request, env, url);
      return env.ASSETS.fetch(request);
    }
    return htmlResponse(loginPage(), 401);
  },
};
