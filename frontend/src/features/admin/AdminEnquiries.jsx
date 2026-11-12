import { useApp } from '../../context/AppContext.jsx';
import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function AdminEnquiries() {
  const { enquiries, setEnquiryStatus } = useApp();
  useTitle('Enquiries');
  return (
    <div>
      <PageHead title="Enquiries" />
      <p className="mb-4 text-xs text-mute">Guests must be signed in to send an enquiry. New enquiries are stored in MongoDB and appear here for the admin team.</p>
      <div className="overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs text-mute"><tr>{['Guest', 'Contact', 'Property', 'Message', 'Date', 'Status'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line align-top">
            {enquiries.map((e) => (<tr key={e.id}>
              <td className="px-4 py-3 font-semibold">{e.name}</td>
              <td className="px-4 py-3 text-mute"><div>{e.email}</div><div>{e.phone}</div></td>
              <td className="px-4 py-3">{e.hotelName}</td><td className="max-w-[260px] px-4 py-3 text-mute">{e.message}</td><td className="whitespace-nowrap px-4 py-3">{e.date}</td>
              <td className="px-4 py-3"><select className="input min-h-[36px] py-1 capitalize" aria-label={`Status for ${e.name}`} value={e.status} onChange={(ev) => setEnquiryStatus(e.id, ev.target.value).catch(() => {})}><option value="new">New</option><option value="contacted">Contacted</option><option value="resolved">Resolved</option></select></td>
            </tr>))}
            {!enquiries.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-mute">No enquiries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
