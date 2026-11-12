import { useState } from 'react';
import { cn, initials } from '../../utils/cn.js';

export function Placeholder({ name = '', className, note = 'Official photo not added yet' }) {
  return (
    <div className={cn('relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#E9EAE3] text-center', className)} role="img" aria-label={`${name}: ${note}`}>
      <svg className="absolute inset-0 h-full w-full opacity-60" aria-hidden="true"><defs><pattern id="ph" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="28" stroke="#D6D8CC" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#ph)" /></svg>
      <span className="relative font-display text-5xl font-semibold text-night/70">{initials(name) || 'KS'}</span>
      <span className="relative mt-2 px-4 text-[11px] font-medium text-mute">{note}</span>
    </div>
  );
}

export default function Img({ src, alt = '', name, className, imgClassName, eager = false, note }) {
  const [state, setState] = useState('loading');
  if (!src || state === 'error') return <Placeholder name={name || alt} className={className} note={note} />;
  return (
    <div className={cn('relative overflow-hidden bg-[#E9EAE3]', className)}>
      <img
        src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer"
        onLoad={() => setState('ok')} onError={() => setState('error')}
        className={cn('h-full w-full object-cover transition-opacity duration-500', state === 'ok' ? 'opacity-100' : 'opacity-0', imgClassName)}
      />
      {state === 'loading' && <div className="skeleton absolute inset-0" />}
    </div>
  );
}
