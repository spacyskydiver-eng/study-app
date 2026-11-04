/* The installed app's offline copy. The network always wins when it answers, so a deploy reaches the
   app on its next open with no version number to bump here. The saved copy is only for when the network
   doesn't answer, and a PIN screen (401) is never saved or replaced by a saved page: that keeps the PIN
   showing whenever the server can be reached. Mail, calendar and every /api/ call are never touched. */
const CORE = 'vault-core-1', IMAGES = 'vault-images-1', FONTS = 'vault-fonts-1';
const NAV_WAIT = 6000, ASSET_WAIT = 3000, FONT_WAIT = 2000, MAX_IMAGES = 700;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (![CORE, IMAGES, FONTS].includes(k)) await caches.delete(k);
  await self.clients.claim();
})()));

const saveable = res => res.ok && res.type === 'basic' && !res.redirected;
async function put(key, res) {
  const cache = await caches.open(CORE);
  await cache.delete(key, { ignoreSearch: true });      // the previous ?v= of the same file
  await cache.put(key, res);
}
// network first; if it hasn't answered in time use the saved copy and let the download finish behind it
async function networkFirst(key, request, wait) {
  const net = fetch(request).then(res => {
    if (saveable(res)) put(key, res.clone());
    return res;
  });
  const saved = () => caches.open(CORE).then(c => c.match(key, { ignoreSearch: true }));
  const timer = new Promise(res => setTimeout(res, wait, 'slow'));
  try {
    const first = await Promise.race([net, timer]);
    if (first !== 'slow') {
      if (first.status !== 401 || request.mode === 'navigate') return first;
      return (await saved()) || first;      // a file behind an expired PIN: the page's own check brings the PIN up
    }
    net.catch(() => {});
    return (await saved()) || await net;
  } catch (e) {
    const hit = await saved();
    if (hit) return hit;
    throw e;
  }
}
// note and card images: show the saved one at once, refresh it behind
async function images(request) {
  const cache = await caches.open(IMAGES);
  const hit = await cache.match(request);
  const net = fetch(request).then(async res => {
    if (saveable(res)) {
      await cache.put(request, res.clone());
      const keys = await cache.keys();
      for (const k of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) await cache.delete(k);
    }
    return res;
  });
  if (hit) { net.catch(() => {}); return hit; }
  return net;
}
// the stylesheet imports Google Fonts, and the page can't draw until that answers: on a bad signal
// give up quickly and let the system font stand in
async function fonts(request) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const net = fetch(request).then(res => { cache.put(request, res.clone()); return res; });
  net.catch(() => {});
  const res = await Promise.race([net, new Promise(ok => setTimeout(ok, FONT_WAIT))]).catch(() => null);
  return res || new Response('', { headers: { 'Content-Type': /css/.test(request.url) || request.destination === 'style' ? 'text/css' : 'font/woff2' } });
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return e.respondWith(fonts(req));
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/^\/(api|ms|pin|outbox|legacy)(\/|$)/.test(url.pathname)) return;
  if (req.mode === 'navigate') return e.respondWith(networkFirst('/', req, NAV_WAIT));
  if (url.pathname.startsWith('/attachments/')) return e.respondWith(images(req));
  if (/^\/(assets|data)\//.test(url.pathname)) return e.respondWith(networkFirst(url.pathname + url.search, req, ASSET_WAIT));
});
