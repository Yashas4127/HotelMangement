import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, MapPin, Star } from 'lucide-react';
import Img from '../common/Img.jsx';
import FavButton from './FavButton.jsx';
import { CardContact } from './ContactButtons.jsx';
import { useCover } from '../../hooks/useHotelImages.js';
import { useCompare } from '../../context/CompareContext.jsx';
import { cn } from '../../utils/cn.js';

export const placeOf = (h) => [h.city, h.district].filter((x, i, a) => x && a.indexOf(x) === i).join(', ');

export default function HotelCard({ hotel, className, tall, list, compare = true }) {
  const ref = useRef(null);
  const cover = useCover(hotel, ref);
  const { ids, toggle, full } = useCompare();
  const picked = ids.includes(hotel.id);
  const desc = hotel.highlights?.[0] || hotel.shortDescription || '';
  const chips = hotel.facilities.slice(0, list ? 5 : 3);
  return (
    <article ref={ref} className={cn('group relative', list && 'grid gap-4 rounded-xl border border-line bg-paper p-3 sm:grid-cols-[280px_1fr]', className)}>
      <Link to={`/hotels/${hotel.slug}`} className={cn('block', list && 'contents')} aria-label={`View details: ${hotel.name}`}>
        <div className={cn('relative overflow-hidden rounded-lg', list ? 'aspect-[4/3] sm:aspect-auto sm:min-h-[200px]' : tall ? 'aspect-[4/5]' : 'aspect-[4/3]')}>
          <Img src={cover} name={hotel.name} alt={`${hotel.name}, ${hotel.city}`} className="h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" />
          {hotel.stars > 0 && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-night/85 px-2.5 py-1 text-xs font-semibold text-white"><Star size={12} className="fill-bronze text-bronze" />{hotel.stars}-star</span>}
        </div>
        <div className={cn(!list && 'pt-3', list && 'min-w-0 py-1 pr-10')}>
          <h3 className="text-base font-bold leading-snug md:text-lg">{hotel.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-mute"><MapPin size={14} className="shrink-0" />{placeOf(hotel)}</p>
          {desc && <p className={cn('mt-1.5 text-sm text-mute', list ? 'line-clamp-2' : 'line-clamp-2')}>{desc}</p>}
          <div className="mt-2.5 flex flex-wrap gap-1.5"><span className="chip">{hotel.type}</span>{chips.map((c) => <span key={c} className="chip text-mute">{c}</span>)}</div>
        </div>
      </Link>
      <div className={cn('flex items-center justify-between gap-3', list ? 'sm:col-start-2 sm:self-end' : 'mt-3')}>
        <CardContact hotel={hotel} />
        <div className="flex items-center gap-2">
          <Link to={`/book/${hotel.slug}`} className="inline-flex min-h-[40px] items-center rounded-full bg-night px-3 text-xs font-semibold text-white hover:bg-night/85">Book</Link>
          {compare && <button type="button" onClick={() => toggle(hotel.id)} disabled={!picked && full} aria-pressed={picked} className={cn('inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition disabled:opacity-40', picked ? 'border-night bg-night text-white' : 'border-line bg-paper text-ink')}><ArrowLeftRight size={14} />{picked ? 'Added' : 'Compare'}</button>}
        </div>
      </div>
      <FavButton id={hotel.id} className={cn('absolute shadow', list ? 'right-5 top-5 sm:left-[236px] sm:right-auto' : 'right-3 top-3')} />
    </article>
  );
}
