import { datasetMeta } from '../../services/hotelService.js';
import { useTitle } from '../../hooks/useTitle.js';

export default function About() {
  useTitle('About', 'Why Karnataka Stays exists and how its listings are researched.');
  return (
    <div className="wrap max-w-3xl py-10 md:py-16">
      <h1 className="h-display text-5xl md:text-7xl">A guide to staying well in Karnataka.</h1>
      <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-ink/90">
        <p>Karnataka Stays is a discovery guide for hotels, boutique stays and resorts across the state: coffee estates in Coorg and Chikmagalur, riverside lodges in Kabini and Dandeli, the ruins of Hampi, and the coast.</p>
        <p>We coordinate booking requests with each property. Our team checks availability and sends you a quote; the guest pays only after approving that quote. The reservation is confirmed after payment and confirmation with the hotel.</p>
        <h2 className="pt-4 text-2xl font-extrabold">How listings are researched</h2>
        <p>The current catalogue contains {datasetMeta.photoBackedCount} photo-backed properties from a research dataset of {datasetMeta.count} candidates (version {datasetMeta.version}, {datasetMeta.created}). Contact details are collected from the listed property websites. Where a phone number, address or room detail is unavailable, we leave it blank rather than inventing it.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-mute">{datasetMeta.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
        <h2 id="privacy" className="pt-4 text-2xl font-extrabold">Privacy</h2>
        <p>Saved stays and trip preferences remain on your device. You can browse without an account; enquiries and booking requests require sign-in and are stored securely for our team to manage.</p>
        <h2 id="terms" className="pt-4 text-2xl font-extrabold">Terms</h2>
        <p>Information may change. Confirm rates, availability and policies with the property. Photographs are the property of their respective owners.</p>
      </div>
    </div>
  );
}
