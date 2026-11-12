const TRAVEL_TERMS = /\b(hotels?|resorts?|stays?|rooms?|vacations?|holidays?|trips?|weekends?|destinations?|travel|tours?|plan(?:ning)?|go(?:ing)?|itinerar(?:y|ies)|attractions?|places?|sightseeing|visits?|visiting|famous|popular|beaches?|waterfalls?|temples?|parks?|viewpoints?|foods?|cuisines?|dishes?|restaurants?|famil(?:y|ies)|couples?|solo|groups?|amenit\w*|facilit\w*|properties?|accommodations?|polic(?:y|ies)|check[\s-]?ins?|check[\s-]?outs?|rates?|prices?|costs?|contacts?|near|parents|kids|children|honeymoon|anniversary|budget|luxury|peaceful|nature|mountains?|hills?|coast|coastal|forest|monsoon|coorg|kodagu|chikmagalur|mysuru|mysore|hampi|gokarna|mangaluru|manglauru|mangalore|bengaluru|bangalore|karnataka|kabini|sakleshpur|udupi|murudeshwar|madikeri|dandeli)\b/i;

export function isTravelQuery(text = '') {
  return TRAVEL_TERMS.test(String(text));
}

function words(value) {
  return String(value || '').toLowerCase().split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .map((word) => ({ manglauru: 'mangaluru', mangalore: 'mangaluru' })[word] || word)
    .map((word) => word.endsWith('ies') ? `${word.slice(0, -3)}y` : word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word);
}

export function findRelevantHotels(query, hotels, limit = 6) {
  const queryWords = new Set(words(query));
  if (!queryWords.size) return [];

  return hotels
    .map((hotel) => {
      const searchable = [
        hotel.name, hotel.city, hotel.district, hotel.type, hotel.description,
        hotel.shortDescription, ...(hotel.facilities || []), ...(hotel.highlights || []),
        ...(hotel.rooms || []).map((room) => room.name),
      ].join(' ');
      const matchedWords = words(searchable).filter((word) => queryWords.has(word));
      const locationMatch = [hotel.city, hotel.district].some((place) =>
        place && String(query).toLowerCase().includes(place.toLowerCase()));
      return { hotel, score: matchedWords.length + (locationMatch ? 8 : 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ hotel }) => hotel);
}

export function findRelevantDestinations(query, destinations, limit = 5) {
  const queryWords = new Set(words(query));
  if (!queryWords.size) return [];

  return destinations
    .map((destination) => {
      const searchable = [
        destination.name, destination.district, destination.description,
        ...(destination.keywords || []),
      ].join(' ');
      const matchedWords = words(searchable).filter((word) => queryWords.has(word));
      const exactMatch = [destination.name, destination.district].some((place) =>
        place && String(query).toLowerCase().includes(place.toLowerCase()));
      return { destination, score: matchedWords.length + (exactMatch ? 8 : 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ destination }) => destination);
}

export function destinationContext(destination) {
  return {
    name: destination.name,
    district: destination.district || '',
    description: String(destination.description || '').slice(0, 700),
  };
}

export function hotelContext(hotel) {
  return {
    id: hotel.id,
    name: hotel.name,
    city: hotel.city || '',
    district: hotel.district || '',
    address: hotel.address || '',
    type: hotel.type || '',
    description: String(hotel.shortDescription || hotel.description || '').slice(0, 700),
    facilities: (hotel.facilities || []).slice(0, 20),
    rooms: (hotel.rooms || []).slice(0, 10).map((room) => ({
      name: room.name || '',
      description: room.description || '',
      occupancy: room.occupancy || '',
    })),
    phone: hotel.phone || '',
    email: hotel.email || '',
    website: hotel.website || '',
    stars: hotel.stars || '',
    publishedRates: hotel.rates || '',
    checkIn: hotel.policies?.checkIn || '',
    checkOut: hotel.policies?.checkOut || '',
    cancellation: hotel.policies?.cancellation || '',
    images: (hotel.images || []).slice(0, 1).map((image) => image.url),
    slug: hotel.slug,
  };
}

export function googleMapsPlaceLinks(places) {
  return places.map((name) => ({
    name,
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, Karnataka`)}`,
  }));
}

function parseResponseMetadata(responseText, allowedIds) {
  let text = responseText.trim();
  const idLine = text.match(/^\s*HOTEL_IDS:\s*(.*?)\s*$/im);
  const placesLine = text.match(/^\s*PLACES:\s*(.*?)\s*$/im);
  text = text
    .replace(/^\s*HOTEL_IDS:\s*.*?\s*$/im, '')
    .replace(/^\s*PLACES:\s*.*?\s*$/im, '')
    .replace(/\s*\(\s*\[[^\]]+\]\(\s*https?:\/\/[^)]*\)\s*\)/gi, '')
    .replace(/\[[^\]]+\]\(\s*https?:\/\/[^)]*\)/gi, '')
    .replace(/https?:\/\/[^\s)\]>]+/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const hotelIds = idLine
    ? idLine[1].split(',').map((id) => id.trim()).filter((id) => allowedIds.has(id))
    : [];
  const places = placesLine
    ? placesLine[1].split('|').map((place) => place.trim())
      .filter((place) => place && place.length <= 120 && !/^https?:\/\//i.test(place))
      .filter((place, index, list) => list.findIndex((other) => other.toLowerCase() === place.toLowerCase()) === index)
      .slice(0, 10)
    : [];
  return { text, hotelIds: [...new Set(hotelIds)].slice(0, 3), places };
}

export function parseGeminiResponse(body, allowedIds) {
  const interaction = body?.interaction || body;
  const outputBlocks = (interaction?.steps || [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content || [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string');
  let text = (outputBlocks.map((block) => block.text).join('\n') || interaction?.output_text || '').trim();
  if (!text) throw new Error('Gemini returned an empty response.');

  const metadata = parseResponseMetadata(text, allowedIds);
  const sources = outputBlocks
    .flatMap((block) => block.annotations || [])
    .filter((annotation) => annotation.type === 'url_citation' && /^https?:\/\//i.test(annotation.url || ''))
    .map((annotation) => ({ title: annotation.title || new URL(annotation.url).hostname, url: annotation.url }))
    .filter((source, index, list) => list.findIndex((other) => other.url === source.url) === index)
    .slice(0, 6);
  return { ...metadata, sources };
}

export function parseChatCompletionResponse(body, allowedIds, provider) {
  const message = body?.choices?.[0]?.message;
  const content = message?.content;
  const responseText = typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.filter((part) => part?.type === 'text' && typeof part.text === 'string').map((part) => part.text).join('\n')
      : '';
  let text = responseText.trim();
  if (!text) throw new Error(`${provider} returned an empty response.`);

  const metadata = parseResponseMetadata(text, allowedIds);
  const sources = (message.annotations || [])
    .map((annotation) => {
      const citation = annotation.url_citation || annotation;
      if (!/^https?:\/\//i.test(citation.url || '')) return null;
      return { title: citation.title || new URL(citation.url).hostname, url: citation.url };
    })
    .filter((source, index, list) => source && list.findIndex((other) => other?.url === source.url) === index)
    .slice(0, 6);
  return { ...metadata, sources };
}
