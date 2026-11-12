// Researched details, keyed by hotel slug. Only facts found on the property's own site or on major
// listing sites are stored; anything unconfirmed is simply left out (and therefore hidden in the UI).
// Run `npm run enrich` to auto-collect phones/emails/addresses for every property into
// src/data/scrapedContacts.json. Values in THIS file always win over scraped ones.
// Fields: phone, phones[], whatsapp, email, address, stars, roomCount, checkIn, checkOut, facilities[], dining[], highlights[], petPolicy, source
export const enrichment = {
  'evolve-back-coorg': {
    phones: ['+91 63669 20434', '+91 8274 258481'],
    whatsapp: '+91 63669 20339',
    email: 'info@evolveback.com',
    address: 'Karadigodu Post, Siddapur, Coorg (Kodagu), Karnataka 571253',
    stars: 5, checkIn: '1:00 PM', checkOut: '11:00 AM',
    facilities: ['Swimming pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Free parking', 'Wi-Fi', 'Laundry', 'Library', "Children's play area"],
    dining: [{ name: 'Peppercorn', cuisine: 'Barbecue' }, { name: 'Plantain Leaf', cuisine: 'Pure vegetarian' }],
    highlights: ['Riverside resort set in coffee and spice plantations', 'Three restaurants on site'],
    petPolicy: 'Pets not allowed',
    source: 'Official contact page (evolveback.com); amenities per Expedia / Hotels.com listings',
  },
  'the-serai-chikmagalur': {
    phones: ['+91 8262 224903', '+91 94835 24903'],
    email: 'enquiries@theserai.in',
    address: 'Mugthihalli Post, KM Road, Chikkamagaluru, Karnataka 577133',
    stars: 5, roomCount: 29,
    facilities: ['Swimming pool', 'Spa', 'Gym', 'Restaurant', 'Room service', 'Parking', 'Wi-Fi', 'Yoga', 'Outdoor dining', 'Business centre', 'Indoor & outdoor games'],
    highlights: ['Estate villas and terraces inside a working coffee plantation', 'Guided plantation walks'],
    source: 'Official contact page (theserai.in); amenities per Karnataka Tourism listing',
  },
  'summer-house-nandi-foothills': {
    address: '576/16, 17, 18, Nandi Foothills, opposite Amita Rasa, Sulthanpet, Chikkaballapur, Karnataka 562103',
    stars: 3,
    facilities: ['Swimming pool', 'Wi-Fi', 'Restaurant', 'Free parking', 'Room service', 'Garden', 'Family rooms', 'Games room', 'Meeting facilities', 'Lift'],
    dining: [{ name: 'Restaurant', cuisine: 'Indian' }],
    highlights: ['Rooftop swimming pool and outdoor fireplace', 'Mountain-view balconies', 'About 25 km from Kempegowda International Airport'],
    source: 'Booking.com and Bag2Bag listings (no official phone found yet)',
  },
};
