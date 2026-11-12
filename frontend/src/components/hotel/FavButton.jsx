import { Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { cn } from '../../utils/cn.js';

export default function FavButton({ id, className, label }) {
  const { favs, toggleFav } = useApp();
  const on = favs.includes(id);
  return (
    <button type="button" aria-pressed={on} aria-label={on ? 'Remove from saved' : 'Save property'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(id); }}
      className={cn('grid h-10 w-10 place-items-center rounded-full bg-paper/95 text-ink shadow-sm transition active:scale-90', className)}>
      <Heart size={18} className={on ? 'fill-bronze text-bronze' : ''} />{label && <span className="sr-only">{label}</span>}
    </button>
  );
}
