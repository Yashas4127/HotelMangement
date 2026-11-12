import { useEffect, useState } from 'react';
import { cachedImage, lookupImage } from '../services/imageService.js';

export function useInView(ref) {
  const [seen, setSeen] = useState(!ref);
  useEffect(() => {
    const el = ref && ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen]);
  return seen;
}

// Returns the best available cover URL (stored image first, then a live lookup of the official site's own image).
export function useCover(hotel, ref) {
  const stored = hotel?.images?.find((i) => i.category === 'cover')?.url || hotel?.images?.[0]?.url || null;
  const [remote, setRemote] = useState(() => (hotel ? cachedImage(hotel.slug) : null));
  const seen = useInView(ref);
  useEffect(() => {
    if (!hotel || stored || remote || !seen) return;
    let on = true;
    lookupImage(hotel).then((u) => on && u && setRemote(u));
    return () => { on = false; };
  }, [hotel, stored, remote, seen]);
  return stored || remote || null;
}

// All displayable images for a hotel, with the live-found cover appended when nothing is stored.
export function useGallery(hotel) {
  const cover = useCover(hotel, null);
  if (!hotel) return [];
  if (hotel.images?.length) return hotel.images;
  return cover ? [{ id: 'live', url: cover, label: 'Official website image', caption: `${hotel.name} (image from the official website)`, category: 'cover', source_page: hotel.website, verified: false }] : [];
}
