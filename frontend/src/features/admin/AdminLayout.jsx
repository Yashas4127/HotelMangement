import { useState } from 'react';
import { Navigate, NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { Building2, CalendarDays, ImageIcon, Inbox, LayoutDashboard, LogOut, MapPin, Menu, Plus, Settings, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { cn } from '../../utils/cn.js';

const nav = [['/admin', 'Overview', LayoutDashboard, true], ['/admin/hotels', 'Hotels', Building2], ['/admin/hotels/add', 'Add Hotel', Plus], ['/admin/destinations', 'Destinations', MapPin], ['/admin/images', 'Images', ImageIcon], ['/admin/enquiries', 'Enquiries', Inbox], ['/admin/bookings', 'Bookings', CalendarDays], ['/admin/settings', 'Settings', Settings]];

export default function AdminLayout() {
  const { admin, logout, loading } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-mute">Checking administrator access…</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  const side = (
    <div className="flex h-full flex-col bg-night text-white">
      <div className="flex h-16 items-center justify-between px-5"><Link to="/admin" className="font-display text-2xl font-bold">Stays <span className="text-bronze">Admin</span></Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Admin">
        {nav.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end || to === '/admin/hotels'} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-semibold', isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5')}><Icon size={18} />{label}</NavLink>
        ))}
      </nav>
      <div className="space-y-1 p-3"><Link to="/" className="flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm text-white/65 hover:bg-white/5">View public site</Link>
        <button onClick={async () => { try { await logout(); navigate('/admin/login'); } catch { /* The shared error banner reports the server failure. */ } }} className="flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-white/65 hover:bg-white/5"><LogOut size={18} />Logout</button></div>
    </div>
  );
  return (
    <div className="min-h-screen bg-canvas lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{side}</aside>
      {open && <div className="fixed inset-0 z-[60] lg:hidden"><div className="absolute inset-0 bg-night/60" onClick={() => setOpen(false)} /><div className="absolute inset-y-0 left-0 w-72">{side}</div></div>}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper px-4 lg:hidden"><button onClick={() => setOpen(true)} aria-label="Open admin menu" className="grid h-10 w-10 place-items-center"><Menu /></button><span className="font-bold">Admin</span></header>
      <main className="mx-auto max-w-[1200px] p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
