// Source dataset normalization used by the database seed and catalogue metadata.
import raw from '../data/karnataka_hotels_curated_66_research_v5.json';
import resolved from '../data/resolvedImages.json';
import { seedDestinations } from '../data/destinations.js';
import { slugify } from '../utils/slug.js';
import { enrichment } from '../data/enrichment.js';
import scraped from '../data/scrapedContacts.json';

export const TYPE_LABELS = {
  hotel_or_resort_candidate: 'Hotel / Resort',
  resort_candidate: 'Resort',
  hotel_resort_or_homestay_candidate: 'Hotel / Homestay',
  homestay_candidate: 'Homestay',
  boutique_resort_candidate: 'Boutique resort',
};
export const PROPERTY_TYPES = ['Hotel / Resort', 'Resort', 'Hotel / Homestay', 'Homestay', 'Boutique resort', 'Hotel', 'Boutique stay', 'Lodge'];
export const STD_FACILITIES = ['Wi-Fi', 'Parking', 'Free parking', 'Swimming pool', 'Restaurant', 'Gym', 'Spa', 'Room service', 'Family rooms', 'Conference facilities'];

const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const txt = (v) => (v == null || v === '' ? null : typeof v === 'string' ? v : JSON.stringify(v));

function normalizeImage(i, idx, fallbackSource) {
  return {
    id: `img-${idx + 1}-${String(i.url || '').slice(-24).replace(/[^a-zA-Z0-9]/g, '')}`,
    url: i.url,
    label: i.label || '',
    caption: i.caption || i.label || '',
    category: i.category || (idx === 0 ? 'cover' : 'gallery'),
    source_page: i.source_page || fallbackSource || '',
    verified: false, // a URL existing never means "verified"
    permission: i.rights || 'Usage permission not confirmed',
  };
}

export function normalizeRecord(p, index, usedSlugs) {
  let slug = slugify(p.property_name);
  while (usedSlugs.has(slug)) slug += '-2';
  usedSlugs.add(slug);
  const fromDataset = arr(p.actual_property_photo_assets).filter((a) => a && a.url);
  const fromScript = arr(resolved[slugify(p.property_name)]);
  const imgs = [...fromDataset, ...fromScript].filter((a, i, all) => all.findIndex((b) => b.url === a.url) === i);
  const en = enrichment[slug] || {};
  const sc = scraped[slug] || {};
  const facts = txt(p.property_facts_from_source);
  const completeness = String(p.hotel_information_completeness || '');
  return {
    id: slug,
    sourceId: p.id, // dataset ids contain duplicates; the original is preserved here
    slug,
    name: p.property_name,
    city: p.locality_or_city || '',
    district: p.district || '',
    state: p.state || 'Karnataka',
    typeRaw: p.property_category || '',
    type: TYPE_LABELS[p.property_category] || 'Stay',
    shortDescription: facts ? facts.split(';')[0].trim() : sc.description || '',
    description: facts || sc.description || '',
    factsList: facts ? facts.split(';').map((s) => s.trim()).filter(Boolean) : sc.description ? [sc.description] : [],
    address: en.address || p.address || sc.address || '', lat: '', lng: '',
    phone: en.phone || p.phone || sc.phone || '', phones: [...(en.phones || []), ...(sc.phones || [])], email: en.email || p.email || sc.email || '', contactSource: sc.source || '', website: p.official_website_or_best_available_listing || '',
    whatsapp: en.whatsapp || sc.whatsapp || '', bookingUrl: p.booking_url || '', galleryUrl: p.official_gallery_or_property_photo_source || '',
    images: imgs.map((a, i) => normalizeImage(a, i, p.official_gallery_or_property_photo_source)),
    facilities: [...new Set([...arr(p.amenities).map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean), ...(en.facilities || [])])],
    stars: en.stars || 0, highlights: en.highlights || [], researchSource: en.source || '',
    rooms: arr(p.room_categories).map((r) => (typeof r === 'string' ? { name: r } : r)),
    roomCount: en.roomCount ?? p.room_count ?? '',
    rates: p.published_rates ?? null,
    dining: [...arr(p.dining), ...(en.dining || [])].map((d) => (typeof d === 'string' ? { description: d } : d)),
    events: p.events_and_banquet ? (typeof p.events_and_banquet === 'string' ? { description: p.events_and_banquet } : p.events_and_banquet) : null,
    policies: { checkIn: en.checkIn || p.check_in || '', checkOut: en.checkOut || p.check_out || '', cancellation: p.cancellation_policy || '', child: '', pet: en.petPolicy || p.pet_policy || '' },
    featured: Boolean(facts) || Boolean(en.stars) || index === 0,
    verified: /^verified/i.test(completeness) ? 'verified' : /^partial/i.test(completeness) ? 'partial' : 'unverified',
    status: 'published',
    ownershipNote: p.ownership_independence_status || '',
    photoPermission: p.photo_reuse_permission || '',
    photoEvidence: p.photo_evidence_status || '',
    sourceNotes: p.source_notes || '',
    order: index,
  };
}

export function seedHotels() {
  const used = new Set();
  return raw.properties.map((p, i) => normalizeRecord(p, i, used)).filter((hotel) => hotel.images.some((image) => /^https?:\/\//i.test(image.url)));
}
export const datasetMeta = {
  name: raw.dataset_name,
  version: raw.version,
  created: raw.created_on,
  count: raw.properties.length,
  photoBackedCount: raw.properties.filter((property) => {
    const slug = slugify(property.property_name);
    return arr(property.actual_property_photo_assets).some((image) => image?.url)
      || arr(resolved[slug]).some((image) => image?.url);
  }).length,
  limitations: raw.important_limitations,
  rules: raw.quality_rules,
};
export { seedDestinations };

export function destinationFor(h, destinations) {
  const hay = `${h.city} ${h.district} ${h.name}`.toLowerCase();
  const found = destinations.find((d) => (d.keywords || []).some((k) => hay.includes(k)));
  return found ? found.slug : '';
}

