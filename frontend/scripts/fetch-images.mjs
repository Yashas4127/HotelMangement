// Collects each property's OWN images from its official website / gallery page.
// Run on your machine (needs internet):  npm run fetch-images
// Output: src/data/resolvedImages.json  { "<hotel-slug>": [{ url, label, caption, source_page }] }
// Only images found on the property's own pages are saved. Reuse permission is NOT implied: get written permission before launch.
import fs from 'node:fs';
import { slugify } from '../src/utils/slug.js';

const raw = JSON.parse(fs.readFileSync('src/data/karnataka_hotels_curated_66_research_v5.json', 'utf8'));
const OUT = 'src/data/resolvedImages.json';
const MAX = 8, CONCURRENCY = 4, TIMEOUT = 15000;
const BAD = /logo|icon|favicon|sprite|avatar|placeholder|loader|pixel|badge|payment|tripadvisor|\.svg|\.gif|1x1|blank|whatsapp|facebook|instagram|flag/i;
const GOOD_EXT = /\.(jpe?g|png|webp|avif)(\?|#|$)/i;

export function extractImages(html, base) {
  const found = [];
  const push = (u) => {
    if (!u) return;
    u = u.trim().replace(/&amp;/g, '&');
    if (u.startsWith('data:') || u.startsWith('blob:')) return;
    try { found.push(new URL(u, base).href); } catch { /* ignore */ }
  };
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/gi)) push((m[0].match(/content=["']([^"']+)["']/i) || [])[1]);
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const attr = (n) => (tag.match(new RegExp(`${n}=["']([^"']+)["']`, 'i')) || [])[1];
    const w = parseInt(attr('width') || '0', 10);
    if (w && w < 300) continue;
    const srcset = attr('data-srcset') || attr('srcset');
    const best = srcset ? srcset.split(',').map((x) => x.trim().split(/\s+/)[0]).pop() : null;
    push(attr('data-src') || attr('data-lazy-src') || best || attr('src'));
  }
  for (const m of html.matchAll(/url\(["']?([^"')]+\.(?:jpe?g|png|webp))["']?\)/gi)) push(m[1]);
  const seen = new Set();
  return found.filter((u) => {
    if (BAD.test(u)) return false;
    const looksImg = GOOD_EXT.test(u) || /image|upload|media|cdn|photo|gallery/i.test(u);
    const key = u.split('?')[0];
    if (!looksImg || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

async function get(url) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; KarnatakaStaysBot/1.0)', accept: 'text/html' } });
    if (!r.ok) return null;
    return { html: await r.text(), url: r.url };
  } catch { return null; } finally { clearTimeout(t); }
}

async function one(p) {
  const pages = [...new Set([p.official_gallery_or_property_photo_source, p.official_website_or_best_available_listing].filter((u) => u && /^https?:/.test(u)))];
  const out = [];
  for (const page of pages) {
    const res = await get(page);
    if (!res) continue;
    for (const url of extractImages(res.html, res.url)) if (!out.some((o) => o.url === url)) out.push({ url, label: out.length ? 'Property photo' : 'Cover', caption: `${p.property_name}`, source_page: page });
    if (out.length >= MAX) break;
  }
  return out.slice(0, MAX);
}

if (process.argv[1] && process.argv[1].endsWith('fetch-images.mjs')) {
  const result = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const queue = [...raw.properties]; let done = 0, got = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const p = queue.shift(); const slug = slugify(p.property_name);
      const imgs = await one(p);
      if (imgs.length) { result[slug] = imgs; got++; }
      console.log(`[${++done}/${raw.properties.length}] ${p.property_name}: ${imgs.length} images`);
    }
  }));
  fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
  console.log(`\nDone. ${got} properties have images. Saved to ${OUT}. Restart "npm run dev" / rebuild to see them.`);
}
