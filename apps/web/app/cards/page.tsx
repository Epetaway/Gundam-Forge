import dynamic from 'next/dynamic';
const CardsClient = dynamic(() => import('./CardsClient'), { ssr: false });

export default function CardsPage() {
  return <CardsClient />;
}