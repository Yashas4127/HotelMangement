import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageSquareText, Minus, SendHorizontal, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE } from '../../config/site.js';
import { api, jsonBody } from '../../services/api.js';
import { cn } from '../../utils/cn.js';
import { digits } from '../../utils/contact.js';

const QUICK_PROMPTS = ['Find hotels near me', 'Explore Coorg', 'Plan a weekend trip', 'Family vacation ideas', 'Hotels near beaches', 'Explore nearby attractions'];

const timeStamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function buildWelcomeMessage() {
  return {
    id: 'welcome',
    role: 'assistant',
    text: 'Namaskara! Welcome to Karnataka.\n\nLooking for a beautiful getaway? I can help you discover amazing stays, explore destinations and plan your next vacation.',
    timestamp: timeStamp(),
    cards: [],
  };
}

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([buildWelcomeMessage()]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [siteConfig, setSiteConfig] = useState({ supportWhatsApp: '', aiAssistantAvailable: false });
  const [aiConnected, setAiConnected] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    let active = true;
    api('/config')
      .then((config) => {
        if (active) {
          setSiteConfig(config);
          setConfigLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setSiteConfig({ supportWhatsApp: '', aiAssistantAvailable: false });
          setConfigLoaded(true);
        }
      });
    return () => { active = false; };
  }, []);

  const supportNumber = configLoaded ? siteConfig.supportWhatsApp : SITE.supportWhatsApp;
  const whatsappHref = supportNumber ? `https://wa.me/${digits(supportNumber)}` : '#';

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping, isOpen, isMinimized]);

  const appendMessage = (role, text, cards = [], sources = [], places = []) => {
    const item = {
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      text,
      timestamp: timeStamp(),
      cards,
      sources,
      places,
    };
    setMessages((current) => [...current, item]);
    return item;
  };

  const submitPrompt = async (value) => {
    const input = value.trim();
    if (!input || isTyping) return;

    const userMessage = appendMessage('user', input);
    setMessage('');
    setIsTyping(true);

    try {
      const history = [...messages.filter((item) => item.id !== 'welcome'), userMessage]
        .slice(-12)
        .map(({ role, text }) => ({ role, text }));
      const response = await api('/assistant/chat', {
        method: 'POST',
        body: jsonBody({ messages: history }),
      });
      if (['gemini', 'mistral', 'openrouter'].includes(response.provider)) setAiConnected(true);
      appendMessage('assistant', response.text, response.hotels || [], response.sources || [], response.places || []);
    } catch (reason) {
      setAiConnected(false);
      appendMessage('assistant', reason.message || 'The assistant could not respond right now. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([buildWelcomeMessage()]);
    setIsTyping(false);
  };

  if (!SITE.supportWidgetEnabled) return null;

  return (
    <div className="pointer-events-none fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-3 z-[60] md:bottom-6 md:right-6">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          {supportNumber && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat on WhatsApp"
              className="inline-flex items-center gap-2 rounded-full border border-[#dfe9d9] bg-[#25D366] px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#25D366]/30 transition duration-200 hover:scale-[1.02] active:scale-[.98] md:px-4 md:text-sm"
            >
              <MessageSquareText size={17} />
              <span className="hidden sm:inline">WhatsApp us</span>
            </a>
          )}

          <button
            type="button"
            aria-label="Open Karnataka Travel Assistant"
            aria-expanded={isOpen}
            onClick={() => { setIsOpen((current) => !current); setIsMinimized(false); }}
            className="inline-flex items-center gap-2 rounded-full border border-[#d9d0be] bg-[#f7f3eb] px-3 py-2.5 text-xs font-bold text-ink shadow-lg shadow-slate-200/70 transition duration-200 hover:scale-[1.02] active:scale-[.98] md:px-4 md:text-sm"
          >
            <Sparkles size={17} className="text-bronze" />
            <span className="hidden sm:inline">Plan your stay</span>
            {aiConnected && <span className="ml-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]" aria-label="Assistant online" />}
          </button>
        </div>

        <AnimatePresence>
          {(isOpen || isMinimized) && (
            <motion.aside
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'w-[min(92vw,380px)] overflow-hidden rounded-[28px] border border-line bg-paper shadow-[0_18px_50px_rgba(15,23,42,0.18)]',
                isMinimized ? 'h-auto' : 'flex h-[min(650px,calc(100dvh-8rem-env(safe-area-inset-bottom,0px)))] flex-col',
              )}
            >
              <div className="flex items-center justify-between border-b border-line bg-[#f4efe8] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e7dcc3] text-bronze">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Karnataka Travel Assistant</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mute">
                      {aiConnected && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />}
                      <span>{aiConnected ? 'Online now' : siteConfig.aiAssistantAvailable ? 'Ready to help' : 'AI setup needed'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-mute">
                  <button type="button" onClick={() => setIsMinimized(true)} aria-label="Minimize assistant" className="rounded-full p-1.5 hover:bg-white/80 hover:text-ink"><Minus size={16} /></button>
                  <button type="button" onClick={() => { setIsOpen(false); setIsMinimized(false); }} aria-label="Close assistant" className="rounded-full p-1.5 hover:bg-white/80 hover:text-ink"><X size={16} /></button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  <div className="shrink-0 border-b border-line bg-white px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button type="button" key={prompt} onClick={() => submitPrompt(prompt)} className="rounded-full border border-line bg-[#f8f7f4] px-2.5 py-1.5 text-[11px] font-medium text-ink transition hover:border-bronze hover:text-bronze">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#faf8f3] px-3 py-3">
                    {messages.map((item) => (
                      <div key={item.id} className={cn('flex', item.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('min-w-0 max-w-[86%] break-words rounded-2xl px-3 py-2.5 text-sm shadow-sm', item.role === 'user' ? 'bg-[#1d2d2a] text-white' : 'bg-white text-ink')}>
                          <div className="min-w-0 whitespace-pre-line break-words leading-relaxed">{item.text}</div>
                          {item.cards && item.cards.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {item.cards.map((hotel) => (
                                <div key={hotel.id} className="overflow-hidden rounded-xl border border-line bg-[#f8f7f4]">
                                  <div className="overflow-hidden">
                                    {hotel.images?.[0]?.url && <img src={hotel.images[0].url} alt={hotel.name} className="h-32 w-full object-cover" />}
                                  </div>
                                  <div className="space-y-2 p-3">
                                    <div>
                                      <h4 className="text-sm font-bold text-ink">{hotel.name}</h4>
                                      <p className="mt-1 text-[11px] text-mute">{[hotel.city, hotel.district].filter(Boolean).join(', ')}</p>
                                      {hotel.stars > 0 && <p className="mt-1 text-[11px] font-semibold text-ink">{hotel.stars}-star property</p>}
                                    </div>
                                    <p className="line-clamp-2 text-[11px] text-mute">
                                      {hotel.shortDescription || hotel.description || 'Verified stay details from the Karnataka dataset.'}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {(hotel.facilities || []).slice(0, 3).map((facility) => (
                                        <span key={facility} className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[10px] text-mute">{facility}</span>
                                      ))}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                      <Link to={`/hotels/${hotel.slug}`} className="text-[11px] font-semibold text-bronze underline underline-offset-4">View property</Link>
                                      {hotel.phone && <a href={`tel:${hotel.phone}`} className="text-[11px] font-semibold text-ink">Contact</a>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {item.places?.length > 0 && (
                            <div className="mt-3 border-t border-line pt-2">
                              <p className="mb-1 text-[10px] font-semibold text-mute">Explore these places</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {item.places.map((place) => (
                                  <a key={place.url} href={place.url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-bronze underline underline-offset-2">
                                    {place.name} on Google Maps
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.sources?.length > 0 && (
                            <div className="mt-3 border-t border-line pt-2">
                              <p className="mb-1 text-[10px] font-semibold text-mute">Sources</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {item.sources.map((source) => (
                                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-bronze underline underline-offset-2">
                                    {source.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-[10px] text-current/80">{item.timestamp}</div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="max-w-[75%] rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-bronze [animation-delay:-150ms]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-bronze [animation-delay:-75ms]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-bronze" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 border-t border-line bg-white p-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-mute">
                      <span>Suggested follow-ups</span>
                      <button type="button" onClick={clearChat} className="font-semibold text-bronze">Clear chat</button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            submitPrompt(message);
                          }
                        }}
                        aria-label="Ask the Karnataka Travel Assistant"
                        placeholder="Ask about stays, trips, and attractions"
                        className="input flex-1 rounded-full border border-line bg-[#f8f7f4] px-3 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:border-bronze"
                        maxLength={1200}
                      />
                      <button type="button" onClick={() => submitPrompt(message)} aria-label="Send message" className="grid h-11 w-11 place-items-center rounded-full bg-bronze text-white transition hover:bg-[#b39a74] disabled:opacity-50" disabled={!message.trim() || isTyping}>
                        <SendHorizontal size={17} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
