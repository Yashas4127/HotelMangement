import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  id: String,
  url: { type: String, required: true },
  label: String,
  caption: String,
  category: String,
  source_page: String,
  verified: Boolean,
  permission: String,
}, { _id: false, strict: false });

const hotelSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  city: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: 'Karnataka' },
  type: { type: String, default: 'Stay' },
  images: { type: [imageSchema], default: [] },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  sourceId: String,
}, { timestamps: true, strict: false, id: false });

hotelSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Hotel', hotelSchema);
