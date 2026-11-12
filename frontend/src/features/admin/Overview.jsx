import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export const PageHead = ({ title, children }) => (<div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1><div className="flex gap-2">{children}</div></div>);

export default function Overview() {
  const { hotels, destinations, enquiries } = useApp();
  useTitle('Admin overview');
  const stats = [['Total properties', hotels.length], ['Published', hotels.filter((h) => h.status === 'published').length], ['Draft', hotels.filter((h) => h.status === 'draft').length], ['Featured', hotels.filter((h) => h.featured).length], ['Destinations', destinations.length], ['Total enquiries', enquiries.length]];
  const noPhoto = hotels.filter((h) => !h.images.length).length;
  return (
    <div>
      <PageHead title="Overview"><Link to="/admin/hotels/add" className="btn-primary">Add hotel</Link></PageHead>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(([k, v]) => <div key={k} className="rounded-lg border border-line bg-paper p-5"><p className="text-xs font-semibold text-mute">{k}</p><p className="mt-1 font-heading text-4xl font-extrabold">{v}</p></div>)}
      </div>
      <div className="mt-6 rounded-lg border border-line bg-paper p-5 text-sm">
        <p><b>{noPhoto}</b> of {hotels.length} properties have no stored photograph. They show a live-found official-site image where available. Run <code className="rounded bg-canvas px-1">npm run fetch-images</code> to collect more, or add image URLs under Images.</p>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Latest enquiries</h2>
      <div className="divide-y divide-line rounded-lg border border-line bg-paper">{enquiries.slice(0, 4).map((e) => <div key={e.id} className="flex items-center justify-between gap-3 p-4 text-sm"><div className="min-w-0"><p className="font-semibold">{e.name}</p><p className="truncate text-mute">{e.message}</p></div><span className="chip capitalize">{e.status}</span></div>)}</div>
    </div>
  );
}
