// Finds a property's own official image when none is stored.
// Uses the free microlink.io metadata API to read the og:image of the property's OFFICIAL website, in the visitor's browser.
// Results are cached in localStorage. For a complete, offline, rate-limit-free result run `npm run fetch-images` once.
const KEY = 'kh_img_cache_v1';
const DAY = 864e5;
let cache = null;
let blockedUntil = 0;
let chain = Promise.resolve();

const load = () => { if (cache) return cache; try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { cache = {}; } return cache; };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* quota */ } };

export function cachedImage(slug) {
  const e = load()[slug];
  return e && e.url ? e.url : null;
}

export function lookupImage(hotel) {
  const c = load();
  const e = c[hotel.slug];
  if (e && (e.url || Date.now() - e.t < DAY)) return Promise.resolve(e.url || null);
  if (!hotel.website || Date.now() < blockedUntil) return Promise.resolve(null);
  chain = chain.then(async () => {
    if (Date.now() < blockedUntil) return null;
    try {
      const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(hotel.website)}`);
      if (r.status === 429) { blockedUntil = Date.now() + 36e5; return null; }
      const j = await r.json();
      const url = j?.data?.image?.url || null;
      c[hotel.slug] = { url, t: Date.now() };
      save();
      await new Promise((res) => setTimeout(res, 250));
      return url;
    } catch { return null; }
  });
  return chain;
}
