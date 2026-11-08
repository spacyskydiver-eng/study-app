/* Neural text-to-speech for the read-aloud player (assets/reader.js), via Workers AI (Deepgram Aura).
   POST /api/tts { text, voice } → audio/mpeg. Each sentence is cached for 30 days, so replaying a lesson
   costs nothing. Voices: enceladus (Google Gemini TTS told to speak as a dry, refined British butler:
   the voice the open-source "Jarvis voice butler" projects use; needs the GEMINI_API_KEY secret, and falls
   back to draco without it), draco (Aura-2, British male baritone), helios (Aura-1, British male, crisper),
   pandora (Aura-2, British female). */
const VOICES = {
  draco: { model: "@cf/deepgram/aura-2-en", speaker: "draco" },
  helios: { model: "@cf/deepgram/aura-1", speaker: "helios" },
  pandora: { model: "@cf/deepgram/aura-2-en", speaker: "pandora" },
};

async function sha(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const err = (msg, status) => new Response(JSON.stringify({ error: msg }), { status, headers: { "Content-Type": "application/json" } });

const GEMINI_STYLE = "a calm, dry, refined British butler with a received-pronunciation accent, speaking at a natural, flowing conversational pace with only brief pauses between sentences";
async function gemini(text, env) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts",
      input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style: GEMINI_STYLE }] }] }],
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice: "Enceladus" }] },
    }),
  });
  if (!r.ok) throw new Error("gemini " + r.status + " " + (await r.text()).slice(0, 160));
  const j = await r.json();
  let data = null;
  for (const st of j.steps || []) if (st.type === "model_output") for (const c of st.content || []) if (c.type === "audio" && c.data) data = c.data;
  if (!data) throw new Error("gemini: no audio in reply");
  return Uint8Array.from(atob(data), c => c.charCodeAt(0)).buffer;   // WAV, 24 kHz mono
}

/* Gemini clips start and end with a breath of silence; trimmed so clips run on from each other */
function trimWav(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  if (String.fromCharCode(...u8.slice(0, 4)) !== "RIFF") return buf;
  let off = 12, fmt = null, data = null;
  while (off + 8 <= u8.length) {
    const id = String.fromCharCode(...u8.slice(off, off + 4)), size = dv.getUint32(off + 4, true);
    if (id === "fmt ") fmt = { ch: dv.getUint16(off + 10, true), rate: dv.getUint32(off + 12, true), bits: dv.getUint16(off + 22, true) };
    if (id === "data") { data = { start: off + 8, size: Math.min(size, u8.length - off - 8) }; break; }
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.bits !== 16) return buf;
  const frame = 2 * fmt.ch, n = Math.floor(data.size / frame), loud = 500;
  const amp = i => Math.abs(dv.getInt16(data.start + i * frame, true));
  let a = 0, b = n - 1;
  while (a < n && amp(a) < loud) a++;
  while (b > a && amp(b) < loud) b--;
  a = Math.max(0, a - Math.round(fmt.rate * 0.03));
  b = Math.min(n - 1, b + Math.round(fmt.rate * 0.12));
  const len = (b - a + 1) * frame, out = new Uint8Array(44 + len), o = new DataView(out.buffer);
  const w = (p, t) => [...t].forEach((c, k) => { out[p + k] = c.charCodeAt(0); });
  w(0, "RIFF"); o.setUint32(4, 36 + len, true); w(8, "WAVEfmt "); o.setUint32(16, 16, true); o.setUint16(20, 1, true);
  o.setUint16(22, fmt.ch, true); o.setUint32(24, fmt.rate, true); o.setUint32(28, fmt.rate * frame, true); o.setUint16(32, frame, true);
  o.setUint16(34, 16, true); w(36, "data"); o.setUint32(40, len, true);
  out.set(u8.subarray(data.start + a * frame, data.start + a * frame + len), 44);
  return out.buffer;
}

export async function ttsApi(request, env, ctx) {
  if (request.method !== "POST") return err("POST only", 405);
  if (!env.AI) return err("Workers AI isn't switched on for this site.", 503);
  let body;
  try { body = await request.json(); } catch (e) { return err("Bad JSON", 400); }
  const text = String(body.text || "").trim();
  if (!text) return err("No text", 400);
  if (text.length > 2500) return err("Too long: send a sentence at a time", 413);
  const cache = caches.default;
  if (body.voice === "enceladus" && env.GEMINI_API_KEY) {
    const gk = new Request(`https://tts.cache/enceladus2/${await sha(text)}`);
    const ghit = await cache.match(gk);
    if (ghit) return ghit;
    try {
      const wav = trimWav(await gemini(text, env));
      ctx.waitUntil(cache.put(gk, new Response(wav, { headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=2592000" } })));
      return new Response(wav, { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=2592000", "X-TTS-Voice": "enceladus" } });
    } catch (e) { console.log("tts: " + e.message + "; using draco"); }
  }
  const v = VOICES[body.voice] || VOICES.draco;   // enceladus without a key (or failing) reads as draco
  const key = new Request(`https://tts.cache/${v.speaker}/${await sha(text)}`);
  const hit = await cache.match(key);
  if (hit) return hit;
  let out;
  try {
    out = await env.AI.run(v.model, { text, speaker: v.speaker, encoding: "mp3" });
  } catch (e) {
    return err("The voice service didn't answer: " + String(e && e.message || e).slice(0, 200), 502);
  }
  let bytes;
  if (out instanceof ReadableStream) bytes = await new Response(out).arrayBuffer();
  else if (out && out.audio) bytes = Uint8Array.from(atob(out.audio), c => c.charCodeAt(0)).buffer;
  else if (out instanceof ArrayBuffer || ArrayBuffer.isView(out)) bytes = out;
  else return err("Unexpected reply from the voice service", 502);
  const res = new Response(bytes, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=2592000" } });
  const toCache = new Response(bytes, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=2592000" } });
  ctx.waitUntil(cache.put(key, toCache));
  return res;
}
