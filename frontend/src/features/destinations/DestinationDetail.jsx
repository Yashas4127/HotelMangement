import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import HotelCard from '../../components/hotel/HotelCard.jsx';
import Img from '../../components/common/Img.jsx';
import { Empty } from '../../components/common/Bits.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function DestinationDetail() {
  const { slug } = useParams();
  const { destinations, published } = useApp();
  const dest = destinations.find((d) => d.slug === slug);
  const list = useMemo(() => published.filter((h) => h.destination === slug), [published, slug]);
  const [type, setType] = useState('');
  useTitle(dest?.name, dest?.description);
  if (!dest) return <div className="wrap py-16"><Empty title="Destination not found"><Link to="/destinations" className="btn-dark">All destinations</Link></Empty></div>;
  const types = [...new Set(list.map((h) => h.type))];
  const shown = type ? list.filter((h) => h.type === type) : list;
  const photos = list.flatMap((h) => h.images.map((i) => ({ ...i, hotel: h }))).slice(0, 6);
  return (
    <div>
      <section className="bg-night py-14 text-white md:py-20">
        <div className="wrap">
          <p className="text-sm text-white/60">{dest.district}</p>
          <h1 className="h-display mt-2 text-6xl md:text-8xl">{dest.name}</h1>
          <p className="mt-4 max-w-xl text-base text-white/80 md:text-lg">{dest.description}</p>
          <p className="mt-4 text-sm font-semibold">{list.length} {list.length === 1 ? 'property' : 'properties'} listed</p>
        </div>
      </section>
      <div className="wrap py-10">
        {photos.length > 0 && <div className="no-scrollbar -mx-5 mb-10 flex gap-3 overflow-x-auto px-5 md:mx-0 md:px-0">{photos.map((p) => <Link key={p.id} to={`/hotels/${p.hotel.slug}`} className="w-64 shrink-0"><Img src={p.url} alt={p.caption || p.hotel.name} name={p.hotel.name} className="aspect-[4/3] rounded-lg" /><p className="mt-1.5 text-xs text-mute">{p.hotel.name}</p></Link>)}</div>}
        {types.length > 1 && <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by type">{['', ...types].map((t) => <button key={t || 'all'} aria-pressed={type === t} onClick={() => setType(t)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${type === t ? 'border-night bg-night text-white' : 'border-line bg-paper'}`}>{t || 'All'}</button>)}</div>}
        {shown.length ? <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{shown.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
          : <Empty title="No properties here yet" text="Properties added in the admin panel will appear in this destination."><Link to="/hotels" className="btn-dark">Explore all stays</Link></Empty>}
      </div>
    </div>
  );
}
