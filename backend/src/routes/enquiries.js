import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import Enquiry from '../models/Enquiry.js';
import Hotel from '../models/Hotel.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/enquiries', requireUser, async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  const hotelId = typeof req.body.hotelId === 'string' ? req.body.hotelId : '';
  if (message.length < 10 || message.length > 2000) {
    return res.status(400).json({ message: 'Your message must be between 10 and 2,000 characters.' });
  }
  let hotelName = 'General enquiry';
  if (hotelId) {
    const hotel = await Hotel.findOne({ id: hotelId, status: 'published' });
    if (!hotel) return res.status(404).json({ message: 'That hotel is no longer available.' });
    hotelName = hotel.name;
  }
  const enquiry = await Enquiry.create({
    id: randomUUID(),
    userId: req.user.id,
    hotelId,
    hotelName,
    name: req.user.name,
    email: req.user.email,
    phone: (typeof req.body.phone === 'string' ? req.body.phone.trim() : '') || req.user.phone || '',
    message,
  });
  res.status(201).json(enquiry);
});

router.get('/admin/enquiries', requireUser, requireAdmin, async (_req, res) => {
  const enquiries = await Enquiry.find().sort({ createdAt: -1 }).lean();
  res.json(enquiries.map(({ _id, __v, userId, ...enquiry }) => ({ ...enquiry, date: enquiry.createdAt.toISOString().slice(0, 10) })));
});

router.patch('/admin/enquiries/:id', requireUser, requireAdmin, async (req, res) => {
  const allowed = ['new', 'contacted', 'resolved'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Choose a valid enquiry status.' });
  const enquiry = await Enquiry.findOneAndUpdate({ id: req.params.id }, { status: req.body.status }, { new: true, runValidators: true });
  if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
  res.json(enquiry);
});

export default router;
