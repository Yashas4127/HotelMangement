import { NavLink } from 'react-router-dom';
import { Compass, Heart, Home, User } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { useApp } from '../../context/AppContext.jsx';

export default function BottomNav() {
  const { user } = useApp();
  const items = [['/', 'Home', Home], ['/hotels', 'Explore', Compass], ['/saved', 'Saved', Heart], [user ? (user.role === 'admin' ? '/admin' : '/account/bookings') : '/login', user ? (user.role === 'admin' ? 'Admin' : 'Account') : 'Sign in', User]];
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur md:hidden" aria-label="Bottom">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(([to, label, Icon]) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'} className={({ isActive }) => cn('flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold', isActive ? 'text-ink' : 'text-mute')}>
              {({ isActive }) => (<><Icon size={21} strokeWidth={isActive ? 2.4 : 1.8} /><span className={cn('border-b-2 pb-px', isActive ? 'border-bronze' : 'border-transparent')}>{label}</span></>)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
