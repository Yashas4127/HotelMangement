import { BedDouble, BookOpen, Baby, Car, Check, Coffee, Dumbbell, Shirt, Sparkles, Users, Utensils, Waves, Wifi, Wine } from 'lucide-react';

const MAP = [
  [/pool/i, Waves], [/wi-?fi|internet/i, Wifi], [/park/i, Car], [/restaurant|dining|cafe|breakfast/i, Utensils], [/gym|fitness/i, Dumbbell],
  [/spa|yoga|massage/i, Sparkles], [/bar|lounge/i, Wine], [/room service|coffee|tea/i, Coffee], [/family|children|kids|play/i, Baby],
  [/conference|meeting|business|banquet/i, Users], [/laundry/i, Shirt], [/library/i, BookOpen], [/lift|elevator|room|villa/i, BedDouble],
];
export default function FacilityIcon({ name, size = 18, className }) {
  const Icon = (MAP.find(([re]) => re.test(name)) || [null, Check])[1];
  return <Icon size={size} className={className} aria-hidden="true" />;
}
