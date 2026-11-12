import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import HotelCard from '../../components/hotel/HotelCard.jsx';
import { Empty } from '../../components/common/Bits.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function Saved() {
  const { published, favs } = useApp();
  useTitle('Saved stays');
  const list = published.filter((h) => favs.includes(h.id));
  return (
    <div className="wrap py-8 md:py-12">
      <h1 className="text-3xl font-extrabold md:text-5xl">Saved stays</h1>
      <p className="mt-2 text-sm text-mute">Saved on this device.</p>
      <div className="mt-8">{list.length ? <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{list.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
        : <Empty title="Nothing saved yet" text="Tap the heart on any property to keep it here."><Link to="/hotels" className="btn-dark">Explore stays</Link></Empty>}</div>
    </div>
  );
}
