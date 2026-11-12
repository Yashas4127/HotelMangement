import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext(null);
export const useTrip = () => useContext(Ctx);
const KEY = 'kh_trip_v1';
const today = () => new Date().toISOString().slice(0, 10);
const load = () => { try { const t = JSON.parse(localStorage.getItem(KEY)); if (t) return t; } catch { /* ignore */ } return {}; };

export function TripProvider({ children }) {
  const [t, setT] = useState(() => ({ checkIn: '', checkOut: '', adults: 2, children: 0, rooms: 1, ...load() }));
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ } }, [t]);
  const value = useMemo(() => {
    const valid = t.checkIn && t.checkIn >= today() ? t.checkIn : '';
    const out = t.checkOut && valid && t.checkOut > valid ? t.checkOut : '';
    const nights = valid && out ? Math.round((new Date(out) - new Date(valid)) / 864e5) : 0;
    const set = (patch) => setT((s) => {
      const n = { ...s, ...patch };
      if (patch.checkIn && n.checkOut && n.checkOut <= patch.checkIn) { const d = new Date(patch.checkIn); d.setDate(d.getDate() + 1); n.checkOut = d.toISOString().slice(0, 10); }
      return n;
    });
    return { trip: { ...t, checkIn: valid, checkOut: out }, nights, set, today: today(), clear: () => setT((s) => ({ ...s, checkIn: '', checkOut: '' })) };
  }, [t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
