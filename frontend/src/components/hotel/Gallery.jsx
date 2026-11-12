import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import Img, { Placeholder } from '../common/Img.jsx';

function Lightbox({ images, index, setIndex, onClose }) {
  const n = images.length;
  const go = useCallback((d) => setIndex((i) => (i + d + n) % n), [n, setIndex]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [go, onClose]);
  const img = images[index];
  return (
    <motion.div className="fixed inset-0 z-[95] flex flex-col bg-night text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="flex items-center justify-between px-4 py-3"><span className="text-sm">{index + 1} / {n}</span><button onClick={onClose} aria-label="Close viewer" className="grid h-11 w-11 place-items-center"><X /></button></div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        <AnimatePresence mode="wait"><motion.img key={img.url} src={img.url} alt={img.caption || img.label || ''} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} /></AnimatePresence>
        {n > 1 && <>
          <button onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-night/70"><ChevronLeft /></button>
          <button onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-night/70"><ChevronRight /></button>
        </>}
      </div>
      <div className="px-5 py-4 text-center text-sm text-white/80">{img.caption || img.label}{img.source_page && <a href={img.source_page} target="_blank" rel="noreferrer" className="ml-2 underline">Source</a>}</div>
    </motion.div>
  );
}

export default function Gallery({ images, name, galleryUrl }) {
  const [open, setOpen] = useState(null);
  const [cur, setCur] = useState(0);
  const scroller = useRef(null);
  const onScroll = () => { const el = scroller.current; if (el) setCur(Math.round(el.scrollLeft / el.clientWidth)); };

  if (!images.length) {
    return (
      <div className="overflow-hidden rounded-xl"><div className="aspect-[16/9] md:aspect-[21/9]"><Placeholder name={name} note="We haven't added an official photograph of this property yet" /></div>
        {galleryUrl && <a href={galleryUrl} target="_blank" rel="noreferrer" className="btn-ghost mt-3 w-full sm:w-auto">View official photo gallery <ExternalLink size={16} /></a>}</div>
    );
  }
  const grid = images.slice(0, 5);
  return (
    <>
      {/* Mobile: swipeable carousel */}
      <div className="relative -mx-5 md:hidden">
        <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" tabIndex={0} aria-label="Photo carousel">
          {images.map((im, i) => (
            <button key={im.id || im.url} onClick={() => setOpen(i)} className="aspect-[4/3] w-full shrink-0 snap-center" aria-label={`Open photo ${i + 1}`}>
              <Img src={im.url} alt={im.caption || `${name} photo ${i + 1}`} name={name} eager={i === 0} className="h-full w-full" />
            </button>
          ))}
        </div>
        <span className="absolute bottom-3 right-4 rounded-full bg-night/70 px-3 py-1 text-xs font-semibold text-white">{cur + 1} / {images.length}</span>
      </div>
      {/* Desktop: grid */}
      <div className={`hidden gap-2 overflow-hidden rounded-xl md:grid ${grid.length > 1 ? 'h-[460px] grid-cols-4 grid-rows-2' : 'h-[460px]'}`}>
        {grid.map((im, i) => (
          <button key={im.id || im.url} onClick={() => setOpen(i)} className={`relative overflow-hidden ${i === 0 && grid.length > 1 ? 'col-span-2 row-span-2' : ''}`} aria-label={`Open photo ${i + 1}`}>
            <Img src={im.url} alt={im.caption || `${name} photo ${i + 1}`} name={name} eager={i === 0} className="h-full w-full" imgClassName="transition-transform duration-500 hover:scale-[1.03]" />
            {i === grid.length - 1 && images.length > grid.length && <span className="absolute inset-0 grid place-items-center bg-night/55 text-sm font-semibold text-white">+{images.length - grid.length} more</span>}
          </button>
        ))}
      </div>
      <AnimatePresence>{open !== null && <Lightbox images={images} index={open} setIndex={setOpen} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  );
}
