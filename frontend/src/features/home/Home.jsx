import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext.jsx';
import { collections } from '../../data/collections.js';
import HotelCard from '../../components/hotel/HotelCard.jsx';
import DestinationCard from '../../components/destination/DestinationCard.jsx';
import Img from '../../components/common/Img.jsx';
import { SectionHead, CardSkeleton } from '../../components/common/Bits.jsx';
import { useCover } from '../../hooks/useHotelImages.js';
import { useTitle } from '../../hooks/useTitle.js';
import { useRecent } from '../../hooks/useRecent.js';

const QUICK = [['Coorg', '/hotels?dest=coorg'], ['Chikmagalur', '/hotels?dest=chikmagalur'], ['Hampi', '/hotels?dest=hampi'], ['Kabini', '/hotels?dest=kabini'], ['Gokarna', '/hotels?dest=gokarna'], ['Mysuru', '/hotels?dest=mysuru']];

function SearchPanel() {
  const nav = useNavigate();
  const { destinations, published } = useApp();
  const [q, setQ] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const d = destinations.find((x) => x.name.toLowerCase() === q.trim().toLowerCase());
    nav(d ? `/hotels?dest=${d.slug}` : q.trim() ? `/hotels?q=${encodeURIComponent(q.trim())}` : '/hotels');
  };
  return (
    <div className="mt-8 w-full max-w-2xl md:mt-10">
      <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl bg-paper p-2 text-ink shadow-xl sm:flex-row" role="search" aria-label="Search stays">
        <label className="flex min-h-[56px] flex-1 items-center gap-3 px-4">
          <MapPin size={20} className="shrink-0 text-bronze" />
          <span className="sr-only">Destination or stay</span>
          <input list="dest-list" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Where to? Coorg, Hampi, a hotel name…" className="w-full bg-transparent text-base font-semibold placeholder:font-normal placeholder:text-mute/70 focus:outline-none" />
          <datalist id="dest-list">{destinations.map((d) => <option key={d.id} value={d.name} />)}{published.slice(0, 80).map((h) => <option key={h.id} value={h.name} />)}</datalist>
        </label>
        <button className="btn-primary min-h-[56px] rounded-xl px-8 text-base"><Search size={18} />Search stays</button>
      </form>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Popular destinations">
        {QUICK.map(([n, to]) => <Link key={n} to={to} className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">{n}</Link>)}
      </div>
    </div>
  );
}

function Recent() {
  const ids = useRecent();
  const { published } = useApp();
  const list = ids.map((id) => published.find((h) => h.id === id)).filter(Boolean).slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="wrap pt-14 md:pt-20">
      <SectionHead title="Pick up where you left off" sub="Stays you viewed recently on this device." />
      <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
        {list.map((h) => <HotelCard key={h.id} hotel={h} compare={false} className="w-[72vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none" />)}
      </div>
    </section>
  );
}

export default function Home() {
  const { published, destinations, loading } = useApp();
  useTitle(null, 'Discover thoughtfully selected hotels, boutique stays and beautiful escapes across Karnataka.');
  const featured = useMemo(() => published.filter((h) => h.featured), [published]);
  const handpicked = (featured.length >= 4 ? featured : published).slice(0, 8);
  const heroHotel = featured.find((h) => h.images.length) || featured[0] || published[0];
  const heroImg = useCover(heroHotel, null);
  const editorial = featured.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate -mt-14 overflow-hidden bg-night text-white md:-mt-[72px]">
        {heroImg && <Img src={heroImg} alt={heroHotel ? `${heroHotel.name}` : ''} eager className="absolute inset-0 -z-10 h-full w-full" imgClassName="opacity-60" note=" " />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night/70 via-night/30 to-night/80" />
        <div className="wrap flex min-h-[84vh] flex-col justify-end pb-10 pt-28 md:min-h-[82vh] md:pb-16">
          <p className="text-xs font-semibold tracking-[.18em] text-white/80">DISCOVER KARNATAKA</p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="h-display mt-4 max-w-4xl text-[3.4rem] sm:text-7xl md:text-[7rem]">Find Your Next Extraordinary Stay.</motion.h1>
          <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">Discover thoughtfully selected hotels, boutique stays and beautiful escapes across Karnataka.</p>
          <SearchPanel />
          {heroImg && heroHotel && <p className="mt-4 text-xs text-white/60">Photo: <Link to={`/hotels/${heroHotel.slug}`} className="underline">{heroHotel.name}</Link></p>}
        </div>
      </section>

      <Recent />

      {/* Destinations */}
      <section className="wrap pt-14 md:pt-24">
        <SectionHead title="Popular destinations" sub="Coffee hills, forest rivers, ruins and coastline." to="/destinations" action="All destinations" />
        <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
          {destinations.slice(0, 8).map((d) => <DestinationCard key={d.id} dest={d} className="w-[62vw] max-w-[260px] snap-start md:w-auto md:max-w-none" />)}
        </div>
      </section>

      {/* Handpicked */}
      <section className="wrap pt-16 md:pt-28">
        <SectionHead title="Handpicked stays" sub="Properties where we have confirmed details from the official source." to="/hotels?featured=1" action="View featured" />
        {loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          : <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-10 md:overflow-visible md:px-0 lg:grid-cols-4">{handpicked.map((h) => <HotelCard key={h.id} hotel={h} tall className="w-[78vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none" />)}</div>}
      </section>

      {/* Experiences: asymmetric layout */}
      <section className="wrap pt-16 md:pt-28">
        <SectionHead title="Discover by experience" sub="Pick a landscape, then see who's staying there." />
        <div className="grid gap-3 md:grid-cols-6 md:grid-rows-2 md:gap-4">
          {collections.map((c, i) => {
            const n = published.filter(c.test).length;
            const span = ['md:col-span-3 md:row-span-2', 'md:col-span-3', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-3'][i] || 'md:col-span-2';
            const dark = i % 3 === 0;
            return (
              <Link key={c.slug} to={`/hotels?collection=${c.slug}`} className={`group relative flex min-h-[150px] flex-col justify-between rounded-lg p-5 transition ${span} ${dark ? 'bg-night text-white' : i % 3 === 1 ? 'bg-[#E3E5DB]' : 'bg-[#EAE3D6]'}`}>
                <ArrowUpRight className="self-end opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <div><h3 className={`font-display font-semibold leading-none ${i === 0 ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'}`}>{c.title}</h3><p className={`mt-2 max-w-sm text-sm ${dark ? 'text-white/70' : 'text-mute'}`}>{c.blurb}</p><p className="mt-2 text-xs font-semibold">{n} {n === 1 ? 'stay' : 'stays'}</p></div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured editorial */}
      {editorial.length > 0 && (
        <section className="mt-16 bg-paper py-16 md:mt-28 md:py-24">
          <div className="wrap grid gap-14 md:gap-24">
            {editorial.map((h, i) => <EditorialRow key={h.id} hotel={h} flip={i % 2 === 1} />)}
          </div>
        </section>
      )}

      {/* Why */}
      <section className="wrap pt-16 md:pt-28">
        <SectionHead title="Why use this guide" />
        <dl className="grid gap-x-10 gap-y-6 md:grid-cols-5">
          {[['Carefully selected', 'A curated shortlist, not an open directory.'], ['All of Karnataka', 'Coast, Ghats, forest and heritage towns.'], ['Honest information', 'Unconfirmed details are left blank, never guessed.'], ['Easy discovery', 'Search, filter and save on any device.'], ['Direct contact', 'Call or WhatsApp the property directly. No middlemen.']].map(([t, d]) => (
            <div key={t} className="border-t-2 border-bronze pt-3"><dt className="font-bold">{t}</dt><dd className="mt-1 text-sm text-mute">{d}</dd></div>))}
        </dl>
      </section>

      {/* Testimonials (demo) */}
      <section className="wrap pt-16 md:pt-28">
        <SectionHead title="What guests might say" sub="Demo content only. These are placeholder quotes, not real guest reviews." />
        <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {['The search made it easy to compare coffee-estate stays.', 'Saving favourites and calling the property directly felt simple.', 'Clear about what was and was not confirmed.'].map((t, i) => (
            <figure key={i} className="w-[80vw] max-w-sm shrink-0 snap-start rounded-lg border border-line bg-paper p-6 md:w-auto md:max-w-none"><blockquote className="font-display text-2xl leading-snug">“{t}”</blockquote><figcaption className="mt-4 text-xs text-mute">Sample placeholder · Demo content</figcaption></figure>))}
        </div>
      </section>

      <Newsletter />
    </div>
  );
}

function EditorialRow({ hotel, flip }) {
  const cover = useCover(hotel, null);
  return (
    <article className={`grid items-center gap-6 md:grid-cols-2 md:gap-14 ${flip ? 'md:[&>*:first-child]:order-2' : ''}`}>
      <Link to={`/hotels/${hotel.slug}`} className="block overflow-hidden rounded-lg"><Img src={cover} name={hotel.name} alt={hotel.name} className="aspect-[4/3] w-full md:aspect-[5/4]" /></Link>
      <div>
        <p className="text-sm text-mute">{hotel.city}, {hotel.district}</p>
        <h3 className="h-display mt-2 text-5xl md:text-6xl">{hotel.name}</h3>
        <p className="mt-4 max-w-md text-mute">{hotel.shortDescription || `${hotel.type} in ${hotel.city}.`}</p>
        <Link to={`/hotels/${hotel.slug}`} className="btn-dark mt-6">Discover property</Link>
      </div>
    </article>
  );
}

function Newsletter() {
  const [email, setEmail] = useState(''); const [done, setDone] = useState(false); const [err, setErr] = useState('');
  const submit = (e) => { e.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Enter a valid email address.'); return; } setErr(''); setDone(true); };
  return (
    <section className="wrap pt-16 md:pt-28">
      <div className="rounded-2xl bg-night px-6 py-12 text-white md:px-16 md:py-16">
        <h2 className="h-display max-w-2xl text-5xl md:text-6xl">New stays, as we find them.</h2>
        <p className="mt-3 max-w-md text-white/70">Occasional notes on places worth the drive. (Demo form: nothing is sent.)</p>
        {done ? <p className="mt-6 font-semibold text-bronze" role="status">Thanks. This demo form does not store your email.</p> : (
          <form onSubmit={submit} noValidate className="mt-7 flex max-w-lg flex-col gap-3 sm:flex-row">
            <div className="flex-1"><label htmlFor="nl" className="sr-only">Email address</label><input id="nl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input border-white/20 bg-white/10 text-white placeholder:text-white/50" />{err && <p className="mt-1 text-xs text-red-300" role="alert">{err}</p>}</div>
            <button className="btn-primary">Subscribe</button>
          </form>)}
      </div>
    </section>
  );
}
