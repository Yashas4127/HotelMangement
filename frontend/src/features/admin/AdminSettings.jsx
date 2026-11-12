import { useEffect, useState } from 'react';
import { api, jsonBody } from '../../services/api.js';
import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function AdminSettings() {
  useTitle('Settings');
  const [settings, setSettings] = useState({
    supportWhatsApp: '',
    aiProvider: 'gemini',
    aiActiveProvider: '',
    aiProviderKeysConfigured: { gemini: false, mistral: false, openrouter: false },
    aiAssistantConfigured: false,
  });
  const [aiProviderKeys, setAiProviderKeys] = useState({ gemini: '', mistral: '', openrouter: '' });
  const [clearAiProviderKeys, setClearAiProviderKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/admin/settings')
      .then((data) => { if (active) setSettings(data); })
      .catch((reason) => { if (active) setError(reason.message || 'Could not load settings.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const saveSupportSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const saved = await api('/admin/settings', {
        method: 'PUT',
        body: jsonBody({ supportWhatsApp: settings.supportWhatsApp }),
      });
      setSettings((current) => ({ ...current, ...saved }));
      setNotice('Support settings saved.');
    } catch (reason) {
      setError(reason.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const saveAiSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const saved = await api('/admin/settings', {
        method: 'PUT',
        body: jsonBody({
          supportWhatsApp: settings.supportWhatsApp,
          aiProvider: settings.aiProvider,
          aiProviderKeys,
          clearAiProviderKeys,
        }),
      });
      setSettings((current) => ({ ...current, ...saved }));
      setAiProviderKeys({ gemini: '', mistral: '', openrouter: '' });
      setClearAiProviderKeys([]);
      setNotice('AI provider settings saved securely.');
    } catch (reason) {
      setError(reason.message || 'Could not save AI provider settings.');
    } finally {
      setSaving(false);
    }
  };

  const providers = [
    { id: 'gemini', name: 'Google Gemini', url: 'https://aistudio.google.com/apikey', keyLabel: 'Gemini API key' },
    { id: 'mistral', name: 'Mistral AI', url: 'https://console.mistral.ai/api-keys', keyLabel: 'Mistral API key' },
    { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/keys', keyLabel: 'OpenRouter API key' },
  ];

  return (
    <div className="max-w-2xl">
      <PageHead title="Settings" />
      <form onSubmit={saveSupportSettings} className="mb-5 rounded-lg border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold">Customer support</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">Set the WhatsApp number used by the floating “WhatsApp us” button across the public website. Include the country code, for example <code>+91 98765 43210</code>. Leave it blank to hide/disable WhatsApp support.</p>
        <label htmlFor="support-whatsapp" className="label mt-5">WhatsApp support number</label>
        <input
          id="support-whatsapp"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+91 98765 43210"
          value={settings.supportWhatsApp}
          onChange={(event) => setSettings((current) => ({ ...current, supportWhatsApp: event.target.value }))}
          className="input"
          disabled={loading || saving}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-dark" disabled={loading || saving}>
            {saving ? 'Saving…' : 'Save support settings'}
          </button>
        </div>
      </form>

      <form onSubmit={saveAiSettings} className="mb-5 rounded-lg border border-line bg-paper p-6 text-sm leading-relaxed">
        <h2 className="text-base font-extrabold">AI travel assistant</h2>
        <p className="mt-2 text-mute">You only need to add one provider key. The assistant automatically uses a saved key; the preference below is optional when multiple keys are configured. Keys are encrypted before being saved and are never returned to the browser. Leave a key blank to keep the saved value.</p>

        <label htmlFor="ai-provider" className="label mt-5">Preferred AI provider</label>
        <select
          id="ai-provider"
          value={settings.aiProvider}
          onChange={(event) => setSettings((current) => ({ ...current, aiProvider: event.target.value }))}
          className="input"
          disabled={loading || saving}
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}{settings.aiProviderKeysConfigured[provider.id] ? ' (configured)' : ''}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-mute" role="status">
          {settings.aiActiveProvider
            ? `Currently using ${providers.find((provider) => provider.id === settings.aiActiveProvider)?.name || settings.aiActiveProvider}.`
            : 'No provider key saved yet. Add any one key below to enable the assistant.'}
        </p>

        <div className="mt-5 space-y-4">
          {providers.map((provider) => {
            const configured = settings.aiProviderKeysConfigured[provider.id];
            const removing = clearAiProviderKeys.includes(provider.id);
            return (
              <div key={provider.id} className="rounded-md border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor={`ai-key-${provider.id}`} className="font-semibold">{provider.keyLabel}</label>
                  <a className="text-xs font-semibold text-bronze underline" href={provider.url} target="_blank" rel="noreferrer">
                    Get API key
                  </a>
                </div>
                <input
                  id={`ai-key-${provider.id}`}
                  type="password"
                  autoComplete="new-password"
                  spellCheck="false"
                  placeholder={configured ? 'Key saved securely. Paste to replace it.' : 'Paste API key'}
                  value={aiProviderKeys[provider.id]}
                  onChange={(event) => setAiProviderKeys((current) => ({ ...current, [provider.id]: event.target.value }))}
                  className="input mt-2"
                  disabled={loading || saving || removing}
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className={configured && !removing ? 'text-emerald-700' : 'text-mute'} role="status">
                    {removing ? 'Key will be removed when saved.' : configured ? 'API key configured' : 'No API key saved'}
                  </span>
                  {configured && (
                    <button
                      type="button"
                      className="font-semibold text-red-700 underline"
                      disabled={loading || saving}
                      onClick={() => setClearAiProviderKeys((current) => (
                        removing ? current.filter((id) => id !== provider.id) : [...current, provider.id]
                      ))}
                    >
                      {removing ? 'Keep key' : 'Remove key'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-mute">
          Gemini and OpenRouter can use web search for sourced destination details. Mistral answers without live web search. Provider usage and web search may incur charges from the provider.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-dark" disabled={loading || saving}>
            {saving ? 'Saving…' : 'Save AI settings'}
          </button>
          {notice && <span className="text-sm text-emerald-700" role="status">{notice}</span>}
          {error && <span className="text-sm text-red-700" role="alert">{error}</span>}
        </div>
      </form>

      <div className="rounded-lg border border-line bg-paper p-6 text-sm leading-relaxed">
        <h2 className="text-base font-extrabold">Production data and payments</h2>
        <p className="mt-2 text-mute">Hotel listings, enquiries, booking requests, quotes, and customer accounts are stored in MongoDB. Admin and customer sessions use server-issued, HTTP-only cookies. Configure the MongoDB and admin environment variables before starting the API.</p>
        <p className="mt-3 text-mute">Razorpay payments are enabled only when the server has valid test or live credentials. Availability is checked by the admin before a quote is sent; only a paid request can be marked confirmed.</p>
        <p className="mt-3 text-mute">Use <code>npm run seed</code> to import the original hotel and destination data. Only hotels with photo URLs are included in the public catalogue.</p>
      </div>
    </div>
  );
}
