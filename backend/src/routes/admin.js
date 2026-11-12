import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import Hotel from '../models/Hotel.js';
import Destination from '../models/Destination.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';
import { getAdminBookings, quoteAdminBooking, updateAdminBookingStatus } from './bookings.js';

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
