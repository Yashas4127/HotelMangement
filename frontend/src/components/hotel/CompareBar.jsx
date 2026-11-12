import { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useCompare } from '../../context/CompareContext.jsx';
import Modal from '../common/Modal.jsx';
import { CallButton, WhatsAppButton } from './ContactButtons.jsx';
import { phonesOf, pretty } from '../../utils/contact.js';

const rows = [
  ['Location', (h) => [h.city, h.district].filter((x, i, a) => x && a.indexOf(x) === i).join(', ')],
  ['Type', (h) => h.type],
  ['Star category', (h) => (h.stars ? `${h.stars}-star` : '')],
  ['Rooms', (h) => (h.roomCount ? String(h.roomCount) : '')],
  ['Check-in / out', (h) => [h.policies.checkIn, h.policies.checkOut].filter(Boolean).join(' / ')],
  ['Facilities', (h) => h.facilities.slice(0, 8).join(', ')],
  ['Phone', (h) => phonesOf(h).slice(0, 2).map((p) => pretty(p.number)).join(', ')],
];

export default function CompareBar() {
  const { published } = useApp();
  const { ids, remove, clear } = useCompare();
  const [open, setOpen] = useState(false);
  const list = ids.map((id) => published.find((h) => h.id === id)).filter(Boolean);
  if (!list.length) return null;
  // A row only shows if at least one compared stay has data for it.
  const shown = rows.filter(([, f]) => list.some((h) => f(h)));
  return (
    <>
      <div className="pb-safe fixed inset-x-0 bottom-16 z-40 px-3 md:bottom-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl bg-night p-3 text-white shadow-2xl">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto no-scrollbar">
            {list.map((h) => <span key={h.id} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-1 text-xs font-semibold">{h.name}<button onClick={() => remove(h.id)} aria-label={`Remove ${h.name}`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/20"><X size={12} /></button></span>)}
          </div>
          <button className="btn-primary min-h-[40px] shrink-0 px-4" disabled={list.length < 2} onClick={() => setOpen(true)}><ArrowLeftRight size={15} />Compare {list.length}</button>
          <button onClick={clear} className="shrink-0 text-xs font-semibold text-white/70 underline">Clear</button>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Compare stays" wide>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead><tr><th className="w-28" />{list.map((h) => <th key={h.id} className="p-2 align-top font-bold">{h.name}</th>)}</tr></thead>
            <tbody>
              {shown.map(([k, f]) => <tr key={k} className="border-t border-line"><th className="p-2 align-top text-xs font-semibold text-mute">{k}</th>{list.map((h) => <td key={h.id} className="p-2 align-top">{f(h) || <span className="text-mute">—</span>}</td>)}</tr>)}
              <tr className="border-t border-line"><th />{list.map((h) => <td key={h.id} className="space-y-2 p-2"><WhatsAppButton hotel={h} className="w-full text-xs">WhatsApp</WhatsAppButton><CallButton hotel={h} className="w-full text-xs" /></td>)}</tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
