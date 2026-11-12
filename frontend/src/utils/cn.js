import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...a) => twMerge(clsx(a));
export { slugify } from './slug.js';
export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
export const initials = (n = '') => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
