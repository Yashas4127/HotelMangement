import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import { requireUser } from '../middleware/auth.js';
import { isValidDateRange, verifyPaymentSignature } from '../utils/booking.js';

const router = Router();

router.post('/', requireUser, async (req, res) => {
  const { hotelId, checkIn, checkOut } = req.body;
  const guests = Number(req.body.guests);
  const rooms = Number(req.body.rooms || 1);
  if (!isValidDateRange(checkIn, checkOut)) {
    return res.status(400).json({ message: 'Choose a valid future check-in date and a later check-out date.' });
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 20 || !Number.isInteger(rooms) || rooms < 1 || rooms > 10) {
    return res.status(400).json({ message: 'Guests must be 1–20 and rooms must be 1–10.' });
  }
  const hotel = await Hotel.findOne({
    id: hotelId,
    status: 'published',
    images: { $elemMatch: { url: /^https?:\/\//i } },
  });
  if (!hotel) return res.status(404).json({ message: 'That hotel is no longer available.' });
  const booking = await Booking.create({
    id: randomUUID(),
    userId: req.user.id,
    hotelId: hotel.id,
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    checkIn,
    checkOut,
    guests,
    rooms,
    specialRequests: typeof req.body.specialRequests === 'string' ? req.body.specialRequests.trim().slice(0, 2000) : '',
  });
  res.status(201).json(booking);
});

router.get('/mine', requireUser, async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json(bookings.map(({ _id, __v, userId, ...booking }) => booking));
});

router.post('/:id/payment-order', requireUser, async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id, userId: req.user.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  if (!['quoted', 'payment_pending'].includes(booking.status) || !booking.quotedAmount || booking.quotedAmount <= 0) {
    return res.status(409).json({ message: 'This booking does not have an approved quote ready for payment.' });
  }
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: 'Online payments are not configured. Please contact the booking team.' });
  }
  if (booking.status === 'payment_pending' && booking.razorpayOrderId) {
    return res.json({
      orderId: booking.razorpayOrderId,
      amount: Math.round(booking.quotedAmount * 100),
      currency: booking.currency || 'INR',
      keyId: RAZORPAY_KEY_ID,
    });
  }
  const client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  const order = await client.orders.create({
    amount: Math.round(booking.quotedAmount * 100),
    currency: booking.currency || 'INR',
    receipt: booking.id.replace(/-/g, '').slice(0, 40),
    notes: { bookingId: booking.id, userId: String(req.user.id) },
  });
  booking.razorpayOrderId = order.id;
  booking.status = 'payment_pending';
  await booking.save();
  res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
});

router.post('/:id/verify-payment', requireUser, async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  const booking = await Booking.findOne({ id: req.params.id, userId: req.user.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  if (booking.status === 'paid' && booking.paymentId === paymentId) return res.json(booking);
  if (booking.status !== 'payment_pending' || booking.razorpayOrderId !== orderId) {
    return res.status(409).json({ message: 'This payment does not match the current booking quote.' });
  }
  if (!verifyPaymentSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
    return res.status(400).json({ message: 'Payment verification failed. Contact support before trying again.' });
  }
  const client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  let payment;
  try {
    payment = await client.payments.fetch(paymentId);
  } catch (error) {
    console.error('Razorpay payment lookup failed:', error);
    return res.status(502).json({ message: 'Payment status could not be checked. Contact the booking team before trying again.' });
  }
  if (payment.order_id !== orderId || payment.status !== 'captured'
    || payment.amount !== Math.round(booking.quotedAmount * 100) || payment.currency !== booking.currency) {
    return res.status(409).json({ message: 'Razorpay has not confirmed the full quoted payment yet.' });
  }
  booking.status = 'paid';
  booking.paymentId = paymentId;
  booking.paidAt = new Date();
  await booking.save();
  res.json(booking);
});

export async function handleRazorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.get('x-razorpay-signature');
  if (!secret || !signature || !req.body?.length) return res.status(400).json({ message: 'Invalid webhook request.' });
  const expected = createHmac('sha256', secret).update(req.body).digest();
  let received;
  try {
    received = Buffer.from(signature, 'hex');
  } catch {
    return res.status(400).json({ message: 'Webhook signature verification failed.' });
  }
  if (expected.length !== received.length || !expected.length || !timingSafeEqual(expected, received)) {
    return res.status(400).json({ message: 'Webhook signature verification failed.' });
  }
  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Webhook body is not valid JSON.' });
  }
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id || event.payload?.order?.entity?.id;
    if (orderId && payment?.status === 'captured') {
      await Booking.findOneAndUpdate(
        { razorpayOrderId: orderId, status: { $in: ['payment_pending', 'paid'] } },
        { status: 'paid', paymentId: payment.id, paidAt: new Date(payment.created_at ? payment.created_at * 1000 : Date.now()) },
      );
    }
  }
  res.json({ received: true });
}

export async function getAdminBookings(_req, res) {
  const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
  const userIds = [...new Set(bookings.map((booking) => String(booking.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select('name email phone').lean();
  const byId = new Map(users.map((user) => [String(user._id), user]));
  res.json(bookings.map(({ _id, __v, userId, ...booking }) => ({
    ...booking,
    guest: byId.get(String(userId)) || null,
  })));
}

export async function quoteAdminBooking(req, res) {
  const amount = Number(req.body.amount);
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
    return res.status(400).json({ message: 'Enter a quote greater than 0 and no more than ₹1,00,00,000.' });
  }
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  if (!['requested', 'quoted'].includes(booking.status)) {
    return res.status(409).json({ message: 'A quote can only be sent for a new or previously quoted booking.' });
  }
  booking.quotedAmount = amount;
  booking.currency = 'INR';
  booking.quoteNote = note.slice(0, 1000);
  booking.status = 'quoted';
  booking.razorpayOrderId = undefined;
  await booking.save();
  res.json(booking);
}

export async function updateAdminBookingStatus(req, res) {
  if (!['confirmed', 'declined'].includes(req.body.status)) {
    return res.status(400).json({ message: 'Choose Confirmed or Declined.' });
  }
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  if (req.body.status === 'confirmed' && booking.status !== 'paid') {
    return res.status(409).json({ message: 'Only a paid booking can be confirmed.' });
  }
  if (req.body.status === 'declined' && ['paid', 'confirmed'].includes(booking.status)) {
    return res.status(409).json({ message: 'A paid booking must be resolved with the guest before it can be declined.' });
  }
  booking.status = req.body.status;
  await booking.save();
  res.json(booking);
}

export default router;
