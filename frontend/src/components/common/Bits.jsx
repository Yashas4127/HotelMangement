import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const SectionHead = ({ title, sub, action, to, className }) => (
  <div className={cn('mb-6 flex items-end justify-between gap-4 md:mb-8', className)}>
    <div className="max-w-xl">
      <h2 className="text-2xl font-extrabold leading-tight md:text-4xl">{title}</h2>
      {sub && <p className="mt-2 text-sm text-mute md:text-base">{sub}</p>}
    </div>
    {to && <Link to={to} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-ink underline decoration-bronze decoration-2 underline-offset-4 sm:inline-flex">{action || 'View all'}<ArrowUpRight size={16} /></Link>}
  </div>
);
export const Empty = ({ title, text, children }) => (
  <div className="rounded-xl border border-dashed border-line bg-paper px-6 py-14 text-center">
    <h3 className="text-lg font-bold">{title}</h3>
    {text && <p className="mx-auto mt-2 max-w-md text-sm text-mute">{text}</p>}
    <div className="mt-5">{children}</div>
  </div>
);
export const CardSkeleton = () => (
  <div><div className="skeleton aspect-[4/3] rounded-lg" /><div className="skeleton mt-3 h-4 w-2/3 rounded" /><div className="skeleton mt-2 h-3 w-1/2 rounded" /></div>
);
