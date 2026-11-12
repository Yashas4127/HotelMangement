import { Link } from 'react-router-dom';
import { Logo } from './Navbar.jsx';

export default function Footer() {
  const col = 'flex flex-col gap-2 text-sm text-white/70';
  return (
    <footer className="mt-20 bg-night pb-24 pt-14 text-white md:pb-10">
      <div className="wrap grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-white/70">Discover Karnataka stays and let our team coordinate your booking, check availability and arrange secure payment after your quote is approved.</p>
          <div className="mt-5 flex gap-2" aria-label="Social media placeholders">
            {['Instagram', 'Facebook', 'YouTube'].map((s) => <span key={s} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60" title="Placeholder">{s}</span>)}
          </div>
        </div>
        <div><h3 className="mb-3 text-sm font-bold">Explore</h3><div className={col}><Link to="/hotels">All stays</Link><Link to="/hotels?featured=1">Featured</Link><Link to="/saved">Saved</Link></div></div>
        <div><h3 className="mb-3 text-sm font-bold">Destinations</h3><div className={col}><Link to="/destinations/coorg">Coorg</Link><Link to="/destinations/chikmagalur">Chikmagalur</Link><Link to="/destinations/hampi">Hampi</Link><Link to="/destinations">All destinations</Link></div></div>
        <div><h3 className="mb-3 text-sm font-bold">Company</h3><div className={col}><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/about#privacy">Privacy</Link><Link to="/about#terms">Terms</Link><Link to="/admin/login">Admin</Link></div></div>
      </div>
      <div className="wrap mt-10 border-t border-white/10 pt-6 text-xs text-white/50">© {new Date().getFullYear()} Karnataka Stays. Property photographs belong to their respective properties.</div>
    </footer>
  );
}
