// "Experience" collections. Grouping is by destination region or by the property's own name/category - not a quality claim.
const inDest = (...slugs) => (h) => slugs.includes(h.destination);
export const collections = [
  { slug: 'mountain', title: 'Mountain escapes', blurb: 'Coffee country and hill stays in Coorg, Chikmagalur, Sakleshpur and Nandi Hills.', test: inDest('coorg', 'chikmagalur', 'sakleshpur', 'nandi-hills') },
  { slug: 'beach', title: 'Beachfront stays', blurb: 'Along the Arabian Sea at Udupi, Gokarna and Mangaluru.', test: inDest('udupi', 'gokarna', 'mangaluru') },
  { slug: 'heritage', title: 'Heritage country', blurb: 'Hampi and Mysuru, where history sits outside the front door.', test: inDest('hampi', 'mysuru') },
  { slug: 'jungle', title: 'Jungle retreats', blurb: 'Kabini, Dandeli and Bandipur: riverside and forest lodges.', test: inDest('kabini', 'dandeli', 'bandipur') },
  { slug: 'boutique', title: 'Boutique stays', blurb: 'Small properties and homestays.', test: (h) => /boutique|homestay/i.test(`${h.typeRaw} ${h.name} ${h.shortDescription}`) },
  { slug: 'luxury', title: 'Luxury resorts', blurb: 'Properties that describe themselves as luxury resorts.', test: (h) => /luxury/i.test(h.name) },
];
