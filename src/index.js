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
    if (p.startsWith("/api/") && env.SYNC_TOKEN) return syncedApi(env, url, request);
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
  const bounds = [...raw.matchAll(/boundary="?([^";\r\n]+)"?/gi)].map(m => m[1]);
  const out = [];
  if (!bounds.length) {   // single-part message: decode the body by the top-level encoding
    const cut = raw.search(/\r?\n\r?\n/), head = raw.slice(0, cut), body = raw.slice(cut);
    const cte = (head.match(/content-transfer-encoding:\s*([\w-]+)/i) || [])[1] || "";
    out.push(/base64/i.test(cte) ? b64Text(body) : /quoted-printable/i.test(cte) ? qpDecode(body) : body);
  }
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
/* Payloads (Power Automate has no createObject, so plain base64 pieces are used):
     [[SYNC:M|subject|from|received|preview|id:SYNC]]   one new email, each field base64
     [[SYNC:E|<base64 JSON array of emails>:SYNC]]      latest emails from "Get emails (V3)"
     [[SYNC:C|<base64 JSON array of events>:SYNC]]      events from "Get calendar view of events (V3)"
   An older single base64 JSON object form is still accepted. */
function syncPayload(raw) {
  const out = { mail: [], batchMail: null, events: null };
  const seen = new Set();
  for (const t of mimeTexts(raw)) {
    const text = t.replace(/<[^>]*>/g, "").replace(/&#61;|&#x3d;/gi, "=");
    for (const m of text.matchAll(/\[\[SYNC:([\s\S]*?):SYNC\]\]/g)) {
      const body = m[1].replace(/\s+/g, "");
      if (seen.has(body)) continue; seen.add(body);
      const parts = body.split("|");
      try {
        if (parts[0] === "M") {
          const [, subject, from, received, preview, id] = parts.map(b64Text);
          out.mail.push({ subject, from, received, preview, id });
        } else if (parts[0] === "E") out.batchMail = JSON.parse(b64Text(parts[1]));
        else if (parts[0] === "C") out.events = JSON.parse(b64Text(parts[1]));
        else {
          const d = JSON.parse(b64Text(body));
          if (d.type === "mail") out.mail.push(d);
          if (d.type === "calendar") out.events = d.events || [];
          if (d.type === "batch") { out.batchMail = d.mail || []; out.events = d.events || []; }
        }
      } catch (e) { /* skip a damaged piece */ }
    }
  }
  return out.mail.length || out.batchMail || out.events ? out : null;
}
async function syncTables(env) {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS sync_state (k TEXT PRIMARY KEY, v TEXT, at INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS mail2 (id TEXT PRIMARY KEY, subject TEXT, sender TEXT, recips TEXT, cc TEXT, received TEXT, preview TEXT, unread INTEGER, att INTEGER, html TEXT, body TEXT, added INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS ev2 (id TEXT PRIMARY KEY, subject TEXT, start TEXT, finish TEXT, allday INTEGER, location TEXT, organizer TEXT, body TEXT, link TEXT)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, recips TEXT, cc TEXT, subject TEXT, html TEXT, created INTEGER)"),
  ]);
}
// email / event HTML to readable text (for the assistant, search and previews)
function htmlToText(html) {
  let s = String(html || "");
  if (!/<[a-z!/][^>]*>/i.test(s)) return s.replace(/\r/g, "").trim();
  s = s.replace(/<(style|script|head|title)[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|tr|h\d|table|ul|ol|blockquote)>/gi, "\n").replace(/<li[^>]*>/gi, "\n• ").replace(/<\/t[dh]>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/gi, "&");
  return s.split("\n").map(l => l.replace(/[ \t ͏‌]+/g, " ").trim()).join("\n")
    .replace(/^Warning: This email is from outside the UEA system[^\n]*\n*/m, "").replace(/\n{3,}/g, "\n\n").trim();
}
const truthy = v => v === true || /^true$/i.test(String(v));
const addrList = v => { if (Array.isArray(v)) return v.map(x => (x && (x.emailAddress ? x.emailAddress.address : x.address)) || String(x)).join("; "); return String(v || "").replace(/^\[\]$/, ""); };
async function handleSyncEmail(message, env) {
  const from = String(message.from || "").toLowerCase();
  const want = String(env.SYNC_FROM || "").trim().toLowerCase();
  const token = String(env.SYNC_TOKEN || "").trim();
  const subject = message.headers.get("subject") || "";
  await syncTables(env);
  // SYNC_FROM may be a full address or just the domain (uea.ac.uk); the token is the real check
  const fromOk = want && (want.includes("@") ? from === want : from.endsWith("@" + want));
  const note = async why => env.DB.prepare("INSERT OR REPLACE INTO sync_state (k, v, at) VALUES ('reject', ?, ?)").bind(JSON.stringify({ why, from, subject: subject.slice(0, 120) }), Date.now()).run();
  if (!token || !subject.includes(token)) { await note("no token in subject"); message.setReject("Not accepted"); return; }
  if (!fromOk) { await note("sender not allowed"); message.setReject("Not accepted"); return; }
  const raw = await new Response(message.raw).text();
  const data = syncPayload(raw);
  if (!data) { await note("no [[SYNC: payload found in the body"); return; }
  const now = Date.now();
  // the flows' own messages (SYNC / SYNC-SEND) are never shown as mail
  const own = m => /^\s*SYNC\b/.test(String(m.subject || ""));
  const quick = data.mail.filter(m => !own(m)).map(m => env.DB.prepare(
    "INSERT INTO mail2 (id, subject, sender, recips, cc, received, preview, unread, att, html, body, added) VALUES (?, ?, ?, '', '', ?, ?, 1, 0, '', '', ?) ON CONFLICT(id) DO NOTHING")
    .bind(String(m.id || m.received + m.subject).slice(0, 400), String(m.subject || ""), String(m.from || ""), utc(m.received), String(m.preview || "").slice(0, 400), now));
  const full = (data.batchMail || []).filter(m => !own(m)).map(m => {
    const html = String(pick(m, "body", "Body") || "");
    const text = htmlToText(html) || String(pick(m, "preview", "bodyPreview") || "");
    return env.DB.prepare("INSERT OR REPLACE INTO mail2 (id, subject, sender, recips, cc, received, preview, unread, att, html, body, added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(String(pick(m, "id", "Id") || pick(m, "received", "receivedDateTime") + m.subject).slice(0, 400), String(pick(m, "subject", "Subject") || ""), String(pick(m, "from", "From") || ""),
        addrList(pick(m, "to", "toRecipients")), addrList(pick(m, "cc", "ccRecipients")), utc(pick(m, "received", "receivedDateTime")),
        String(pick(m, "preview", "bodyPreview") || text).replace(/^Warning: This email is from outside the UEA system[^\n]*\s*/, "").slice(0, 400),
        truthy(pick(m, "isRead", "IsRead")) ? 0 : 1, truthy(pick(m, "att", "hasAttachments")) ? 1 : 0, html.slice(0, 60000), text.slice(0, 30000), now);
  });
  for (let i = 0; i < quick.length + full.length; i += 50) await env.DB.batch([...quick, ...full].slice(i, i + 50));
  await env.DB.prepare("DELETE FROM mail2 WHERE id NOT IN (SELECT id FROM mail2 ORDER BY received DESC LIMIT 400)").run();
  if (data.events) {
    const rows = data.events.map(e => env.DB.prepare("INSERT OR REPLACE INTO ev2 (id, subject, start, finish, allday, location, organizer, body, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(String(pick(e, "id", "Id") || pick(e, "start", "start.dateTime") + pick(e, "subject")).slice(0, 400), String(pick(e, "subject", "Subject") || ""),
        utc(pick(e, "start", "start.dateTime", "Start")), utc(pick(e, "end", "end.dateTime", "End")), truthy(pick(e, "allDay", "isAllDay", "IsAllDay")) ? 1 : 0,
        String(pick(e, "location", "location.displayName", "Location") || ""), addrList(pick(e, "organizer", "Organizer")),
        htmlToText(pick(e, "body", "Body")).replace(/_{8,}[\s\S]*$/, "").slice(0, 4000), String(pick(e, "link", "webLink", "WebLink") || "")));
    // a calendar snapshot replaces what was stored (deleted / moved events disappear)
    await env.DB.prepare("DELETE FROM ev2").run();
    for (let i = 0; i < rows.length; i += 80) await env.DB.batch(rows.slice(i, i + 80));
  }
  await env.DB.prepare("INSERT OR REPLACE INTO sync_state (k, v, at) VALUES ('last', ?, ?)").bind(data.events ? "calendar" : "mail", now).run();
}
// what the site's /api/ms/* endpoints return when the data comes from the flows
// Outlook connector times are UTC without a zone marker; add Z so browsers don't read them as local
const utc = v => { v = String(v || ""); return /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v) ? v.replace(/\.\d+$/, "") + "Z" : v; };
const pick = (o, ...keys) => { for (const k of keys) { const v = k.split(".").reduce((x, y) => (x == null ? x : x[y]), o); if (v != null && v !== "") return v; } return ""; };
const OUTLOOK = "https://outlook.office.com/mail/";
const mailOut = (r, full) => ({ id: r.id, subject: r.subject, from: r.sender, to: r.recips, cc: r.cc, received: r.received, preview: r.preview, unread: !!r.unread, attachments: !!r.att, link: OUTLOOK, ...(full ? { html: r.html, text: r.body } : {}) });
const evOut = r => ({ id: r.id, subject: r.subject, start: r.start, end: r.finish, allDay: !!r.allday, location: r.location, organizer: r.organizer, ...(r.body != null ? { description: r.body } : {}), link: r.link || "https://outlook.office.com/calendar/" });
async function eventsBetween(env, from, to, withBody) {
  const rows = await env.DB.prepare(`SELECT id, subject, start, finish, allday, location, organizer, ${withBody ? "body," : ""} link FROM ev2 WHERE finish >= ? AND start < ? ORDER BY start`).bind(from, to).all();
  return (rows.results || []).map(evOut);
}
const isoDay = t => new Date(t).toISOString().slice(0, 19) + "Z";
async function syncedApi(env, url, request) {
  await syncTables(env);
  const last = await env.DB.prepare("SELECT at FROM sync_state WHERE k = 'last'").first();
  const p = url.pathname, q = url.searchParams;
  if (p === "/api/ms/status") {
    const rej = await env.DB.prepare("SELECT v, at FROM sync_state WHERE k = 'reject'").first();
    return json({ connected: !!last, account: last ? "via Power Automate" : "", source: "flow", lastSync: last ? last.at : 0, lastReject: rej ? { ...JSON.parse(rej.v), at: rej.at } : null, ai: !!env.AI, canSend: true });
  }
  if (p === "/api/ms/send" && request.method === "POST") return queueSend(env, request, url);
  if (p === "/api/ms/outbox") {
    const rows = await env.DB.prepare("SELECT id, recips, subject, created FROM outbox ORDER BY created DESC LIMIT 20").all();
    return json({ items: rows.results || [] });
  }
  if (!last) return json({ notConnected: true });
  if (p === "/api/ms/mail") {
    if (q.get("id")) {
      const r = await env.DB.prepare("SELECT * FROM mail2 WHERE id = ?").bind(q.get("id")).first();
      return r ? json({ message: mailOut(r, true) }) : json({ error: "not found" }, 404);
    }
    const limit = Math.min(400, Math.max(1, Number(q.get("limit")) || 15));
    const rows = await env.DB.prepare("SELECT id, subject, sender, recips, cc, received, preview, unread, att FROM mail2 ORDER BY received DESC LIMIT ?").bind(limit).all();
    return json({ messages: (rows.results || []).map(r => mailOut(r)) });
  }
  if (p === "/api/ms/calendar") {
    if (q.get("id")) {
      const r = await env.DB.prepare("SELECT * FROM ev2 WHERE id = ?").bind(q.get("id")).first();
      return r ? json({ event: evOut(r) }) : json({ error: "not found" }, 404);
    }
    let from, to;
    if (q.get("from")) { from = q.get("from"); to = q.get("to") || isoDay(Date.parse(from) + 31 * 864e5); }
    else {
      const days = Math.min(400, Math.max(1, Number(q.get("days")) || 2));
      const start = new Date(); start.setUTCHours(0, 0, 0, 0);
      from = isoDay(start.getTime() - 864e5); to = isoDay(start.getTime() + days * 864e5);
    }
    return json({ events: await eventsBetween(env, from, to, q.get("full") === "1") });
  }
  if (p === "/api/jarvis" && request.method === "POST") return jarvis(env, request);
  return json({ error: "not found" }, 404);
}

/* ------------------------------------------------------------------ sending through Outlook
   The site can't reach UEA's mail directly, so a third flow ("When a feed item is published" on
   /outbox/<SYNC_TOKEN>.rss) picks queued messages up and sends them with "Send an email (V2)".
   Each item's description is base64 JSON {to, cc, subject, html}. Only drafts Alex confirmed reach it. */
const okAddr = s => /^[^\s@<>;,]+@[^\s@<>;,]+\.[a-z]{2,}$/i.test(s);
const splitAddrs = v => String(v || "").split(/[;,\s]+/).map(x => x.trim()).filter(Boolean);
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
async function queueSend(env, request) {
  let d; try { d = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const to = splitAddrs(d.to), cc = splitAddrs(d.cc);
  if (!to.length || ![...to, ...cc].every(okAddr)) return json({ error: "Check the email addresses." }, 400);
  const subject = String(d.subject || "").trim().slice(0, 250);
  const text = String(d.body || "").slice(0, 20000);
  if (!subject || !text.trim()) return json({ error: "Add a subject and a message." }, 400);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM outbox WHERE created > ?").bind(Date.now() - 3600000).first();
  if (recent && recent.n >= 20) return json({ error: "That's 20 emails this hour; try again later." }, 429);
  const html = `<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt">${escHtml(text).replace(/\r?\n/g, "<br>")}</div>`;
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO outbox (id, recips, cc, subject, html, created) VALUES (?, ?, ?, ?, ?, ?)").bind(id, to.join(";"), cc.join(";"), subject, html, Date.now()).run();
  await env.DB.prepare("DELETE FROM outbox WHERE created < ?").bind(Date.now() - 7 * 864e5).run();
  return json({ queued: true, id });
}
function b64utf8(s) { const bytes = new TextEncoder().encode(s); let bin = ""; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin); }
async function outboxFeed(env, url) {
  await syncTables(env);
  const rows = await env.DB.prepare("SELECT * FROM outbox WHERE created > ? ORDER BY created DESC LIMIT 20").bind(Date.now() - 6 * 3600000).all();
  const items = (rows.results || []).map(r => `<item><guid isPermaLink="false">${r.id}</guid><title>${escHtml(r.subject)}</title><link>${url.origin}/#${r.id}</link><description>${b64utf8(JSON.stringify({ to: r.recips, cc: r.cc, subject: r.subject, html: r.html }))}</description><pubDate>${new Date(r.created).toUTCString()}</pubDate></item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Outbox</title><link>${url.origin}/</link><description>Queued emails</description><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "no-store" } });
}

/* ------------------------------------------------------------------ Jarvis: answers over mail + calendar
   Workers AI (binding AI). The question is matched against stored mail and events; the best matches
   go to the model in full, the rest as a one-line index. The model replies as JSON so a draft can be
   shown for review and only sent when Alex presses Send. */
const STOP = new Set("a an the and or of to in on at for from with about is are was were be been i me my you your it this that these those what whats which who whom when where how do does did can could would should will please email emails mail mails message messages inbox outlook find show tell give get any some all today tomorrow yesterday week calendar event events summarise summarize summary draft write reply send new latest recent got have has had there their them they he she his her him".split(" "));
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const londonDate = t => new Date(t).toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const londonDay = t => new Date(t).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
async function jarvis(env, request) {
  if (!env.AI) return json({ error: "The AI isn't switched on for this site yet (Workers AI binding missing)." }, 503);
  let d; try { d = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const q = String(d.q || "").slice(0, 2000);
  const lq = q.toLowerCase();
  const history = (Array.isArray(d.history) ? d.history : []).slice(-6).map(h => ({ q: String(h.q || "").slice(0, 600), a: String(h.a || "").slice(0, 900) }));
  const now = Date.now(), today = londonDay(now);
  const words = [...new Set((lq + " " + history.slice(-2).map(h => h.q.toLowerCase()).join(" ")).match(/[a-z0-9@.\-']{3,}/g) || [])].filter(w => !STOP.has(w));

  const mails = ((await env.DB.prepare("SELECT id, subject, sender, recips, cc, received, preview, unread, body FROM mail2 ORDER BY received DESC LIMIT 400").all()).results || []);
  const scoreMail = m => { const hay = (m.subject + " " + m.sender + " " + m.recips).toLowerCase(), body = (m.body || "").toLowerCase(); let s = 0; for (const w of words) { if (hay.includes(w)) s += 3; if (body.includes(w)) s += 1; } return s; };
  const wantToday = /\btoday|this morning|tonight\b/.test(lq), wantYest = /\byesterday\b/.test(lq);
  const focus = new Map();
  if (d.emailId) { const m = mails.find(x => x.id === d.emailId); if (m) focus.set(m.id, 9000); }
  if (wantToday || wantYest) mails.filter(m => londonDay(m.received) === (wantYest ? londonDay(now - 864e5) : today)).slice(0, 10).forEach(m => focus.set(m.id, focus.get(m.id) || 1500));
  if (/\b(latest|recent|new|unread|last)\b/.test(lq) && !focus.size) mails.slice(0, 6).forEach(m => focus.set(m.id, 1200));
  mails.map(m => [m, scoreMail(m)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([m]) => { if (!focus.has(m.id)) focus.set(m.id, 2500); });
  const mailRef = [], mailIndex = [], mailFull = [];
  mails.slice(0, 120).concat(mails.filter(m => focus.has(m.id) && mails.indexOf(m) >= 120)).forEach(m => {
    const k = "E" + (mailRef.push(m.id));
    mailIndex.push(`${k} | ${londonDate(m.received)} | from ${m.sender}${m.unread ? " | UNREAD" : ""} | ${m.subject}`);
    if (focus.has(m.id)) mailFull.push(`### ${k}\nFrom: ${m.sender}\nTo: ${m.recips}${m.cc ? "\nCc: " + m.cc : ""}\nDate: ${londonDate(m.received)}\nSubject: ${m.subject}\n\n${(m.body || m.preview || "").slice(0, focus.get(m.id))}`);
  });

  // calendar: the next two weeks always, plus anything the question names (a month, or matching words)
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const evMap = new Map();
  (await eventsBetween(env, isoDay(start.getTime() - 864e5), isoDay(start.getTime() + 15 * 864e5), true)).forEach(e => evMap.set(e.id, e));
  const mi = MONTHS.findIndex(m => new RegExp("\\b" + m.slice(0, 3) + "(" + m.slice(3) + ")?\\b").test(lq));
  if (mi >= 0) { const y = start.getUTCFullYear() + (mi < start.getUTCMonth() - 2 ? 1 : 0); (await eventsBetween(env, isoDay(Date.UTC(y, mi, 1)), isoDay(Date.UTC(y, mi + 1, 1)), true)).slice(0, 120).forEach(e => evMap.set(e.id, e)); }
  if (/\b(next|this) month\b/.test(lq)) (await eventsBetween(env, isoDay(start.getTime()), isoDay(start.getTime() + 45 * 864e5), true)).slice(0, 150).forEach(e => evMap.set(e.id, e));
  if (words.length) {
    const all = (await env.DB.prepare("SELECT id, subject, start, finish, allday, location, organizer, body, link FROM ev2 ORDER BY start").all()).results || [];
    all.map(r => { const hay = (r.subject + " " + r.location + " " + r.body).toLowerCase(); return [r, words.filter(w => hay.includes(w)).length]; })
      .filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || a[0].start.localeCompare(b[0].start)).slice(0, 25).forEach(([r]) => evMap.set(r.id, evOut(r)));
  }
  const evRef = [], evLines = [...evMap.values()].sort((a, b) => a.start.localeCompare(b.start)).map(e => {
    const k = "C" + evRef.push(e.id);
    return `${k} | ${e.allDay ? londonDay(e.start) + " all day" : londonDate(e.start) + " to " + new Date(e.end).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" })} | ${e.subject}${e.location ? " | " + e.location : ""}${e.description ? " | notes: " + e.description.replace(/\s+/g, " ").slice(0, 300) : ""}`;
  });

  const system = `You are Jarvis, the assistant built into Alex Taylor's study site. Alex is a first-year BSc Biomedicine student at the University of East Anglia (UEA); his email is A.Taylor12@uea.ac.uk. You can read his Outlook inbox and calendar below (synced copies) and you can prepare emails for him to send.
Now: ${londonDate(now)} (UK time).
Rules:
- Use only the emails and events given. If something isn't there, say so plainly. Never invent senders, dates or content.
- Be concise and direct, UK English, no exclamation marks. Use short markdown (bold, bullet lists) when it helps.
- When you mention specific emails or events, put their keys (E3, C7) in "refs" so the site can link them; in the reply text use their names, not the keys.
- When Alex asks you to write, draft, reply to or send an email, put the email in "draft": to (addresses separated by ;), cc, subject, body (plain text, line breaks as \\n, signed "Alex"). Take addresses from the emails below; if you can't find the person's address, leave "to" empty and say so. For a reply, use "Re: " + the original subject. Never say an email has been sent; say the draft is ready to check.
- When Alex asks you to open, show, go to, pull up or take him to an email, his inbox, his calendar or a day, set "open": {"page": "mail" or "calendar", "ref": the key (E3 / C2) or null, "date": "YYYY-MM-DD" or null}, and keep "reply" to one short line. Otherwise "open" is null.
- Reply with JSON only: {"reply": "markdown text", "refs": ["E1","C2"], "draft": null or {"to":"","cc":"","subject":"","body":""}, "open": null or {"page":"","ref":null,"date":null}}`;
  const context = `INBOX (newest first, ${mails.length} stored):\n${mailIndex.join("\n") || "(empty)"}\n\nEMAILS IN FULL:\n${mailFull.join("\n\n") || "(none matched)"}\n\nCALENDAR (${evLines.length} events shown):\n${evLines.join("\n") || "(none)"}`;
  const messages = [{ role: "system", content: system }, { role: "user", content: context.slice(0, 60000) }, { role: "assistant", content: '{"reply": "Got it. I have your inbox and calendar.", "refs": [], "draft": null}' }];
  for (const h of history) { messages.push({ role: "user", content: h.q }, { role: "assistant", content: JSON.stringify({ reply: h.a, refs: [], draft: null }) }); }
  messages.push({ role: "user", content: q + (d.draft ? `\n\n(Current draft being edited: ${JSON.stringify(d.draft).slice(0, 4000)})` : "") });

  let out = null, raw = "";
  for (const model of ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fast"]) {
    try {
      const r = await env.AI.run(model, { messages, max_tokens: 1400, temperature: 0.3, response_format: { type: "json_object" } });
      raw = r && r.response;
      out = typeof raw === "object" && raw ? raw : JSON.parse(String(raw).replace(/^[^{]*/, "").replace(/[^}]*$/, ""));
      if (out && typeof out.reply === "string") break;
    } catch (e) {
      if (typeof raw === "string" && raw.trim()) { out = { reply: raw.trim(), refs: [], draft: null }; break; }
      out = { reply: "", error: String(e && e.message || e) };
    }
  }
  if (!out || (!out.reply && !out.draft)) return json({ error: "The AI didn't answer" + (out && out.error ? ": " + out.error : ".") }, 502);
  const refs = (Array.isArray(out.refs) ? out.refs : []).map(String);
  const emails = refs.filter(r => /^E\d+$/.test(r)).map(r => mails.find(m => m.id === mailRef[+r.slice(1) - 1])).filter(Boolean).map(m => ({ id: m.id, subject: m.subject, from: m.sender, received: m.received, unread: !!m.unread }));
  const events = refs.filter(r => /^C\d+$/.test(r)).map(r => evMap.get(evRef[+r.slice(1) - 1])).filter(Boolean).map(e => ({ id: e.id, subject: e.subject, start: e.start, end: e.end, allDay: e.allDay, location: e.location }));
  // keys the model wrote into the text become the email / event name
  const refName = (t, n) => { if (t === "E") { const m = mails.find(x => x.id === mailRef[n - 1]); return m ? `“${m.subject}”` : ""; } const e = evMap.get(evRef[n - 1]); return e ? `“${e.subject}”` : ""; };
  const reply = String(out.reply || "").replace(/\(?\b([EC])(\d+)\b\)?/g, (m, t, n) => refName(t, +n) || m).replace(/ {2,}/g, " ").trim();
  let draft = out.draft && typeof out.draft === "object" ? { to: String(out.draft.to || ""), cc: String(out.draft.cc || ""), subject: String(out.draft.subject || ""), body: String(out.draft.body || "") } : null;
  if (draft && !draft.subject && !draft.body) draft = null;
  let open = null;
  if (out.open && typeof out.open === "object" && /^(mail|calendar)$/.test(out.open.page)) {
    const ref = String(out.open.ref || "");
    open = { page: out.open.page, id: null, start: null, title: "" };
    if (/^E\d+$/.test(ref)) { const m = mails.find(x => x.id === mailRef[+ref.slice(1) - 1]); if (m) Object.assign(open, { page: "mail", id: m.id, title: m.subject }); }
    if (/^C\d+$/.test(ref)) { const e = evMap.get(evRef[+ref.slice(1) - 1]); if (e) Object.assign(open, { page: "calendar", id: e.id, start: e.start, title: e.subject }); }
    if (!open.start && /^\d{4}-\d{2}-\d{2}$/.test(String(out.open.date || ""))) open.start = out.open.date + "T12:00:00Z";
  }
  return json({ reply, emails, events, draft, open });
}

export default {
  async email(message, env) { return handleSyncEmail(message, env); },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/pin" && request.method === "POST") return handlePinPost(request, env);
    // the send flow reads queued emails from here; the secret token in the path is the key
    const tok = String(env.SYNC_TOKEN || "").trim();
    if (tok && url.pathname === `/outbox/${tok}.rss`) return outboxFeed(env, url);
    if (await validSession(request, env)) {
      if (url.pathname.startsWith("/ms/") || url.pathname.startsWith("/api/ms/") || url.pathname === "/api/jarvis") return handleMs(request, env, url);
      // pages are never kept by the browser: an expired session must reach the PIN screen, not a saved copy
      const res = await env.ASSETS.fetch(request);
      if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
      const out = new Response(res.body, res);
      out.headers.set("Cache-Control", "private, no-store");
      return out;
    }
    return htmlResponse(loginPage(), 401);
  },
};
