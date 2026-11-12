import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hotelId: { type: String, default: '' },
  hotelName: { type: String, default: 'General enquiry' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  message: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['new', 'contacted', 'resolved'], default: 'new' },
}, { timestamps: true, id: false });

enquirySchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.userId;
    return ret;
  },
});

export default mongoose.model('Enquiry', enquirySchema);
