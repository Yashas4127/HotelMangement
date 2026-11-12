import { useEffect, useState } from 'react';
const KEY = 'kh_recent_v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
export const trackRecent = (id) => { try { localStorage.setItem(KEY, JSON.stringify([id, ...read().filter((x) => x !== id)].slice(0, 8))); } catch { /* ignore */ } };
export function useRecent() { const [ids, setIds] = useState([]); useEffect(() => setIds(read()), []); return ids; }
