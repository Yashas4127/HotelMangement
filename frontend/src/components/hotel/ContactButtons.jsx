import { MessageCircle, Phone } from 'lucide-react';
import { useTrip } from '../../context/TripContext.jsx';
import { hasWhatsApp, phonesOf, pretty, telHref, whatsappLink, whatsappTarget } from '../../utils/contact.js';
import { cn } from '../../utils/cn.js';

export function useContact(hotel) {
  const { trip } = useTrip();
  const phones = phonesOf(hotel);
  return { phones, call: phones[0] ? telHref(phones[0].number) : '', wa: whatsappLink(hotel, trip), direct: whatsappTarget(hotel)?.direct };
}

// Compact round icon buttons for hotel cards.
export function CardContact({ hotel, className }) {
  const { phones, call, wa } = useContact(hotel);
  if (!phones.length && !wa) return null;
  const base = 'grid h-10 w-10 place-items-center rounded-full border transition active:scale-90';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {call && <a href={call} aria-label={`Call ${hotel.name}`} className={cn(base, 'border-line bg-paper text-ink hover:border-ink/40')}><Phone size={17} /></a>}
      {wa && <a href={wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${hotel.name}`} className={cn(base, 'border-[#25D366] bg-[#25D366] text-white hover:bg-[#1fb857]')}><MessageCircle size={18} /></a>}
    </div>
  );
}

export function WhatsAppButton({ hotel, className, children }) {
  const { wa } = useContact(hotel);
  if (!wa) return null;
  return <a href={wa} target="_blank" rel="noreferrer" className={cn('btn bg-[#25D366] text-white hover:bg-[#1fb857]', className)}><MessageCircle size={17} />{children || 'Enquire on WhatsApp'}</a>;
}

export function CallButton({ hotel, className, full }) {
  const { phones, call } = useContact(hotel);
  if (!call) return null;
  return <a href={call} className={cn('btn-ghost', className)}><Phone size={16} />{full ? `Call ${pretty(phones[0].number)}` : 'Call'}</a>;
}
export { hasWhatsApp };
