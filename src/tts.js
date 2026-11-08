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

const GEMINI_STYLE = "calm, dry and precise, an unhurried refined British butler with a received-pronunciation English accent";
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

export async function ttsApi(request, env, ctx) {
  if (request.method !== "POST") return err("POST only", 405);
  if (!env.AI) return err("Workers AI isn't switched on for this site.", 503);
  let body;
  try { body = await request.json(); } catch (e) { return err("Bad JSON", 400); }
  const text = String(body.text || "").trim();
  if (!text) return err("No text", 400);
  if (text.length > 1500) return err("Too long: send a sentence at a time", 413);
  const cache = caches.default;
  if (body.voice === "enceladus" && env.GEMINI_API_KEY) {
    const gk = new Request(`https://tts.cache/enceladus/${await sha(text)}`);
    const ghit = await cache.match(gk);
    if (ghit) return ghit;
    try {
      const wav = await gemini(text, env);
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
