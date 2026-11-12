import { useApp } from '../../context/AppContext.jsx';
import DestinationCard from '../../components/destination/DestinationCard.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function Destinations() {
  const { destinations } = useApp();
  useTitle('Destinations in Karnataka', 'Browse Karnataka destinations and the stays available in each.');
  return (
    <div className="wrap py-8 md:py-12">
      <h1 className="text-3xl font-extrabold md:text-5xl">Destinations</h1>
      <p className="mt-2 max-w-xl text-sm text-mute md:text-base">From coffee country to the Arabian Sea, the places our listed stays are grouped by.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {destinations.map((d, i) => <DestinationCard key={d.id} dest={d} tall={i % 5 === 0} className="w-full" />)}
      </div>
    </div>
  );
}
