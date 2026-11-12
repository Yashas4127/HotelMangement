import { X } from 'lucide-react';

const Group = ({ title, children }) => (<fieldset className="border-b border-line pb-5"><legend className="mb-3 text-sm font-bold">{title}</legend>{children}</fieldset>);

export default function FilterPanel({ f, set, opts, onClear, activeCount }) {
  const toggleFac = (x) => set('fac', f.fac.includes(x) ? f.fac.filter((y) => y !== x) : [...f.fac, x]);
  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between"><h2 className="text-base font-bold">Filters</h2>{activeCount > 0 && <button onClick={onClear} className="inline-flex items-center gap-1 text-xs font-semibold underline"><X size={12} />Clear all</button>}</div>
      {opts.hasStars && <Group title="Star category"><div className="flex flex-wrap gap-2">{[3, 4, 5].map((n) => (
        <button key={n} type="button" aria-pressed={f.stars === String(n)} onClick={() => set('stars', f.stars === String(n) ? '' : String(n))} className={`rounded-full border px-3 py-2 text-xs font-semibold ${f.stars === String(n) ? 'border-night bg-night text-white' : 'border-line bg-paper'}`}>{n}+ star</button>))}</div></Group>}
      <Group title="Contact"><label className="flex min-h-[32px] items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#A58B65]" checked={f.contact} onChange={(e) => set('contact', e.target.checked)} />Phone / WhatsApp available <span className="text-xs text-mute">({opts.contactCount})</span></label></Group>
      <Group title="District"><select className="input" value={f.district} onChange={(e) => set('district', e.target.value)} aria-label="District"><option value="">All districts</option>{opts.districts.map((d) => <option key={d}>{d}</option>)}</select></Group>
      <Group title="City / locality"><select className="input" value={f.city} onChange={(e) => set('city', e.target.value)} aria-label="City"><option value="">All cities</option>{opts.cities.map((d) => <option key={d}>{d}</option>)}</select></Group>
      <Group title="Property type">
        <div className="flex flex-wrap gap-2">{opts.types.map((t) => (
          <button key={t} type="button" aria-pressed={f.type === t} onClick={() => set('type', f.type === t ? '' : t)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${f.type === t ? 'border-night bg-night text-white' : 'border-line bg-paper'}`}>{t}</button>))}</div>
      </Group>
      {opts.facilities.length > 0 && (
        <Group title="Facilities"><div className="grid gap-2">{opts.facilities.map((x) => (
          <label key={x} className="flex min-h-[32px] items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#A58B65]" checked={f.fac.includes(x)} onChange={() => toggleFac(x)} />{x}</label>))}</div></Group>
      )}
      {opts.hasPrices && (
        <Group title="Price per night (₹)"><div className="grid grid-cols-2 gap-2"><input className="input" inputMode="numeric" placeholder="Min" value={f.min} onChange={(e) => set('min', e.target.value)} /><input className="input" inputMode="numeric" placeholder="Max" value={f.max} onChange={(e) => set('max', e.target.value)} /></div></Group>
      )}
      <label className="flex min-h-[40px] items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#A58B65]" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} />Featured properties only</label>
    </div>
  );
}
