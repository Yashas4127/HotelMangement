import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import Modal from '../../components/common/Modal.jsx';
import Img from '../../components/common/Img.jsx';
import { Field } from '../../components/forms/EnquiryForm.jsx';
import { slugify, uid } from '../../utils/cn.js';
import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

const empty = { id: '', slug: '', name: '', district: '', description: '', cover: '', keywords: [] };
export default function AdminDestinations() {
  const { destinations, destCounts, upsertDestination, deleteDestination } = useApp();
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [errs, setErrs] = useState({});
  useTitle('Manage destinations');
  const save = async (e) => {
    e.preventDefault();
    const er = {}; if (!edit.name.trim()) er.name = 'Name is required.';
    const slug = slugify(edit.slug || edit.name);
    if (destinations.some((d) => d.slug === slug && d.id !== edit.id)) er.slug = 'Slug already used.';
    if (edit.cover && !/^https?:\/\//.test(edit.cover)) er.cover = 'Enter a full URL.';
    setErrs(er); if (Object.keys(er).length) return;
    const kw = (typeof edit.keywords === 'string' ? edit.keywords.split(',') : edit.keywords).map((k) => k.trim().toLowerCase()).filter(Boolean);
    try {
      await upsertDestination({ ...edit, id: edit.id || uid('d'), slug, keywords: kw.length ? kw : [edit.name.toLowerCase()] });
      setEdit(null);
    } catch {
      // The shared error banner reports the server validation or network error.
    }
  };
  return (
    <div>
      <PageHead title="Destinations"><button className="btn-primary" onClick={() => { setErrs({}); setEdit({ ...empty }); }}><Plus size={16} />Add destination</button></PageHead>
      <div className="divide-y divide-line rounded-lg border border-line bg-paper">
        {destinations.map((d) => (
          <div key={d.id} className="flex items-center gap-4 p-4">
            <Img src={d.cover} name={d.name} note=" " className="h-14 w-20 shrink-0 rounded" />
            <div className="min-w-0 flex-1"><p className="font-bold">{d.name}</p><p className="truncate text-xs text-mute">{d.district} · {destCounts[d.slug] || 0} properties</p></div>
            <button className="grid h-9 w-9 place-items-center rounded-md border border-line" aria-label={`Edit ${d.name}`} onClick={() => { setErrs({}); setEdit({ ...d, keywords: (d.keywords || []).join(', ') }); }}><Pencil size={15} /></button>
            <button className="grid h-9 w-9 place-items-center rounded-md border border-line text-red-700" aria-label={`Delete ${d.name}`} onClick={() => setDel(d)}><Trash2 size={15} /></button>
          </div>))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit destination' : 'Add destination'} wide>
        {edit && <form onSubmit={save} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2"><Field id="dn" label="Name" err={errs.name}><input id="dn" className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field><Field id="ds" label="Slug" err={errs.slug}><input id="ds" className="input" value={edit.slug} placeholder="auto from name" onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field></div>
          <Field id="dd" label="District"><input id="dd" className="input" value={edit.district} onChange={(e) => setEdit({ ...edit, district: e.target.value })} /></Field>
          <Field id="dc" label="Cover photograph URL" err={errs.cover}><input id="dc" className="input" value={edit.cover} onChange={(e) => setEdit({ ...edit, cover: e.target.value })} /></Field>
          <Field id="dk" label="Matching keywords (comma separated, matched against property city/district)"><input id="dk" className="input" value={edit.keywords} onChange={(e) => setEdit({ ...edit, keywords: e.target.value })} /></Field>
          <Field id="dx" label="Description"><textarea id="dx" rows={3} className="input py-2" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          <div className="flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete destination?"><p className="text-sm text-mute">Properties are not deleted, but they will no longer be grouped under “{del?.name}”.</p><div className="mt-5 flex justify-end gap-3"><button className="btn-ghost" onClick={() => setDel(null)}>Cancel</button><button className="btn bg-red-700 text-white" onClick={async () => { try { await deleteDestination(del.id); setDel(null); } catch { /* The shared error banner reports the failure. */ } }}>Delete</button></div></Modal>
    </div>
  );
}
