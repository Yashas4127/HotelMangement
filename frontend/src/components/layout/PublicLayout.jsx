import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import BottomNav from './BottomNav.jsx';
import CompareBar from '../hotel/CompareBar.jsx';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const detail = matchPath('/hotels/:slug', pathname);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-bronze focus:px-3 focus:py-2">Skip to content</a>
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main id="main" key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      {!detail && <BottomNav />}
      <CompareBar />
    </div>
  );
}
