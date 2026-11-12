import { SITE } from '../config/site.js';

// Normalises an Indian phone string to digits with country code, e.g. "+91 98440 19710" -> "919844019710".
export const digits = (p) => String(p || '').replace(/\D/g, '');
export function toE164India(p) {
  let d = digits(p);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10) d = `91${d}`;
  if (d.length === 11 && d.startsWith('0')) d = `91${d.slice(1)}`;
  return d;
}
// Mobile check is deliberately conservative so landlines never get a WhatsApp button.
// Mobile = "+91 98440 19710" style (5+5 grouping) or 10 contiguous digits starting 6, 7 or 9.
// Landlines are written with an STD code ("+91 8262 224903", "080 2657 8585") and are never treated as mobile.
const stripCountry = (p) => String(p || '').trim().replace(/^(\+|00)?91[\s-]?/, '').replace(/^\(0\)\s*/, '');
export function isMobile(p) {
  const r = stripCountry(p);
  if (/^0/.test(r)) return false;
  return /^[6-9]\d{4}[\s-]\d{5}$/.test(r) || /^[679]\d{9}$/.test(r);
}
export const splitPhones = (s) => String(s || '').split(/[\/,;|]|\bor\b/i).map((x) => x.trim()).filter((x) => digits(x).length >= 8);
export const pretty = (p) => {
  const d = toE164India(p);
  return isMobile(p) ? `+91 ${d.slice(2, 7)} ${d.slice(7)}` : /^\+?91/.test(String(p).trim()) ? String(p).trim().replace(/^\+?91[\s-]?/, '+91 ') : String(p).trim();
};
export const telHref = (p) => `tel:+${toE164India(p)}`;

// All phone numbers we hold for a hotel: [{ number, mobile }]
export function phonesOf(h) {
  const list = [...(h.phones || []), ...splitPhones(h.phone), h.whatsapp].filter(Boolean);
  const seen = new Set();
  return list.filter((p) => { const k = toE164India(p); if (seen.has(k)) return false; seen.add(k); return true; })
    .map((p) => ({ number: p, mobile: isMobile(p) }));
}
export const primaryPhone = (h) => phonesOf(h)[0]?.number || '';

// The number WhatsApp enquiries go to: explicit WhatsApp number > first mobile on file > site concierge.
export function whatsappTarget(h) {
  if (h.whatsapp) return { number: toE164India(h.whatsapp), direct: true };
  const m = phonesOf(h).find((p) => p.mobile);
  if (m) return { number: toE164India(m.number), direct: true };
  if (SITE.conciergeWhatsApp) return { number: digits(SITE.conciergeWhatsApp), direct: false };
  return null;
}
export const hasWhatsApp = (h) => !!whatsappTarget(h);

const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export function enquiryText(h, trip = {}) {
  const lines = [`Hi, I found ${h.name} (${[h.city, h.district].filter((x, i, a) => x && a.indexOf(x) === i).join(', ')}) on ${SITE.name}.`];
  if (trip.checkIn && trip.checkOut) lines.push(`Dates: ${fmtDate(trip.checkIn)} to ${fmtDate(trip.checkOut)}.`);
  else if (trip.checkIn) lines.push(`Check-in: ${fmtDate(trip.checkIn)}.`);
  if (trip.adults) lines.push(`Guests: ${trip.adults} adult${trip.adults > 1 ? 's' : ''}${trip.children ? `, ${trip.children} child${trip.children > 1 ? 'ren' : ''}` : ''}${trip.rooms > 1 ? `, ${trip.rooms} rooms` : ''}.`);
  lines.push('Is it available? Please share room options and rates.');
  if (!(h.whatsapp || phonesOf(h).some((p) => p.mobile))) lines.unshift(`[Enquiry for ${h.name}]`);
  return lines.join('\n');
}
export function whatsappLink(h, trip) {
  const t = whatsappTarget(h);
  return t ? `https://wa.me/${t.number}?text=${encodeURIComponent(enquiryText(h, trip))}` : '';
}
