import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  district: String,
  keywords: { type: [String], default: [] },
  cover: String,
  description: String,
}, { timestamps: true, strict: false, id: false });

destinationSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Destination', destinationSchema);
