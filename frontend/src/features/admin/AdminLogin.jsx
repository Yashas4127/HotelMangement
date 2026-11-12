import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function AdminLogin() {
  const { admin, login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useTitle('Admin login');
  if (admin) return <Navigate to="/admin" replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(email, p); nav('/admin'); }
    catch (reason) { setErr(reason instanceof Error ? reason.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-night p-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-paper p-7">
        <Link to="/" className="font-display text-2xl font-bold">Karnataka <span className="text-bronze">Stays</span></Link>
        <h1 className="mt-5 text-xl font-extrabold">Admin sign in</h1>
        <div className="mt-5 grid gap-4">
          <div><label htmlFor="u" className="label">Admin email</label><input id="u" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></div>
          <div><label htmlFor="p" className="label">Password</label><input id="p" type="password" className="input" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required /></div>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </div>
        <p className="mt-5 rounded-md bg-canvas p-3 text-xs text-mute">Admin credentials are created from <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> when you run the database seed command. <Link className="underline" to="/">Return to the public site</Link>.</p>
      </form>
    </div>
  );
}
