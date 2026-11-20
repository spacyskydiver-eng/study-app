/* Phone notifications: a morning summary of today's timetabled sessions (time and place only).
   Standard Web Push: the installed app subscribes, the Worker keeps the subscription in D1 and sends an
   encrypted push (RFC 8291, aes128gcm) signed with a VAPID key (RFC 8292). The VAPID key pair is made
   on first use and kept in D1, so there is no secret to set by hand. The cron tick sends at 07:30
   London time on days with sessions; /api/push/test sends one straight away. */

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => { s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
const cat = (...parts) => { const n = parts.reduce((s, p) => s + p.length, 0), out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
const SUBJECT = "https://alexbiomedstuff.bid";

async function tables(env) {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS push_subs (endpoint TEXT PRIMARY KEY, p256dh TEXT, auth TEXT, created INTEGER, ua TEXT)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS push_state (k TEXT PRIMARY KEY, v TEXT)"),
  ]);
}
async function vapid(env) {
  const row = await env.DB.prepare("SELECT v FROM push_state WHERE k = 'vapid'").first();
  if (row) return JSON.parse(row.v);
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const keys = { priv: await crypto.subtle.exportKey("jwk", kp.privateKey), pub: b64u(await crypto.subtle.exportKey("raw", kp.publicKey)) };
  await env.DB.prepare("INSERT OR IGNORE INTO push_state (k, v) VALUES ('vapid', ?)").bind(JSON.stringify(keys)).run();
  const again = await env.DB.prepare("SELECT v FROM push_state WHERE k = 'vapid'").first();   // another request may have won
  return JSON.parse(again.v);
}
async function vapidHeader(keys, endpoint) {
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT })));
  const key = await crypto.subtle.importKey("jwk", keys.priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${keys.pub}`;
}
const hmac = async (key, data) => new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), data));
// RFC 8291 message encryption, one record
async function encrypt(sub, text) {
  const ua = unb64u(sub.p256dh), auth = unb64u(sub.auth);
  const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, eph.privateKey, 256));
  const prkKey = await hmac(auth, shared);
  const ikm = await hmac(prkKey, cat(enc.encode("WebPush: info\0"), ua, asPub, new Uint8Array([1])));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, cat(enc.encode(text), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);     // record size 4096
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
async function sendOne(env, keys, sub, payload) {
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: { Authorization: await vapidHeader(keys, sub.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "43200", Urgency: "high" },
    body: await encrypt(sub, JSON.stringify(payload)),
  });
  if (res.status === 404 || res.status === 410) await env.DB.prepare("DELETE FROM push_subs WHERE endpoint = ?").bind(sub.endpoint).run();
  return res.status;
}
async function sendAll(env, payload) {
  await tables(env);
  const keys = await vapid(env);
  const subs = (await env.DB.prepare("SELECT endpoint, p256dh, auth FROM push_subs").all()).results || [];
  const out = [];
  for (const s of subs) { try { out.push(await sendOne(env, keys, s, payload)); } catch (e) { out.push(String(e.message || e)); } }
  return out;
}

/* ---------------------------------------------------------------- today's sessions */
const londonDay = t => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
const londonTime = t => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false }).format(t);
const BUILDINGS = [
  [/JULIAN STUDY CENTRE/, "Julian"], [/THOMAS PAINE/, "Thomas Paine"], [/ENTERPRISE CENTRE/, "Enterprise Centre"],
  [/ELIZABETH FRY/, "Elizabeth Fry"], [/NEW SCIENCES? BUILDING/, "New Science"], [/ZUCKERMAN/, "ZICER"],
  [/CONGREGATION HALL/, "Congregation Hall"], [/^SCIENCE BUILDING/, "Science"], [/QUEEN'?S/, "Queens"], [/ARTS/, "Arts"],
  [/SAINSBURY/, "Sainsbury Centre"], [/SPORTSPARK/, "Sportspark"], [/LIBRARY/, "Library"],
];
// "JULIAN STUDY CENTRE (Bld: 57) - JSC LT 0.01 (Cap: 280...)" -> "Julian"; "LECTURE THEATRE BUILDING ... - LT 2" -> "LT2";
// "NEW SCIENCES BUILDING (Bld: 60) - NEWSCI 2.02 (...)" -> "New Science 2.02"
export function shortLoc(loc) {
  const first = String(loc || "").split(";")[0].trim();
  const m = first.match(/^(.*?)\s*\(Bld:[^)]*\)\s*-\s*(.*?)\s*(\(|$)/);
  if (!m) return first.replace(/\s*\[.*?\]\s*/g, " ").trim();
  const bld = m[1].trim().toUpperCase(), room = m[2].trim();
  if (/LECTURE THEATRE BUILDING/.test(bld)) { const n = room.match(/LT\s*(\d+)/i); return n ? `LT${n[1]}` : "Lecture Theatre"; }
  const hit = BUILDINGS.find(([re]) => re.test(bld));
  const name = hit ? hit[1] : bld.replace(/\bBUILDING\b/, "").trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  if (/\bLT\b/i.test(room)) return name;                       // the building's own lecture theatre
  const num = room.match(/(\d+\.\d+[A-Z]?)/);
  return num ? `${name} ${num[1]}` : name;
}
export async function todaySessions(env, now = Date.now()) {
  const day = londonDay(now);
  const from = new Date(now - 36 * 3600e3).toISOString().slice(0, 19) + "Z", to = new Date(now + 36 * 3600e3).toISOString().slice(0, 19) + "Z";
  const rows = (await env.DB.prepare("SELECT start, location FROM ev2 WHERE start >= ? AND start < ? AND allday = 0 ORDER BY start").bind(from, to).all()).results || [];
  return rows.filter(r => /\(Bld:/.test(r.location || "") && londonDay(new Date(r.start)) === day)
    .map(r => ({ time: londonTime(new Date(r.start)), place: shortLoc(r.location) }));
}
const summary = list => ({ title: list.length === 1 ? "Today" : `Today · ${list.length}`, body: list.map(s => `${s.time}  ${s.place}`).join("\n"), tag: "today", url: "/#/calendar" });

// called from the 15-minute cron: once a day, in the 07:30–07:44 slot
export async function morningPush(env) {
  const now = Date.now(), t = londonTime(now);
  if (t < "07:30" || t >= "07:45") return;
  await tables(env);
  const day = londonDay(now);
  const done = await env.DB.prepare("SELECT v FROM push_state WHERE k = 'sent'").first();
  if (done && done.v === day) return;
  await env.DB.prepare("INSERT OR REPLACE INTO push_state (k, v) VALUES ('sent', ?)").bind(day).run();
  const list = await todaySessions(env, now);
  if (list.length) await sendAll(env, summary(list));
}

export async function pushApi(request, env, url) {
  await tables(env);
  const p = url.pathname;
  if (p === "/api/push/key") return json({ key: (await vapid(env)).pub });
  if (p === "/api/push/subscribe" && request.method === "POST") {
    const b = await request.json().catch(() => ({})), s = b.subscription || {};
    if (!s.endpoint || !s.keys || !s.keys.p256dh || !s.keys.auth || !/^https:\/\//.test(s.endpoint)) return json({ error: "bad subscription" }, 400);
    await env.DB.prepare("INSERT OR REPLACE INTO push_subs (endpoint, p256dh, auth, created, ua) VALUES (?, ?, ?, ?, ?)").bind(s.endpoint, s.keys.p256dh, s.keys.auth, Date.now(), String(request.headers.get("user-agent") || "").slice(0, 200)).run();
    return json({ ok: true });
  }
  if (p === "/api/push/unsubscribe" && request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    if (b.endpoint) await env.DB.prepare("DELETE FROM push_subs WHERE endpoint = ?").bind(b.endpoint).run();
    return json({ ok: true });
  }
  if (p === "/api/push/today") return json({ sessions: await todaySessions(env) });
  if (p === "/api/push/test" && request.method === "POST") {
    const list = await todaySessions(env);
    const msg = list.length ? summary(list) : { title: "Notifications are on", body: "Each morning at 7:30 you'll get the times and places of that day's sessions.", tag: "today", url: "/#/calendar" };
    return json({ sent: await sendAll(env, msg) });
  }
  return json({ error: "not found" }, 404);
}
