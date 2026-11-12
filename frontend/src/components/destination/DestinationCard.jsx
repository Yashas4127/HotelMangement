import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import Img from '../common/Img.jsx';
import { useCover } from '../../hooks/useHotelImages.js';
import { useApp } from '../../context/AppContext.jsx';
import { cn } from '../../utils/cn.js';

export default function DestinationCard({ dest, className, tall }) {
  const { published, destCounts } = useApp();
  const ref = useRef(null);
  const sample = useMemo(() => published.find((h) => h.destination === dest.slug && h.images?.length) || published.find((h) => h.destination === dest.slug), [published, dest.slug]);
  const hotelCover = useCover(sample, ref);
  const cover = dest.cover || (sample ? hotelCover : null);
  const n = destCounts[dest.slug] || 0;
  return (
    <Link ref={ref} to={`/destinations/${dest.slug}`} className={cn('group relative block shrink-0 overflow-hidden rounded-lg bg-night', tall ? 'aspect-[3/4]' : 'aspect-[4/5]', className)}>
      <Img src={cover} name={dest.name} note={' '} alt={`${dest.name}${sample && !dest.cover ? ` (photo of ${sample.name})` : ''}`} className="absolute inset-0 h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="font-display text-3xl font-semibold leading-none">{dest.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-xs text-white/80">{dest.description}</p>
        <p className="mt-2 text-xs font-semibold text-white/90">{n ? `${n} ${n === 1 ? 'property' : 'properties'}` : 'No properties yet'}</p>
      </div>
    </Link>
  );
}
