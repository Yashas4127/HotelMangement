import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Field } from '../../components/forms/EnquiryForm.jsx';
import { useTitle } from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';

export function EnquiryPage() {
  const { slug } = useParams();
  const { published, user, addEnquiry } = useApp();
  const hotel = published.find((item) => item.slug === slug);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  useTitle(hotel ? `Enquire about ${hotel.name}` : 'Hotel enquiry');

  if (!hotel) return <div className="wrap py-16"><h1 className="text-2xl font-bold">Hotel not found</h1><Link className="btn-ghost mt-4" to="/hotels">Browse stays</Link></div>;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await addEnquiry({ hotelId: hotel.id, message, phone });
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your enquiry could not be sent.');
    }
  };

  return (
    <div className="wrap max-w-2xl py-10 md:py-14">
      <Link to={`/hotels/${hotel.slug}`} className="text-sm font-semibold underline">Back to {hotel.name}</Link>
      {sent ? (
        <div className="mt-7 rounded-xl border border-line bg-paper p-7 text-center">
          <CheckCircle2 className="mx-auto text-bronze" size={40} />
          <h1 className="mt-3 text-2xl font-extrabold">Enquiry received</h1>
          <p className="mt-2 text-sm text-mute">Our team will follow up using {user.email}. You can track your hotel requests from your account.</p>
          <Link className="btn-dark mt-5" to="/account/bookings">My requests</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border border-line bg-paper p-6">
          <div><h1 className="text-2xl font-extrabold">Ask us about {hotel.name}</h1><p className="mt-1 text-sm text-mute">Your message is sent to our team; we’ll help coordinate with the property.</p></div>
          <p className="rounded-md bg-canvas p-3 text-sm text-mute">Signed in as <b>{user.name}</b> ({user.email})</p>
          <Field id="enquiry-phone" label="Phone (optional)"><input id="enquiry-phone" className="input" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
          <Field id="enquiry-message" label="What would you like to know?"><textarea id="enquiry-message" className="input py-2.5" rows={5} minLength={10} maxLength={2000} required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Travel dates, number of guests, or any questions for our team" /></Field>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn-primary">Send enquiry</button>
        </form>
      )}
    </div>
  );
}

export function BookingPage() {
  const { slug } = useParams();
  const { published, user, createBooking } = useApp();
  const navigate = useNavigate();
  const hotel = published.find((item) => item.slug === slug);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useTitle(hotel ? `Book ${hotel.name}` : 'Request a booking');

  if (!hotel) return <div className="wrap py-16"><h1 className="text-2xl font-bold">Hotel not found</h1><Link className="btn-ghost mt-4" to="/hotels">Browse stays</Link></div>;
  const minDate = new Date().toISOString().slice(0, 10);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createBooking({ hotelId: hotel.id, checkIn, checkOut, guests: Number(guests), rooms: Number(rooms), specialRequests });
      navigate('/account/bookings?created=1');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your booking request could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap max-w-2xl py-10 md:py-14">
      <Link to={`/hotels/${hotel.slug}`} className="text-sm font-semibold underline">Back to {hotel.name}</Link>
      <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border border-line bg-paper p-6">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-bronze">Booking request</p><h1 className="mt-1 text-2xl font-extrabold">Let us arrange your stay</h1><p className="mt-2 text-sm text-mute">We’ll check availability with {hotel.name}, then send you a quote. You pay only after you approve the quote. Your reservation is confirmed after payment and hotel confirmation.</p></div>
        <p className="rounded-md bg-canvas p-3 text-sm text-mute">Guest: <b>{user.name}</b> · {user.email}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="booking-checkin" label="Check-in"><input id="booking-checkin" className="input" type="date" min={minDate} required value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></Field>
          <Field id="booking-checkout" label="Check-out"><input id="booking-checkout" className="input" type="date" min={checkIn || minDate} required value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></Field>
          <Field id="booking-guests" label="Guests"><input id="booking-guests" className="input" type="number" min="1" max="20" required value={guests} onChange={(event) => setGuests(event.target.value)} /></Field>
          <Field id="booking-rooms" label="Rooms"><input id="booking-rooms" className="input" type="number" min="1" max="10" required value={rooms} onChange={(event) => setRooms(event.target.value)} /></Field>
        </div>
        <Field id="booking-requests" label="Special requests (optional)"><textarea id="booking-requests" className="input py-2.5" rows={4} maxLength={2000} value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} placeholder="Anything our booking team should know?" /></Field>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Sending request…' : 'Request this booking'}</button>
      </form>
    </div>
  );
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Razorpay checkout could not be loaded. Please try again.'));
    document.body.appendChild(script);
  });
}

export function MyBookings() {
  const { user, loadBookings } = useApp();
  const [bookings, setBookings] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useTitle('My hotel requests');

  const refresh = async () => setBookings(await loadBookings());
  useEffect(() => {
    refresh().catch((reason) => setError(reason instanceof Error ? reason.message : 'Bookings could not be loaded.')).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const pay = async (booking) => {
    setBusyId(booking.id);
    setError('');
    try {
      await loadRazorpay();
      const order = await api(`/bookings/${encodeURIComponent(booking.id)}/payment-order`, { method: 'POST' });
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Karnataka Stays',
        description: `${booking.hotelName} booking`,
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email },
        handler: async (result) => {
          try {
            await api(`/bookings/${encodeURIComponent(booking.id)}/verify-payment`, { method: 'POST', body: JSON.stringify(result) });
            await refresh();
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Payment verification failed. Contact the booking team before paying again.');
          } finally {
            setBusyId('');
          }
        },
        modal: { ondismiss: () => setBusyId('') },
      });
      checkout.open();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Payment could not be started.');
      setBusyId('');
    }
  };

  const label = { requested: 'Availability check in progress', quoted: 'Quote ready', payment_pending: 'Payment in progress', paid: 'Paid · awaiting hotel confirmation', confirmed: 'Booking confirmed', declined: 'Request declined' };
  return (
    <div className="wrap max-w-4xl py-10 md:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-bronze">Your account</p>
      <h1 className="mt-1 text-3xl font-extrabold">My hotel requests</h1>
      <p className="mt-2 text-sm text-mute">Bookings and enquiries are private to your account.</p>
      {new URLSearchParams(window.location.search).has('created') && <p className="mt-4 rounded-md bg-sage/20 p-3 text-sm">Your booking request is with our team. We’ll confirm availability and add a quote here.</p>}
      {error && <p className="err mt-4" role="alert">{error}</p>}
      {loading ? <p className="mt-8 text-sm text-mute">Loading your requests…</p> : bookings.length === 0 ? (
        <div className="mt-7 rounded-lg border border-line bg-paper p-7 text-sm text-mute">You have no booking requests yet. <Link className="font-semibold underline" to="/hotels">Explore stays</Link>.</div>
      ) : (
        <div className="mt-6 grid gap-4">{bookings.map((booking) => (
          <article key={booking.id} className="rounded-xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>              <Link to={`/hotels/${booking.hotelSlug || booking.hotelId}`} className="text-lg font-bold underline">{booking.hotelName}</Link><p className="mt-1 text-sm text-mute">{booking.checkIn} to {booking.checkOut} · {booking.guests} guests · {booking.rooms} room{booking.rooms > 1 ? 's' : ''}</p></div>
              <span className="chip capitalize">{label[booking.status] || booking.status}</span>
            </div>
            {booking.specialRequests && <p className="mt-3 text-sm text-mute">{booking.specialRequests}</p>}
            {booking.quotedAmount > 0 && <div className="mt-4 border-t border-line pt-4"><p className="font-bold">Quote: ₹{Number(booking.quotedAmount).toLocaleString('en-IN')} {booking.currency || 'INR'}</p>{booking.quoteNote && <p className="mt-1 text-sm text-mute">{booking.quoteNote}</p>}{['quoted', 'payment_pending'].includes(booking.status) && <button className="btn-primary mt-3" disabled={busyId === booking.id} onClick={() => pay(booking)}>{busyId === booking.id ? 'Opening secure checkout…' : 'Pay this quote'}</button>}</div>}
            {booking.status === 'paid' && <p className="mt-3 text-sm text-mute">Payment received. Our team is confirming your reservation with the property.</p>}
          </article>
        ))}</div>
      )}
    </div>
  );
}
