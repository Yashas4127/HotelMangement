// Collects phone numbers, WhatsApp numbers, emails and addresses from each property's OWN website.
// Run on your machine (needs internet):  npm run enrich
// Output: src/data/scrapedContacts.json  { "<hotel-slug>": { phones, whatsapp, email, address, description, source } }
// Values you type into src/data/enrichment.js always win over scraped ones. Re-run any time; existing entries are kept.
// Always eyeball the result: scraping is best-effort and a footer number can belong to a hotel group, not the property.
import fs from 'node:fs';
import { slugify } from '../src/utils/slug.js';

const OUT = 'src/data/scrapedContacts.json';
const CONCURRENCY = 4, TIMEOUT = 15000;
const CONTACT_PATHS = ['/contact-us', '/contact', '/contactus', '/contact-us.html', '/contact.html', '/contact-us/', '/contact/', '/reach-us', '/location'];

const clean = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const digits = (s) => s.replace(/\D/g, '');
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) && !email.includes('://') && !/example|sentry|wixpress/i.test(email);
const validPhone = (value) => {
  let number = digits(value);
  if (number.startsWith('0091')) number = number.slice(4);
  else if (number.length === 12 && number.startsWith('91')) number = number.slice(2);
  else if (number.length === 11 && number.startsWith('0')) number = number.slice(1);
  return number.length === 10 && /^[6-9]\d{9}$/.test(number)
    && !/^(\d)\1{7,}$/.test(number)
    && !['0123456789', '1234567890', '9876543210', '0987654321'].includes(number);
};
// Formats: mobiles as "+91 98440 19710" (5+5). Landlines / ambiguous numbers stay contiguous ("+91 8262224903")
// so the app never offers WhatsApp for a landline. Numbers starting 8 only count as mobile if the source wrote them 5+5.
function normPhone(raw) {
  let d = digits(raw);
  if (d.startsWith('0091')) d = d.slice(2);
  const spaced55 = /(?:^|\D)\d{5}[\s-]\d{5}(?:\D|$)/.test(raw);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) {
    const number = `+91 ${d.slice(1)}`;
    return validPhone(number) ? number : null;
  }
  if (d.length === 10 && /^[6-9]/.test(d)) {
    const number = /^[679]/.test(d) || spaced55 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : `+91 ${d}`;
    return validPhone(number) ? number : null;
  }
  return null;
}

function metaDescription(html) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = Object.fromEntries([...match[0].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
      .map((attribute) => [attribute[1].toLowerCase(), attribute[2] ?? attribute[3] ?? attribute[4] ?? '']));
    if (!['description', 'og:description'].includes((attributes.name || attributes.property || '').toLowerCase())) continue;
    const description = clean(attributes.content || '');
    if (description.length >= 40 && description.length <= 800) return description;
  }
  return '';
}

export function extractContacts(html) {
  const phones = new Set(), out = { phones: [], whatsapp: '', email: '', address: '' };
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) { const p = normPhone(decodeURIComponent(m[1])); if (p) phones.add(p); }
  for (const m of html.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?phone=|whatsapp:\/\/send\?phone=)\+?(\d{10,13})/gi)) { const p = normPhone(m[1]); if (p) { out.whatsapp ||= p; phones.add(p); } }
  for (const m of html.matchAll(/href=["']mailto:([^"'?]+)/gi)) { const e = decodeURIComponent(m[1]).trim(); if (validEmail(e)) { out.email ||= e; } }
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(walk);
        if (n.telephone) String(n.telephone).split(/[,\/]/).forEach((t) => { const p = normPhone(t); if (p) phones.add(p); });
        if (n.email && !out.email) {
          const email = String(n.email).replace(/^mailto:/, '').trim();
          if (validEmail(email)) out.email = email;
        }
        if (n.address && !out.address) { const a = n.address; out.address = typeof a === 'string' ? clean(a) : clean([a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).join(', ')); }
        Object.values(n).forEach(walk); };
      walk(JSON.parse(m[1]));
    } catch { /* bad JSON-LD */ }
  }
  // Plain-text numbers that sit right after a "phone / call / mobile / reservation / whatsapp" label.
  const text = clean(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
  for (const m of text.matchAll(/(?:phone|call|mobile|mob|tel|reservations?|whats\s?app|contact)\s*(?:no\.?|number)?\s*[:\-]?\s*((?:\+?91[\s-]?)?(?:0?\d{2,5}[\s-]?)?\d{3,5}[\s-]?\d{4,6})/gi)) { const p = normPhone(m[1]); if (p) phones.add(p); }
  out.phones = [...phones].slice(0, 4);
  return out;
}

async function get(url) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; KarnatakaStaysBot/1.0)', accept: 'text/html' } });
    return r.ok ? { html: await r.text(), url: r.url } : null;
  } catch { return null; } finally { clearTimeout(t); }
}

async function one(p) {
  const site = p.official_website_or_best_available_listing;
  if (!site || !/^https?:/.test(site) || /google\.com/.test(site)) return null;
  const merged = { phones: [], whatsapp: '', email: '', address: '', description: '', source: '' };
  const home = await get(site);
  const pages = [];
  if (home) {
    pages.push(home);
    merged.description = metaDescription(home.html);
    if (merged.description) merged.source = home.url;
    for (const m of home.html.matchAll(/href=["']([^"'#]*contact[^"']*)["']/gi)) { try { pages.push({ url: new URL(m[1], home.url).href }); } catch { /* skip */ } }
  }
  for (const path of CONTACT_PATHS) { try { pages.push({ url: new URL(path, site).href }); } catch { /* skip */ } }
  const seen = new Set();
  for (const pg of pages) {
    if (seen.has(pg.url) || seen.size >= 5) continue; seen.add(pg.url);
    const res = pg.html ? pg : await get(pg.url);
    if (!res) continue;
    const c = extractContacts(res.html);
    for (const ph of c.phones) if (!merged.phones.includes(ph)) merged.phones.push(ph);
    merged.whatsapp ||= c.whatsapp; merged.email ||= c.email; merged.address ||= c.address;
    merged.description ||= c.description;
    if ((c.phones.length || c.email) && !merged.source) merged.source = res.url;
  }
  merged.phones = merged.phones.slice(0, 4);
  return merged.phones.length || merged.email || merged.address || merged.whatsapp || merged.description ? merged : null;
}

if (process.argv[1] && process.argv[1].endsWith('enrich-contacts.mjs')) {
  const raw = JSON.parse(fs.readFileSync('src/data/karnataka_hotels_curated_66_research_v5.json', 'utf8'));
  const result = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const queue = [...raw.properties]; let done = 0, got = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const p = queue.shift(); const slug = slugify(p.property_name);
      const c = await one(p);
      if (c) {
        const previous = result[slug] || {};
        result[slug] = {
          ...previous,
          ...c,
          phones: [...new Set([...(previous.phones || []), ...c.phones])].slice(0, 4),
          whatsapp: c.whatsapp || previous.whatsapp || '',
          email: c.email || previous.email || '',
          address: c.address || previous.address || '',
          description: c.description || previous.description || '',
          source: c.source || previous.source || '',
        };
        got++;
      }
      console.log(`[${++done}/${raw.properties.length}] ${p.property_name}: ${c ? `${c.phones.length} phone(s)${c.whatsapp ? ', WhatsApp' : ''}${c.email ? ', email' : ''}` : 'nothing found'}`);
    }
  }));
  for (const contact of Object.values(result)) {
    contact.phones = [...new Set((contact.phones || []).filter(validPhone))];
    if (!validPhone(contact.whatsapp || '')) contact.whatsapp = '';
    if (!validEmail(contact.email || '')) contact.email = '';
    if (typeof contact.description === 'string') contact.description = clean(contact.description).slice(0, 800);
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
  console.log(`\nDone. ${got} properties updated. Saved to ${OUT}. Run "npm run seed" from the project root to import the details into MongoDB.`);
}
