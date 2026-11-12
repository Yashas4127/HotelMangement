import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Minus, Plus, Users, X } from 'lucide-react';
import { useTrip } from '../../context/TripContext.jsx';
import { cn } from '../../utils/cn.js';

const Step = ({ label, sub, value, min, max, onChange }) => (
  <div className="flex items-center justify-between py-2.5">
    <div><p className="text-sm font-semibold">{label}</p>{sub && <p className="text-xs text-mute">{sub}</p>}</div>
    <div className="flex items-center gap-3">
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-8 w-8 place-items-center rounded-full border border-line disabled:opacity-30"><Minus size={14} /></button>
      <span className="w-5 text-center text-sm font-bold" aria-live="polite">{value}</span>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-line disabled:opacity-30"><Plus size={14} /></button>
    </div>
  </div>
);

export function guestsLabel(t) {
  const g = t.adults + t.children;
  return `${g} guest${g > 1 ? 's' : ''}${t.rooms > 1 ? ` · ${t.rooms} rooms` : ''}`;
}

// Dates + guests. Lives on the Explore and hotel pages (not the home hero) so the home page stays clean.
export default function TripBar({ className, stacked }) {
  const { trip, nights, set, today, clear } = useTrip();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const cell = 'flex min-h-[56px] flex-1 items-center gap-3 px-4 py-2';
  const lab = 'block text-[11px] font-semibold text-mute';
  const inp = 'w-full bg-transparent text-sm font-semibold focus:outline-none';
  return (
    <div className={cn('rounded-xl border border-line bg-paper', className)} role="group" aria-label="Trip details">
      <div className={cn('flex divide-line', stacked ? 'flex-col divide-y' : 'flex-col divide-y md:flex-row md:divide-x md:divide-y-0')}>
        <label className={cell}><CalendarDays size={18} className="shrink-0 text-bronze" /><span className="flex-1"><span className={lab}>Check-in</span><input type="date" min={today} value={trip.checkIn} onChange={(e) => set({ checkIn: e.target.value })} className={inp} /></span></label>
        <label className={cell}><CalendarDays size={18} className="shrink-0 text-bronze" /><span className="flex-1"><span className={lab}>Check-out{nights > 0 && <span className="ml-1 font-bold text-ink">· {nights} night{nights > 1 ? 's' : ''}</span>}</span><input type="date" min={trip.checkIn || today} value={trip.checkOut} onChange={(e) => set({ checkOut: e.target.value })} className={inp} /></span></label>
        <div className="relative flex-1" ref={ref}>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn(cell, 'w-full text-left')}>
            <Users size={18} className="shrink-0 text-bronze" /><span className="flex-1"><span className={lab}>Guests</span><span className="block text-sm font-semibold">{guestsLabel(trip)}</span></span>
          </button>
          {open && (
            <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-line bg-paper p-4 shadow-xl">
              <div className="divide-y divide-line">
                <Step label="Adults" sub="Age 13+" value={trip.adults} min={1} max={12} onChange={(v) => set({ adults: v })} />
                <Step label="Children" sub="Age 0–12" value={trip.children} min={0} max={8} onChange={(v) => set({ children: v })} />
                <Step label="Rooms" value={trip.rooms} min={1} max={6} onChange={(v) => set({ rooms: v })} />
              </div>
              <button type="button" className="btn-dark mt-3 w-full" onClick={() => setOpen(false)}>Done</button>
            </div>
          )}
        </div>
        {(trip.checkIn || trip.checkOut) && <button type="button" onClick={clear} aria-label="Clear dates" className="grid min-h-[44px] place-items-center px-4 text-mute hover:text-ink"><X size={16} /></button>}
      </div>
    </div>
  );
}
