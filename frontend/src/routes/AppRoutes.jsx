import { lazy, Suspense } from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout.jsx';
import RequireCustomer from '../components/forms/RequireCustomer.jsx';
import Home from '../features/home/Home.jsx';
import { Empty } from '../components/common/Bits.jsx';
import AuthPage from '../features/auth/AuthPage.jsx';
import { BookingPage, EnquiryPage, MyBookings } from '../features/hotels/HotelActions.jsx';
import SupportWidget from '../components/support/SupportWidget.jsx';
import { SITE } from '../config/site.js';

const Explore = lazy(() => import('../features/hotels/Explore.jsx'));
const HotelDetail = lazy(() => import('../features/hotels/HotelDetail.jsx'));
const Destinations = lazy(() => import('../features/destinations/Destinations.jsx'));
const DestinationDetail = lazy(() => import('../features/destinations/DestinationDetail.jsx'));
const About = lazy(() => import('../features/about/About.jsx'));
const Contact = lazy(() => import('../features/contact/Contact.jsx'));
const Saved = lazy(() => import('../features/saved/Saved.jsx'));
const AdminLayout = lazy(() => import('../features/admin/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('../features/admin/AdminLogin.jsx'));
const Overview = lazy(() => import('../features/admin/Overview.jsx'));
const HotelsTable = lazy(() => import('../features/admin/HotelsTable.jsx'));
const HotelForm = lazy(() => import('../features/admin/HotelForm.jsx'));
const AdminImages = lazy(() => import('../features/admin/AdminImages.jsx'));
const AdminDestinations = lazy(() => import('../features/admin/AdminDestinations.jsx'));
const AdminEnquiries = lazy(() => import('../features/admin/AdminEnquiries.jsx'));
const AdminSettings = lazy(() => import('../features/admin/AdminSettings.jsx'));
const AdminBookings = lazy(() => import('../features/admin/AdminBookings.jsx'));

const NotFound = () => <div className="wrap py-20"><Empty title="Page not found"><Link to="/" className="btn-dark">Back home</Link></Empty></div>;

export default function AppRoutes() {
  const { pathname } = useLocation();
  const showSupportWidget = !pathname.startsWith('/admin') || SITE.adminSupportWidgetVisible;

  return (
    <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-sm text-mute">Loading…</div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="hotels" element={<Explore />} />
          <Route path="hotels/:slug" element={<HotelDetail />} />
          <Route path="destinations" element={<Destinations />} />
          <Route path="destinations/:slug" element={<DestinationDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="saved" element={<Saved />} />
          <Route path="login" element={<AuthPage />} />
          <Route element={<RequireCustomer />}>
            <Route path="enquire/:slug" element={<EnquiryPage />} />
            <Route path="book/:slug" element={<BookingPage />} />
            <Route path="account/bookings" element={<MyBookings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="hotels" element={<HotelsTable />} />
          <Route path="hotels/add" element={<HotelForm key="add" />} />
          <Route path="hotels/edit/:id" element={<HotelForm />} />
          <Route path="images" element={<AdminImages />} />
          <Route path="destinations" element={<AdminDestinations />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      {showSupportWidget && <SupportWidget />}
    </Suspense>
  );
}
