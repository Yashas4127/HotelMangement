import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { collections } from '../../data/collections.js';
import HotelCard from '../../components/hotel/HotelCard.jsx';
import FilterPanel from '../../components/hotel/FilterPanel.jsx';
import Sheet from '../../components/common/Sheet.jsx';
import TripBar from '../../components/trip/TripBar.jsx';
import { phonesOf } from '../../utils/contact.js';
import { CardSkeleton, Empty } from '../../components/common/Bits.jsx';
import { useTitle } from '../../hooks/useTitle.js';

const uniq = (a) => [...new Set(a.filter(Boolean))].sort((x, y) => x.localeCompare(y));
const priceOf = (h) => (typeof h.rates === 'number' ? h.rates : null);

export function useHotelFilters(list) {
  const [sp, setSp] = useSearchParams();
  const f = {
    q: sp.get('q') || '', dest: sp.get('dest') || '', district: sp.get('district') || '', city: sp.get('city') || '',
    type: sp.get('type') || '', fac: sp.getAll('fac'), featured: sp.get('featured') === '1', sort: sp.get('sort') || 'recommended',
    collection: sp.get('collection') || '', min: sp.get('min') || '', max: sp.get('max') || '',
    contact: sp.get('contact') === '1', stars: sp.get('stars') || '',
  };
  const set = (k, v) => setSp((p) => {
    const n = new URLSearchParams(p); n.delete(k);
    if (Array.isArray(v)) v.forEach((x) => n.append(k, x)); else if (v === true) n.set(k, '1'); else if (v) n.set(k, v);
    return n;
  }, { replace: true });
  const clear = () => setSp(new URLSearchParams(f.sort !== 'recommended' ? { sort: f.sort } : {}), { replace: true });
  const opts = useMemo(() => ({
    districts: uniq(list.map((h) => h.district)), cities: uniq(list.map((h) => h.city)), types: uniq(list.map((h) => h.type)),
    facilities: uniq(list.flatMap((h) => h.facilities)), hasPrices: list.some((h) => priceOf(h) != null), hasStars: list.some((h) => h.stars > 0), contactCount: list.filter((h) => phonesOf(h).length).length,
  }), [list]);
  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const col = collections.find((c) => c.slug === f.collection);
    let r = list.filter((h) => {
      if (q && !`${h.name} ${h.city} ${h.district} ${h.type}`.toLowerCase().includes(q)) return false;
      if (f.dest && h.destination !== f.dest) return false;
      if (f.district && h.district !== f.district) return false;
      if (f.city && h.city !== f.city) return false;
      if (f.type && h.type !== f.type) return false;
      if (f.featured && !h.featured) return false;
      if (f.contact && !phonesOf(h).length) return false;
      if (f.stars && h.stars < +f.stars) return false;
      if (col && !col.test(h)) return false;
      if (f.fac.length && !f.fac.every((x) => h.facilities.includes(x))) return false;
      const p = priceOf(h);
      if ((f.min || f.max) && (p == null || (f.min && p < +f.min) || (f.max && p > +f.max))) return false;
      return true;
    });
    const by = { az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name), low: (a, b) => (priceOf(a) ?? 1e12) - (priceOf(b) ?? 1e12),
      recommended: (a, b) => (phonesOf(b).length > 0) - (phonesOf(a).length > 0) || (b.featured - a.featured) || ((b.images.length > 0) - (a.images.length > 0)) || a.order - b.order };
    return [...r].sort(by[f.sort] || by.recommended);
  }, [list, f.q, f.dest, f.district, f.city, f.type, f.featured, f.collection, f.sort, f.min, f.max, f.contact, f.stars, f.fac.join('|')]); // eslint-disable-line
  const activeCount = ['dest', 'district', 'city', 'type', 'collection', 'min', 'max', 'stars'].filter((k) => f[k]).length + (f.featured ? 1 : 0) + (f.contact ? 1 : 0) + f.fac.length;
  return { f, set, clear, opts, results, activeCount };
}

export default function Explore() {
  const { published, loading, destinations } = useApp();
  const { f, set, clear, opts, results, activeCount } = useHotelFilters(published);
  const [sheet, setSheet] = useState(false);
  const [view, setView] = useState('grid');
  const [sp] = useSearchParams();
  const input = useRef(null);
  useTitle('Explore stays in Karnataka', 'Search and filter hotels, resorts and boutique stays across Karnataka.');
  useEffect(() => { if (sp.get('focus') && input.current) input.current.focus(); }, [sp]);
  const col = collections.find((c) => c.slug === f.collection);

  return (
    <div className="wrap pb-24 pt-8 md:py-12">
      <h1 className="text-3xl font-extrabold md:text-5xl">Explore stays</h1>
      <p className="mt-2 max-w-xl text-sm text-mute md:text-base">{col ? col.blurb : 'Hotels, resorts and boutique stays across Karnataka.'}</p>

      <TripBar className="mt-6 max-w-3xl" />

      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Quick filters">
        {[['Beachfront', () => set('collection', f.collection === 'beach' ? '' : 'beach'), f.collection === 'beach'], ['Hills & coffee', () => set('collection', f.collection === 'mountain' ? '' : 'mountain'), f.collection === 'mountain'], ['Jungle', () => set('collection', f.collection === 'jungle' ? '' : 'jungle'), f.collection === 'jungle'], ['Heritage', () => set('collection', f.collection === 'heritage' ? '' : 'heritage'), f.collection === 'heritage'],
          ['Swimming pool', () => set('fac', f.fac.includes('Swimming pool') ? f.fac.filter((x) => x !== 'Swimming pool') : [...f.fac, 'Swimming pool']), f.fac.includes('Swimming pool')], ['Can call / WhatsApp', () => set('contact', !f.contact), f.contact]].map(([label, on, active]) => (
          <button key={label} type="button" aria-pressed={active} onClick={on} className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold transition ${active ? 'border-night bg-night text-white' : 'border-line bg-paper hover:border-ink/40'}`}>{label}</button>))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_190px]">
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" /><input ref={input} className="input pl-10" placeholder="Search by name, city or district" aria-label="Search stays" value={f.q} onChange={(e) => set('q', e.target.value)} /></div>
        <select className="input" aria-label="Destination" value={f.dest} onChange={(e) => set('dest', e.target.value)}><option value="">All destinations</option>{destinations.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}</select>
        <select className="input" aria-label="Sort" value={f.sort} onChange={(e) => set('sort', e.target.value === 'recommended' ? '' : e.target.value)}>
          <option value="recommended">Recommended</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option>{opts.hasPrices && <option value="low">Price low to high</option>}
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-semibold" aria-live="polite">{loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'property' : 'properties'}`}</p>
        <div className="hidden items-center gap-1 rounded-lg border border-line bg-paper p-1 sm:flex" role="group" aria-label="Layout">
          {[['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']].map(([k, Icon, label]) => <button key={k} type="button" aria-label={label} aria-pressed={view === k} onClick={() => setView(k)} className={`grid h-9 w-9 place-items-center rounded-md ${view === k ? 'bg-night text-white' : 'text-mute'}`}><Icon size={17} /></button>)}
        </div>
        <button className="btn-ghost lg:hidden" onClick={() => setSheet(true)}><SlidersHorizontal size={16} />Filters{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bronze px-1 text-[11px] text-night">{activeCount}</span>}</button>
      </div>

      {activeCount > 0 && <div className="mt-3 flex flex-wrap gap-2">
        {[f.dest && ['dest', destinations.find((d) => d.slug === f.dest)?.name], f.district && ['district', f.district], f.city && ['city', f.city], f.type && ['type', f.type], col && ['collection', col.title], f.featured && ['featured', 'Featured'], f.contact && ['contact', 'Can call / WhatsApp'], f.stars && ['stars', `${f.stars}+ star`]].filter(Boolean).map(([k, v]) => (
          <button key={k} onClick={() => set(k, k === 'featured' || k === 'contact' ? false : '')} className="chip gap-1">{v}<X size={12} aria-label="remove filter" /></button>))}
      </div>}

      <div className="mt-6 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="sticky top-24 hidden h-fit lg:block"><FilterPanel f={f} set={set} opts={opts} onClear={clear} activeCount={activeCount} /></aside>
        <div>
          {loading ? <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
            : results.length === 0 ? published.length === 0
              ? <Empty title="Hotel listings are not seeded yet" text="Connect MongoDB, then run npm run seed from the project directory to import the photo-backed hotel catalogue." />
              : <Empty title="No stays match those filters" text="Try removing a filter or searching a different place."><button className="btn-dark" onClick={clear}>Clear filters</button></Empty>
            : view === 'list' ? <div className="grid gap-4">{results.map((h) => <HotelCard key={h.id} hotel={h} list />)}</div>
            : <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">{results.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>}
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filters" footer={<div className="grid grid-cols-2 gap-3"><button className="btn-ghost" onClick={clear}>Clear</button><button className="btn-primary" onClick={() => setSheet(false)}>Show {results.length}</button></div>}>
        <FilterPanel f={f} set={set} opts={opts} onClear={clear} activeCount={activeCount} />
      </Sheet>
    </div>
  );
}
