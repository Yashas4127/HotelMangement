import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../context/AppContext.jsx';
import { cn } from '../../utils/cn.js';

const links = [['/', 'Home'], ['/hotels', 'Explore'], ['/destinations', 'Destinations'], ['/about', 'About'], ['/contact', 'Contact']];
export const Logo = ({ light }) => (
  <Link to="/" className={cn('font-display text-2xl font-bold leading-none tracking-tight', light ? 'text-white' : 'text-ink')} aria-label="Karnataka Stays home">
    Karnataka<span className="text-bronze"> Stays</span>
  </Link>
);

export default function Navbar() {
  const { favs, user, logout } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const home = pathname === '/';
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 40);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const overlay = home && !solid;
  const accountPath = user?.role === 'admin' ? '/admin' : '/account/bookings';
  const signOut = async () => {
    try {
      await logout();
      setOpen(false);
      navigate('/');
    } catch {
      // The shared error banner reports the server failure.
    }
  };
  return (
    <header className={cn('sticky top-0 z-50 transition-colors', overlay ? 'bg-night/40 text-white backdrop-blur-sm' : 'border-b border-line bg-canvas/95 text-ink backdrop-blur')}>
      <div className="wrap flex h-14 items-center justify-between md:h-[72px]">
        <Logo light={overlay} />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('text-sm font-semibold transition-colors', isActive ? 'underline decoration-bronze decoration-2 underline-offset-[10px]' : 'opacity-80 hover:opacity-100')}>{label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link to="/hotels?focus=1" aria-label="Search stays" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"><Search size={20} /></Link>
          <Link to="/saved" aria-label={`Saved properties (${favs.length})`} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-white/10">
            <Heart size={20} />{favs.length > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-bronze px-1 text-[10px] font-bold text-night">{favs.length}</span>}
          </Link>
          {user ? <><Link to={accountPath} className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/10 md:inline">{user.role === 'admin' ? 'Admin' : 'My bookings'}</Link><button type="button" onClick={signOut} className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/10 md:inline">Sign out</button></> : <Link to="/login" className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/10 md:inline">Sign in</Link>}
          <button className="grid h-11 w-11 place-items-center rounded-full md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] bg-night text-white md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Menu">
            <div className="wrap flex h-14 items-center justify-between"><Logo light /><button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-11 w-11 place-items-center"><X size={24} /></button></div>
            <nav className="wrap mt-8 flex flex-col gap-1" aria-label="Mobile">
              {links.map(([to, label]) => <Link key={to} to={to} className="border-b border-white/10 py-4 font-display text-4xl font-semibold">{label}</Link>)}
              <Link to="/saved" className="py-4 font-display text-4xl font-semibold">Saved</Link>
              {user ? <><Link to={accountPath} className="py-4 font-display text-4xl font-semibold">{user.role === 'admin' ? 'Admin' : 'My bookings'}</Link><button type="button" onClick={signOut} className="py-4 text-left font-display text-4xl font-semibold">Sign out</button></> : <Link to="/login" className="py-4 font-display text-4xl font-semibold">Sign in</Link>}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
