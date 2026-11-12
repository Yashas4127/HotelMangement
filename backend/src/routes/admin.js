import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import Hotel from '../models/Hotel.js';
import Destination from '../models/Destination.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';
import { getAdminBookings, quoteAdminBooking, updateAdminBookingStatus } from './bookings.js';
import SiteSettings from '../models/SiteSettings.js';
import { AI_PROVIDERS, encryptAiProviderKey, getAiProviderStatus, resolveAiProvider } from '../utils/aiSettings.js';

const router = Router();
router.use(requireUser, requireAdmin);

router.get('/hotels', async (_req, res) => {
  const hotels = await Hotel.find().sort({ order: 1, name: 1 }).lean();
  res.json(hotels.map(({ _id, __v, ...hotel }) => hotel));
});

function validImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function hotelPayload(body, id) {
  const allowed = [
    'slug', 'name', 'city', 'district', 'state', 'type', 'typeRaw', 'shortDescription', 'description',
    'factsList', 'address', 'lat', 'lng', 'phone', 'phones', 'email', 'website', 'whatsapp', 'bookingUrl',
    'galleryUrl', 'images', 'facilities', 'stars', 'highlights', 'researchSource', 'rooms', 'roomCount', 'rates',
    'dining', 'events', 'policies', 'featured', 'verified', 'status', 'ownershipNote', 'photoPermission',
    'photoEvidence', 'sourceNotes', 'order', 'sourceId',
  ];
  const payload = Object.fromEntries(allowed.filter((key) => Object.hasOwn(body, key)).map((key) => [key, body[key]]));
  payload.id = id;
  if (typeof payload.slug === 'string') payload.slug = payload.slug.trim();
  if (payload.status === 'published') {
    if (!payload.name?.trim() || !payload.slug || !payload.city?.trim() || !payload.district?.trim()) {
      throw Object.assign(new Error('A published hotel needs a name, slug, city, and district.'), { status: 400 });
    }
    if (!Array.isArray(payload.images) || !payload.images.some((image) => validImageUrl(image?.url))) {
      throw Object.assign(new Error('Add at least one valid hotel photo before publishing.'), { status: 400 });
    }
  }
  if (payload.images && (!Array.isArray(payload.images) || payload.images.some((image) => !validImageUrl(image?.url)))) {
    throw Object.assign(new Error('One or more hotel photo URLs are invalid.'), { status: 400 });
  }
  return payload;
}

router.get('/bookings', getAdminBookings);
router.post('/bookings/:id/quote', quoteAdminBooking);
router.patch('/bookings/:id/status', updateAdminBookingStatus);

function adminSettingsResponse(settings) {
  const aiProvider = settings?.aiProvider || 'gemini';
  const aiProviderKeysConfigured = getAiProviderStatus(settings);
  return {
    supportWhatsApp: settings?.supportWhatsApp || '',
    aiProvider,
    aiActiveProvider: resolveAiProvider(settings),
    aiProviderKeysConfigured,
    aiAssistantConfigured: Boolean(resolveAiProvider(settings)),
  };
}

router.get('/settings', async (_req, res) => {
  const settings = await SiteSettings.findOne({ key: 'site' }).lean();
  res.json(adminSettingsResponse(settings));
});

router.put('/settings', async (req, res) => {
  const supportWhatsApp = typeof req.body.supportWhatsApp === 'string'
    ? req.body.supportWhatsApp.trim()
    : null;
  if (supportWhatsApp === null) {
    return res.status(400).json({ message: 'A WhatsApp support number is required (it can be left blank to disable the button).' });
  }
  const digits = supportWhatsApp.replace(/\D/g, '');
  if (supportWhatsApp && (digits.length < 8 || digits.length > 15)) {
    return res.status(400).json({ message: 'Enter a valid support number with country code, between 8 and 15 digits.' });
  }
  const currentSettings = await SiteSettings.findOne({ key: 'site' }).lean();
  const aiProvider = req.body.aiProvider === undefined
    ? currentSettings?.aiProvider || 'gemini'
    : req.body.aiProvider;
  if (!AI_PROVIDERS.includes(aiProvider)) {
    return res.status(400).json({ message: 'Choose Gemini, Mistral, or OpenRouter as the AI provider.' });
  }
  const apiKeys = req.body.aiProviderKeys === undefined ? {} : req.body.aiProviderKeys;
  if (!apiKeys || typeof apiKeys !== 'object' || Array.isArray(apiKeys)) {
    return res.status(400).json({ message: 'The AI provider keys are invalid.' });
  }
  const clearKeys = req.body.clearAiProviderKeys === undefined ? [] : req.body.clearAiProviderKeys;
  if (!Array.isArray(clearKeys) || clearKeys.some((provider) => !AI_PROVIDERS.includes(provider))) {
    return res.status(400).json({ message: 'The AI provider keys to remove are invalid.' });
  }

  const updates = {
    supportWhatsApp: digits,
    aiProvider,
  };
  for (const provider of AI_PROVIDERS) {
    const apiKey = apiKeys[provider];
    if (apiKey !== undefined && (typeof apiKey !== 'string' || apiKey.length > 512)) {
      return res.status(400).json({ message: 'Each AI provider key must be a string no longer than 512 characters.' });
    }
    if (clearKeys.includes(provider) && typeof apiKey === 'string' && apiKey.trim()) {
      return res.status(400).json({ message: 'A provider key cannot be replaced and removed in the same request.' });
    }
    if (clearKeys.includes(provider)) {
      updates[`${provider}ApiKeyEncrypted`] = '';
      if (provider === 'gemini') updates.geminiApiKeyDisabled = true;
    } else if (typeof apiKey === 'string' && apiKey.trim()) {
      updates[`${provider}ApiKeyEncrypted`] = encryptAiProviderKey(apiKey.trim());
      if (provider === 'gemini') updates.geminiApiKeyDisabled = false;
    }
  }

  const settings = await SiteSettings.findOneAndUpdate(
    { key: 'site' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  res.json(adminSettingsResponse(settings));
});

router.post('/hotels', async (req, res) => {
  const id = typeof req.body.id === 'string' && req.body.id ? req.body.id : randomUUID();
  const hotel = await Hotel.create(hotelPayload(req.body, id));
  res.status(201).json(hotel);
});

router.put('/hotels/:id', async (req, res) => {
  const hotel = await Hotel.findOneAndUpdate(
    { id: req.params.id },
    { $set: hotelPayload(req.body, req.params.id) },
    { new: true, runValidators: true },
  );
  if (!hotel) return res.status(404).json({ message: 'Hotel not found.' });
  res.json(hotel);
});

router.delete('/hotels/:id', async (req, res) => {
  const result = await Hotel.deleteOne({ id: req.params.id });
  if (!result.deletedCount) return res.status(404).json({ message: 'Hotel not found.' });
  res.status(204).end();
});

router.post('/destinations', async (req, res) => {
  const destination = await Destination.create(req.body);
  res.status(201).json(destination);
});

router.put('/destinations/:id', async (req, res) => {
  const destination = await Destination.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!destination) return res.status(404).json({ message: 'Destination not found.' });
  res.json(destination);
});

router.delete('/destinations/:id', async (req, res) => {
  const result = await Destination.deleteOne({ id: req.params.id });
  if (!result.deletedCount) return res.status(404).json({ message: 'Destination not found.' });
  res.status(204).end();
});

export default router;
