import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';

export function validateEnquiry(f) {
  const e = {};
  if (f.phone.trim() && !/^[+\d][\d\s-]{6,17}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (f.message.trim().length < 10) e.message = 'Message should be at least 10 characters.';
  return e;
}

export const Field = ({ id, label, err, children }) => (<div><label htmlFor={id} className="label">{label}</label>{children}{err && <p className="err" role="alert">{err}</p>}</div>);

export default function EnquiryForm({ hotel, hotels, onDone }) {
  const { addEnquiry, user } = useApp();
  const location = useLocation();
  const [f, setF] = useState({ phone: '', message: '', hotelId: hotel?.id || '' });
  const [errs, setErrs] = useState({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const er = validateEnquiry(f); setErrs(er); setError('');
    if (Object.keys(er).length) return;
    const h = hotel || hotels?.find((x) => x.id === f.hotelId);
    try {
      await addEnquiry({ phone: f.phone.trim(), message: f.message.trim(), hotelId: h?.id || '' });
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your enquiry could not be sent.');
    }
  };
  if (!user) return <p className="text-sm text-mute">Please <Link className="font-semibold underline" to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}>sign in</Link> before sending an enquiry.</p>;
  if (sent) return (
    <div className="py-8 text-center" role="status">
      <CheckCircle2 className="mx-auto text-bronze" size={40} />
      <h3 className="mt-3 text-lg font-bold">Enquiry received</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-mute">Our team will follow up using {user.email}.</p>
      {onDone && <button className="btn-ghost mt-5" onClick={onDone}>Close</button>}
    </div>
  );
  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {hotels && !hotel && (
        <Field id="hotel" label="Property (optional)">
          <select id="hotel" className="input" value={f.hotelId} onChange={set('hotelId')}><option value="">General enquiry</option>{hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
        </Field>
      )}
      <p className="rounded-md bg-canvas p-3 text-sm text-mute">Signed in as <b>{user.name}</b> ({user.email})</p>
      <Field id="phone" label="Phone (optional)" err={errs.phone}><input id="phone" type="tel" className="input" value={f.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" aria-invalid={!!errs.phone} /></Field>
      <Field id="message" label="Message" err={errs.message}><textarea id="message" rows={4} className="input py-2.5" value={f.message} onChange={set('message')} aria-invalid={!!errs.message} placeholder="Dates, number of guests, anything you'd like to know" /></Field>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn-primary">Send enquiry</button>
    </form>
  );
}
