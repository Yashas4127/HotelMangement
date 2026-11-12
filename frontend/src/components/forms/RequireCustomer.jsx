import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';

export default function RequireCustomer() {
  const { user, loading } = useApp();
  const location = useLocation();
  if (loading) return <div className="wrap grid min-h-[50vh] place-items-center text-sm text-mute">Loading account…</div>;
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
