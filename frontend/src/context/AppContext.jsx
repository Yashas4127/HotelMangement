import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { destinationFor } from '../services/hotelService.js';
import { api, jsonBody } from '../services/api.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const read = (key, init) => { try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch { /* ignore */ } return init(); };
const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } };

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [favs, setFavs] = useState(() => read('kh_favs_v1', () => []));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const report = useCallback(async (operation) => {
    setError('');
    try {
      return await operation();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request could not be completed.');
      throw reason;
    }
  }, []);

  const loadInventory = useCallback(async (isAdmin) => {
    const [hotelRows, destinationRows] = await Promise.all([
      api(isAdmin ? '/admin/hotels' : '/hotels'),
      api('/destinations'),
    ]);
    setHotels(hotelRows);
    setDestinations(destinationRows);
    if (isAdmin) setEnquiries(await api('/admin/enquiries'));
  }, []);

  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        let session = null;
        try {
          session = await api('/auth/me');
        } catch (reason) {
          if (reason.status !== 401) throw reason;
        }
        if (!active) return;
        setUser(session?.user || null);
        await loadInventory(session?.user?.role === 'admin');
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'The server could not be reached.');
      } finally {
        if (active) setLoading(false);
      }
    };
    start();
    return () => { active = false; };
  }, [loadInventory]);
  useEffect(() => write('kh_favs_v1', favs), [favs]);

  const all = useMemo(() => hotels.map((h) => ({ ...h, destination: destinationFor(h, destinations) })), [hotels, destinations]);
  const published = useMemo(() => all.filter((h) => h.status === 'published'), [all]);
  const destCounts = useMemo(() => {
    const m = {}; published.forEach((h) => { m[h.destination] = (m[h.destination] || 0) + 1; }); return m;
  }, [published]);

  const value = {
    loading, hotels: all, published, destinations, destCounts, enquiries, favs, user,
    admin: user?.role === 'admin', error, clearError: () => setError(''),
    toggleFav: useCallback((id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), []),
    upsertHotel: (hotel) => report(async () => {
      const saved = await api(hotels.some((item) => item.id === hotel.id) ? `/admin/hotels/${encodeURIComponent(hotel.id)}` : '/admin/hotels', {
        method: hotels.some((item) => item.id === hotel.id) ? 'PUT' : 'POST',
        body: jsonBody(hotel),
      });
      setHotels((list) => list.some((item) => item.id === saved.id)
        ? list.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...list]);
      return saved;
    }),
    patchHotel: (id, patch) => report(async () => {
      const current = hotels.find((hotel) => hotel.id === id);
      if (!current) throw new Error('Hotel not found.');
      const saved = await api(`/admin/hotels/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...patch }) });
      setHotels((list) => list.map((hotel) => hotel.id === id ? saved : hotel));
      return saved;
    }),
    deleteHotel: (id) => report(async () => {
      await api(`/admin/hotels/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setHotels((list) => list.filter((hotel) => hotel.id !== id));
    }),
    upsertDestination: (destination) => report(async () => {
      const exists = destinations.some((item) => item.id === destination.id);
      const saved = await api(exists ? `/admin/destinations/${encodeURIComponent(destination.id)}` : '/admin/destinations', {
        method: exists ? 'PUT' : 'POST',
        body: jsonBody(destination),
      });
      setDestinations((list) => list.some((item) => item.id === saved.id)
        ? list.map((item) => item.id === saved.id ? saved : item)
        : [...list, saved]);
      return saved;
    }),
    deleteDestination: (id) => report(async () => {
      await api(`/admin/destinations/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setDestinations((list) => list.filter((destination) => destination.id !== id));
    }),
    addEnquiry: (enquiry) => report(async () => {
      const saved = await api('/enquiries', { method: 'POST', body: jsonBody(enquiry) });
      setEnquiries((list) => [saved, ...list]);
      return saved;
    }),
    setEnquiryStatus: (id, status) => report(async () => {
      const saved = await api(`/admin/enquiries/${encodeURIComponent(id)}`, { method: 'PATCH', body: jsonBody({ status }) });
      setEnquiries((list) => list.map((enquiry) => enquiry.id === id ? { ...enquiry, ...saved } : enquiry));
    }),
    login: (email, password) => report(async () => {
      const { user: signedIn } = await api('/auth/login', { method: 'POST', body: jsonBody({ email, password }) });
      if (signedIn.role !== 'admin') {
        await api('/auth/logout', { method: 'POST' });
        throw new Error('This account does not have administrator access.');
      }
      setUser(signedIn);
      await loadInventory(true);
      return true;
    }),
    signIn: (email, password) => report(async () => {
      const { user: signedIn } = await api('/auth/login', { method: 'POST', body: jsonBody({ email, password }) });
      setUser(signedIn);
      if (signedIn.role === 'admin') await loadInventory(true);
      return signedIn;
    }),
    signUp: (name, email, password, phone) => report(async () => {
      const { user: signedIn } = await api('/auth/register', { method: 'POST', body: jsonBody({ name, email, password, phone }) });
      setUser(signedIn);
      return signedIn;
    }),
    logout: () => report(async () => {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      setEnquiries([]);
      await loadInventory(false);
    }),
    createBooking: (booking) => report(() => api('/bookings', { method: 'POST', body: jsonBody(booking) })),
    loadBookings: () => report(() => api('/bookings/mine')),
    loadAdminBookings: () => report(() => api('/admin/bookings')),
    quoteBooking: (id, amount, note) => report(() => api(`/admin/bookings/${encodeURIComponent(id)}/quote`, {
      method: 'POST', body: jsonBody({ amount, note }),
    })),
    updateBookingStatus: (id, status) => report(() => api(`/admin/bookings/${encodeURIComponent(id)}/status`, {
      method: 'PATCH', body: jsonBody({ status }),
    })),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
