import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { useTitle } from '../../hooks/useTitle.js';

function safeNext(value) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/account/bookings';
}

export default function AuthPage() {
  const { user, signIn, signUp } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const register = params.get('mode') === 'register';
  const next = safeNext(params.get('next'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useTitle(register ? 'Create your account' : 'Sign in');

  if (user) return <Navigate to={next} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (register) await signUp(name, email, password, phone);
      else await signIn(email, password);
      navigate(next, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap grid min-h-[65vh] max-w-lg place-items-center py-12">
      <form onSubmit={submit} className="w-full rounded-xl border border-line bg-paper p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-bronze">Karnataka Stays</p>
        <h1 className="mt-2 text-2xl font-extrabold">{register ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm text-mute">Browsing is open to everyone. Sign in only when you want to send an enquiry or request a booking.</p>
        <div className="mt-6 grid gap-4">
          {register && <div><label className="label" htmlFor="account-name">Full name</label><input id="account-name" className="input" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></div>}
          <div><label className="label" htmlFor="account-email">Email</label><input id="account-email" className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          {register && <div><label className="label" htmlFor="account-phone">Phone (optional)</label><input id="account-phone" className="input" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>}
          <div><label className="label" htmlFor="account-password">Password</label><input id="account-password" className="input" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 10 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />{register && <p className="mt-1 text-xs text-mute">Use at least 10 characters.</p>}</div>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
        </div>
        <p className="mt-5 text-sm text-mute">
          {register ? 'Already have an account?' : 'New to Karnataka Stays?'}{' '}
          <Link className="font-semibold underline" to={`${register ? '/login' : '/login?mode=register'}${params.get('next') ? `${register ? '?' : '&'}next=${encodeURIComponent(params.get('next'))}` : ''}`}>{register ? 'Sign in' : 'Create an account'}</Link>
        </p>
      </form>
    </div>
  );
}
