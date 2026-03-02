import { Suspense } from 'react';
import CardsClient from './CardsClient';
import { cards } from '@/lib/data/cards';

export default function CardsPage(): JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CardsClient initialCards={cards} />
    </Suspense>
  );
}
