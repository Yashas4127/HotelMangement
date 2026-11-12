import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptAiProviderKey, encryptAiProviderKey, getAiProviderKey, getAiProviderStatus, resolveAiProvider } from '../src/utils/aiSettings.js';
import { findRelevantDestinations, findRelevantHotels, googleMapsPlaceLinks, isTravelQuery, parseChatCompletionResponse, parseGeminiResponse } from '../src/utils/travelAssistant.js';

const hotels = [
  { id: 'coorg-stay', name: 'Coffee Estate Stay', city: 'Madikeri', district: 'Kodagu', facilities: ['Restaurant'] },
  { id: 'beach-stay', name: 'Coastal Retreat', city: 'Gokarna', district: 'Uttara Kannada', facilities: ['Beach access'] },
];

test('travel assistant scope recognizes Karnataka travel and rejects unrelated queries', () => {
  assert.equal(isTravelQuery('Suggest a family vacation in Coorg'), true);
  assert.equal(isTravelQuery('Planning 3 days in manglauru'), true);
  assert.equal(isTravelQuery('Explain how to solve this math problem'), false);
});

test('hotel retrieval matches destination and property details without returning unrelated stays', () => {
  assert.deepEqual(findRelevantHotels('Find hotels in Madikeri', hotels).map(({ id }) => id), ['coorg-stay']);
});

test('destination retrieval matches the requested verified destination', () => {
  const destinations = [{ name: 'Coorg', district: 'Kodagu', description: 'Coffee estates and Western Ghats.' }];
  assert.deepEqual(findRelevantDestinations('Plan a weekend in Coorg', destinations).map(({ name }) => name), ['Coorg']);
});

test('destination lookup recognizes common Mangaluru spellings and the user typo', () => {
  const destinations = [{
    name: 'Mangaluru',
    district: 'Dakshina Kannada',
    keywords: ['mangaluru', 'dakshina kannada'],
    description: 'A coastal city with access to beaches.',
  }];
  for (const query of ['3 days in Mangaluru', '3 days in Mangalore', '3 days in manglauru']) {
    assert.deepEqual(findRelevantDestinations(query, destinations).map(({ name }) => name), ['Mangaluru']);
  }
});

test('Gemini hotel IDs are restricted to retrieved dataset properties', () => {
  const parsed = parseGeminiResponse({
    interaction: {
      steps: [{
        type: 'model_output',
        content: [{
          type: 'text',
          text: 'Here are some stays.\nHOTEL_IDS: coorg-stay, invented-stay\nPLACES: Abbey Falls | Raja’s Seat',
          annotations: [{ type: 'url_citation', title: 'Karnataka Tourism', url: 'https://karnatakatourism.org/mangaluru' }],
        }],
      }],
    },
  }, new Set(['coorg-stay']));

  assert.deepEqual(parsed, {
    text: 'Here are some stays.',
    hotelIds: ['coorg-stay'],
    places: ['Abbey Falls', 'Raja’s Seat'],
    sources: [{ title: 'Karnataka Tourism', url: 'https://karnatakatourism.org/mangaluru' }],
  });
});

test('AI provider keys are encrypted at rest and decrypt with the configured server secret', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-derive-an-encryption-key';
  try {
    const apiKey = 'provider-test-key';
    const encrypted = encryptAiProviderKey(apiKey);
    assert.match(encrypted, /^v1:/);
    assert.equal(encrypted.includes(apiKey), false);
    assert.equal(decryptAiProviderKey(encrypted), apiKey);
    assert.equal(getAiProviderKey({ mistralApiKeyEncrypted: encrypted }, 'mistral'), apiKey);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('AI provider status never treats a missing selected provider key as configured', () => {
  assert.deepEqual(getAiProviderStatus({
    mistralApiKeyEncrypted: 'encrypted',
    openrouterApiKeyEncrypted: '',
    geminiApiKeyEncrypted: '',
  }), {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    mistral: true,
    openrouter: false,
  });
});

test('AI assistant automatically falls back to whichever provider key is configured', () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    assert.equal(resolveAiProvider({ aiProvider: 'gemini', mistralApiKeyEncrypted: 'encrypted' }), 'mistral');
    assert.equal(resolveAiProvider({ aiProvider: 'openrouter', mistralApiKeyEncrypted: 'encrypted' }), 'mistral');
    assert.equal(resolveAiProvider({ aiProvider: 'openrouter', openrouterApiKeyEncrypted: 'encrypted' }), 'openrouter');
    assert.equal(resolveAiProvider({ aiProvider: 'gemini' }), '');
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('OpenRouter citations and hotel IDs are parsed and restricted to verified hotels', () => {
  const parsed = parseChatCompletionResponse({
    choices: [{
      message: {
        content: 'Try these verified stays.\nHOTEL_IDS: coorg-stay, invented-stay\nPLACES: Coorg | Abbey Falls',
        annotations: [{
          type: 'url_citation',
          url_citation: { title: 'Karnataka Tourism', url: 'https://karnatakatourism.org/coorg' },
        }],
      },
    }],
  }, new Set(['coorg-stay']), 'openrouter');

  assert.deepEqual(parsed, {
    text: 'Try these verified stays.',
    hotelIds: ['coorg-stay'],
    places: ['Coorg', 'Abbey Falls'],
    sources: [{ title: 'Karnataka Tourism', url: 'https://karnatakatourism.org/coorg' }],
  });
});

test('named places produce clickable Google Maps search links', () => {
  assert.deepEqual(googleMapsPlaceLinks(['Panambur Beach']), [{
    name: 'Panambur Beach',
    url: 'https://www.google.com/maps/search/?api=1&query=Panambur%20Beach%2C%20Karnataka',
  }]);
});

test('provider citation markup and raw URLs are removed from assistant prose', () => {
  const parsed = parseChatCompletionResponse({
    choices: [{
      message: {
        content: 'Visit Panambur Beach ([sd2.tourism.gov.in](https://sd2.tourism.gov.in/plan.pdf?utm_source=openai)) for a coastal walk.\nMore info: https://example.com/long-page',
      },
    }],
  }, new Set(), 'mistral');

  assert.equal(parsed.text, 'Visit Panambur Beach for a coastal walk.\nMore info:');
});
