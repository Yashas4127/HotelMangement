import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { PROPERTY_TYPES, STD_FACILITIES } from '../../services/hotelService.js';
import { Field } from '../../components/forms/EnquiryForm.jsx';
import Img from '../../components/common/Img.jsx';
import { slugify, uid } from '../../utils/cn.js';
import { PageHead } from './Overview.jsx';
import { useTitle } from '../../hooks/useTitle.js';

const blank = () => ({
  id: '', slug: '', name: '', city: '', district: '', state: 'Karnataka', type: '', typeRaw: '', shortDescription: '', description: '', factsList: [],
  address: '', lat: '', lng: '', phone: '', email: '', website: '', whatsapp: '', bookingUrl: '', galleryUrl: '', images: [], facilities: [], rooms: [], roomCount: '', rates: null,
  dining: [], events: null, policies: { checkIn: '', checkOut: '', cancellation: '', child: '', pet: '' }, featured: false, verified: 'unverified', status: 'draft',
  ownershipNote: '', photoPermission: '', photoEvidence: '', sourceNotes: '', order: 0,
});
const IMG_CATS = [['cover', 'Main cover photograph', 1], ['gallery', 'Gallery photographs'], ['room', 'Room photographs'], ['dining', 'Dining photographs'], ['amenity', 'Amenity photographs']];
const urlOk = (v) => { try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
const Card = ({ title, children }) => (<section className="rounded-lg border border-line bg-paper p-5 md:p-6"><h2 className="mb-4 text-base font-extrabold">{title}</h2>{children}</section>);

export default function HotelForm() {
  const { id } = useParams();
  const { hotels, upsertHotel } = useApp();
  const nav = useNavigate();
  const existing = hotels.find((h) => h.id === id);
  const initial = useMemo(() => (existing ? structuredClone(existing) : blank()), [existing]); // eslint-disable-line
  const [h, setH] = useState(initial);
  const [errs, setErrs] = useState({});
  const [custom, setCustom] = useState('');
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const snap = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(h) !== snap.current;
  useTitle(existing ? `Edit ${existing.name}` : 'Add hotel');

  useEffect(() => {
    if (!dirty) return;
    const f = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', f); return () => window.removeEventListener('beforeunload', f);
  }, [dirty]);

  if (id && !existing) return <p className="text-mute">Hotel not found.</p>;
  const set = (k) => (e) => setH((s) => ({ ...s, [k]: e.target.value }));
  const setPol = (k) => (e) => setH((s) => ({ ...s, policies: { ...s.policies, [k]: e.target.value } }));
  const onName = (e) => { const v = e.target.value; setH((s) => ({ ...s, name: v, slug: slugTouched ? s.slug : slugify(v) })); };
  const ev = h.events || { banquet: false, capacity: '', types: '', description: '' };
  const setEv = (k, v) => setH((s) => ({ ...s, events: { ...(s.events || { banquet: false, capacity: '', types: '', description: '' }), [k]: v } }));

  const validate = (publish) => {
    const e = {};
    if (!h.name.trim()) e.name = 'Hotel name is required.';
    if (publish) {
      if (!h.slug.trim()) e.slug = 'Slug is required.';
      else if (hotels.some((x) => x.slug === h.slug && x.id !== h.id)) e.slug = 'This slug is already used.';
      if (!h.type) e.type = 'Choose a property type.';
      if (!h.city.trim()) e.city = 'City is required.';
      if (!h.district.trim()) e.district = 'District is required.';
      if (!h.images.some((image) => image.url.trim())) e.images = 'Add at least one photograph before publishing.';
    }
    if (h.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h.email)) e.email = 'Enter a valid email.';
    if (h.website && !urlOk(h.website)) e.website = 'Enter a full URL starting with http(s)://';
    if (h.lat && (isNaN(h.lat) || +h.lat < -90 || +h.lat > 90)) e.lat = 'Latitude must be between -90 and 90.';
    if (h.lng && (isNaN(h.lng) || +h.lng < -180 || +h.lng > 180)) e.lng = 'Longitude must be between -180 and 180.';
    if (h.images.some((i) => i.url && !urlOk(i.url))) e.images = 'One or more image URLs are invalid.';
    setErrs(e); return Object.keys(e).length === 0;
  };
  const save = async (status) => {
    if (!validate(status === 'published')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const slug = h.slug.trim() || slugify(h.name);
    const images = h.images.filter((i) => i.url.trim());
    const rooms = h.rooms.filter((r) => r.name?.trim());
    rooms.forEach((r) => { if (r.photo && !images.some((i) => i.url === r.photo)) images.push({ id: uid('img'), url: r.photo, label: r.name, caption: r.name, category: 'room', source_page: '', verified: false, permission: 'Usage permission not confirmed' }); });
    const events = h.events && (h.events.banquet || h.events.capacity || h.events.types || h.events.description) ? h.events : null;
    const out = { ...h, id: h.id || slug, slug, status, images, rooms, events, dining: h.dining.filter((d) => d.name || d.cuisine || d.description), shortDescription: h.shortDescription || h.description.split(/[.;]/)[0] };
    try {
      await upsertHotel(out);
      snap.current = JSON.stringify(h);
      nav('/admin/hotels');
    } catch {
      // The shared error banner reports the server validation or network error.
    }
  };
  const cancel = () => { if (!dirty || window.confirm('Discard unsaved changes?')) nav('/admin/hotels'); };
  const addImg = (category) => setH((s) => ({ ...s, images: [...s.images, { id: uid('img'), url: '', label: '', caption: '', category, source_page: '', verified: false, permission: 'Usage permission not confirmed' }] }));
  const upImg = (iid, k, v) => setH((s) => ({ ...s, images: s.images.map((i) => (i.id === iid ? { ...i, [k]: v } : i)) }));
  const rmImg = (iid) => setH((s) => ({ ...s, images: s.images.filter((i) => i.id !== iid) }));
  const toggleFac = (x) => setH((s) => ({ ...s, facilities: s.facilities.includes(x) ? s.facilities.filter((y) => y !== x) : [...s.facilities, x] }));
  const customs = h.facilities.filter((f) => !STD_FACILITIES.includes(f));
  const rep = (key, blankRow) => ({ add: () => setH((s) => ({ ...s, [key]: [...s[key], blankRow()] })), up: (i, k, v) => setH((s) => ({ ...s, [key]: s[key].map((r, j) => (j === i ? { ...r, [k]: v } : r)) })), rm: (i) => setH((s) => ({ ...s, [key]: s[key].filter((_, j) => j !== i) })) });
  const rooms = rep('rooms', () => ({ name: '', description: '', occupancy: '', price: '', photo: '' }));
  const dining = rep('dining', () => ({ name: '', cuisine: '', timings: '', description: '' }));
  const T = (id, label, key, props = {}) => (<Field id={id} label={label} err={errs[key]}><input id={id} className="input" value={h[key] ?? ''} onChange={set(key)} aria-invalid={!!errs[key]} {...props} /></Field>);

  return (
    <div className="pb-24">
      <PageHead title={existing ? `Edit: ${existing.name}` : 'Add hotel'} />
      {Object.keys(errs).length > 0 && <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">Please fix the highlighted fields.</div>}
      <div className="grid gap-5">
        <Card title="Basic details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Hotel name *" err={errs.name}><input id="name" className="input" value={h.name} onChange={onName} aria-invalid={!!errs.name} /></Field>
            <Field id="slug" label="Slug *" err={errs.slug}><input id="slug" className="input" value={h.slug} onChange={(e) => { setSlugTouched(true); setH((s) => ({ ...s, slug: slugify(e.target.value) })); }} /></Field>
            <Field id="type" label="Property type *" err={errs.type}><select id="type" className="input" value={h.type} onChange={set('type')}><option value="">Select…</option>{[...new Set([...PROPERTY_TYPES, h.type].filter(Boolean))].map((t) => <option key={t}>{t}</option>)}</select></Field>
            {T('city', 'City *', 'city')}{T('district', 'District *', 'district')}{T('address', 'Full address', 'address')}{T('lat', 'Latitude', 'lat', { inputMode: 'decimal' })}{T('lng', 'Longitude', 'lng', { inputMode: 'decimal' })}
          </div>
          <div className="mt-4 grid gap-4"><Field id="sd" label="Short description"><input id="sd" className="input" value={h.shortDescription} onChange={set('shortDescription')} /></Field><Field id="fd" label="Full description"><textarea id="fd" rows={4} className="input py-2.5" value={h.description} onChange={(e) => setH((s) => ({ ...s, description: e.target.value, factsList: e.target.value.split(/;|\n/).map((x) => x.trim()).filter(Boolean) }))} /></Field></div>
        </Card>
        <Card title="Contact details"><div className="grid gap-4 sm:grid-cols-2">{T('phone', 'Phone', 'phone', { type: 'tel' })}{T('email', 'Email', 'email', { type: 'email' })}{T('website', 'Website', 'website')}{T('whatsapp', 'WhatsApp number (with country code)', 'whatsapp', { inputMode: 'tel' })}</div></Card>
        <Card title="Photographs">
          <p className="mb-4 text-xs text-mute">Paste image URLs. Only use photographs of this property that you have permission to display. Images are never marked verified automatically.</p>
          {errs.images && <p className="err mb-2">{errs.images}</p>}
          {IMG_CATS.map(([cat, label, max]) => {
            const items = h.images.filter((i) => i.category === cat);
            return (<div key={cat} className="mb-5"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold">{label}</h3>{(!max || items.length < max) && <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold underline" onClick={() => addImg(cat)}><Plus size={13} />Add</button>}</div>
              <div className="grid gap-3">{items.map((i) => (<div key={i.id} className="flex gap-3"><Img src={i.url} name="" note=" " className="h-16 w-24 shrink-0 rounded" /><div className="grid flex-1 gap-2 sm:grid-cols-2"><input className="input" placeholder="Image URL" aria-label="Image URL" value={i.url} onChange={(e) => upImg(i.id, 'url', e.target.value)} /><input className="input" placeholder="Alt text / caption" aria-label="Caption" value={i.caption} onChange={(e) => upImg(i.id, 'caption', e.target.value)} /></div><button type="button" onClick={() => rmImg(i.id)} className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line text-red-700" aria-label="Remove image"><Trash2 size={16} /></button></div>))}</div></div>);
          })}
        </Card>
        <Card title="Facilities">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{STD_FACILITIES.map((x) => <label key={x} className="flex min-h-[36px] items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#A58B65]" checked={h.facilities.includes(x)} onChange={() => toggleFac(x)} />{x}</label>)}</div>
          <div className="mt-4 flex gap-2"><input className="input" placeholder="Other facility" aria-label="Other facility" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (custom.trim()) { toggleFac(custom.trim()); setCustom(''); } } }} /><button type="button" className="btn-ghost" onClick={() => { if (custom.trim() && !h.facilities.includes(custom.trim())) toggleFac(custom.trim()); setCustom(''); }}>Add</button></div>
          {customs.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{customs.map((c) => <button type="button" key={c} onClick={() => toggleFac(c)} className="chip gap-1">{c} ×</button>)}</div>}
        </Card>
        <Card title="Room information">
          <div className="mb-4 max-w-xs">{T('rc', 'Total number of rooms', 'roomCount', { inputMode: 'numeric' })}</div>
          <div className="grid gap-4">{h.rooms.map((r, i) => (<div key={i} className="rounded-md border border-line p-4"><div className="grid gap-3 sm:grid-cols-2"><input className="input" placeholder="Room name" aria-label="Room name" value={r.name} onChange={(e) => rooms.up(i, 'name', e.target.value)} /><input className="input" placeholder="Occupancy" aria-label="Occupancy" value={r.occupancy || ''} onChange={(e) => rooms.up(i, 'occupancy', e.target.value)} /><input className="input" placeholder="Price (only if known)" aria-label="Price" inputMode="numeric" value={r.price || ''} onChange={(e) => rooms.up(i, 'price', e.target.value)} /><input className="input" placeholder="Room photo URL" aria-label="Room photo URL" value={r.photo || ''} onChange={(e) => rooms.up(i, 'photo', e.target.value)} /></div><textarea rows={2} className="input mt-3 py-2" placeholder="Description" aria-label="Room description" value={r.description || ''} onChange={(e) => rooms.up(i, 'description', e.target.value)} /><button type="button" className="mt-2 text-xs font-semibold text-red-700 underline" onClick={() => rooms.rm(i)}>Remove room</button></div>))}</div>
          <button type="button" className="btn-ghost mt-4" onClick={rooms.add}><Plus size={15} />Add room</button>
        </Card>
        <Card title="Dining">
          <div className="grid gap-4">{h.dining.map((d, i) => (<div key={i} className="rounded-md border border-line p-4"><div className="grid gap-3 sm:grid-cols-3"><input className="input" placeholder="Restaurant name" aria-label="Restaurant name" value={d.name || ''} onChange={(e) => dining.up(i, 'name', e.target.value)} /><input className="input" placeholder="Cuisine" aria-label="Cuisine" value={d.cuisine || ''} onChange={(e) => dining.up(i, 'cuisine', e.target.value)} /><input className="input" placeholder="Timings" aria-label="Timings" value={d.timings || ''} onChange={(e) => dining.up(i, 'timings', e.target.value)} /></div><textarea rows={2} className="input mt-3 py-2" placeholder="Description" aria-label="Dining description" value={d.description || ''} onChange={(e) => dining.up(i, 'description', e.target.value)} /><button type="button" className="mt-2 text-xs font-semibold text-red-700 underline" onClick={() => dining.rm(i)}>Remove</button></div>))}</div>
          <button type="button" className="btn-ghost mt-4" onClick={dining.add}><Plus size={15} />Add dining venue</button>
        </Card>
        <Card title="Events">
          <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#A58B65]" checked={!!ev.banquet} onChange={(e) => setEv('banquet', e.target.checked)} />Banquet facilities available</label>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="cap" className="label">Capacity</label><input id="cap" className="input" value={ev.capacity} onChange={(e) => setEv('capacity', e.target.value)} /></div><div><label htmlFor="et" className="label">Event types</label><input id="et" className="input" value={ev.types} onChange={(e) => setEv('types', e.target.value)} /></div></div>
        </Card>
        <Card title="Policies"><div className="grid gap-4 sm:grid-cols-2">{[['checkIn', 'Check-in'], ['checkOut', 'Check-out'], ['cancellation', 'Cancellation policy'], ['child', 'Child policy'], ['pet', 'Pet policy']].map(([k, l]) => <div key={k}><label htmlFor={`p-${k}`} className="label">{l}</label><input id={`p-${k}`} className="input" value={h.policies[k] || ''} onChange={setPol(k)} /></div>)}</div></Card>
        <Card title="Additional information">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#A58B65]" checked={h.featured} onChange={(e) => setH((s) => ({ ...s, featured: e.target.checked }))} />Featured</label>
            <div><label htmlFor="ver" className="label">Verification status</label><select id="ver" className="input" value={h.verified} onChange={set('verified')}><option value="unverified">Unverified</option><option value="partial">Partial</option><option value="verified">Verified</option></select></div>
            <div><label htmlFor="stat" className="label">Current status</label><input id="stat" className="input bg-canvas" value={h.status} readOnly /></div>
          </div>
        </Card>
      </div>
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3">
          <span className="hidden text-xs font-semibold text-mute sm:block">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <div className="flex flex-1 justify-end gap-2"><button type="button" className="btn-ghost" onClick={cancel}>Cancel</button><button type="button" className="btn-ghost" onClick={() => save('draft')}>Save draft</button><button type="button" className="btn-primary" onClick={() => save('published')}>Publish</button></div>
        </div>
      </div>
    </div>
  );
}
