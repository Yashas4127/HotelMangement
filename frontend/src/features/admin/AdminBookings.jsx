import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function AdminBookings() {
  const { loadAdminBookings, quoteBooking, updateBookingStatus } = useApp();
  const [bookings, setBookings] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  useTitle('Manage bookings');

  const refresh = async () => {
    const rows = await loadAdminBookings();
    setBookings(rows);
    setQuotes((current) => Object.fromEntries(rows.map((booking) => [
      booking.id,
      current[booking.id] || { amount: booking.quotedAmount || '', note: booking.quoteNote || '' },
    ])));
  };

  useEffect(() => {
    refresh()
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Bookings could not be loaded.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const sendQuote = async (event, booking) => {
    event.preventDefault();
    setError('');
    setBusy(booking.id);
    try {
      const quote = quotes[booking.id] || {};
      await quoteBooking(booking.id, Number(quote.amount), quote.note || '');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The quote could not be saved.');
    } finally {
      setBusy('');
    }
  };

  const setStatus = async (booking, status) => {
    setError('');
    setBusy(booking.id);
    try {
      await updateBookingStatus(booking.id, status);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The booking status could not be updated.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div>
      <PageHead title="Bookings" />
      <p className="mb-5 text-sm text-mute">Check availability with the property first, send the guest a final quote, and confirm only after payment and hotel confirmation.</p>
      {error && <p className="err mb-4" role="alert">{error}</p>}
      {loading ? <p className="text-sm text-mute">Loading booking requests…</p> : bookings.length === 0 ? (
        <p className="rounded-lg border border-line bg-paper p-8 text-center text-sm text-mute">No booking requests yet.</p>
      ) : (
        <div className="grid gap-4">{bookings.map((booking) => {
          const quote = quotes[booking.id] || { amount: '', note: '' };
          return (
            <article key={booking.id} className="rounded-lg border border-line bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{booking.hotelName}</h2>
                  <p className="mt-1 text-sm">{booking.guest?.name} · <a className="underline" href={`mailto:${booking.guest?.email}`}>{booking.guest?.email}</a>{booking.guest?.phone && <> · <a className="underline" href={`tel:${booking.guest.phone}`}>{booking.guest.phone}</a></>}</p>
                  <p className="mt-1 text-sm text-mute">{booking.checkIn} to {booking.checkOut} · {booking.guests} guests · {booking.rooms} room{booking.rooms > 1 ? 's' : ''}</p>
                  {booking.specialRequests && <p className="mt-2 text-sm text-mute">Request: {booking.specialRequests}</p>}
                  {booking.paymentId && <p className="mt-2 text-xs text-mute">Payment reference: {booking.paymentId}</p>}
                </div>
                <span className="chip capitalize">{booking.status.replace('_', ' ')}</span>
              </div>
              {['requested', 'quoted'].includes(booking.status) && (
                <form onSubmit={(event) => sendQuote(event, booking)} className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-[180px_1fr_auto]">
                  <label className="text-xs font-semibold">Total quote (₹)<input className="input mt-1" type="number" min="1" step="0.01" required value={quote.amount} onChange={(event) => setQuotes((current) => ({ ...current, [booking.id]: { ...quote, amount: event.target.value } }))} /></label>
                  <label className="text-xs font-semibold">Message for guest<input className="input mt-1" maxLength={1000} value={quote.note} onChange={(event) => setQuotes((current) => ({ ...current, [booking.id]: { ...quote, note: event.target.value } }))} placeholder="What the quote includes or any conditions" /></label>
                  <button className="btn-primary self-end" disabled={busy === booking.id}>{booking.status === 'quoted' ? 'Update quote' : 'Send quote'}</button>
                </form>
              )}
              {booking.status === 'paid' && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><p className="text-sm font-semibold">Paid ₹{Number(booking.quotedAmount).toLocaleString('en-IN')} · confirm the reservation with the hotel.</p><button className="btn-primary" disabled={busy === booking.id} onClick={() => setStatus(booking, 'confirmed')}>Confirm booking</button></div>}
              {booking.status === 'confirmed' && <p className="mt-4 border-t border-line pt-4 text-sm text-sage">Confirmed. The guest has paid and the hotel reservation is confirmed.</p>}
              {booking.status === 'declined' && <p className="mt-4 border-t border-line pt-4 text-sm text-mute">Declined before payment. Please contact the guest to explain next steps.</p>}
            </article>
          );
        })}</div>
      )}
    </div>
  );
}
