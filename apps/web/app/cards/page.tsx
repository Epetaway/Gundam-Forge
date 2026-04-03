import { Suspense } from 'react';
import CardsClient from './CardsClient';
import { cards } from '@/lib/data/cards';
import { CardsSkeleton } from './CardsSkeleton';

export default function CardsPage(): JSX.Element {
  return (
    <Suspense fallback={<CardsSkeleton />}>
      <CardsClient initialCards={cards} />
    </Suspense>
  );
}
