import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const AI_PROVIDERS = ['gemini', 'mistral', 'openrouter'];

const keyFields = {
  gemini: 'geminiApiKeyEncrypted',
  mistral: 'mistralApiKeyEncrypted',
  openrouter: 'openrouterApiKeyEncrypted',
};

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long to encrypt AI provider keys.');
  }
  return createHash('sha256').update('karnataka-stays:ai-provider-keys:v1:').update(secret).digest();
}

export function encryptAiProviderKey(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptAiProviderKey(value) {
  const [version, ivText, tagText, encryptedText] = String(value || '').split(':');
  if (version !== 'v1' || !ivText || !tagText || !encryptedText) {
    throw new Error('Stored AI provider key is invalid.');
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

export function hasAiProviderKey(settings, provider) {
  const field = keyFields[provider];
  if (!field) return false;
  if (provider === 'gemini' && settings?.geminiApiKeyDisabled) return Boolean(settings[field]);
  return Boolean(settings?.[field] || (provider === 'gemini' && process.env.GEMINI_API_KEY));
}

export function getAiProviderKey(settings, provider) {
  const field = keyFields[provider];
  if (!field) throw new Error('The selected AI provider is not supported.');
  if (settings?.[field]) return decryptAiProviderKey(settings[field]);
  if (provider === 'gemini' && settings?.geminiApiKeyDisabled) return '';
  return provider === 'gemini' ? process.env.GEMINI_API_KEY || '' : '';
}

export function getAiProviderStatus(settings) {
  return Object.fromEntries(AI_PROVIDERS.map((provider) => [provider, hasAiProviderKey(settings, provider)]));
}

export function resolveAiProvider(settings) {
  const statuses = getAiProviderStatus(settings);
  if (statuses[settings?.aiProvider]) return settings.aiProvider;
  return AI_PROVIDERS.find((provider) => statuses[provider]) || '';
}
