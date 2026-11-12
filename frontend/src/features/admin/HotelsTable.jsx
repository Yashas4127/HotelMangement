import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Star, Trash2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import Img from '../../components/common/Img.jsx';
import Modal from '../../components/common/Modal.jsx';
import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

const PER = 10;
export default function HotelsTable() {
  const { hotels, patchHotel, deleteHotel } = useApp();
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [ver, setVer] = useState(''); const [page, setPage] = useState(1); const [del, setDel] = useState(null);
  useTitle('Manage hotels');
  const list = useMemo(() => hotels.filter((h) => (!q || `${h.name} ${h.city} ${h.district}`.toLowerCase().includes(q.toLowerCase())) && (!status || h.status === status) && (!ver || h.verified === ver)), [hotels, q, status, ver]);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages);
  const rows = list.slice((cur - 1) * PER, cur * PER);
  const ib = 'grid h-9 w-9 place-items-center rounded-md border border-line hover:bg-canvas';
  return (
    <div>
      <PageHead title="Hotels"><Link to="/admin/hotels/add" className="btn-primary">Add hotel</Link></PageHead>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_160px_160px]">
        <input className="input" placeholder="Search name, city, district" aria-label="Search hotels" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className="input" aria-label="Publication status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select>
        <select className="input" aria-label="Verification" value={ver} onChange={(e) => { setVer(e.target.value); setPage(1); }}><option value="">All verification</option><option value="verified">Verified</option><option value="partial">Partial</option><option value="unverified">Unverified</option></select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs text-mute"><tr>{['Photo', 'Hotel', 'Location', 'Type', 'Verification', 'Status', 'Actions'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-3"><Img src={h.images[0]?.url} name={h.name} note=" " className="h-12 w-16 rounded" /></td>
                <td className="px-4 py-3 font-semibold">{h.name}{h.featured && <Star size={13} className="ml-1.5 inline fill-bronze text-bronze" aria-label="Featured" />}</td>
                <td className="px-4 py-3 text-mute">{h.city}, {h.district}</td>
                <td className="px-4 py-3">{h.type}</td>
                <td className="px-4 py-3"><span className="chip capitalize">{h.verified}</span></td>
                <td className="px-4 py-3"><span className={`chip ${h.status === 'published' ? 'border-sage' : ''}`}>{h.status}</span></td>
                <td className="px-4 py-3"><div className="flex gap-1.5">
                  <Link to={`/hotels/${h.slug}`} target="_blank" className={ib} aria-label={`View ${h.name}`}><ExternalLink size={15} /></Link>
                  <Link to={`/admin/hotels/edit/${h.id}`} className={ib} aria-label={`Edit ${h.name}`}><Pencil size={15} /></Link>
                  <button className={ib} onClick={() => patchHotel(h.id, { featured: !h.featured }).catch(() => {})} aria-label={h.featured ? 'Unfeature' : 'Feature'} title={h.featured ? 'Unfeature' : 'Feature'}><Star size={15} className={h.featured ? 'fill-bronze text-bronze' : ''} /></button>
                  <button className={ib} onClick={() => patchHotel(h.id, { status: h.status === 'published' ? 'draft' : 'published' }).catch(() => {})} aria-label={h.status === 'published' ? 'Unpublish' : 'Publish'} title={h.status === 'published' ? 'Unpublish' : 'Publish'}>{h.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                  <button className={`${ib} text-red-700`} onClick={() => setDel(h)} aria-label={`Delete ${h.name}`}><Trash2 size={15} /></button>
                </div></td>
              </tr>))}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-mute">No hotels match.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm"><span className="text-mute">{list.length} results</span>
        <div className="flex items-center gap-2"><button className="btn-ghost" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>Previous</button><span>{cur} / {pages}</span><button className="btn-ghost" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Next</button></div></div>
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete this hotel?">
      <p className="text-sm text-mute">“{del?.name}” and its listing will be permanently deleted.</p>
      <div className="mt-5 flex justify-end gap-3"><button className="btn-ghost" onClick={() => setDel(null)}>Cancel</button><button className="btn bg-red-700 text-white" onClick={async () => { try { await deleteHotel(del.id); setDel(null); } catch { /* The shared error banner reports the failure. */ } }}>Delete</button></div>
      </Modal>
    </div>
  );
}
