import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hotelId: { type: String, required: true },
  hotelSlug: { type: String, required: true },
  hotelName: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, required: true, min: 1, max: 20 },
  rooms: { type: Number, required: true, min: 1, max: 10, default: 1 },
  specialRequests: { type: String, default: '', maxlength: 2000 },
  status: {
    type: String,
    enum: ['requested', 'quoted', 'payment_pending', 'paid', 'confirmed', 'declined'],
    default: 'requested',
  },
  quotedAmount: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  quoteNote: { type: String, default: '', maxlength: 1000 },
  razorpayOrderId: String,
  paymentId: String,
  paidAt: Date,
}, { timestamps: true, id: false });

bookingSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.userId;
    return ret;
  },
});

export default mongoose.model('Booking', bookingSchema);
