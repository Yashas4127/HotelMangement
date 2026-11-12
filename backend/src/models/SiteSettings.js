import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'site' },
  supportWhatsApp: { type: String, default: '' },
  aiProvider: { type: String, enum: ['gemini', 'mistral', 'openrouter'], default: 'gemini' },
  geminiApiKeyEncrypted: { type: String, default: '' },
  geminiApiKeyDisabled: { type: Boolean, default: false },
  mistralApiKeyEncrypted: { type: String, default: '' },
  openrouterApiKeyEncrypted: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('SiteSettings', siteSettingsSchema);
