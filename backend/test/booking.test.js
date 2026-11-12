import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isValidDateRange, verifyPaymentSignature } from '../src/utils/booking.js';

test('booking dates must be valid future calendar dates with checkout after check-in', () => {
  const today = new Date();
  today.setUTCDate(today.getUTCDate() + 2);
  const checkIn = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() + 1);
  const checkOut = today.toISOString().slice(0, 10);
  assert.equal(isValidDateRange(checkIn, checkOut), true);
  assert.equal(isValidDateRange(checkIn, checkIn), false);
  assert.equal(isValidDateRange('2025-02-31', checkOut), false);
  assert.equal(isValidDateRange('not-a-date', checkOut), false);
});

test('payment verification accepts only the matching Razorpay HMAC signature', () => {
  const orderId = 'order_test_123';
  const paymentId = 'pay_test_456';
  const secret = 'test-secret';
  const signature = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  assert.equal(verifyPaymentSignature(orderId, paymentId, signature, secret), true);
  assert.equal(verifyPaymentSignature(orderId, paymentId, signature, 'wrong-secret'), false);
  assert.equal(verifyPaymentSignature(orderId, paymentId, 'invalid', secret), false);
});
