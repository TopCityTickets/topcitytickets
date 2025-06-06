import dynamic from 'next/dynamic';

const EventClientPage = dynamic(() => import('./EventClientPage'), { ssr: false });

export default function Page() {
  return <EventClientPage />;
}
