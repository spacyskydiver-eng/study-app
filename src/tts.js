/* Neural text-to-speech for the read-aloud player (assets/reader.js), via Workers AI (Deepgram Aura).
   POST /api/tts { text, voice } → audio/mpeg. Each sentence is cached for 30 days, so replaying a lesson
   costs nothing. Voices: draco (Aura-2, British male baritone, the default "Jarvis style" voice),
   helios (Aura-1, British male, crisper), pandora (Aura-2, British female). */
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

export async function ttsApi(request, env, ctx) {
  if (request.method !== "POST") return err("POST only", 405);
  if (!env.AI) return err("Workers AI isn't switched on for this site.", 503);
  let body;
  try { body = await request.json(); } catch (e) { return err("Bad JSON", 400); }
  const text = String(body.text || "").trim(), v = VOICES[body.voice] || VOICES.draco;
  if (!text) return err("No text", 400);
  if (text.length > 1500) return err("Too long: send a sentence at a time", 413);
  const key = new Request(`https://tts.cache/${v.speaker}/${await sha(text)}`);
  const cache = caches.default;
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
