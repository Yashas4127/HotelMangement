import { useMemo, useState } from 'react';
import { Trash2, BadgeCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import Img from '../../components/common/Img.jsx';
import { Field } from '../../components/forms/EnquiryForm.jsx';
import { uid } from '../../utils/cn.js';
import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

const urlOk = (v) => { try { return /^https?:$/.test(new URL(v).protocol); } catch { return false; } };
export default function AdminImages() {
  const { hotels, patchHotel } = useApp();
  const [sel, setSel] = useState('');
  const [f, setF] = useState({ hotelId: '', url: '', category: 'gallery', source: '', caption: '' });
  const [err, setErr] = useState('');
  useTitle('Manage images');
  const rows = useMemo(() => hotels.filter((h) => !sel || h.id === sel).flatMap((h) => h.images.map((i) => ({ ...i, hotel: h }))), [hotels, sel]);
  const add = async (e) => {
    e.preventDefault();
    if (!f.hotelId) return setErr('Choose a hotel.');
    if (!urlOk(f.url)) return setErr('Enter a valid image URL (http/https).');
    const h = hotels.find((x) => x.id === f.hotelId);
    try {
      await patchHotel(h.id, { images: [...h.images, { id: uid('img'), url: f.url.trim(), label: f.caption, caption: f.caption, category: f.category, source_page: f.source, verified: false, permission: 'Usage permission not confirmed' }] });
      setF({ ...f, url: '', caption: '', source: '' }); setErr('');
    } catch {
      // The shared error banner reports the server validation or network error.
    }
  };
  const upd = (row, fn) => patchHotel(row.hotel.id, { images: row.hotel.images.map((i) => (i.id === row.id ? fn(i) : i)) }).catch(() => {});
  return (
    <div>
      <PageHead title="Images" />
      <form onSubmit={add} className="mb-6 grid gap-3 rounded-lg border border-line bg-paper p-5 md:grid-cols-6" noValidate>
        <div className="md:col-span-2"><Field id="ih" label="Hotel"><select id="ih" className="input" value={f.hotelId} onChange={(e) => setF({ ...f, hotelId: e.target.value })}><option value="">Select hotel…</option>{hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field></div>
        <div className="md:col-span-2"><Field id="iu" label="Image URL"><input id="iu" className="input" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field></div>
        <Field id="ic" label="Category"><select id="ic" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{['cover', 'gallery', 'room', 'dining', 'amenity'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <div className="flex items-end"><button className="btn-primary w-full">Add image</button></div>
        <div className="md:col-span-3"><Field id="is" label="Source page URL"><input id="is" className="input" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></Field></div>
        <div className="md:col-span-3"><Field id="ia" label="Caption / alt text"><input id="ia" className="input" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /></Field></div>
        {err && <p className="err md:col-span-6" role="alert">{err}</p>}
      </form>
      <div className="mb-4 flex items-center gap-3"><select className="input max-w-xs" aria-label="Filter by hotel" value={sel} onChange={(e) => setSel(e.target.value)}><option value="">All hotels</option>{hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select><span className="text-sm text-mute">{rows.length} images</span></div>
      {rows.length === 0 ? <p className="rounded-lg border border-dashed border-line bg-paper p-10 text-center text-sm text-mute">No stored images yet. Add URLs above, or run <code>npm run fetch-images</code>.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-lg border border-line bg-paper">
            <Img src={r.url} name={r.hotel.name} className="aspect-[16/10]" />
            <div className="p-4 text-sm"><p className="font-bold">{r.hotel.name}</p><p className="mt-0.5 text-xs capitalize text-mute">{r.category}{r.caption ? ` · ${r.caption}` : ''}</p>
              <p className="mt-1 truncate text-xs"><a href={r.source_page || r.url} target="_blank" rel="noreferrer" className="underline" title={r.source_page || r.url}>{r.source_page ? 'Source page' : 'Image URL'}</a></p>
              <p className="mt-1 text-xs text-mute">{r.permission}</p>
              <div className="mt-3 flex items-center justify-between">
                <button onClick={() => upd(r, (i) => ({ ...i, verified: !i.verified }))} className={`chip gap-1 ${r.verified ? 'border-sage bg-[#EDEFE8]' : ''}`} aria-pressed={r.verified}><BadgeCheck size={13} />{r.verified ? 'Manually verified' : 'Not verified'}</button>
                <button onClick={() => patchHotel(r.hotel.id, { images: r.hotel.images.filter((i) => (i.id || i.url) !== (r.id || r.url)) }).catch(() => {})} className="grid h-9 w-9 place-items-center rounded-md border border-line text-red-700" aria-label="Remove image"><Trash2 size={15} /></button></div></div>
          </div>))}</div>)}
    </div>
  );
}
