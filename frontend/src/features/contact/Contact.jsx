import { Mail, MapPin, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import EnquiryForm from '../../components/forms/EnquiryForm.jsx';
import { useTitle } from '../../hooks/useTitle.js';

export default function Contact() {
  const { published } = useApp();
  useTitle('Contact', 'Send an enquiry about a Karnataka stay.');
  return (
    <div className="wrap grid gap-12 py-10 md:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h1 className="h-display text-5xl md:text-7xl">Get in touch.</h1>
        <p className="mt-5 max-w-md text-mute">Questions about a property or this guide? Send a note. For rates and availability, the property itself will always have the final answer.</p>
        <ul className="mt-8 grid gap-4 text-sm">
          <li className="flex items-center gap-3"><Mail size={18} className="text-bronze" /><span>hello@your-domain.example <span className="text-mute">(placeholder)</span></span></li>
          <li className="flex items-center gap-3"><Phone size={18} className="text-bronze" /><span>+91 00000 00000 <span className="text-mute">(placeholder)</span></span></li>
          <li className="flex items-center gap-3"><MapPin size={18} className="text-bronze" /><span>Karnataka, India <span className="text-mute">(placeholder)</span></span></li>
        </ul>
      </div>
      <div className="rounded-xl border border-line bg-paper p-6 md:p-8"><EnquiryForm hotels={published} /></div>
    </div>
  );
}
