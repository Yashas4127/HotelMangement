import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const Ctx = createContext(null);
export const useCompare = () => useContext(Ctx);
export const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [ids, setIds] = useState([]);
  const toggle = useCallback((id) => setIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= MAX_COMPARE ? l : [...l, id])), []);
  const remove = useCallback((id) => setIds((l) => l.filter((x) => x !== id)), []);
  const value = useMemo(() => ({ ids, toggle, remove, clear: () => setIds([]), full: ids.length >= MAX_COMPARE }), [ids, toggle, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
