import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ExternalLink, Globe, Mail, MapPin, Phone, Share2, Star, Info, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useTrip } from '../../context/TripContext.jsx';
import Gallery from '../../components/hotel/Gallery.jsx';
import FavButton from '../../components/hotel/FavButton.jsx';
import HotelCard, { placeOf } from '../../components/hotel/HotelCard.jsx';
import FacilityIcon from '../../components/hotel/FacilityIcon.jsx';
import { CallButton, WhatsAppButton, useContact } from '../../components/hotel/ContactButtons.jsx';
import TripBar, { guestsLabel } from '../../components/trip/TripBar.jsx';
import { useGallery } from '../../hooks/useHotelImages.js';
import { trackRecent } from '../../hooks/useRecent.js';
import { useTitle } from '../../hooks/useTitle.js';
import { Empty } from '../../components/common/Bits.jsx';
import { pretty, telHref, toE164India } from '../../utils/contact.js';

const Fact = ({ k, v }) => (v ? <div className="border-t border-line py-3"><dt className="text-xs font-semibold text-mute">{k}</dt><dd className="mt-0.5 text-sm font-medium">{v}</dd></div> : null);
const Section = ({ id, title, children }) => (<section id={id} className="scroll-mt-32 border-t border-line py-8"><h2 className="mb-4 text-xl font-extrabold md:text-2xl">{title}</h2>{children}</section>);

export default function HotelDetail() {
  const { slug } = useParams();
  const { published, loading, destinations } = useApp();
  const { trip, nights } = useTrip();
  const hotel = published.find((h) => h.slug === slug);
  const images = useGallery(hotel);
  const contact = useContact(hotel || {});
  const [copied, setCopied] = useState(false);
  useTitle(hotel ? hotel.name : 'Property', hotel ? `${hotel.name} in ${hotel.city}, ${hotel.district}. Photos, facilities and direct contact.` : undefined);
  useEffect(() => { if (hotel) trackRecent(hotel.id); }, [hotel?.id]); // eslint-disable-line

  if (loading) return <div className="wrap py-10"><div className="skeleton h-8 w-1/2 rounded" /><div className="skeleton mt-6 aspect-[16/9] rounded-xl" /></div>;
  if (!hotel) return <div className="wrap py-16"><Empty title="Property not found" text="It may have been unpublished or removed."><Link className="btn-dark" to="/hotels">Browse all stays</Link></Empty></div>;

  const dest = destinations.find((d) => d.slug === hotel.destination);
  const similar = published.filter((h) => h.id !== hotel.id && h.destination === hotel.destination).slice(0, 3);
  const mapUrl = hotel.lat && hotel.lng ? `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${hotel.address || hotel.city} Karnataka`)}`;
  const pol = hotel.policies;
  const policyRows = [['Check-in', pol.checkIn], ['Check-out', pol.checkOut], ['Cancellation', pol.cancellation], ['Children', pol.child], ['Pets', pol.pet]].filter(([, v]) => v);
  const dining = hotel.dining.filter((d) => d.name || d.description || d.cuisine);
  const about = [...(hotel.highlights || []), ...hotel.factsList];
  const roomImgs = hotel.images.filter((i) => i.category === 'room');
  const quick = [hotel.type, hotel.stars ? `${hotel.stars}-star` : '', hotel.roomCount ? `${hotel.roomCount} rooms` : '', pol.checkIn ? `Check-in ${pol.checkIn}` : '', pol.checkOut ? `Check-out ${pol.checkOut}` : ''].filter(Boolean);
  const tabs = [['overview', 'Overview', true], ['amenities', 'Amenities', hotel.facilities.length], ['rooms', 'Rooms', hotel.rooms.length], ['dining', 'Dining', dining.length], ['location', 'Location', true], ['contact', 'Contact', true]].filter((t) => t[2]);
  const share = async () => {
    const data = { title: hotel.name, text: `${hotel.name}, ${placeOf(hotel)}`, url: window.location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); setCopied(true); setTimeout(() => setCopied(false), 1800); } } catch { /* cancelled */ }
  };
  const hasContact = contact.phones.length || contact.wa;

  return (
    <div className="pb-28 md:pb-0">
      <div className="wrap pt-5 md:pt-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-mute">
          <Link to="/" className="hover:text-ink">Home</Link><ChevronRight size={12} /><Link to="/hotels" className="hover:text-ink">Explore</Link>
          {dest && <><ChevronRight size={12} /><Link to={`/destinations/${dest.slug}`} className="hover:text-ink">{dest.name}</Link></>}<ChevronRight size={12} /><span className="text-ink" aria-current="page">{hotel.name}</span>
        </nav>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{hotel.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-mute">
              <span className="inline-flex items-center gap-1"><MapPin size={15} />{placeOf(hotel)}, {hotel.state}</span>
              {hotel.stars > 0 && <span className="inline-flex items-center gap-1 font-semibold text-ink"><Star size={14} className="fill-bronze text-bronze" />{hotel.stars}-star</span>}
              <span className="chip">{hotel.type}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={share} aria-label="Share this stay" className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-paper"><Share2 size={17} />{copied && <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded bg-night px-2 py-1 text-[11px] text-white" role="status">Link copied</span>}</button>
            <FavButton id={hotel.id} className="border border-line" />
          </div>
        </div>
        <Gallery images={images} name={hotel.name} galleryUrl={hotel.galleryUrl} />
        {hotel.galleryUrl && images.length > 0 && <a href={hotel.galleryUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline decoration-bronze decoration-2 underline-offset-4">See the full official gallery <ExternalLink size={14} /></a>}
      </div>

      <div className="sticky top-14 z-30 mt-6 border-y border-line bg-canvas/95 backdrop-blur md:top-[72px]">
        <nav className="wrap no-scrollbar flex gap-6 overflow-x-auto" aria-label="Page sections">
          {tabs.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }} className="shrink-0 border-b-2 border-transparent py-3.5 text-sm font-semibold text-mute hover:border-bronze hover:text-ink">{label}</a>)}
        </nav>
      </div>

      <div className="wrap mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <section id="overview" className="scroll-mt-32 pb-8">
            {quick.length > 0 && <div className="flex flex-wrap gap-2">{quick.map((q) => <span key={q} className="chip">{q}</span>)}</div>}
            {about.length > 0 && <ul className="mt-5 grid gap-2 text-[15px] leading-relaxed">{about.map((x, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bronze" />{x.charAt(0).toUpperCase() + x.slice(1)}</li>)}</ul>}
            {hotel.rates && <p className="mt-5 text-sm"><span className="text-mute">Rates: </span><span className="font-semibold">{String(hotel.rates)}</span></p>}
          </section>

          {hotel.facilities.length > 0 && <Section id="amenities" title="Amenities"><ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">{hotel.facilities.map((x) => <li key={x} className="flex items-center gap-2.5"><FacilityIcon name={x} className="shrink-0 text-bronze" />{x}</li>)}</ul></Section>}

          {hotel.rooms.length > 0 && <Section id="rooms" title="Rooms"><div className="grid gap-4 sm:grid-cols-2">{hotel.rooms.map((r, i) => (<div key={i} className="rounded-lg border border-line bg-paper p-4"><h3 className="font-bold">{r.name}</h3>{r.description && <p className="mt-1 text-sm text-mute">{r.description}</p>}{r.occupancy && <p className="mt-2 text-xs text-mute">Sleeps {r.occupancy}</p>}{r.price && <p className="mt-1 text-sm font-semibold">₹{r.price}</p>}</div>))}</div>{roomImgs.length > 0 && <div className="mt-5"><Gallery images={roomImgs} name={hotel.name} /></div>}</Section>}

          {dining.length > 0 && <Section id="dining" title="Dining">{dining.map((d, i) => (<div key={i} className="mb-3"><h3 className="font-bold">{d.name || 'Dining'}</h3>{(d.cuisine || d.timings) && <p className="text-sm text-mute">{[d.cuisine, d.timings].filter(Boolean).join(' · ')}</p>}{d.description && <p className="mt-1 text-[15px]">{d.description}</p>}</div>))}</Section>}

          {hotel.events && (hotel.events.description || hotel.events.capacity) && <Section id="events" title="Events and banquets"><p className="text-[15px]">{hotel.events.description}</p>{hotel.events.capacity && <p className="mt-1 text-sm text-mute">Capacity: {hotel.events.capacity}</p>}</Section>}

          <Section id="location" title="Location">
            <p className="text-[15px]">{hotel.address || `${placeOf(hotel)}, ${hotel.state}`}</p>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-ghost mt-4"><MapPin size={16} />Open in Google Maps</a>
          </Section>

          {policyRows.length > 0 && <Section id="policies" title="Policies"><dl className="grid gap-x-8 sm:grid-cols-2">{policyRows.map(([k, v]) => <Fact key={k} k={k} v={v} />)}</dl></Section>}

          <Section id="contact" title="Contact the property">
            <div className="grid gap-3">
              {contact.phones.map((p) => (
                <div key={p.number} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper p-3">
                  <span className="inline-flex items-center gap-2 font-semibold"><Phone size={16} className="text-bronze" />{pretty(p.number)}</span>
                  <span className="flex gap-2">
                    <a href={telHref(p.number)} className="btn-ghost min-h-[40px] px-4">Call</a>
                    {p.mobile && <a href={`https://wa.me/${toE164India(p.number)}`} target="_blank" rel="noreferrer" className="btn min-h-[40px] bg-[#25D366] px-4 text-white hover:bg-[#1fb857]"><MessageCircle size={16} />WhatsApp</a>}
                  </span>
                </div>
              ))}
              {hotel.email && <a href={`mailto:${hotel.email}`} className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-bronze decoration-2 underline-offset-4"><Mail size={16} />{hotel.email}</a>}
              {hotel.website && <a href={hotel.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-bronze decoration-2 underline-offset-4"><Globe size={16} />Official website / listing</a>}
              {!hasContact && <p className="text-sm text-mute">No phone number on file yet. Use the official website above or send an enquiry.</p>}
            </div>
            <div className="mt-5 flex gap-3 rounded-lg bg-[#EFEDE5] p-4 text-xs text-mute"><Info size={16} className="mt-0.5 shrink-0" /><p>{hotel.researchSource ? `Source: ${hotel.researchSource}. ` : ''}Rates, availability and policies change, so please confirm with the property before you book. Photographs belong to the property.</p></div>
          </Section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-40 grid gap-4 rounded-xl border border-line bg-paper p-5">
            <div><h2 className="text-lg font-extrabold">Plan your stay</h2><p className="mt-1 text-sm text-mute">We’ll check availability and send you a quote before you pay.</p></div>
            <TripBar stacked />
            {nights > 0 && <p className="text-sm font-semibold">{nights} night{nights > 1 ? 's' : ''} · {guestsLabel(trip)}</p>}
            <div className="grid gap-2.5">
              <Link to={`/book/${hotel.slug}`} className="btn-dark w-full">Book with Karnataka Stays</Link>
              <Link to={`/enquire/${hotel.slug}`} className="btn-ghost w-full"><Mail size={16} />Ask us a question</Link>
              <WhatsAppButton hotel={hotel} className="w-full" />
              <CallButton hotel={hotel} full className="w-full" />
            </div>
            <p className="text-xs text-mute">We confirm the hotel’s availability, send your quote, and arrange the reservation after secure payment.</p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && <div className="wrap mt-16"><h2 className="mb-6 text-2xl font-extrabold">Similar stays{dest ? ` in ${dest.name}` : ''}</h2><div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{similar.map((h) => <HotelCard key={h.id} hotel={h} compare={false} />)}</div></div>}

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <WhatsAppButton hotel={hotel} className="flex-[1.6]">WhatsApp</WhatsAppButton>
          <CallButton hotel={hotel} className="flex-1" />
          {!contact.wa && !contact.call && hotel.website && <a className="btn-ghost flex-1" href={hotel.website} target="_blank" rel="noreferrer"><Globe size={16} />Website</a>}
          <Link to={`/enquire/${hotel.slug}`} className="btn-ghost flex-1">Enquire</Link>
          <Link to={`/book/${hotel.slug}`} className="btn-dark flex-1">Book</Link>
        </div>
      </div>
    </div>
  );
}
