import { createHmac, timingSafeEqual } from 'node:crypto';

export function isValidDateRange(checkIn, checkOut) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn || '') || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut || '')) return false;
  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())
    && start.toISOString().slice(0, 10) === checkIn
    && end.toISOString().slice(0, 10) === checkOut
    && start >= today && end > start;
}

export function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
