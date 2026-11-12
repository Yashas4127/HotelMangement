import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function AdminSettings() {
  useTitle('Settings');
  return (
    <div className="max-w-2xl">
      <PageHead title="Settings" />
      <div className="rounded-lg border border-line bg-paper p-6 text-sm leading-relaxed">
        <h2 className="text-base font-extrabold">Production data and payments</h2>
        <p className="mt-2 text-mute">Hotel listings, enquiries, booking requests, quotes, and customer accounts are stored in MongoDB. Admin and customer sessions use server-issued, HTTP-only cookies. Configure the MongoDB and admin environment variables before starting the API.</p>
        <p className="mt-3 text-mute">Razorpay payments are enabled only when the server has valid test or live credentials. Availability is checked by the admin before a quote is sent; only a paid request can be marked confirmed.</p>
        <p className="mt-3 text-mute">Use <code>npm run seed</code> to import the original hotel and destination data. Only hotels with photo URLs are included in the public catalogue.</p>
      </div>
    </div>
  );
}
