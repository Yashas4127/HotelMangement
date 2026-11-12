import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Hotel from './models/Hotel.js';
import Destination from './models/Destination.js';
import dns from "dns"
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
const slugify = (value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const arr = (value) => Array.isArray(value) ? value : value ? [value] : [];
const text = (value) => value == null || value === '' ? null : typeof value === 'string' ? value : JSON.stringify(value);

function normalizeHotel(property, index, usedSlugs, resolved, enrichment, scraped) {
  let slug = slugify(property.property_name);
  while (usedSlugs.has(slug)) slug += '-2';
  usedSlugs.add(slug);
  const fromDataset = arr(property.actual_property_photo_assets).filter((image) => image?.url);
  const fromScript = arr(resolved[slugify(property.property_name)]);
  const images = [...fromDataset, ...fromScript]
    .filter((image, imageIndex, all) => all.findIndex((other) => other.url === image.url) === imageIndex)
    .map((image, imageIndex) => ({
      id: `${slug}-image-${imageIndex + 1}`,
      url: image.url,
      label: image.label || '',
      caption: image.caption || image.label || '',
      category: image.category || (imageIndex === 0 ? 'cover' : 'gallery'),
      source_page: image.source_page || property.official_gallery_or_property_photo_source || '',
      verified: false,
      permission: image.rights || 'Usage permission not confirmed',
    }));
  if (!images.length) return null;
  const facts = text(property.property_facts_from_source);
  const complete = String(property.hotel_information_completeness || '');
  const extra = enrichment[slug] || {};
  const contact = scraped[slug] || {};
  const facilities = [...new Set([
    ...arr(property.amenities).map((amenity) => typeof amenity === 'string' ? amenity : amenity?.name).filter(Boolean),
    ...(extra.facilities || []),
  ])];
  return {
    id: slug,
    sourceId: property.id,
    slug,
    name: property.property_name,
    city: property.locality_or_city || '',
    district: property.district || '',
    state: property.state || 'Karnataka',
    typeRaw: property.property_category || '',
    type: {
      hotel_or_resort_candidate: 'Hotel / Resort',
      resort_candidate: 'Resort',
      hotel_resort_or_homestay_candidate: 'Hotel / Homestay',
      homestay_candidate: 'Homestay',
      boutique_resort_candidate: 'Boutique resort',
    }[property.property_category] || 'Stay',
    shortDescription: facts ? facts.split(';')[0].trim() : contact.description || '',
    description: facts || contact.description || '',
    factsList: facts ? facts.split(';').map((item) => item.trim()).filter(Boolean) : contact.description ? [contact.description] : [],
    address: extra.address || property.address || contact.address || '',
    lat: '',
    lng: '',
    phone: extra.phone || property.phone || contact.phone || '',
    phones: [...(extra.phones || []), ...(contact.phones || [])],
    email: extra.email || property.email || contact.email || '',
    contactSource: contact.source || '',
    website: property.official_website_or_best_available_listing || '',
    whatsapp: extra.whatsapp || contact.whatsapp || '',
    bookingUrl: property.booking_url || '',
    galleryUrl: property.official_gallery_or_property_photo_source || '',
    images,
    facilities,
    stars: extra.stars || 0,
    highlights: extra.highlights || [],
    researchSource: extra.source || '',
    rooms: arr(property.room_categories).map((room) => typeof room === 'string' ? { name: room } : room),
    roomCount: extra.roomCount ?? property.room_count ?? '',
    rates: property.published_rates ?? null,
    dining: [...arr(property.dining), ...(extra.dining || [])].map((item) => typeof item === 'string' ? { description: item } : item),
    events: property.events_and_banquet ? (typeof property.events_and_banquet === 'string' ? { description: property.events_and_banquet } : property.events_and_banquet) : null,
    policies: {
      checkIn: extra.checkIn || property.check_in || '',
      checkOut: extra.checkOut || property.check_out || '',
      cancellation: property.cancellation_policy || '',
      child: '',
      pet: extra.petPolicy || property.pet_policy || '',
    },
    featured: Boolean(facts) || Boolean(extra.stars) || index === 0,
    verified: /^verified/i.test(complete) ? 'verified' : /^partial/i.test(complete) ? 'partial' : 'unverified',
    status: 'published',
    ownershipNote: property.ownership_independence_status || '',
    photoPermission: property.photo_reuse_permission || '',
    photoEvidence: property.photo_evidence_status || '',
    sourceNotes: property.source_notes || '',
    order: index,
  };
}

await connectDatabase();
const [raw, resolved, enrichmentModule, scraped, destinationModule] = await Promise.all([
  readJson('frontend/src/data/karnataka_hotels_curated_66_research_v5.json'),
  readJson('frontend/src/data/resolvedImages.json'),
  import('../../frontend/src/data/enrichment.js'),
  readJson('frontend/src/data/scrapedContacts.json'),
  import('../../frontend/src/data/destinations.js'),
]);
const usedSlugs = new Set();
const hotels = raw.properties
  .map((property, index) => normalizeHotel(property, index, usedSlugs, resolved, enrichmentModule.enrichment, scraped))
  .filter(Boolean);
const destinations = destinationModule.seedDestinations;

if (hotels.length === 0) throw new Error('No hotels with photos were found. Nothing was imported.');
await Hotel.bulkWrite(hotels.map((hotel) => ({
  updateOne: { filter: { id: hotel.id }, update: { $set: hotel }, upsert: true },
})));
await Hotel.deleteMany({ sourceId: { $exists: true }, 'images.0': { $exists: false } });
await Destination.bulkWrite(destinations.map((destination) => ({
  updateOne: { filter: { id: destination.id }, update: { $set: destination }, upsert: true },
})));

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Karnataka Stays Admin' } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10) {
  throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters before seeding.');
}
await User.findOneAndUpdate(
  { email: ADMIN_EMAIL.trim().toLowerCase() },
  { $set: { name: ADMIN_NAME, email: ADMIN_EMAIL.trim().toLowerCase(), passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'admin' } },
  { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
);
console.log(`Imported ${hotels.length} hotels with photos and ${destinations.length} destinations.`);
console.log(`Admin account ready for ${ADMIN_EMAIL.trim().toLowerCase()}.`);
process.exit(0);
